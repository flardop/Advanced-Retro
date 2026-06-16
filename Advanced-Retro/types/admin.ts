export type AdminRole = 'user' | 'admin' | 'banned';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type EmailLogStatus = 'sent' | 'failed' | 'pending';
export type ScheduledEmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type MessageReviewStatus = 'pending_review' | 'approved' | 'rejected';

export type AdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AdminRole;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AdminRole;
  status: 'active' | 'banned';
  notes: string | null;
  last_login_at: string | null;
  orders_count: number;
  total_spent_cents: number;
  created_at: string | null;
  updated_at: string | null;
};

export type PageViewRecord = {
  id: string;
  url: string;
  page_title: string | null;
  user_id: string | null;
  ip_hash: string | null;
  session_id: string | null;
  referrer: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  duration_seconds: number;
  timestamp: string;
};

export type UserSessionRecord = {
  id: string;
  user_id: string | null;
  session_id: string;
  current_page: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  ip_hash: string | null;
  country: string | null;
  city: string | null;
  last_heartbeat: string;
  started_at: string;
};

export type LoginActivityRecord = {
  id: string;
  user_id: string | null;
  email: string | null;
  event_type: 'login' | 'logout' | 'signup';
  success: boolean;
  ip_hash: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  created_at: string;
};

export type ErrorLogRecord = {
  id: string;
  message: string;
  stack_trace: string | null;
  url: string | null;
  user_id: string | null;
  severity: ErrorSeverity;
  extra_data: Record<string, unknown> | null;
  resolved: boolean;
  created_at: string;
};

export type EmailTemplateRecord = {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
};

export type EmailLogRecord = {
  id: string;
  recipient_email: string;
  recipient_user_id: string | null;
  subject: string;
  template_id: string | null;
  template_name: string | null;
  status: EmailLogStatus;
  error_message: string | null;
  sent_at: string;
};

export type AdminSettingRecord = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
};

export type RetrovilleWaitlistRecord = {
  id: string;
  email: string;
  created_at: string;
  role_label: string | null;
  source: string | null;
};

export type AnalyticsEventRecord = {
  id: string;
  event_name: string;
  path: string | null;
  session_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export type StoreCreatorLeadRecord = {
  id: string;
  name: string | null;
  email: string;
  business_type: string | null;
  plan_interest: string | null;
  created_at: string;
};

export type ScheduledEmailRecord = {
  id: string;
  template_id: string | null;
  recipient_scope: 'all_users' | 'buyers' | 'selected_users' | 'custom_email';
  recipient_payload: Record<string, unknown>;
  subject: string;
  html_body: string;
  status: ScheduledEmailStatus;
  scheduled_for: string;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminProductMeta = {
  product_id: string;
  compare_at_price_cents: number | null;
  sku: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_handle: string | null;
  image_paths: string[];
  updated_at: string;
};

export type AdminOrderMeta = {
  order_id: string;
  shipping_company: string | null;
  tracking_url: string | null;
  estimated_delivery_date: string | null;
  internal_notes: string | null;
  payment_status: OrderPaymentStatus;
  fulfillment_status: FulfillmentStatus;
  updated_at: string;
};

export type AdminOrderStatusEvent = {
  id: string;
  order_id: string;
  status: FulfillmentStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

export type AdminMessageReview = {
  ticket_id: string;
  review_status: MessageReviewStatus;
  review_reason: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type DashboardStats = {
  totalRevenueCents: number;
  revenueChangePct: number;
  totalOrders: number;
  ordersChangePct: number;
  newUsers: number;
  usersChangePct: number;
  activeUsers: number;
  totalProducts: number;
  pendingOrders: number;
};

export type ChartPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export type ActivityFeedItem = {
  id: string;
  type: 'page_view' | 'order' | 'signup' | 'error';
  title: string;
  description: string;
  href: string | null;
  created_at: string;
  severity?: ErrorSeverity;
};

export type DashboardSnapshot = {
  stats: DashboardStats;
  revenueSeries: ChartPoint[];
  ordersStatus: ChartPoint[];
  topVisitedProducts: Array<{ id: string; name: string; image: string | null; views: number }>;
  trafficByDevice: ChartPoint[];
  recentOrders: Array<Record<string, unknown>>;
  recentUsers: AdminUserRecord[];
  recentErrors: ErrorLogRecord[];
  liveActivity: ActivityFeedItem[];
  generatedAt: string;
};

export type AnalyticsSnapshot = {
  summary: {
    totalPageViews: number;
    uniqueSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  pageViewsOverTime: ChartPoint[];
  topPages: Array<{
    url: string;
    page_title: string | null;
    views: number;
    uniqueSessions: number;
    avgDuration: number;
  }>;
  trafficSources: ChartPoint[];
  geography: Array<{ country: string; city: string; sessions: number; percentage: number }>;
  deviceBreakdown: ChartPoint[];
  browserBreakdown: ChartPoint[];
  heatmap: Array<{ day: string; hour: number; views: number }>;
  newVsReturning: ChartPoint[];
  activeHours: ChartPoint[];
};

export type RetrovilleAnalyticsSnapshot = {
  summary: {
    totalPageViews: number;
    uniqueSessions: number;
    avgSessionDuration: number;
    waitlistTotal: number;
    waitlistInRange: number;
    waitlistLast30Days: number;
    waitlistConversionRate: number;
    newsletterSignupsInRange: number;
    newsletterConversionRate: number;
    trafficShare: number;
    launchDate: string | null;
  };
  pageViewsOverTime: ChartPoint[];
  topPages: Array<{
    url: string;
    page_title: string | null;
    views: number;
    uniqueSessions: number;
    avgDuration: number;
  }>;
  trafficSources: ChartPoint[];
  geography: Array<{ country: string; city: string; sessions: number; percentage: number }>;
  deviceBreakdown: ChartPoint[];
  browserBreakdown: ChartPoint[];
  waitlistSources: ChartPoint[];
  waitlistRoles: ChartPoint[];
  newsletterSignupPages: ChartPoint[];
  newsletterSignupDevices: ChartPoint[];
  recentWaitlist: Array<{
    id: string;
    email_masked: string;
    created_at: string;
    source: string | null;
    role_label: string | null;
  }>;
};

export type DataTableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
};

export type DataTableBulkAction<T> = {
  id: string;
  label: string;
  variant?: 'default' | 'danger';
  onClick: (rows: T[]) => void | Promise<void>;
};

export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export type AdminApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
