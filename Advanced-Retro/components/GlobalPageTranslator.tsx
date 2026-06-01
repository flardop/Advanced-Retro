'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useLocale } from '@/components/LocaleProvider';

const STORAGE_KEY = 'advanced-retro-global-translations-v1';
const ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'] as const;
const TEXT_SKIP_SELECTOR =
  'script, style, noscript, code, pre, textarea, [data-no-auto-translate], [contenteditable="true"]';
const ATTRIBUTE_SKIP_SELECTOR =
  'script, style, noscript, code, pre, [data-no-auto-translate], [contenteditable="true"]';

type AttributeName = (typeof ATTRIBUTES)[number];
type AppliedRecord = { source: string; applied: string | null };
type TranslationTarget = { source: string; restore: () => void; apply: (translated: string) => void };

function shouldTranslate(value: string) {
  const trimmed = value.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 500 &&
    /[A-Za-zÀ-ÿ]/.test(trimmed) &&
    !/^(https?:\/\/|mailto:|tel:|www\.)/i.test(trimmed) &&
    !/^[\d\s.,€$%:+\-–—/()]+$/.test(trimmed)
  );
}

function withOriginalSpacing(source: string, translated: string) {
  const prefix = source.match(/^\s*/)?.[0] || '';
  const suffix = source.match(/\s*$/)?.[0] || '';
  return `${prefix}${translated.trim()}${suffix}`;
}

function readCache(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const entries = Object.entries(cache).slice(-800);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function cacheKey(locale: string, source: string) {
  return `${locale}:${source.trim()}`;
}

export default function GlobalPageTranslator() {
  const { locale } = useLocale();
  const textRecords = useRef(new WeakMap<Text, AppliedRecord>());
  const attributeRecords = useRef(new WeakMap<Element, Map<AttributeName, AppliedRecord>>());

  const scan = useCallback(async () => {
    if (typeof document === 'undefined' || !document.body) return;
    const targets: TranslationTarget[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const parent = node.parentElement;
      const current = node.nodeValue || '';
      if (!parent || parent.closest(TEXT_SKIP_SELECTOR) || !shouldTranslate(current)) continue;
      let record = textRecords.current.get(node);
      if (!record) {
        record = { source: current, applied: null };
        textRecords.current.set(node, record);
      } else if (current !== record.source && current !== record.applied) {
        record.source = current;
        record.applied = null;
      }
      const entry = record;
      targets.push({
        source: entry.source,
        restore: () => {
          if (node.nodeValue === entry.applied) node.nodeValue = entry.source;
          entry.applied = null;
        },
        apply: (translated) => {
          const next = withOriginalSpacing(entry.source, translated);
          if (node.nodeValue === entry.source || node.nodeValue === entry.applied) {
            node.nodeValue = next;
            entry.applied = next;
          }
        },
      });
    }

    document.querySelectorAll<HTMLElement>('*').forEach((element) => {
      if (element.closest(ATTRIBUTE_SKIP_SELECTOR)) return;
      let records = attributeRecords.current.get(element);
      if (!records) {
        records = new Map();
        attributeRecords.current.set(element, records);
      }
      ATTRIBUTES.forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current || !shouldTranslate(current)) return;
        let record = records.get(attribute);
        if (!record) {
          record = { source: current, applied: null };
          records.set(attribute, record);
        } else if (current !== record.source && current !== record.applied) {
          record.source = current;
          record.applied = null;
        }
        const entry = record;
        targets.push({
          source: entry.source,
          restore: () => {
            if (element.getAttribute(attribute) === entry.applied) {
              element.setAttribute(attribute, entry.source);
            }
            entry.applied = null;
          },
          apply: (translated) => {
            const next = translated.trim();
            if (
              element.getAttribute(attribute) === entry.source ||
              element.getAttribute(attribute) === entry.applied
            ) {
              element.setAttribute(attribute, next);
              entry.applied = next;
            }
          },
        });
      });
    });

    if (locale === 'es') {
      targets.forEach((target) => target.restore());
      return;
    }

    const cache = readCache();
    const pending = new Set<string>();
    targets.forEach((target) => {
      const cached = cache[cacheKey(locale, target.source)];
      if (cached) target.apply(cached);
      else pending.add(target.source.trim());
    });

    const texts = [...pending].slice(0, 40);
    if (!texts.length) return;
    try {
      const response = await fetch('/api/i18n/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: locale, texts }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        translations?: Array<{ source: string; translated: string }>;
      };
      data.translations?.forEach(({ source, translated }) => {
        cache[cacheKey(locale, source)] = translated;
      });
      saveCache(cache);
      targets.forEach((target) => {
        const translated = cache[cacheKey(locale, target.source)];
        if (translated) target.apply(translated);
      });
    } catch {
      // Keep the source language if the external translation service is unavailable.
    }
  }, [locale]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleScan = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void scan(), 140);
    };
    scheduleScan();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [scan]);

  return null;
}
