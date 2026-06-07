import 'server-only';

import { randomUUID } from 'node:crypto';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type {
  FinanceAsset,
  FinanceAssetKind,
  FinanceDashboardPayload,
  FinanceDayNote,
  FinanceEntry,
  FinanceEntryKind,
  FinanceRecoverySummary,
  FinanceSettings,
  FinanceTask,
  FinanceTaskForDay,
} from '@/lib/financeTypes';

const FINANCE_AREAS = {
  settings: 'finance_hub_settings',
  task: 'finance_hub_task',
  completion: 'finance_hub_completion',
  note: 'finance_hub_note',
  entry: 'finance_hub_entry',
  asset: 'finance_hub_asset',
  calendar: 'finance_hub_calendar',
} as const;

const SETTINGS_NAME = 'primary';
const CALENDAR_HORIZON_DAYS = 365;

type SavedFilterRow = {
  id: string;
  user_id: string;
  area: string;
  name: string;
  filter: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }
  return supabaseAdmin;
}

function clampText(value: unknown, max: number) {
  return String(value || '').trim().slice(0, max);
}

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function coerceMoney(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return roundMoney(Math.max(parsed, 0));
}

function coerceInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function coerceBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

function toIsoDate(value: Date) {
  return format(value, 'yyyy-MM-dd');
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ts = parseISO(value).getTime();
  return Number.isFinite(ts);
}

function sanitizeDate(value: unknown, fallback = toIsoDate(new Date())) {
  const next = String(value || '').trim();
  return isValidIsoDate(next) ? next : fallback;
}

function sanitizeTime(value: unknown) {
  const next = String(value || '').trim();
  if (!next) return null;
  return /^\d{2}:\d{2}$/.test(next) ? next : null;
}

function sanitizeWeekdays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => Number(entry)).filter((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 6))].sort();
}

function escapeIcsText(value: string) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsDate(value: Date) {
  return format(value, 'yyyyMMdd');
}

function toIcsDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return format(next, "yyyyMMdd'T'HHmmss");
}

function defaultSettings(): FinanceSettings {
  return {
    recoveryStartedOn: toIsoDate(new Date()),
    relapseDates: [],
    rewardIntervalDays: 15,
    rewardAmountEur: 30,
    pinnedNote: '',
    reminderTime: '21:00',
    browserNotificationsEnabled: false,
    notesPromptEnabled: true,
    calendarFeedEnabled: true,
    calendarToken: randomUUID().replace(/-/g, ''),
  };
}

function normalizeSettings(input: unknown): FinanceSettings {
  const source =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const defaults = defaultSettings();
  const relapseDates = Array.isArray(source.relapseDates)
    ? [...new Set(source.relapseDates.map((entry) => sanitizeDate(entry, '')).filter(Boolean))]
        .sort()
    : [];

  return {
    recoveryStartedOn: sanitizeDate(source.recoveryStartedOn, defaults.recoveryStartedOn),
    relapseDates,
    rewardIntervalDays: coerceInteger(
      source.rewardIntervalDays,
      defaults.rewardIntervalDays,
      1,
      365
    ),
    rewardAmountEur: coerceMoney(source.rewardAmountEur, defaults.rewardAmountEur),
    pinnedNote: clampText(source.pinnedNote, 1200),
    reminderTime: sanitizeTime(source.reminderTime),
    browserNotificationsEnabled: coerceBoolean(
      source.browserNotificationsEnabled,
      defaults.browserNotificationsEnabled
    ),
    notesPromptEnabled: coerceBoolean(
      source.notesPromptEnabled,
      defaults.notesPromptEnabled
    ),
    calendarFeedEnabled: coerceBoolean(
      source.calendarFeedEnabled,
      defaults.calendarFeedEnabled
    ),
    calendarToken: clampText(source.calendarToken, 120) || defaults.calendarToken,
  };
}

