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
  role_label: string | null;
  source: string | null;
  signup_intent: 'newsletter' | 'event' | null;
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
