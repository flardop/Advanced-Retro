export const ADMIN_PATH_PREFIX = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';
export const TRACKING_HEARTBEAT_MS = 30_000;
export const ONLINE_THRESHOLD_MS = 120_000;
export const ACTIVE_THRESHOLD_MS = 30_000;
export const ADMIN_IMAGE_BUCKET = 'admin-product-images';
export const RETROVILLE_SETTING_KEY = 'retroville_launch_date';
export const DEFAULT_RETROVILLE_MONTHS_AHEAD = 6;
export const ADMIN_NOTIFICATION_KEYS = {
  newOrder: 'notify_new_order',
  newUser: 'notify_new_user',
  criticalError: 'notify_critical_error',
  lowStock: 'notify_low_stock',
  newMessage: 'notify_new_message',
  lowStockThreshold: 'low_stock_threshold',
  resendFromEmail: 'resend_from_email',
} as const;

export const DEFAULT_ADMIN_SETTINGS = [
  ['store_name', 'AdvancedRetro', 'Store display name'],
  ['contact_email', 'flardop44@gmail.com', 'Main contact email'],
  ['currency', 'EUR', 'Default currency'],
  ['timezone', 'Europe/Madrid', 'Default timezone'],
  ['ebay_api_key', '', 'eBay API key for price chart'],
  ['resend_api_key', '', 'Resend API key for emails'],
  ['admin_alert_email', 'flardop44@gmail.com', 'Email to receive critical alerts'],
  ['retroville_launch_date', '', 'Launch date for the Retroville countdown'],
  ['notify_new_order', 'true', 'Email admin when a new order arrives'],
  ['notify_new_user', 'true', 'Email admin when a new user signs up'],
  ['notify_critical_error', 'true', 'Email admin when a critical error is logged'],
  ['notify_low_stock', 'true', 'Email admin when stock goes below threshold'],
  ['notify_new_message', 'true', 'Email admin when a new message is created'],
  ['low_stock_threshold', '3', 'Threshold used for low stock alerts'],
  ['resend_from_email', 'AdvancedRetro <onboarding@resend.dev>', 'Default sender email used by admin tools'],
] as const;

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: 'order_confirmation',
    subject: 'Tu pedido {{order_id}} ya está confirmado',
    html_body:
      '<h1>Gracias por tu compra, {{name}}</h1><p>Tu pedido <strong>{{order_id}}</strong> ha quedado confirmado con un total de <strong>{{order_total}}</strong>.</p><p>Puedes revisar su estado cuando quieras desde tu perfil.</p>',
    variables: ['name', 'order_id', 'order_total'],
  },
  {
    name: 'shipping_notification',
    subject: 'Tu pedido {{order_id}} ya está en camino',
    html_body:
      '<h1>Tu pedido está enviado</h1><p>Hola {{name}}, tu pedido <strong>{{order_id}}</strong> ya ha salido.</p><p>Transportista: {{carrier}}<br/>Seguimiento: {{tracking_number}}<br/>Entrega estimada: {{estimated_delivery}}</p>',
    variables: ['name', 'order_id', 'carrier', 'tracking_number', 'estimated_delivery'],
  },
  {
    name: 'delivery_confirmation',
    subject: 'Tu pedido {{order_id}} ha sido entregado',
    html_body:
      '<h1>Pedido entregado</h1><p>Esperamos que disfrutes tu compra, {{name}}.</p><p>Si necesitas ayuda con el pedido {{order_id}}, responde a este correo.</p>',
    variables: ['name', 'order_id'],
  },
  {
    name: 'password_reset',
    subject: 'Restablece tu contraseña de AdvancedRetro',
    html_body:
      '<h1>Restablece tu contraseña</h1><p>Hola {{name}}, usa este enlace para crear una nueva contraseña:</p><p><a href="{{reset_url}}">Restablecer contraseña</a></p>',
    variables: ['name', 'reset_url'],
  },
  {
    name: 'welcome_email',
    subject: 'Bienvenido a AdvancedRetro, {{name}}',
    html_body:
      '<h1>Bienvenido a AdvancedRetro</h1><p>Gracias por unirte, {{name}}.</p><p>Ya puedes explorar catálogo, comunidad y tus pedidos desde tu cuenta.</p>',
    variables: ['name'],
  },
  {
    name: 'custom_announcement',
    subject: 'Novedades de AdvancedRetro para {{name}}',
    html_body:
      '<h1>{{headline}}</h1><p>{{body}}</p><p>Gracias por seguir con nosotros.</p>',
    variables: ['name', 'headline', 'body'],
  },
] as const;