function normalizeTask(row: SavedFilterRow): FinanceTask {
  const source = row.filter || {};
  return {
    id: clampText(source.id || row.name, 120) || row.name,
    title: clampText(source.title, 90),
    details: clampText(source.details, 320),
    category: clampText(source.category, 60),
    startDate: sanitizeDate(source.startDate, toIsoDate(new Date())),
    intervalDays: coerceInteger(source.intervalDays, 1, 1, 365),
    weekdays: sanitizeWeekdays(source.weekdays),
    dueTime: sanitizeTime(source.dueTime),
    estimatedMinutes:
      source.estimatedMinutes == null
        ? null
        : coerceInteger(source.estimatedMinutes, 15, 1, 720),
    active: coerceBoolean(source.active, true),
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

function normalizeNote(row: SavedFilterRow): FinanceDayNote | null {
  const source = row.filter || {};
  const date = sanitizeDate(source.date || row.name, '');
  const note = clampText(source.note, 4000);
  if (!date) return null;
  return {
    date,
    note,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

function normalizeEntry(row: SavedFilterRow): FinanceEntry {
  const source = row.filter || {};
  const kind: FinanceEntryKind =
    String(source.kind || '').toLowerCase() === 'income' ? 'income' : 'expense';

  return {
    id: clampText(source.id || row.name, 120) || row.name,
    entryDate: sanitizeDate(source.entryDate, toIsoDate(new Date())),
    kind,
    title: clampText(source.title, 90),
    category: clampText(source.category, 60) || (kind === 'income' ? 'Ingreso' : 'Gasto'),
    amountEur: coerceMoney(source.amountEur),
    notes: clampText(source.notes, 320),
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

function normalizeAsset(row: SavedFilterRow): Omit<FinanceAsset, 'currentPriceEur' | 'currentValueEur' | 'priceSource'> {
  const source = row.filter || {};
  const kindValue = String(source.kind || '').toLowerCase();
  const kind: FinanceAssetKind =
    kindValue === 'cash' ||
    kindValue === 'crypto' ||
    kindValue === 'stock' ||
    kindValue === 'savings'
      ? (kindValue as FinanceAssetKind)
      : 'other';

  return {
    id: clampText(source.id || row.name, 120) || row.name,
    kind,
    label: clampText(source.label, 80),
    symbol: clampText(source.symbol, 30).toUpperCase(),
    quantity: coerceMoney(source.quantity, 0),
    unitPriceEur: coerceMoney(source.unitPriceEur, kind === 'cash' ? 1 : 0),
    autoPrice: coerceBoolean(source.autoPrice, kind === 'crypto'),
    coingeckoId: clampText(source.coingeckoId, 120),
    notes: clampText(source.notes, 320),
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

function toCompletionKey(taskId: string, date: string) {
  return `${taskId}:${date}`;
}

function occursOnDate(task: FinanceTask, isoDate: string) {
  if (!task.active) return false;
  if (!isValidIsoDate(isoDate) || !isValidIsoDate(task.startDate)) return false;

  const targetDate = parseISO(isoDate);
  const startDate = parseISO(task.startDate);
  if (differenceInCalendarDays(targetDate, startDate) < 0) return false;

  if (task.weekdays.length > 0) {
    return task.weekdays.includes(targetDate.getDay());
  }

  const interval = Math.max(1, task.intervalDays || 1);
  return differenceInCalendarDays(targetDate, startDate) % interval === 0;
}

function deriveRecoverySummary(
  settings: FinanceSettings,
  selectedDate: string
): FinanceRecoverySummary {
  const recoveryStartedOn = sanitizeDate(settings.recoveryStartedOn);
  const selected = parseISO(sanitizeDate(selectedDate));
  const relapseDates = [...new Set(settings.relapseDates.filter(isValidIsoDate))].sort();

  let bestStreakDays = 0;
  let previousAnchor = recoveryStartedOn;

  for (const relapseDate of relapseDates) {
    const cleanDaysBeforeRelapse = Math.max(
      0,
      differenceInCalendarDays(parseISO(relapseDate), parseISO(previousAnchor))
    );
    bestStreakDays = Math.max(bestStreakDays, cleanDaysBeforeRelapse);
    previousAnchor = relapseDate;
  }

  const lastRelapse = relapseDates.length ? relapseDates[relapseDates.length - 1] : null;
  const currentStreakDays = lastRelapse
    ? Math.max(0, differenceInCalendarDays(selected, parseISO(lastRelapse)))
    : Math.max(0, differenceInCalendarDays(selected, parseISO(recoveryStartedOn)) + 1);

  bestStreakDays = Math.max(bestStreakDays, currentStreakDays);

  const milestonesReached = Math.floor(
    currentStreakDays / Math.max(1, settings.rewardIntervalDays)
  );
  const nextRewardInDays =
    currentStreakDays === 0
      ? settings.rewardIntervalDays
      : currentStreakDays % settings.rewardIntervalDays === 0
        ? 0
        : settings.rewardIntervalDays -
          (currentStreakDays % settings.rewardIntervalDays);

  return {
    currentStreakDays,
    bestStreakDays,
    relapseCount: relapseDates.length,
    currentRewardUnlockedEur: roundMoney(
      milestonesReached * settings.rewardAmountEur
    ),
    milestonesReached,
    nextRewardInDays,
  };
}

async function fetchRowsForUser(userId: string) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from('admin_saved_filters')
    .select('id,user_id,area,name,filter,created_at,updated_at')
    .eq('user_id', userId)
    .in('area', Object.values(FINANCE_AREAS))
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los datos de finanzas');
  }

  return (data || []) as SavedFilterRow[];
}

async function upsertRow(
  userId: string,
  area: string,
  name: string,
  filter: Record<string, unknown>,
  isDefault = false
) {
  const admin = requireSupabaseAdmin();
  const { error } = await admin.from('admin_saved_filters').upsert(
    {
      user_id: userId,
      area,
      name,
      filter,
      is_default: isDefault,
    },
    {
      onConflict: 'user_id,area,name',
    }
  );

  if (error) {
    throw new Error(error.message || 'No se pudo guardar el registro');
  }
}

async function deleteRow(userId: string, area: string, name: string) {
  const admin = requireSupabaseAdmin();
  const { error } = await admin
    .from('admin_saved_filters')
    .delete()
    .eq('user_id', userId)
    .eq('area', area)
    .eq('name', name);

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar el registro');
  }
}

async function ensureCalendarMapping(userId: string, token: string) {
  const admin = requireSupabaseAdmin();

  const { data: existingRows, error: existingError } = await admin
    .from('admin_saved_filters')
    .select('id,name')
    .eq('user_id', userId)
    .eq('area', FINANCE_AREAS.calendar);

  if (existingError) {
    throw new Error(existingError.message || 'No se pudo preparar el feed de calendario');
  }

  const rows = Array.isArray(existingRows) ? existingRows : [];
  const staleTokens = rows
    .map((row) => String((row as any)?.name || '').trim())
    .filter((name) => name && name !== token);

  if (staleTokens.length > 0) {
    await admin
      .from('admin_saved_filters')
      .delete()
      .eq('user_id', userId)
      .eq('area', FINANCE_AREAS.calendar)
      .in('name', staleTokens);
  }

  await upsertRow(
    userId,
    FINANCE_AREAS.calendar,
    token,
    {
      token,
      type: 'calendar-feed',
    }
  );
}

async function ensureSettings(userId: string) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from('admin_saved_filters')
    .select('id,user_id,area,name,filter,created_at,updated_at')
    .eq('user_id', userId)
    .eq('area', FINANCE_AREAS.settings)
    .eq('name', SETTINGS_NAME)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'No se pudieron preparar los ajustes');
  }

  const settings = normalizeSettings((data as SavedFilterRow | null)?.filter || null);
  await upsertRow(userId, FINANCE_AREAS.settings, SETTINGS_NAME, settings, true);
  await ensureCalendarMapping(userId, settings.calendarToken);
  return settings;
}

async function fetchCryptoPrices(ids: string[]) {
  const uniqueIds = [...new Set(ids.map((entry) => clampText(entry, 120)).filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, number>();

  try {
    const apiKey =
      process.env.COINGECKO_DEMO_API_KEY ||
      process.env.COINGECKO_API_KEY ||
      process.env.NEXT_PUBLIC_COINGECKO_DEMO_API_KEY ||
      '';

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(uniqueIds.join(','))}&vs_currencies=eur`,
      {
        cache: 'no-store',
        headers: apiKey
          ? {
              'x-cg-demo-api-key': apiKey,
            }
          : undefined,
      }
    );

    if (!response.ok) return new Map<string, number>();

    const payload = (await response.json()) as Record<
      string,
      { eur?: number }
    >;
    const output = new Map<string, number>();
    for (const id of uniqueIds) {
      const price = Number(payload?.[id]?.eur);
      if (Number.isFinite(price) && price >= 0) {
        output.set(id, roundMoney(price));
      }
    }
    return output;
  } catch {
    return new Map<string, number>();
  }
}

function withLivePrices(
  assets: Array<Omit<FinanceAsset, 'currentPriceEur' | 'currentValueEur' | 'priceSource'>>,
  livePrices: Map<string, number>
): FinanceAsset[] {
  return assets.map((asset) => {
    const livePrice =
      asset.autoPrice && asset.coingeckoId
        ? livePrices.get(asset.coingeckoId) ?? null
        : null;
    const currentPriceEur = livePrice ?? asset.unitPriceEur;
    return {
      ...asset,
      currentPriceEur: livePrice ?? null,
      currentValueEur: roundMoney(asset.quantity * currentPriceEur),
      priceSource: livePrice != null ? 'live' : 'manual',
    };
  });
}

function deriveCashflow30d(entries: FinanceEntry[], selectedDate: string) {
  const endDate = parseISO(selectedDate);
  const startDate = subDays(endDate, 29);

  return Array.from({ length: 30 }, (_, index) => {
    const date = addDays(startDate, index);
    const isoDate = toIsoDate(date);
    const dayEntries = entries.filter((entry) => entry.entryDate === isoDate);
    const incomeEur = roundMoney(
      dayEntries
        .filter((entry) => entry.kind === 'income')
        .reduce((sum, entry) => sum + entry.amountEur, 0)
    );
    const expenseEur = roundMoney(
      dayEntries
        .filter((entry) => entry.kind === 'expense')
        .reduce((sum, entry) => sum + entry.amountEur, 0)
    );
    return {
      date: isoDate,
      label: format(date, 'dd MMM', { locale: es }),
      incomeEur,
      expenseEur,
      netEur: roundMoney(incomeEur - expenseEur),
    };
  });
}

function deriveExpenseByCategory(entries: FinanceEntry[]) {
  const buckets = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== 'expense') continue;
    const key = entry.category || 'Sin categoría';
    buckets.set(key, roundMoney((buckets.get(key) || 0) + entry.amountEur));
  }

  return [...buckets.entries()]
    .map(([category, totalEur]) => ({ category, totalEur }))
    .sort((left, right) => right.totalEur - left.totalEur)
    .slice(0, 8);
}

function deriveMonthlyNet(entries: FinanceEntry[], selectedDate: string) {
  const end = parseISO(selectedDate);
  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = subMonths(startOfMonth(end), 5 - index);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthEntries = entries.filter((entry) => {
      const date = parseISO(entry.entryDate);
      return date >= monthStart && date <= monthEnd;
    });
    const incomeEur = roundMoney(
      monthEntries
        .filter((entry) => entry.kind === 'income')
        .reduce((sum, entry) => sum + entry.amountEur, 0)
    );
    const expenseEur = roundMoney(
      monthEntries
        .filter((entry) => entry.kind === 'expense')
        .reduce((sum, entry) => sum + entry.amountEur, 0)
    );
    return {
      month: format(monthDate, 'MMM yy', { locale: es }),
      incomeEur,
      expenseEur,
      netEur: roundMoney(incomeEur - expenseEur),
    };
  });
}

function deriveProductivity14d(
  tasks: FinanceTask[],
  completionSet: Set<string>,
  selectedDate: string
) {
  const endDate = parseISO(selectedDate);
  const startDate = subDays(endDate, 13);

  return Array.from({ length: 14 }, (_, index) => {
    const date = addDays(startDate, index);
    const isoDate = toIsoDate(date);
    const dueTasks = tasks.filter((task) => occursOnDate(task, isoDate));
    const completed = dueTasks.filter((task) =>
      completionSet.has(toCompletionKey(task.id, isoDate))
    ).length;
    return {
      date: isoDate,
      label: format(date, 'dd MMM', { locale: es }),
      completionRate: dueTasks.length
        ? Math.round((completed / dueTasks.length) * 100)
        : 100,
      completed,
      due: dueTasks.length,
    };
  });
}

function sortEntries(entries: FinanceEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.entryDate === right.entryDate) {
      return (right.updatedAt || '').localeCompare(left.updatedAt || '');
    }
    return right.entryDate.localeCompare(left.entryDate);
  });
}

function sortTasks(tasks: FinanceTask[]) {
  return [...tasks].sort((left, right) => {
    const leftTime = left.dueTime || '99:99';
    const rightTime = right.dueTime || '99:99';
    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
    return left.title.localeCompare(right.title, 'es');
  });
}

export async function loadFinanceHub(
  userId: string,
  options?: {
    selectedDate?: string;
    userName?: string | null;
    email?: string | null;
  }
): Promise<FinanceDashboardPayload> {
  const settings = await ensureSettings(userId);
  const rows = await fetchRowsForUser(userId);
  const selectedDate = sanitizeDate(options?.selectedDate);

  const tasks = sortTasks(
    rows
      .filter((row) => row.area === FINANCE_AREAS.task)
      .map(normalizeTask)
      .filter((task) => task.title)
  );

  const completionSet = new Set(
    rows
      .filter((row) => row.area === FINANCE_AREAS.completion)
      .map((row) => row.name)
      .filter(Boolean)
  );

  const notesByDate = rows
    .filter((row) => row.area === FINANCE_AREAS.note)
    .map(normalizeNote)
    .filter(Boolean) as FinanceDayNote[];

  const entries = sortEntries(
    rows
      .filter((row) => row.area === FINANCE_AREAS.entry)
      .map(normalizeEntry)
      .filter((entry) => entry.title && entry.amountEur > 0)
  );

  const rawAssets = rows
    .filter((row) => row.area === FINANCE_AREAS.asset)
    .map(normalizeAsset)
    .filter((asset) => asset.label && asset.quantity >= 0);
  const livePriceMap = await fetchCryptoPrices(
    rawAssets
      .filter((asset) => asset.autoPrice && asset.coingeckoId)
      .map((asset) => asset.coingeckoId)
  );
  const assets = withLivePrices(rawAssets, livePriceMap).sort((left, right) =>
    right.currentValueEur - left.currentValueEur
  );

  const tasksForSelectedDate: FinanceTaskForDay[] = tasks
    .filter((task) => occursOnDate(task, selectedDate))
    .map((task) => ({
      ...task,
      completed: completionSet.has(toCompletionKey(task.id, selectedDate)),
    }));

  const noteForSelectedDate =
    notesByDate.find((note) => note.date === selectedDate) || null;
  const entriesForSelectedDate = entries.filter(
    (entry) => entry.entryDate === selectedDate
  );

  const selectedDayIncomeEur = roundMoney(
    entriesForSelectedDate
      .filter((entry) => entry.kind === 'income')
      .reduce((sum, entry) => sum + entry.amountEur, 0)
  );
  const selectedDayExpenseEur = roundMoney(
    entriesForSelectedDate
      .filter((entry) => entry.kind === 'expense')
      .reduce((sum, entry) => sum + entry.amountEur, 0)
  );

  const monthKey = selectedDate.slice(0, 7);
  const monthEntries = entries.filter((entry) => entry.entryDate.startsWith(monthKey));
  const monthIncomeEur = roundMoney(
    monthEntries
      .filter((entry) => entry.kind === 'income')
      .reduce((sum, entry) => sum + entry.amountEur, 0)
  );
  const monthExpenseEur = roundMoney(
    monthEntries
      .filter((entry) => entry.kind === 'expense')
      .reduce((sum, entry) => sum + entry.amountEur, 0)
  );

  const tasksCompleted = tasksForSelectedDate.filter((task) => task.completed).length;
  const tasksDue = tasksForSelectedDate.length;
  const recovery = deriveRecoverySummary(settings, selectedDate);

  return {
    selectedDate,
    user: {
      id: userId,
      name: options?.userName || null,
      email: options?.email || '',
    },
    settings,
    noteForSelectedDate,
    notesByDate: notesByDate.sort((left, right) =>
      right.date.localeCompare(left.date)
    ),
    tasks,
    tasksForSelectedDate,
    entries,
    entriesForSelectedDate,
    assets,
    recovery,
    summary: {
      todayCompletionRate: tasksDue
        ? Math.round((tasksCompleted / tasksDue) * 100)
        : 100,
      tasksDue,
      tasksCompleted,
      selectedDayIncomeEur,
      selectedDayExpenseEur,
      selectedDayNetEur: roundMoney(selectedDayIncomeEur - selectedDayExpenseEur),
      monthIncomeEur,
      monthExpenseEur,
      monthNetEur: roundMoney(monthIncomeEur - monthExpenseEur),
      assetValueEur: roundMoney(
        assets.reduce((sum, asset) => sum + asset.currentValueEur, 0)
      ),
    },
    charts: {
      cashflow30d: deriveCashflow30d(entries, selectedDate),
      expenseByCategory: deriveExpenseByCategory(entries),
      monthlyNet: deriveMonthlyNet(entries, selectedDate),
      productivity14d: deriveProductivity14d(tasks, completionSet, selectedDate),
    },
    calendarFeedPath: settings.calendarFeedEnabled
      ? `/api/finanzas/calendar/${settings.calendarToken}`
      : null,
  };
}

function sanitizeTaskPayload(input: Record<string, unknown>) {
  const id = clampText(input.id, 120) || randomUUID();
  return {
    id,
    title: clampText(input.title, 90),
    details: clampText(input.details, 320),
    category: clampText(input.category, 60),
    startDate: sanitizeDate(input.startDate),
    intervalDays: coerceInteger(input.intervalDays, 1, 1, 365),
    weekdays: sanitizeWeekdays(input.weekdays),
    dueTime: sanitizeTime(input.dueTime),
    estimatedMinutes:
      input.estimatedMinutes == null || input.estimatedMinutes === ''
        ? null
        : coerceInteger(input.estimatedMinutes, 15, 1, 720),
    active: coerceBoolean(input.active, true),
  };
}

function sanitizeEntryPayload(input: Record<string, unknown>) {
  const id = clampText(input.id, 120) || randomUUID();
  const kind: FinanceEntryKind =
    String(input.kind || '').toLowerCase() === 'income' ? 'income' : 'expense';
  return {
    id,
    entryDate: sanitizeDate(input.entryDate),
    kind,
    title: clampText(input.title, 90),
    category: clampText(input.category, 60) || (kind === 'income' ? 'Ingreso' : 'Gasto'),
    amountEur: coerceMoney(input.amountEur),
    notes: clampText(input.notes, 320),
  };
}

function sanitizeAssetPayload(input: Record<string, unknown>) {
  const id = clampText(input.id, 120) || randomUUID();
  const kindValue = String(input.kind || '').toLowerCase();
  const kind: FinanceAssetKind =
    kindValue === 'cash' ||
    kindValue === 'crypto' ||
    kindValue === 'stock' ||
    kindValue === 'savings'
      ? (kindValue as FinanceAssetKind)
      : 'other';
  return {
    id,
    kind,
    label: clampText(input.label, 80),
    symbol: clampText(input.symbol, 30).toUpperCase(),
    quantity: coerceMoney(input.quantity, 0),
    unitPriceEur: coerceMoney(input.unitPriceEur, kind === 'cash' ? 1 : 0),
    autoPrice: coerceBoolean(input.autoPrice, kind === 'crypto'),
    coingeckoId: clampText(input.coingeckoId, 120),
    notes: clampText(input.notes, 320),
  };
}

function mergeSettings(
  current: FinanceSettings,
  input: Record<string, unknown>
): FinanceSettings {
  return normalizeSettings({
    ...current,
    recoveryStartedOn: sanitizeDate(
      input.recoveryStartedOn,
      current.recoveryStartedOn
    ),
    rewardIntervalDays: coerceInteger(
      input.rewardIntervalDays,
      current.rewardIntervalDays,
      1,
      365
    ),
    rewardAmountEur: coerceMoney(
      input.rewardAmountEur,
      current.rewardAmountEur
    ),
    pinnedNote: clampText(input.pinnedNote, 1200),
    reminderTime: sanitizeTime(input.reminderTime),
    browserNotificationsEnabled: coerceBoolean(
      input.browserNotificationsEnabled,
      current.browserNotificationsEnabled
    ),
    notesPromptEnabled: coerceBoolean(
      input.notesPromptEnabled,
      current.notesPromptEnabled
    ),
    calendarFeedEnabled: coerceBoolean(
      input.calendarFeedEnabled,
      current.calendarFeedEnabled
    ),
    calendarToken: current.calendarToken,
    relapseDates: current.relapseDates,
  });
}

export async function mutateFinanceHub(
  userId: string,
  action: string,
  payload: Record<string, unknown>,
  options?: {
    selectedDate?: string;
    userName?: string | null;
    email?: string | null;
  }
) {
  const currentSettings = await ensureSettings(userId);

  switch (action) {
    case 'saveTask': {
      const task = sanitizeTaskPayload(payload);
      if (!task.title) {
        throw new Error('La tarea necesita un título');
      }
      await upsertRow(userId, FINANCE_AREAS.task, task.id, task);
      break;
    }

    case 'deleteTask': {
      const taskId = clampText(payload.id, 120);
      if (!taskId) throw new Error('Falta la tarea a eliminar');
      await deleteRow(userId, FINANCE_AREAS.task, taskId);
      const admin = requireSupabaseAdmin();
      await admin
        .from('admin_saved_filters')
        .delete()
        .eq('user_id', userId)
        .eq('area', FINANCE_AREAS.completion)
        .like('name', `${taskId}:%`);
      break;
    }

    case 'toggleCompletion': {
      const taskId = clampText(payload.taskId, 120);
      const date = sanitizeDate(payload.date);
      if (!taskId) throw new Error('Falta la tarea');
      const key = toCompletionKey(taskId, date);
      const completed = coerceBoolean(payload.completed, false);
      if (completed) {
        await upsertRow(userId, FINANCE_AREAS.completion, key, {
          taskId,
          date,
          completed: true,
        });
      } else {
        await deleteRow(userId, FINANCE_AREAS.completion, key);
      }
      break;
    }

    case 'saveNote': {
      const date = sanitizeDate(payload.date);
      const note = clampText(payload.note, 4000);
      if (!note) {
        await deleteRow(userId, FINANCE_AREAS.note, date);
      } else {
        await upsertRow(userId, FINANCE_AREAS.note, date, { date, note });
      }
      break;
    }

    case 'saveEntry': {
      const entry = sanitizeEntryPayload(payload);
      if (!entry.title || entry.amountEur <= 0) {
        throw new Error('El movimiento necesita concepto e importe');
      }
      await upsertRow(userId, FINANCE_AREAS.entry, entry.id, entry);
      break;
    }

    case 'deleteEntry': {
      const entryId = clampText(payload.id, 120);
      if (!entryId) throw new Error('Falta el movimiento a eliminar');
      await deleteRow(userId, FINANCE_AREAS.entry, entryId);
      break;
    }

    case 'saveAsset': {
      const asset = sanitizeAssetPayload(payload);
      if (!asset.label) {
        throw new Error('El activo necesita un nombre');
      }
      await upsertRow(userId, FINANCE_AREAS.asset, asset.id, asset);
      break;
    }

    case 'deleteAsset': {
      const assetId = clampText(payload.id, 120);
      if (!assetId) throw new Error('Falta el activo a eliminar');
      await deleteRow(userId, FINANCE_AREAS.asset, assetId);
      break;
    }

    case 'saveSettings': {
      const nextSettings = mergeSettings(currentSettings, payload);
      await upsertRow(
        userId,
        FINANCE_AREAS.settings,
        SETTINGS_NAME,
        nextSettings,
        true
      );
      await ensureCalendarMapping(userId, nextSettings.calendarToken);
      break;
    }

    case 'registerRelapse': {
      const relapseDate = sanitizeDate(payload.date);
      const nextSettings = normalizeSettings({
        ...currentSettings,
        relapseDates: [
          ...currentSettings.relapseDates,
          relapseDate,
        ],
      });
      await upsertRow(
        userId,
        FINANCE_AREAS.settings,
        SETTINGS_NAME,
        nextSettings,
        true
      );
      await ensureCalendarMapping(userId, nextSettings.calendarToken);
      break;
    }

    default:
      throw new Error('Acción no soportada');
  }

  return loadFinanceHub(userId, options);
}

export async function getFinanceCalendarFeed(token: string) {
  const admin = requireSupabaseAdmin();
  const cleanToken = clampText(token, 160);
  if (!cleanToken) return null;

  const { data, error } = await admin
    .from('admin_saved_filters')
    .select('user_id')
    .eq('area', FINANCE_AREAS.calendar)
    .eq('name', cleanToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'No se pudo resolver el calendario');
  }
  if (!data?.user_id) return null;

  const settings = await ensureSettings(String(data.user_id));
  const rows = await fetchRowsForUser(String(data.user_id));
  const tasks = sortTasks(
    rows
      .filter((row) => row.area === FINANCE_AREAS.task)
      .map(normalizeTask)
      .filter((task) => task.active && task.title)
  );

  return {
    settings,
    tasks,
  };
}

export function buildFinanceCalendarIcs(
  title: string,
  tasks: FinanceTask[]
) {
  const today = new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AdvancedRetro//Finanzas Hub//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(title)}`,
  ];

  for (let offset = 0; offset < CALENDAR_HORIZON_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const isoDate = toIsoDate(date);

    for (const task of tasks) {
      if (!occursOnDate(task, isoDate)) continue;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${escapeIcsText(`${task.id}-${isoDate}@advancedretro.es`)}`);
      lines.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`);
      lines.push(`SUMMARY:${escapeIcsText(task.title)}`);
      if (task.details) {
        lines.push(`DESCRIPTION:${escapeIcsText(task.details)}`);
      }

      if (task.dueTime) {
        const startsAt = toIcsDateTime(date, task.dueTime);
        const minutes = Math.max(15, task.estimatedMinutes || 30);
        const endDate = new Date(date);
        const [hours, minutesFromTask] = task.dueTime.split(':').map(Number);
        endDate.setHours(hours || 0, minutesFromTask || 0, 0, 0);
        endDate.setMinutes(endDate.getMinutes() + minutes);
        lines.push(`DTSTART:${startsAt}`);
        lines.push(`DTEND:${format(endDate, "yyyyMMdd'T'HHmmss")}`);
      } else {
        const nextDate = addDays(date, 1);
        lines.push(`DTSTART;VALUE=DATE:${toIcsDate(date)}`);
        lines.push(`DTEND;VALUE=DATE:${toIcsDate(nextDate)}`);
      }

      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
