export type FinanceTask = {
  id: string;
  title: string;
  details: string;
  category: string;
  startDate: string;
  intervalDays: number;
  weekdays: number[];
  dueTime: string | null;
  estimatedMinutes: number | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FinanceTaskForDay = FinanceTask & {
  completed: boolean;
};

export type FinanceDayNote = {
  date: string;
  note: string;
  updatedAt: string | null;
};

export type FinanceEntryKind = 'income' | 'expense';

export type FinanceEntry = {
  id: string;
  entryDate: string;
  kind: FinanceEntryKind;
  title: string;
  category: string;
  amountEur: number;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FinanceAssetKind =
  | 'cash'
  | 'crypto'
  | 'stock'
  | 'savings'
  | 'other';

export type FinanceAsset = {
  id: string;
  kind: FinanceAssetKind;
  label: string;
  symbol: string;
  quantity: number;
  unitPriceEur: number;
  autoPrice: boolean;
  coingeckoId: string;
  notes: string;
  currentPriceEur: number | null;
  currentValueEur: number;
  priceSource: 'manual' | 'live';
  createdAt: string | null;
  updatedAt: string | null;
};

export type FinanceSettings = {
  recoveryStartedOn: string;
  relapseDates: string[];
  rewardIntervalDays: number;
  rewardAmountEur: number;
  pinnedNote: string;
  reminderTime: string | null;
  browserNotificationsEnabled: boolean;
  notesPromptEnabled: boolean;
  calendarFeedEnabled: boolean;
  calendarToken: string;
};

export type FinanceRecoverySummary = {
  currentStreakDays: number;
  bestStreakDays: number;
  relapseCount: number;
  currentRewardUnlockedEur: number;
  milestonesReached: number;
  nextRewardInDays: number;
};

export type FinanceDashboardPayload = {
  selectedDate: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  settings: FinanceSettings;
  noteForSelectedDate: FinanceDayNote | null;
  notesByDate: Array<FinanceDayNote>;
  tasks: Array<FinanceTask>;
  tasksForSelectedDate: Array<FinanceTaskForDay>;
  entries: Array<FinanceEntry>;
  entriesForSelectedDate: Array<FinanceEntry>;
  assets: Array<FinanceAsset>;
  recovery: FinanceRecoverySummary;
  summary: {
    todayCompletionRate: number;
    tasksDue: number;
    tasksCompleted: number;
    selectedDayIncomeEur: number;
    selectedDayExpenseEur: number;
    selectedDayNetEur: number;
    monthIncomeEur: number;
    monthExpenseEur: number;
    monthNetEur: number;
    assetValueEur: number;
  };
  charts: {
    cashflow30d: Array<{
      date: string;
      label: string;
      incomeEur: number;
      expenseEur: number;
      netEur: number;
    }>;
    expenseByCategory: Array<{
      category: string;
      totalEur: number;
    }>;
    monthlyNet: Array<{
      month: string;
      incomeEur: number;
      expenseEur: number;
      netEur: number;
    }>;
    productivity14d: Array<{
      date: string;
      label: string;
      completionRate: number;
      completed: number;
      due: number;
    }>;
  };
  calendarFeedPath: string | null;
};
