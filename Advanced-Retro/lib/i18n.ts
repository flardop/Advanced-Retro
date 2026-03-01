export type LocaleCode = 'es' | 'en' | 'fr' | 'it' | 'de' | 'pt';

export const DEFAULT_LOCALE: LocaleCode = 'es';

export const SUPPORTED_LOCALES: Array<{
  code: LocaleCode;
  label: string;
  nativeLabel: string;
  flag: string;
}> = [
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
];

type TranslationMap = Record<string, string>;

const ES: TranslationMap = {
  'nav.shop': 'Tienda',
  'nav.community': 'Comunidad',
  'nav.mystery': 'Mystery',
  'nav.roulette': 'Ruleta',
  'nav.concierge': 'Encargos',
  'nav.contact': 'Contacto',
  'nav.cart': 'Carrito',
  'nav.profile': 'Mi perfil',
  'nav.login': 'Entrar',
  'nav.menu': 'Menu',
  'nav.close': 'Cerrar',
  'nav.login_mobile': 'Iniciar sesión',
  'nav.go_cart_mobile': 'Ir al carrito',
  'nav.session': 'Sesión',
  'trust.shipping_title': 'Envío 24-48h:',
  'trust.shipping_text': 'preparación desde España',
  'trust.verify_title': 'Verificación:',
  'trust.verify_text': 'piezas revisadas antes de publicar',
  'trust.support_title': 'Soporte:',
  'trust.support_text': 'ticket y chat comprador ↔ tienda',
  'footer.about':
    'Tienda especializada en retro gaming, coleccionismo y restauración con enfoque profesional.',
  'footer.operation': 'Operación:',
  'footer.operation_value': 'España',
  'footer.attention': 'Atención:',
  'footer.attention_value': 'ticket privado comprador ↔ tienda',
  'footer.store': 'Tienda',
  'footer.catalog': 'Catálogo completo',
  'footer.services': 'Servicios',
  'footer.legal': 'Legal',
  'footer.terms': 'Términos',
  'footer.privacy': 'Privacidad',
  'footer.cookies': 'Cookies',
  'footer.secure': 'Compra segura',
  'footer.secure_text': 'Seguimiento de pedidos, soporte por ticket y estado de envío actualizado.',
  'footer.contact_emails': 'Emails de contacto:',
  'footer.rights': 'Todos los derechos reservados.',
  'footer.conditions': 'Condiciones',
  'lang.title': 'Idioma',
  'lang.subtitle': 'Selecciona idioma',
};

const EN: TranslationMap = {
  'nav.shop': 'Shop',
  'nav.community': 'Community',
  'nav.mystery': 'Mystery',
  'nav.roulette': 'Roulette',
  'nav.concierge': 'Requests',
  'nav.contact': 'Contact',
  'nav.cart': 'Cart',
  'nav.profile': 'My profile',
  'nav.login': 'Sign in',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'nav.login_mobile': 'Sign in',
  'nav.go_cart_mobile': 'Go to cart',
  'nav.session': 'Session',
  'trust.shipping_title': '24-48h shipping:',
  'trust.shipping_text': 'dispatch from Spain',
  'trust.verify_title': 'Verification:',
  'trust.verify_text': 'items checked before publishing',
  'trust.support_title': 'Support:',
  'trust.support_text': 'private ticket and buyer ↔ store chat',
  'footer.about':
    'Store specialized in retro gaming, collecting and restoration with a professional approach.',
  'footer.operation': 'Operation:',
  'footer.operation_value': 'Spain',
  'footer.attention': 'Support:',
  'footer.attention_value': 'private buyer ↔ store ticket',
  'footer.store': 'Store',
  'footer.catalog': 'Full catalog',
  'footer.services': 'Services',
  'footer.legal': 'Legal',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',
  'footer.cookies': 'Cookies',
  'footer.secure': 'Secure purchase',
  'footer.secure_text': 'Order tracking, ticket support and shipping status updates.',
  'footer.contact_emails': 'Contact emails:',
  'footer.rights': 'All rights reserved.',
  'footer.conditions': 'Conditions',
  'lang.title': 'Language',
  'lang.subtitle': 'Choose language',
};

const FR: TranslationMap = {
  ...EN,
  'nav.shop': 'Boutique',
  'nav.community': 'Communauté',
  'nav.contact': 'Contact',
  'nav.cart': 'Panier',
  'nav.profile': 'Mon profil',
  'nav.login': 'Connexion',
  'lang.title': 'Langue',
  'lang.subtitle': 'Choisir la langue',
};

const IT: TranslationMap = {
  ...EN,
  'nav.shop': 'Negozio',
  'nav.community': 'Comunità',
  'nav.contact': 'Contatto',
  'nav.cart': 'Carrello',
  'nav.profile': 'Il mio profilo',
  'nav.login': 'Accedi',
  'lang.title': 'Lingua',
  'lang.subtitle': 'Scegli lingua',
};

const DE: TranslationMap = {
  ...EN,
  'nav.shop': 'Shop',
  'nav.community': 'Community',
  'nav.contact': 'Kontakt',
  'nav.cart': 'Warenkorb',
  'nav.profile': 'Mein Profil',
  'nav.login': 'Anmelden',
  'lang.title': 'Sprache',
  'lang.subtitle': 'Sprache wählen',
};

const PT: TranslationMap = {
  ...EN,
  'nav.shop': 'Loja',
  'nav.community': 'Comunidade',
  'nav.contact': 'Contato',
  'nav.cart': 'Carrinho',
  'nav.profile': 'Meu perfil',
  'nav.login': 'Entrar',
  'lang.title': 'Idioma',
  'lang.subtitle': 'Escolher idioma',
};

const TABLE: Record<LocaleCode, TranslationMap> = {
  es: ES,
  en: EN,
  fr: FR,
  it: IT,
  de: DE,
  pt: PT,
};

export function normalizeLocale(input: string | null | undefined): LocaleCode {
  const value = String(input || '').toLowerCase().trim();
  if (!value) return DEFAULT_LOCALE;

  if (value.startsWith('es')) return 'es';
  if (value.startsWith('en')) return 'en';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('it')) return 'it';
  if (value.startsWith('de')) return 'de';
  if (value.startsWith('pt')) return 'pt';

  return DEFAULT_LOCALE;
}

export function translate(locale: LocaleCode, key: string, fallback?: string): string {
  const current = TABLE[locale]?.[key];
  if (current) return current;
  const esFallback = TABLE.es?.[key];
  if (esFallback) return esFallback;
  return fallback || key;
}

