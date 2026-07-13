export type RetrovilleAdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type RetrovilleAdminSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  ip_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_seen_at: string;
};

export type RetrovilleAdminLoginAttemptRow = {
  id: string;
  email: string | null;
  ip_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  attempted_at: string;
};

export type RetrovilleAdminAccessLogRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  email: string | null;
  ip_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_type: 'login' | 'logout' | 'password_change' | 'access';
  details: Record<string, unknown> | null;
  created_at: string;
};

export type RetrovilleAdminContext = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    lastLoginAt: string | null;
  };
  session: {
    id: string;
    expiresAt: string;
    createdAt: string;
    lastSeenAt: string;
    ipAddress: string | null;
  };
};

export type RetrovilleWaitlistAdminRow = {
  id: string;
  email: string;
  display_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  question?: string | null;
  document_interest?: string | null;
  role_label: string | null;
  source: string | null;
  signup_intent: 'newsletter' | 'event' | 'access' | null;
  event_slug: string | null;
  event_title: string | null;
  status: 'active' | 'unsubscribed';
  page_path: string | null;
  page_title: string | null;
  session_id: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  visits_count: number;
  created_at: string;
  last_seen_at: string | null;
  unsubscribed_at: string | null;
};

export type RetrovilleRealtimeSession = {
  id: string;
  currentPage: string;
  durationSeconds: number;
  deviceType: string;
  country: string;
  city: string;
  region: string;
  locationLabel: string;
  lastHeartbeat: string;
};

export type RetrovilleRealtimeCountryBucket = {
  label: string;
  value: number;
  share: number;
};

export type RetrovilleRealtimeGeoBucket = {
  label: string;
  country: string;
  city: string;
  region: string;
  sessions: number;
  share: number;
  primaryPage: string;
};

export type RetrovilleRealtimeInsight = {
  title: string;
  detail: string;
};

export type RetrovilleAdminRealtimeData = {
  summary: {
    activeUsers: number;
    activeInSpain: number;
    countriesActive: number;
    locationsActive: number;
    topCountry: string;
    topSpainLocation: string;
  };
  sessions: RetrovilleRealtimeSession[];
  countryBuckets: RetrovilleRealtimeCountryBucket[];
  geoBuckets: RetrovilleRealtimeGeoBucket[];
  spainBuckets: RetrovilleRealtimeGeoBucket[];
  deviceBuckets: RetrovilleRealtimeCountryBucket[];
  strategyNotes: RetrovilleRealtimeInsight[];
  clickLeaderboard: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  scrollLeaderboard: Array<{
    path: string;
    averageDepth: number;
    sessions: number;
  }>;
};
