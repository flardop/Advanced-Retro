'use client';

import {
  Bell,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  Copy,
  Edit3,
  Goal,
  LineChart,
  Loader2,
  NotebookPen,
  PiggyBank,
  Plus,
  Repeat,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  FinanceAsset,
  FinanceDashboardPayload,
  FinanceEntry,
  FinanceTask,
} from '@/lib/financeTypes';
import FinanceHubGuestPreview from '@/components/finance/FinanceHubGuestPreview';

type LoadState = 'loading' | 'ready' | 'guest' | 'error';
type ReminderPermissionState =
  | NotificationPermission
  | 'unsupported';
type TaskPreset =
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'specificWeekdays'
  | 'customDays';

type TaskFormState = {
  id: string | null;
  title: string;
  details: string;
  category: string;
  startDate: string;
  dueTime: string;
  estimatedMinutes: string;
  repeatPreset: TaskPreset;
  intervalDays: string;
  weekdays: number[];
  active: boolean;
};

type EntryFormState = {
  id: string | null;
  entryDate: string;
  kind: 'income' | 'expense';
  title: string;
  category: string;
  amountEur: string;
  notes: string;
};

type AssetFormState = {
  id: string | null;
  kind: FinanceAsset['kind'];
  label: string;
  symbol: string;
  quantity: string;
  unitPriceEur: string;
  autoPrice: boolean;
  coingeckoId: string;
  notes: string;
};

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'X' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

function todayIsoDate() {
  return format(new Date(), 'yyyy-MM-dd');
}

function createEmptyTaskForm(): TaskFormState {
  return {
    id: null,
    title: '',
    details: '',
    category: '',
    startDate: todayIsoDate(),
    dueTime: '',
    estimatedMinutes: '20',
    repeatPreset: 'daily',
    intervalDays: '1',
    weekdays: [1, 2, 3, 4, 5],
    active: true,
  };
}

function createEmptyEntryForm(kind: 'income' | 'expense'): EntryFormState {
  return {
    id: null,
    entryDate: todayIsoDate(),
    kind,
    title: '',
    category: kind === 'income' ? 'Ingreso' : 'Gasto',
    amountEur: '',
    notes: '',
  };
}

function createEmptyAssetForm(): AssetFormState {
  return {
    id: null,
    kind: 'cash',
    label: '',
    symbol: '',
    quantity: '',
    unitPriceEur: '1',
    autoPrice: false,
    coingeckoId: '',
    notes: '',
  };
}

