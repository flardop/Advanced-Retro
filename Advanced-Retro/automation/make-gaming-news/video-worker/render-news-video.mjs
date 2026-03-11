#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current.startsWith("--")) {
      const key = current.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    }
  }
  return args;
}

function ensureNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        const error = new Error(`${command} exited with code ${code}`);
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  });
}

async function resolveAssetToLocalPath(asset, baseDir, tempDir, label) {
  if (!asset || typeof asset !== "string") {
    return null;
  }

  if (isHttpUrl(asset)) {
    const url = new URL(asset);
    const extension = path.extname(url.pathname) || ".bin";
    const localPath = path.join(tempDir, `${label}${extension}`);

    const response = await fetch(asset);
    if (!response.ok) {
      throw new Error(`No se pudo descargar ${asset} (${response.status})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fsp.writeFile(localPath, buffer);
    return localPath;
  }

  if (path.isAbsolute(asset)) {
    await fsp.access(asset, fs.constants.R_OK);
    return asset;
  }

  const candidates = [
    path.resolve(baseDir, asset),
    path.resolve(path.dirname(baseDir), asset),
    path.resolve(process.cwd(), asset),
  ];

  for (const candidate of candidates) {
    try {
      await fsp.access(candidate, fs.constants.R_OK);
      return candidate;
    } catch (_) {
      // try next candidate
    }
  }

  throw new Error(`No existe el recurso local: ${asset}`);
}

async function getMediaDurationSeconds(inputPath) {
  const args = [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ];

  const result = await runCommand("ffprobe", args);
  const duration = Number(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    return 5;
  }
  return duration;
}

function escapeSubtitlesPath(subtitlesPath) {
  return subtitlesPath
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,");
}

async function renderVideo({ payload, payloadPath, outputDir, jobId, keepTemp = false }) {
  if (!payload || !Array.isArray(payload.clips) || payload.clips.length === 0) {
    throw new Error("El payload debe incluir al menos un clip en clips[].");
  }

  const payloadDir = path.dirname(payloadPath);
  const safeJobId = sanitizeFilename(jobId || payload.job_id || `job_${Date.now()}`);
  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), `make-video-${safeJobId}-`));

  const width = ensureNumber(payload?.resolution?.width, 1080);
  const height = ensureNumber(payload?.resolution?.height, 1920);
  const fps = ensureNumber(payload.fps, 30);
  const transitionSec = Math.max(0, ensureNumber(payload.transition_sec, 0.3));
  const musicVolume = ensureNumber(payload.music_volume, 0.12);
  const voiceVolume = ensureNumber(payload.voice_volume, 1.0);

  const outputName = sanitizeFilename(payload.output_name || `${safeJobId}.mp4`);
  const outputPath = path.resolve(outputDir, outputName);

  await fsp.mkdir(outputDir, { recursive: true });

  const clipPaths = [];
  for (let index = 0; index < payload.clips.length; index += 1) {
    const clip = payload.clips[index];
    const clipUrl = clip?.url || clip?.path;
    const localClip = await resolveAssetToLocalPath(
      clipUrl,
      payloadDir,
      tempDir,
      `clip_${index + 1}`,
    );

    if (!localClip) {
      throw new Error(`Clip invalido en posicion ${index + 1}.`);
    }

    clipPaths.push(localClip);
  }

  const voicePath = await resolveAssetToLocalPath(
    payload.voice_url || payload.voice_path,
    payloadDir,
    tempDir,
    "voice",
  );

  const musicPath = await resolveAssetToLocalPath(
    payload.music_url || payload.music_path,
    payloadDir,
    tempDir,
    "music",
  );

  const clipDurations = [];
  for (let index = 0; index < clipPaths.length; index += 1) {
    const declaredDuration = ensureNumber(payload.clips[index]?.duration_sec, NaN);
    if (Number.isFinite(declaredDuration) && declaredDuration > 0) {
      clipDurations.push(declaredDuration);
    } else {
      const detected = await getMediaDurationSeconds(clipPaths[index]);
      clipDurations.push(detected);
    }
  }

  const subtitlesText = typeof payload.subtitles_srt === "string" ? payload.subtitles_srt.trim() : "";
  let subtitlesFilePath = null;
  if (subtitlesText.length > 0) {
    subtitlesFilePath = path.join(tempDir, `${safeJobId}.srt`);
    await fsp.writeFile(subtitlesFilePath, `${subtitlesText}\n`, "utf8");
  }

  const ffmpegArgs = ["-y"];

  for (const clipPath of clipPaths) {
    ffmpegArgs.push("-i", clipPath);
  }

  const voiceInputIndex = voicePath ? clipPaths.length : -1;
  if (voicePath) {
    ffmpegArgs.push("-i", voicePath);
  }

  const musicInputIndex = musicPath ? clipPaths.length + (voicePath ? 1 : 0) : -1;
  if (musicPath) {
    ffmpegArgs.push("-stream_loop", "-1", "-i", musicPath);
  }

  const filters = [];

  for (let index = 0; index < clipPaths.length; index += 1) {
    filters.push(
      `[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=${fps},format=yuv420p[v${index}]`,
    );
  }

  let currentVideoLabel = "v0";
  if (clipPaths.length > 1) {
    let timeline = clipDurations[0];

    for (let index = 1; index < clipPaths.length; index += 1) {
      const transitionName = `vxf${index}`;
      const safeOffset = Math.max(0, timeline - transitionSec);

      filters.push(
        `[${currentVideoLabel}][v${index}]xfade=transition=slideleft:duration=${transitionSec}:offset=${safeOffset}[${transitionName}]`,
      );

      currentVideoLabel = transitionName;
      timeline += Math.max(0.1, clipDurations[index] - transitionSec);
    }
  }

  if (subtitlesFilePath) {
    const escapedSubtitlesPath = escapeSubtitlesPath(subtitlesFilePath);
    filters.push(
      `[${currentVideoLabel}]subtitles='${escapedSubtitlesPath}':force_style='FontName=Montserrat,FontSize=44,PrimaryColour=&H00FFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=0'[vout]`,
    );
  } else {
    filters.push(`[${currentVideoLabel}]format=yuv420p[vout]`);
  }

  let hasAudio = false;

  if (voiceInputIndex >= 0 && musicInputIndex >= 0) {
    hasAudio = true;
    filters.push(`[${voiceInputIndex}:a]volume=${voiceVolume}[voicea]`);
    filters.push(`[${musicInputIndex}:a]volume=${musicVolume}[musica]`);
    filters.push("[voicea][musica]amix=inputs=2:duration=first:dropout_transition=2[aout]");
  } else if (voiceInputIndex >= 0) {
    hasAudio = true;
    filters.push(`[${voiceInputIndex}:a]volume=${voiceVolume}[aout]`);
  } else if (musicInputIndex >= 0) {
    hasAudio = true;
    filters.push(`[${musicInputIndex}:a]volume=${musicVolume}[aout]`);
  }

  ffmpegArgs.push("-filter_complex", filters.join(";"));
  ffmpegArgs.push("-map", "[vout]");

  if (hasAudio) {
    ffmpegArgs.push("-map", "[aout]", "-c:a", "aac", "-b:a", "160k");
  } else {
    ffmpegArgs.push("-an");
  }

  ffmpegArgs.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-shortest",
    outputPath,
  );

  await runCommand("ffmpeg", ffmpegArgs);

  if (!keepTemp) {
    await fsp.rm(tempDir, { recursive: true, force: true });
  }

  return {
    job_id: safeJobId,
    output_path: outputPath,
    output_name: outputName,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payloadPath = args.payload;

  if (!payloadPath) {
    console.error("Uso: node render-news-video.mjs --payload <archivo.json> [--output-dir <dir>] [--job-id <id>]");
    process.exit(1);
  }

  const absolutePayloadPath = path.resolve(process.cwd(), payloadPath);
  const outputDir = path.resolve(
    process.cwd(),
    args["output-dir"] || path.join(__dirname, "output"),
  );

  const rawPayload = await fsp.readFile(absolutePayloadPath, "utf8");
  const payload = JSON.parse(rawPayload);

  const jobId = args["job-id"] || payload.job_id || crypto.randomUUID();
  const keepTemp = Boolean(args["keep-temp"]);

  const result = await renderVideo({
    payload,
    payloadPath: absolutePayloadPath,
    outputDir,
    jobId,
    keepTemp,
  });

  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
