export const RETROVILLE_ADMIN_COOKIE_NAME = 'retroville_admin_session';
export const RETROVILLE_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
export const RETROVILLE_ADMIN_LOCKOUT_WINDOW_MINUTES = 15;
export const RETROVILLE_ADMIN_FAILED_ATTEMPTS_LIMIT = 5;
export const RETROVILLE_ADMIN_DEFAULT_PAGE_SIZE = 25;
export const RETROVILLE_ADMIN_REQUEST_TIMEOUT_MS = 10_000;
export const RETROVILLE_ADMIN_HOME_PATH = '/retroville/admin';
export const RETROVILLE_ADMIN_LOGIN_PATH = '/retroville/admin/login';
export const RETROVILLE_ADMIN_DASHBOARD_PATH = '/retroville/admin/dashboard';

export const RETROVILLE_ADMIN_NAV_ITEMS = [
  { href: RETROVILLE_ADMIN_DASHBOARD_PATH, label: 'Dashboard general' },
  { href: '/retroville/admin/usuarios', label: 'Usuarios y newsletter' },
  { href: '/retroville/admin/analiticas', label: 'Analíticas de páginas' },
  { href: '/retroville/admin/tiempo-real', label: 'Seguimiento en tiempo real' },
  { href: '/retroville/admin/seo', label: 'SEO y rastreo' },
  { href: '/retroville/admin/errores', label: 'Registro de errores' },
  { href: '/retroville/admin/contenido', label: 'Gestión de contenido' },
  { href: '/retroville/admin/configuracion', label: 'Configuración' },
] as const;

export const RETROVILLE_PUBLIC_SETTING_KEYS = {
  contactEmail: 'retroville_contact_email',
  heroTagline: 'retroville_hero_tagline',
  buyerBriefCopy: 'retroville_buyer_brief_copy',
  launchDate: 'retroville_launch_date',
  eventDescription: 'retroville_event_description',
  waitlistOpen: 'retroville_waitlist_open',
  maintenanceMode: 'retroville_maintenance_mode',
} as const;

export const RETROVILLE_TRACKED_PAGES = [
  '/retroville',
  '/retroville/personajes',
  '/retroville/sketches',
  '/retroville/episodios',
  '/retroville/presentaciones',
  '/retroville/press',
  '/retroville/faq',
  '/retroville/lore',
  '/retroville/distritos',
  '/retroville/comunidad',
  '/retroville/legal',
  '/retroville/admin',
] as const;
