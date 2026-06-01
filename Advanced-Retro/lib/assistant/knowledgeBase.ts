import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { AssistantLocale } from '@/lib/assistant/localAssistant';

type KnowledgeTopic = {
  lead?: string;
  note?: string;
  details?: string[];
};

type KnowledgeFile = Record<AssistantLocale, Record<string, KnowledgeTopic>>;

let cache: KnowledgeFile | null = null;

function resolveKnowledgePath(): string {
  const candidates = [
    path.join(process.cwd(), 'data', 'assistant-knowledge.json'),
    path.join(process.cwd(), 'Advanced-Retro', 'data', 'assistant-knowledge.json'),
  ];

  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error(`Assistant knowledge file not found. Checked: ${candidates.join(', ')}`);
  }

  return match;
}

function loadKnowledgeFile(): KnowledgeFile {
  if (cache) return cache;
  const raw = readFileSync(resolveKnowledgePath(), 'utf8');
  cache = JSON.parse(raw) as KnowledgeFile;
  return cache;
}

export function getAssistantKnowledge(locale: AssistantLocale, topic: string): KnowledgeTopic {
  const file = loadKnowledgeFile();
  return file[locale]?.[topic] || file.es?.[topic] || {};
}

export function formatKnowledgeTopic(locale: AssistantLocale, topic: string): string {
  const entry = getAssistantKnowledge(locale, topic);
  const parts: string[] = [];
  if (entry.lead) parts.push(entry.lead);
  if (Array.isArray(entry.details) && entry.details.length > 0) {
    parts.push(entry.details.join(' '));
  }
  if (entry.note) parts.push(entry.note);
  return parts.join(' ').trim();
}
