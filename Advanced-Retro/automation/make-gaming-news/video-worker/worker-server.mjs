#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8088);
const OUTPUT_DIR = path.resolve(process.env.VIDEO_OUTPUT_DIR || path.join(__dirname, "output"));
const JOBS_DIR = path.resolve(process.env.VIDEO_JOBS_DIR || path.join(__dirname, "jobs"));
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
const WORKER_TOKEN = process.env.WORKER_TOKEN || "";

const jobs = new Map();

function sanitizeFilename(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function writeCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(response, statusCode, payload) {
  writeCorsHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isAuthorized(request) {
  if (!WORKER_TOKEN) {
    return true;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token === WORKER_TOKEN;
}

async function readJsonBody(request, maxBytes = 5 * 1024 * 1024) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      throw new Error("Body demasiado grande.");
    }
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) {
    return {};
  }

  return JSON.parse(body);
}

function createVideoUrl(filename, request) {
  if (PUBLIC_BASE_URL) {
    return `${PUBLIC_BASE_URL}/files/${encodeURIComponent(filename)}`;
  }

  const host = request.headers.host || `localhost:${PORT}`;
  return `http://${host}/files/${encodeURIComponent(filename)}`;
}

async function ensureDirectories() {
  await fsp.mkdir(OUTPUT_DIR, { recursive: true });
  await fsp.mkdir(JOBS_DIR, { recursive: true });
}

async function startRenderJob({ request, payload, jobId }) {
  const safeJobId = sanitizeFilename(jobId);
  const payloadPath = path.join(JOBS_DIR, `${safeJobId}.json`);
  const logPath = path.join(JOBS_DIR, `${safeJobId}.log`);

  const basePayload = {
    ...payload,
    job_id: safeJobId,
    output_name: payload.output_name || `${safeJobId}.mp4`,
  };

  await fsp.writeFile(payloadPath, JSON.stringify(basePayload, null, 2), "utf8");

  const job = {
    job_id: safeJobId,
    status: "queued",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payload_path: payloadPath,
    log_path: logPath,
    output_path: "",
    video_url: "",
    error: "",
  };

  jobs.set(safeJobId, job);

  const renderScriptPath = path.join(__dirname, "render-news-video.mjs");
  const child = spawn(
    "node",
    [
      renderScriptPath,
      "--payload",
      payloadPath,
      "--output-dir",
      OUTPUT_DIR,
      "--job-id",
      safeJobId,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  job.status = "running";
  job.updated_at = new Date().toISOString();

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    const text = String(chunk);
    stdout += text;
  });

  child.stderr.on("data", (chunk) => {
    const text = String(chunk);
    stderr += text;
  });

  child.on("error", async (error) => {
    job.status = "error";
    job.error = String(error.message || error);
    job.updated_at = new Date().toISOString();
    await fsp.writeFile(logPath, `${stdout}\n${stderr}\n${job.error}\n`, "utf8");
  });

  child.on("close", async (code) => {
    await fsp.writeFile(logPath, `${stdout}\n${stderr}\n`, "utf8");

    if (code !== 0) {
      job.status = "error";
      job.error = `render-news-video.mjs salio con codigo ${code}`;
      job.updated_at = new Date().toISOString();
      return;
    }

    const lastLine = stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .at(-1);

    try {
      const parsed = JSON.parse(lastLine || "{}");
      const outputPath = parsed.output_path ? path.resolve(parsed.output_path) : "";
      const outputName = parsed.output_name || path.basename(outputPath || `${safeJobId}.mp4`);

      job.status = "done";
      job.output_path = outputPath;
      job.video_url = createVideoUrl(outputName, request);
      job.updated_at = new Date().toISOString();
    } catch (error) {
      job.status = "error";
      job.error = `No se pudo parsear salida del renderer: ${String(error.message || error)}`;
      job.updated_at = new Date().toISOString();
    }
  });

  return job;
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || `localhost:${PORT}`}`);

    if (request.method === "OPTIONS") {
      writeCorsHeaders(response);
      response.writeHead(204);
      response.end();
      return;
    }

    if (requestUrl.pathname === "/health") {
      sendJson(response, 200, { status: "ok", jobs: jobs.size });
      return;
    }

    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "No autorizado." });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/render") {
      const payload = await readJsonBody(request);

      if (!payload || !Array.isArray(payload.clips) || payload.clips.length === 0) {
        sendJson(response, 400, { error: "El payload debe incluir clips[]." });
        return;
      }

      const requestedJobId = payload.job_id || `job_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const jobId = sanitizeFilename(requestedJobId);

      if (jobs.has(jobId) && ["queued", "running"].includes(jobs.get(jobId).status)) {
        sendJson(response, 409, { error: "Ya existe un job en curso con ese job_id.", job_id: jobId });
        return;
      }

      const job = await startRenderJob({ request, payload, jobId });
      sendJson(response, 202, {
        job_id: job.job_id,
        status: job.status,
        status_url: `/render/${job.job_id}`,
      });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/render/")) {
      const jobId = sanitizeFilename(requestUrl.pathname.slice("/render/".length));
      const job = jobs.get(jobId);

      if (!job) {
        sendJson(response, 404, { error: "Job no encontrado.", job_id: jobId });
        return;
      }

      sendJson(response, 200, job);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/files/")) {
      const requestedFile = decodeURIComponent(requestUrl.pathname.slice("/files/".length));
      const safeFile = sanitizeFilename(requestedFile);
      const filePath = path.resolve(OUTPUT_DIR, safeFile);

      if (!filePath.startsWith(OUTPUT_DIR)) {
        sendJson(response, 400, { error: "Ruta invalida." });
        return;
      }

      if (!fs.existsSync(filePath)) {
        sendJson(response, 404, { error: "Archivo no encontrado." });
        return;
      }

      writeCorsHeaders(response);
      response.writeHead(200, {
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename=\"${safeFile}\"`,
      });
      fs.createReadStream(filePath).pipe(response);
      return;
    }

    sendJson(response, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    sendJson(response, 500, { error: String(error.message || error) });
  }
});

await ensureDirectories();

server.listen(PORT, () => {
  console.log(`Video worker escuchando en http://localhost:${PORT}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
  console.log(`Jobs dir: ${JOBS_DIR}`);
});