function formatEuro(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function deriveTaskPreset(task: FinanceTask): TaskPreset {
  if (task.weekdays.length === 0 && task.intervalDays === 1) return 'daily';
  if (
    task.weekdays.length === 5 &&
    [1, 2, 3, 4, 5].every((day) => task.weekdays.includes(day))
  ) {
    return 'weekdays';
  }
  if (task.weekdays.length === 1) return 'weekly';
  if (task.weekdays.length > 1) return 'specificWeekdays';
  return 'customDays';
}

function buildTaskPayload(form: TaskFormState) {
  let weekdays: number[] = [];
  let intervalDays = Number(form.intervalDays || 1);

  if (form.repeatPreset === 'weekdays') {
    weekdays = [1, 2, 3, 4, 5];
    intervalDays = 1;
  } else if (form.repeatPreset === 'weekly') {
    const weekday = parseISO(form.startDate).getDay();
    weekdays = [weekday];
    intervalDays = 1;
  } else if (form.repeatPreset === 'specificWeekdays') {
    weekdays = form.weekdays.length ? form.weekdays : [parseISO(form.startDate).getDay()];
    intervalDays = 1;
  } else if (form.repeatPreset === 'daily') {
    weekdays = [];
    intervalDays = 1;
  } else {
    weekdays = [];
    intervalDays = Number(form.intervalDays || 1);
  }

  return {
    id: form.id,
    title: form.title,
    details: form.details,
    category: form.category,
    startDate: form.startDate,
    dueTime: form.dueTime || null,
    estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
    intervalDays,
    weekdays,
    active: form.active,
  };
}

function hydrateTaskForm(task: FinanceTask): TaskFormState {
  return {
    id: task.id,
    title: task.title,
    details: task.details,
    category: task.category,
    startDate: task.startDate,
    dueTime: task.dueTime || '',
    estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : '',
    repeatPreset: deriveTaskPreset(task),
    intervalDays: String(task.intervalDays || 1),
    weekdays: task.weekdays,
    active: task.active,
  };
}

function hydrateEntryForm(entry: FinanceEntry): EntryFormState {
  return {
    id: entry.id,
    entryDate: entry.entryDate,
    kind: entry.kind,
    title: entry.title,
    category: entry.category,
    amountEur: String(entry.amountEur),
    notes: entry.notes,
  };
}

function hydrateAssetForm(asset: FinanceAsset): AssetFormState {
  return {
    id: asset.id,
    kind: asset.kind,
    label: asset.label,
    symbol: asset.symbol,
    quantity: String(asset.quantity),
    unitPriceEur: String(asset.unitPriceEur),
    autoPrice: asset.autoPrice,
    coingeckoId: asset.coingeckoId,
    notes: asset.notes,
  };
}

function formatDayLabel(value: string) {
  return format(parseISO(value), "EEEE d 'de' MMMM", { locale: es });
}

function formatShortDate(value: string) {
  return format(parseISO(value), 'dd MMM', { locale: es });
}

function describeTaskRepeat(task: FinanceTask) {
  if (task.weekdays.length === 0 && task.intervalDays === 1) {
    return 'Cada día';
  }
  if (
    task.weekdays.length === 5 &&
    [1, 2, 3, 4, 5].every((day) => task.weekdays.includes(day))
  ) {
    return 'Laborables';
  }
  if (task.weekdays.length > 0) {
    const labels = WEEKDAY_OPTIONS.filter((day) =>
      task.weekdays.includes(day.value)
    ).map((day) => day.label);
    return `Días: ${labels.join(' · ')}`;
  }
  return `Cada ${task.intervalDays} días`;
}

function SummaryCard({
  icon: Icon,
  eyebrow,
  title,
  value,
  accent,
  copy,
}: {
  icon: typeof CalendarDays;
  eyebrow: string;
  title: string;
  value: string;
  accent: string;
  copy: string;
}) {
  return (
    <article className="glass relative overflow-hidden rounded-[1.6rem] p-5">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${accent}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-textMuted">
            {eyebrow}
          </p>
          <h3 className="mt-3 text-sm font-medium text-textMuted">{title}</h3>
          <p className="mt-2 text-3xl font-semibold text-text">{value}</p>
          <p className="mt-2 text-sm leading-relaxed text-textMuted">{copy}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-line/80 bg-[rgba(255,255,255,0.02)] p-5 text-sm text-textMuted">
      <p className="font-semibold text-text">{title}</p>
      <p className="mt-2 leading-relaxed">{copy}</p>
    </div>
  );
}

export default function FinanceHub() {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [dashboard, setDashboard] = useState<FinanceDashboardPayload | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(createEmptyTaskForm());
  const [entryForm, setEntryForm] = useState<EntryFormState>(createEmptyEntryForm('expense'));
  const [assetForm, setAssetForm] = useState<AssetFormState>(createEmptyAssetForm());
  const [dayNoteDraft, setDayNoteDraft] = useState('');
  const [pinnedNoteDraft, setPinnedNoteDraft] = useState('');
  const [reminderTimeDraft, setReminderTimeDraft] = useState('21:00');
  const [relapseDateDraft, setRelapseDateDraft] = useState(todayIsoDate());
  const [notificationPermission, setNotificationPermission] =
    useState<ReminderPermissionState>('unsupported');

  const feedUrl = useMemo(() => {
    if (!dashboard?.calendarFeedPath || typeof window === 'undefined') return '';
    return new URL(dashboard.calendarFeedPath, window.location.origin).toString();
  }, [dashboard?.calendarFeedPath]);

  const selectedDateLabel = useMemo(
    () => formatDayLabel(selectedDate),
    [selectedDate]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    setNotificationPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    if (!dashboard) return;
    setDayNoteDraft(dashboard.noteForSelectedDate?.note || '');
    setPinnedNoteDraft(dashboard.settings.pinnedNote || '');
    setReminderTimeDraft(dashboard.settings.reminderTime || '21:00');
  }, [dashboard]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoadState('loading');
        setErrorMessage('');
        const response = await fetch(
          `/api/finanzas/dashboard?date=${encodeURIComponent(selectedDate)}`,
          {
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          if (!mounted) return;
          setLoadState('guest');
          setDashboard(null);
          return;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'No se pudo cargar el hub financiero');
        }

        if (!mounted) return;
        setDashboard(payload as FinanceDashboardPayload);
        setLoadState('ready');
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el hub financiero'
        );
        setLoadState('error');
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (
      !dashboard?.settings.browserNotificationsEnabled ||
      notificationPermission !== 'granted' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const time = dashboard.settings.reminderTime || '21:00';
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const nextNotificationAt = new Date();
    nextNotificationAt.setHours(hours || 21, minutes || 0, 0, 0);
    if (nextNotificationAt <= now) {
      nextNotificationAt.setDate(nextNotificationAt.getDate() + 1);
    }

    const timer = window.setTimeout(() => {
      const pendingTasks = dashboard.tasksForSelectedDate.filter(
        (task) => !task.completed
      ).length;
      const body =
        pendingTasks > 0
          ? `Te quedan ${pendingTasks} rutinas por cerrar y revisar.`
          : 'Toca revisar tus notas, gastos y progreso del día.';

      new Notification('Cierre del día · AdvancedRetro Finanzas', {
        body,
      });
    }, nextNotificationAt.getTime() - now.getTime());

    return () => window.clearTimeout(timer);
  }, [
    dashboard?.settings.browserNotificationsEnabled,
    dashboard?.settings.reminderTime,
    dashboard?.tasksForSelectedDate,
    notificationPermission,
  ]);

  async function mutateHub(
    action: string,
    payload: Record<string, unknown>,
    successMessage?: string
  ) {
    try {
      setSavingAction(action);
      const response = await fetch('/api/finanzas/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          payload,
          selectedDate,
        }),
      });

      const nextState = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(nextState?.error || 'No se pudo guardar el cambio');
      }

      setDashboard(nextState as FinanceDashboardPayload);
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo guardar el cambio'
      );
    } finally {
      setSavingAction(null);
    }
  }

  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Este navegador no soporta notificaciones');
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission !== 'granted') {
      toast.error('No diste permiso para notificaciones');
      return;
    }

    await mutateHub(
      'saveSettings',
      {
        ...dashboard?.settings,
        reminderTime: reminderTimeDraft,
        browserNotificationsEnabled: true,
        pinnedNote: pinnedNoteDraft,
      },
      'Notificaciones activadas'
    );
  }

  function copyFeedUrl() {
    if (!feedUrl) {
      toast.error('Aun no hay feed de calendario disponible');
      return;
    }
    navigator.clipboard
      .writeText(feedUrl)
      .then(() => toast.success('Enlace del calendario copiado'))
      .catch(() => toast.error('No se pudo copiar el enlace'));
  }

  function handleTaskSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildTaskPayload(taskForm);
    void mutateHub(
      'saveTask',
      payload,
      taskForm.id ? 'Rutina actualizada' : 'Rutina creada'
    ).then(() => {
      setTaskForm(createEmptyTaskForm());
    });
  }

  function handleEntrySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutateHub(
      'saveEntry',
      {
        ...entryForm,
        amountEur: Number(entryForm.amountEur || 0),
      },
      entryForm.id ? 'Movimiento actualizado' : 'Movimiento guardado'
    ).then(() => {
      setEntryForm(createEmptyEntryForm(entryForm.kind));
    });
  }

  function handleAssetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutateHub(
      'saveAsset',
      {
        ...assetForm,
        quantity: Number(assetForm.quantity || 0),
        unitPriceEur: Number(assetForm.unitPriceEur || 0),
      },
      assetForm.id ? 'Activo actualizado' : 'Activo guardado'
    ).then(() => {
      setAssetForm(createEmptyAssetForm());
    });
  }

  function beginTaskEdit(task: FinanceTask) {
    setTaskForm(hydrateTaskForm(task));
  }

  function beginEntryEdit(entry: FinanceEntry) {
    setEntryForm(hydrateEntryForm(entry));
  }

  function beginAssetEdit(asset: FinanceAsset) {
    setAssetForm(hydrateAssetForm(asset));
  }

  if (loadState === 'loading') {
    return <FinanceHubGuestPreview loading />;
  }

  if (loadState === 'guest') {
    return <FinanceHubGuestPreview />;
  }

  if (loadState === 'error' || !dashboard) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass rounded-[2rem] p-8">
            <p className="text-lg font-semibold text-text">No pude cargar tu hub.</p>
            <p className="mt-3 text-sm leading-7 text-textMuted">
              {errorMessage || 'Algo falló al leer tus datos personales.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2.3rem] border border-line/80 bg-[radial-gradient(circle_at_top_left,rgba(102,192,244,0.18),transparent_38%),linear-gradient(180deg,rgba(13,20,34,0.96),rgba(9,14,24,0.98))] p-6 shadow-[0_28px_80px_rgba(3,8,18,0.34)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-primary">
                <Sparkles className="h-4 w-4" />
                Tu centro privado dentro de AdvancedRetro
              </div>
              <h1 className="title-display mt-5 text-3xl sm:text-5xl">
                Finanzas, constancia y orden diario sin salir de tu universo.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-textMuted sm:text-base">
                Todo gira alrededor de una fecha: tus rutinas recurrentes,
                tu nota del día, movimientos, activos y la racha que quieres
                proteger. La idea es que esto sea bonito, pero sobre todo útil.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <label className="rounded-[1.4rem] border border-line bg-black/20 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
                  Día activo
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="mt-3 w-full bg-transparent px-0 py-0 text-base font-semibold"
                />
                <p className="mt-2 text-xs text-textMuted">{selectedDateLabel}</p>
              </label>

              <div className="rounded-[1.4rem] border border-line bg-black/20 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-textMuted">
                  Calendario externo
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyFeedUrl}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-semibold text-text hover:border-primary/40 hover:text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar feed ICS
                  </button>
                  {feedUrl ? (
                    <a
                      href={feedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-semibold text-text hover:border-primary/40 hover:text-primary"
                    >
                      Abrir feed
                    </a>
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-6 text-textMuted">
                  Suscribe este enlace en Apple Calendar o Google Calendar para recibir avisos reales en tus dispositivos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Goal}
            eyebrow="Racha limpia"
            title="Días sin apostar"
            value={String(dashboard.recovery.currentStreakDays)}
            accent="bg-gradient-to-r from-emerald-400 to-lime-300"
            copy={`Mejor marca: ${dashboard.recovery.bestStreakDays} días · ${dashboard.recovery.relapseCount} recaídas registradas`}
          />
          <SummaryCard
            icon={CalendarDays}
            eyebrow="Rutinas"
            title="Cumplimiento del día"
            value={formatPercent(dashboard.summary.todayCompletionRate)}
            accent="bg-gradient-to-r from-sky-400 to-cyan-300"
            copy={`${dashboard.summary.tasksCompleted}/${dashboard.summary.tasksDue} tareas completadas`}
          />
          <SummaryCard
            icon={Coins}
            eyebrow="Caja del mes"
            title="Balance mensual"
            value={formatEuro(dashboard.summary.monthNetEur)}
            accent="bg-gradient-to-r from-amber-300 to-orange-400"
            copy={`${formatEuro(dashboard.summary.monthIncomeEur)} entran · ${formatEuro(dashboard.summary.monthExpenseEur)} salen`}
          />
          <SummaryCard
            icon={Wallet}
            eyebrow="Patrimonio"
            title="Valor actual"
            value={formatEuro(dashboard.summary.assetValueEur)}
            accent="bg-gradient-to-r from-violet-400 to-fuchsia-300"
            copy="Suma manual y crypto actualizada cuando tenga precio en directo."
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <article className="glass rounded-[1.8rem] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                        Rutinas del día
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-text">
                      Lo que toca cerrar hoy
                    </h2>
                  </div>
                  {savingAction === 'toggleCompletion' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {dashboard.tasksForSelectedDate.length === 0 ? (
                    <EmptyState
                      title="No tienes rutinas activas para este día."
                      copy="Añade tareas recurrentes abajo y el sistema las traerá aquí según su repetición."
                    />
                  ) : (
                    dashboard.tasksForSelectedDate.map((task) => (
                      <label
                        key={`${task.id}-${selectedDate}`}
                        className={`flex items-start gap-3 rounded-[1.3rem] border p-4 transition ${
                          task.completed
                            ? 'border-emerald-400/30 bg-emerald-400/10'
                            : 'border-line bg-black/10 hover:border-primary/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(event) =>
                            void mutateHub(
                              'toggleCompletion',
                              {
                                taskId: task.id,
                                date: selectedDate,
                                completed: event.target.checked,
                              },
                              event.target.checked
                                ? 'Rutina completada'
                                : 'Rutina reabierta'
                            )
                          }
                          className="mt-1 h-4 w-4"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-text">{task.title}</h3>
                            {task.category ? (
                              <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-textMuted">
                                {task.category}
                              </span>
                            ) : null}
                            {task.dueTime ? (
                              <span className="inline-flex items-center gap-1 text-xs text-textMuted">
                                <Clock3 className="h-3.5 w-3.5" />
                                {task.dueTime}
                              </span>
                            ) : null}
                          </div>
                          {task.details ? (
                            <p className="mt-2 text-sm leading-6 text-textMuted">
                              {task.details}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-textMuted">
                            <span className="inline-flex items-center gap-1">
                              <Repeat className="h-3.5 w-3.5" />
                              {describeTaskRepeat(task)}
                            </span>
                            {task.estimatedMinutes ? (
                              <span>{task.estimatedMinutes} min</span>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </article>

              <article className="glass rounded-[1.8rem] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-primary">
                  <NotebookPen className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                    Nota diaria
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-text">
                  Lo que pasó en {formatShortDate(selectedDate)}
                </h2>
                <textarea
                  value={dayNoteDraft}
                  onChange={(event) => setDayNoteDraft(event.target.value)}
                  placeholder="Apunta cómo ha ido el día, qué te preocupa o qué no quieres olvidar mañana."
                  className="mt-5 min-h-[210px] w-full resize-none px-4 py-4 text-sm leading-7"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void mutateHub(
                        'saveNote',
                        { date: selectedDate, note: dayNoteDraft },
                        dayNoteDraft ? 'Nota del día guardada' : 'Nota del día eliminada'
                      )
                    }
                    className="button-primary"
                    disabled={savingAction === 'saveNote'}
                  >
                    {savingAction === 'saveNote' ? 'Guardando…' : 'Guardar nota'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayNoteDraft('')}
                    className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
                  >
                    Limpiar
                  </button>
                </div>
              </article>
            </div>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="h-5 w-5" />
                    <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                      Rutinas activas
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-text">
                    Constructor de agenda repetible
                  </h2>
                </div>
                {taskForm.id ? (
                  <button
                    type="button"
                    onClick={() => setTaskForm(createEmptyTaskForm())}
                    className="rounded-full border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-text hover:border-primary/40 hover:text-primary"
                  >
                    Cancelar edición
                  </button>
                ) : null}
              </div>

              <form onSubmit={handleTaskSubmit} className="mt-5 grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={taskForm.title}
                    onChange={(event) =>
                      setTaskForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Ej. Revisar email"
                    className="px-4 py-3"
                  />
                  <input
                    value={taskForm.category}
                    onChange={(event) =>
                      setTaskForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Categoría"
                    className="px-4 py-3"
                  />
                </div>
                <textarea
                  value={taskForm.details}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, details: event.target.value }))
                  }
                  placeholder="Contexto, checklist o matices para esa rutina"
                  className="min-h-[100px] resize-none px-4 py-3 text-sm leading-7"
                />
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Empieza
                    </span>
                    <input
                      type="date"
                      value={taskForm.startDate}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          startDate: event.target.value,
                        }))
                      }
                      className="mt-2 w-full bg-transparent"
                    />
                  </label>
                  <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Hora
                    </span>
                    <input
                      type="time"
                      value={taskForm.dueTime}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          dueTime: event.target.value,
                        }))
                      }
                      className="mt-2 w-full bg-transparent"
                    />
                  </label>
                  <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Minutos
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={taskForm.estimatedMinutes}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          estimatedMinutes: event.target.value,
                        }))
                      }
                      className="mt-2 w-full bg-transparent"
                    />
                  </label>
                  <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Repite
                    </span>
                    <select
                      value={taskForm.repeatPreset}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          repeatPreset: event.target.value as TaskPreset,
                        }))
                      }
                      className="mt-2 w-full bg-transparent"
                    >
                      <option value="daily">Cada día</option>
                      <option value="weekdays">Laborables</option>
                      <option value="weekly">Semanal</option>
                      <option value="specificWeekdays">Días concretos</option>
                      <option value="customDays">Cada X días</option>
                    </select>
                  </label>
                </div>

                {taskForm.repeatPreset === 'specificWeekdays' ? (
                  <div className="rounded-[1.2rem] border border-line/80 bg-black/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Elige los días
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {WEEKDAY_OPTIONS.map((day) => {
                        const active = taskForm.weekdays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() =>
                              setTaskForm((current) => ({
                                ...current,
                                weekdays: active
                                  ? current.weekdays.filter((value) => value !== day.value)
                                  : [...current.weekdays, day.value].sort(),
                              }))
                            }
                            className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                              active
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-line text-textMuted hover:border-primary/30 hover:text-text'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {taskForm.repeatPreset === 'customDays' ? (
                  <label className="rounded-[1.2rem] border border-line/80 bg-black/10 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                      Intervalo
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={taskForm.intervalDays}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          intervalDays: event.target.value,
                        }))
                      }
                      className="mt-2 w-full bg-transparent"
                    />
                    <p className="mt-2 text-xs text-textMuted">
                      Ejemplo: 2 significa un día sí y otro no.
                    </p>
                  </label>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={savingAction === 'saveTask'}
                  >
                    {savingAction === 'saveTask'
                      ? 'Guardando…'
                      : taskForm.id
                        ? 'Actualizar rutina'
                        : 'Crear rutina'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskForm(createEmptyTaskForm())}
                    className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
                  >
                    Resetear formulario
                  </button>
                </div>
              </form>

              <div className="mt-6 grid gap-3">
                {dashboard.tasks.length === 0 ? (
                  <EmptyState
                    title="Todavía no hay rutinas guardadas."
                    copy="Crea tus hábitos recurrentes y este panel te permitirá editarlos o borrarlos cuando quieras."
                  />
                ) : (
                  dashboard.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-[1.2rem] border border-line bg-black/10 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-text">{task.title}</p>
                            <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-textMuted">
                              {describeTaskRepeat(task)}
                            </span>
                          </div>
                          {task.details ? (
                            <p className="mt-2 text-sm leading-6 text-textMuted">
                              {task.details}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-textMuted">
                            <span>Arranca {formatShortDate(task.startDate)}</span>
                            {task.dueTime ? <span>{task.dueTime}</span> : null}
                            {task.estimatedMinutes ? <span>{task.estimatedMinutes} min</span> : null}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => beginTaskEdit(task)}
                            className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-text hover:border-primary/40 hover:text-primary"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void mutateHub(
                                'deleteTask',
                                { id: task.id },
                                'Rutina eliminada'
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 hover:bg-rose-400/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="glass rounded-[1.8rem] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-primary">
                  <LineChart className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                    Flujo 30 días
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-text">
                  Entrada y salida de dinero
                </h2>
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.charts.cashflow30d}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#6ed58d" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6ed58d" stopOpacity={0.04} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#ff738f" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ff738f" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#9ca9c1" tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca9c1" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,16,28,0.94)',
                          border: '1px solid rgba(102,192,244,0.2)',
                          borderRadius: '16px',
                        }}
                        formatter={(value) => formatEuro(Number(value || 0))}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="incomeEur"
                        name="Ingresos"
                        stroke="#6ed58d"
                        fill="url(#incomeGradient)"
                        strokeWidth={2.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenseEur"
                        name="Gastos"
                        stroke="#ff738f"
                        fill="url(#expenseGradient)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="glass rounded-[1.8rem] p-5 sm:p-6">
                <div className="flex items-center gap-2 text-primary">
                  <BookMarked className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                    Productividad 14 días
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-text">
                  Qué tan constante estás siendo
                </h2>
                <div className="mt-6 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.charts.productivity14d}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#9ca9c1" tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca9c1" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,16,28,0.94)',
                          border: '1px solid rgba(102,192,244,0.2)',
                          borderRadius: '16px',
                        }}
                        formatter={(value, name) =>
                          name === 'completionRate'
                            ? [`${Math.round(Number(value || 0))}%`, 'Cumplimiento']
                            : [Number(value || 0), name === 'completed' ? 'Hechas' : 'Debidas']
                        }
                      />
                      <Legend />
                      <Bar dataKey="completionRate" name="Cumplimiento" fill="#66c0f4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
          </div>

          <div className="space-y-6">
            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <StickyNote className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Post-it central
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Tu idea fija del momento
              </h2>
              <textarea
                value={pinnedNoteDraft}
                onChange={(event) => setPinnedNoteDraft(event.target.value)}
                placeholder="Aquí puedes dejar el recordatorio más importante que quieres ver siempre."
                className="mt-5 min-h-[160px] w-full resize-none px-4 py-4 text-sm leading-7"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void mutateHub(
                      'saveSettings',
                      {
                        ...dashboard.settings,
                        pinnedNote: pinnedNoteDraft,
                        reminderTime: reminderTimeDraft,
                        browserNotificationsEnabled:
                          dashboard.settings.browserNotificationsEnabled,
                      },
                      'Post-it actualizado'
                    )
                  }
                  className="button-primary"
                  disabled={savingAction === 'saveSettings'}
                >
                  {savingAction === 'saveSettings' ? 'Guardando…' : 'Guardar post-it'}
                </button>
              </div>
            </article>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <TrendingDown className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Movimientos
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Qué entra y qué sale
              </h2>
              <form onSubmit={handleEntrySubmit} className="mt-5 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={entryForm.kind}
                    onChange={(event) =>
                      setEntryForm((current) => ({
                        ...current,
                        kind: event.target.value as 'income' | 'expense',
                        category:
                          event.target.value === 'income' ? 'Ingreso' : 'Gasto',
                      }))
                    }
                    className="px-4 py-3"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                  <input
                    type="date"
                    value={entryForm.entryDate}
                    onChange={(event) =>
                      setEntryForm((current) => ({
                        ...current,
                        entryDate: event.target.value,
                      }))
                    }
                    className="px-4 py-3"
                  />
                </div>
                <input
                  value={entryForm.title}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Concepto"
                  className="px-4 py-3"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={entryForm.category}
                    onChange={(event) =>
                      setEntryForm((current) => ({ ...current, category: event.target.value }))
                    }
                    placeholder="Categoría"
                    className="px-4 py-3"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entryForm.amountEur}
                    onChange={(event) =>
                      setEntryForm((current) => ({
                        ...current,
                        amountEur: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="px-4 py-3"
                  />
                </div>
                <textarea
                  value={entryForm.notes}
                  onChange={(event) =>
                    setEntryForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Notas rápidas"
                  className="min-h-[90px] resize-none px-4 py-3 text-sm leading-7"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={savingAction === 'saveEntry'}
                  >
                    {savingAction === 'saveEntry'
                      ? 'Guardando…'
                      : entryForm.id
                        ? 'Actualizar movimiento'
                        : 'Guardar movimiento'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryForm(createEmptyEntryForm(entryForm.kind))}
                    className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
                  >
                    Resetear
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {dashboard.entriesForSelectedDate.length === 0 ? (
                  <EmptyState
                    title="Aún no hay movimientos en esta fecha."
                    copy="Registra ese día cuánto has gastado o ganado para que las gráficas empiecen a tener sentido."
                  />
                ) : (
                  dashboard.entriesForSelectedDate.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.2rem] border border-line bg-black/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-text">{entry.title}</p>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${
                                entry.kind === 'income'
                                  ? 'border-emerald-400/30 text-emerald-300'
                                  : 'border-rose-400/30 text-rose-200'
                              }`}
                            >
                              {entry.kind === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-textMuted">
                            {entry.category}
                          </p>
                          {entry.notes ? (
                            <p className="mt-2 text-sm leading-6 text-textMuted">
                              {entry.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-text">
                            {entry.kind === 'income' ? '+' : '-'}
                            {formatEuro(entry.amountEur)}
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => beginEntryEdit(entry)}
                              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text hover:border-primary/40 hover:text-primary"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void mutateHub(
                                  'deleteEntry',
                                  { id: entry.id },
                                  'Movimiento eliminado'
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-rose-200 hover:bg-rose-400/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Borrar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <PiggyBank className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Activos
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Patrimonio y seguimiento
              </h2>
              <form onSubmit={handleAssetSubmit} className="mt-5 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={assetForm.kind}
                    onChange={(event) =>
                      setAssetForm((current) => ({
                        ...current,
                        kind: event.target.value as FinanceAsset['kind'],
                        unitPriceEur:
                          event.target.value === 'cash' ? '1' : current.unitPriceEur,
                      }))
                    }
                    className="px-4 py-3"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="crypto">Crypto</option>
                    <option value="stock">Acción</option>
                    <option value="savings">Ahorro</option>
                    <option value="other">Otro</option>
                  </select>
                  <input
                    value={assetForm.label}
                    onChange={(event) =>
                      setAssetForm((current) => ({ ...current, label: event.target.value }))
                    }
                    placeholder="Ej. BTC principal"
                    className="px-4 py-3"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={assetForm.symbol}
                    onChange={(event) =>
                      setAssetForm((current) => ({ ...current, symbol: event.target.value }))
                    }
                    placeholder="Símbolo"
                    className="px-4 py-3"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={assetForm.quantity}
                    onChange={(event) =>
                      setAssetForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Cantidad"
                    className="px-4 py-3"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={assetForm.unitPriceEur}
                    onChange={(event) =>
                      setAssetForm((current) => ({
                        ...current,
                        unitPriceEur: event.target.value,
                      }))
                    }
                    placeholder="Precio unitario EUR"
                    className="px-4 py-3"
                  />
                  <input
                    value={assetForm.coingeckoId}
                    onChange={(event) =>
                      setAssetForm((current) => ({
                        ...current,
                        coingeckoId: event.target.value,
                      }))
                    }
                    placeholder="CoinGecko ID (opc.)"
                    className="px-4 py-3"
                  />
                </div>
                <label className="flex items-center gap-3 rounded-[1rem] border border-line/80 bg-black/10 px-4 py-3 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={assetForm.autoPrice}
                    onChange={(event) =>
                      setAssetForm((current) => ({
                        ...current,
                        autoPrice: event.target.checked,
                      }))
                    }
                  />
                  Usar precio en directo cuando exista
                </label>
                <textarea
                  value={assetForm.notes}
                  onChange={(event) =>
                    setAssetForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Notas"
                  className="min-h-[90px] resize-none px-4 py-3 text-sm leading-7"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={savingAction === 'saveAsset'}
                  >
                    {savingAction === 'saveAsset'
                      ? 'Guardando…'
                      : assetForm.id
                        ? 'Actualizar activo'
                        : 'Guardar activo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetForm(createEmptyAssetForm())}
                    className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
                  >
                    Resetear
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {dashboard.assets.length === 0 ? (
                  <EmptyState
                    title="No tienes activos cargados aún."
                    copy="Añade efectivo, crypto, acciones o ahorros para ver el valor global y cruzarlo con tus gastos."
                  />
                ) : (
                  dashboard.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-[1.2rem] border border-line bg-black/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-text">{asset.label}</p>
                            <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-textMuted">
                              {asset.kind}
                            </span>
                            {asset.symbol ? (
                              <span className="text-xs uppercase tracking-[0.16em] text-textMuted">
                                {asset.symbol}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-textMuted">
                            {asset.quantity} unidades · precio {formatEuro(asset.priceSource === 'live' && asset.currentPriceEur != null ? asset.currentPriceEur : asset.unitPriceEur)}
                            {asset.priceSource === 'live' ? ' · en directo' : ' · manual'}
                          </p>
                          {asset.notes ? (
                            <p className="mt-2 text-sm leading-6 text-textMuted">
                              {asset.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-text">
                            {formatEuro(asset.currentValueEur)}
                          </p>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => beginAssetEdit(asset)}
                              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text hover:border-primary/40 hover:text-primary"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void mutateHub(
                                  'deleteAsset',
                                  { id: asset.id },
                                  'Activo eliminado'
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-rose-200 hover:bg-rose-400/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Borrar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <ShieldAlert className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Recuperación
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Racha, premio y control
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-line bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-textMuted">
                    Días limpios
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-text">
                    {dashboard.recovery.currentStreakDays}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-line bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-textMuted">
                    Recompensa acumulada
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-text">
                    {formatEuro(dashboard.recovery.currentRewardUnlockedEur)}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-[1.2rem] border border-line bg-black/10 p-4 text-sm leading-7 text-textMuted">
                <p>
                  Mejor racha: <span className="text-text">{dashboard.recovery.bestStreakDays} días</span>
                </p>
                <p>
                  Próximo premio en:{' '}
                  <span className="text-text">
                    {dashboard.recovery.nextRewardInDays === 0
                      ? 'ya desbloqueado'
                      : `${dashboard.recovery.nextRewardInDays} días`}
                  </span>
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                    Cada cuántos días
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={dashboard.settings.rewardIntervalDays}
                    onChange={(event) =>
                      setDashboard((current) =>
                        current
                          ? {
                              ...current,
                              settings: {
                                ...current.settings,
                                rewardIntervalDays: Number(event.target.value || 1),
                              },
                            }
                          : current
                      )
                    }
                    className="mt-2 w-full bg-transparent"
                  />
                </label>
                <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                    Premio EUR
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={dashboard.settings.rewardAmountEur}
                    onChange={(event) =>
                      setDashboard((current) =>
                        current
                          ? {
                              ...current,
                              settings: {
                                ...current.settings,
                                rewardAmountEur: Number(event.target.value || 0),
                              },
                            }
                          : current
                      )
                    }
                    className="mt-2 w-full bg-transparent"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void mutateHub(
                      'saveSettings',
                      dashboard.settings as unknown as Record<string, unknown>,
                      'Regla de recompensa actualizada'
                    )
                  }
                  className="button-primary"
                >
                  Guardar objetivos
                </button>
                <input
                  type="date"
                  value={relapseDateDraft}
                  onChange={(event) => setRelapseDateDraft(event.target.value)}
                  className="min-w-[180px] px-4 py-3"
                />
                <button
                  type="button"
                  onClick={() =>
                    void mutateHub(
                      'registerRelapse',
                      { date: relapseDateDraft },
                      'Recaída registrada'
                    )
                  }
                  className="rounded-full border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-400/10"
                >
                  Registrar recaída
                </button>
              </div>
              {dashboard.settings.relapseDates.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {dashboard.settings.relapseDates
                    .slice()
                    .reverse()
                    .map((date) => (
                      <span
                        key={date}
                        className="rounded-full border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-textMuted"
                      >
                        {formatShortDate(date)}
                      </span>
                    ))}
                </div>
              ) : null}
            </article>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <Bell className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Avisos
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Recordatorios y calendario
              </h2>
              <p className="mt-3 text-sm leading-7 text-textMuted">
                Para avisos reales en móvil y Mac, el camino más robusto ahora mismo es suscribirte al feed personal en Apple Calendar o Google Calendar. Además, si dejas esta web abierta, te puede avisar también el navegador.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="rounded-[1rem] border border-line/80 bg-black/10 p-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">
                    Hora de revisión
                  </span>
                  <input
                    type="time"
                    value={reminderTimeDraft}
                    onChange={(event) => setReminderTimeDraft(event.target.value)}
                    className="mt-2 w-full bg-transparent"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-[1rem] border border-line/80 bg-black/10 px-4 py-3 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={dashboard.settings.calendarFeedEnabled}
                    onChange={(event) =>
                      setDashboard((current) =>
                        current
                          ? {
                              ...current,
                              settings: {
                                ...current.settings,
                                calendarFeedEnabled: event.target.checked,
                              },
                            }
                          : current
                      )
                    }
                  />
                  Mantener feed ICS activo
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void mutateHub(
                      'saveSettings',
                      {
                        ...dashboard.settings,
                        reminderTime: reminderTimeDraft,
                        pinnedNote: pinnedNoteDraft,
                      },
                      'Preferencias de aviso guardadas'
                    )
                  }
                  className="button-primary"
                >
                  Guardar aviso
                </button>
                <button
                  type="button"
                  onClick={requestNotifications}
                  className="rounded-full border border-line px-4 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:text-primary"
                >
                  {notificationPermission === 'granted'
                    ? 'Notificaciones activas'
                    : 'Permitir notificaciones'}
                </button>
              </div>
            </article>

            <article className="glass rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">
                  Dónde se va el dinero
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-text">
                Categorías más pesadas
              </h2>
              <div className="mt-6 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.charts.expenseByCategory} layout="vertical">
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis type="number" stroke="#9ca9c1" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                    <YAxis type="category" dataKey="category" stroke="#9ca9c1" tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10,16,28,0.94)',
                        border: '1px solid rgba(102,192,244,0.2)',
                        borderRadius: '16px',
                      }}
                      formatter={(value) => formatEuro(Number(value || 0))}
                    />
                    <Bar dataKey="totalEur" name="Gasto" fill="#f5ca65" radius={[0, 12, 12, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
