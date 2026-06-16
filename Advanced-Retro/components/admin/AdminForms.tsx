/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Send, Sparkles, UserRound, ShieldBan, ShieldCheck, Trash2, Mail, Globe, Laptop, Smartphone, Tablet } from 'lucide-react';
import { Modal } from '@/components/admin/ui/Modal';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Badge } from '@/components/admin/ui/Badge';
import { ImageUpload } from '@/components/admin/ui/ImageUpload';
import { RichTextEditor } from '@/components/admin/ui/RichTextEditor';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { toCurrency, toDateLabel, toDateTimeLabel } from '@/lib/admin/format';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { AdminProfile, AdminSettingRecord, AdminUserRecord, PageViewRecord, UserSessionRecord, LoginActivityRecord, EmailTemplateRecord, ScheduledEmailRecord, ActivityFeedItem } from '@/types/admin';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || 'Request failed');
  }
  return payload.data as T;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--admin-text)]">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[var(--admin-text-muted)]">{hint}</span> : null}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)] ${props.className || ''}`} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-muted)] ${props.className || ''}`} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none ${props.className || ''}`} />;
}

export function AdminLoginForm({ redirectedFrom }: { redirectedFrom?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase no está configurado');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('La sesión no se pudo inicializar correctamente');
      }

      const adminSessionResponse = await fetch('/api/admin/session', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const adminSessionPayload = await adminSessionResponse.json().catch(() => null);

      if (!adminSessionResponse.ok || !adminSessionPayload?.success) {
        await supabase.auth.signOut();
        throw new Error(
          adminSessionPayload?.error || 'No tienes permisos de administrador'
        );
      }

      toast.success('Sesión admin iniciada');
      router.replace(redirectedFrom || '/admin/dashboard');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión';
      const normalized = message.toLowerCase();
      if (normalized.includes('email not confirmed')) {
        toast.error('El email no está confirmado. Desactiva la confirmación de email en Supabase Auth.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="flardop44@gmail.com" required />
      </Field>
      <Field label="Contraseña">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
      </Field>
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--admin-primary-hover)] disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Entrar al panel
      </button>
    </form>
  );
}

export function DashboardLiveFeed({ initialItems }: { initialItems: ActivityFeedItem[] }) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await requestJson<ActivityFeedItem[]>('/api/admin/dashboard/activity');
        if (active) setItems(data);
      } catch {
        // ignore background polling errors
      }
    };
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel('admin-live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'page_views' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'error_logs' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, load)
      .subscribe();

    const timer = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div className="space-y-3 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Live Activity Feed</h3>
        <span className="rounded-full bg-[rgba(34,197,94,0.12)] px-3 py-1 text-xs font-semibold text-[var(--admin-success)]">Live</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-[var(--admin-text)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{item.description}</p>
              </div>
              {item.severity ? <Badge variant={item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warning' : 'info'}>{item.severity}</Badge> : null}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--admin-text-muted)]">
              <span>{toDateTimeLabel(item.created_at)}</span>
              {item.href ? <Link href={item.href} className="font-semibold text-[var(--admin-accent)]">Abrir</Link> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductEditorForm({ mode, initialProduct }: { mode: 'new' | 'edit'; initialProduct?: Record<string, any> | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || initialProduct?.meta?.seo_handle || '');
  const [description, setDescription] = useState(initialProduct?.description || '<p></p>');
  const [images, setImages] = useState<string[]>(initialProduct?.meta?.image_paths || initialProduct?.images || (initialProduct?.image ? [initialProduct.image] : []));
  const [isActive, setIsActive] = useState(initialProduct?.is_active !== false);
  const [price, setPrice] = useState(String((Number(initialProduct?.price || 0) / 100) || ''));
  const [compareAt, setCompareAt] = useState(String((Number(initialProduct?.meta?.compare_at_price_cents || 0) / 100) || ''));
  const [stock, setStock] = useState(String(initialProduct?.stock || 0));
  const [sku, setSku] = useState(initialProduct?.meta?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'juegos-gameboy');
  const [tags, setTags] = useState(Array.isArray(initialProduct?.meta?.tags) ? initialProduct.meta.tags.join(', ') : '');
  const [seoTitle, setSeoTitle] = useState(initialProduct?.meta?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(initialProduct?.meta?.seo_description || '');
  const [seoHandle, setSeoHandle] = useState(initialProduct?.meta?.seo_handle || initialProduct?.slug || '');
  const [ebayKeywords, setEbayKeywords] = useState(initialProduct?.ebay_query || initialProduct?.name || '');
  const [ebayStats, setEbayStats] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialProduct?.slug));

  useEffect(() => {
    if (slugManuallyEdited) return;
    const next = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(next);
    setSeoHandle(next);
  }, [slugManuallyEdited, title]);

  const fetchEbayData = async () => {
    try {
      const data = await requestJson<Record<string, any>>('/api/admin/ebay-prices', {
        method: 'POST',
        body: JSON.stringify({ keywords: ebayKeywords }),
      });
      setEbayStats(data);
      toast.success('Datos de eBay cargados');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo consultar eBay');
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: title,
        slug,
        description,
        image: images[0] || null,
        images,
        is_active: isActive,
        price: Math.round(Number(price || 0) * 100),
        stock: Number(stock || 0),
        category,
        ebay_query: ebayKeywords,
        meta: {
          compare_at_price_cents: compareAt ? Math.round(Number(compareAt) * 100) : null,
          sku: sku || null,
          tags: tags.split(',').map((item: string) => item.trim()).filter(Boolean),
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
          seo_handle: seoHandle || slug,
          image_paths: images,
        },
      };
      if (mode === 'new') {
        const created = await requestJson<Record<string, any>>('/api/admin/catalog/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Producto creado');
        router.replace(`/admin/products/${created.id}`);
      } else {
        await requestJson(`/api/admin/catalog/products/${initialProduct?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Producto guardado');
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título del producto" />
            </Field>
            <Field label="Slug">
              <Input value={slug} onChange={(event) => { setSlug(event.target.value); setSlugManuallyEdited(true); }} placeholder="slug-del-producto" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Descripción">
              <RichTextEditor value={description} onChange={setDescription} />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <Field label="Imágenes" hint="La primera imagen se usa como portada principal.">
            <ImageUpload value={images} onChange={setImages} />
          </Field>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--admin-text)]">eBay Price Intelligence</h3>
              <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Consulta precios medios vendidos para ajustar tu precio de salida.</p>
            </div>
            <button type="button" onClick={fetchEbayData} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4" /> Fetch eBay Price Data
            </button>
          </div>
          <div className="mt-4">
            <Field label="Keywords de búsqueda">
              <Input value={ebayKeywords} onChange={(event) => setEbayKeywords(event.target.value)} placeholder="Pokemon amarillo game boy" />
            </Field>
          </div>
          {ebayStats ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Media</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">{toCurrency(Number(ebayStats.average || 0))}</p>
              </div>
              <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Mínimo</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">{toCurrency(Number(ebayStats.min || 0))}</p>
              </div>
              <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Máximo</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">{toCurrency(Number(ebayStats.max || 0))}</p>
              </div>
              <div className="md:col-span-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4 text-sm text-[var(--admin-text-muted)]">
                Precio sugerido: <strong className="text-[var(--admin-text)]">{toCurrency(Number(ebayStats.suggested || 0))}</strong>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="space-y-4">
            <Field label="Estado">
              <Select value={isActive ? 'active' : 'draft'} onChange={(event) => setIsActive(event.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </Select>
            </Field>
            <Field label="Precio (EUR)">
              <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
            </Field>
            <Field label="Compare-at price (EUR)">
              <Input type="number" min="0" step="0.01" value={compareAt} onChange={(event) => setCompareAt(event.target.value)} />
            </Field>
            <Field label="Stock quantity">
              <Input type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} />
            </Field>
            <Field label="SKU">
              <Input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="AR-GB-001" />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="juegos-gameboy">Juegos Game Boy</option>
                <option value="juegos-gameboy-color">Juegos Game Boy Color</option>
                <option value="juegos-gameboy-advance">Juegos Game Boy Advance</option>
                <option value="juegos-super-nintendo">Juegos Super Nintendo</option>
                <option value="juegos-gamecube">Juegos GameCube</option>
                <option value="consolas-retro">Consolas retro</option>
                <option value="manuales">Manuales</option>
                <option value="accesorios">Accesorios</option>
              </Select>
            </Field>
            <Field label="Tags" hint="Separadas por comas.">
              <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="pokemon, rpg, game boy" />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">SEO</h3>
          <div className="mt-4 space-y-4">
            <Field label="Meta title">
              <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            </Field>
            <Field label="Meta description">
              <Textarea rows={4} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
            </Field>
            <Field label="URL handle">
              <Input value={seoHandle} onChange={(event) => setSeoHandle(event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={saving} onClick={submit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--admin-primary-hover)] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === 'new' ? 'Publicar producto' : 'Guardar cambios'}
            </button>
            <button type="button" disabled={saving} onClick={() => { setIsActive(false); void submit(); }} className="inline-flex items-center justify-center rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)] disabled:opacity-60">
              Save Draft
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function OrderManagementPanel({ order, timeline }: { order: Record<string, any>; timeline: Array<Record<string, any>> }) {
  const router = useRouter();
  const [status, setStatus] = useState(String(order.meta?.fulfillment_status || order.status || 'pending'));
  const [company, setCompany] = useState(order.meta?.shipping_company || 'Correos');
  const [trackingNumber, setTrackingNumber] = useState(order.shipping_tracking_code || '');
  const [trackingUrl, setTrackingUrl] = useState(order.meta?.tracking_url || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.meta?.estimated_delivery_date || '');
  const [notes, setNotes] = useState(order.meta?.internal_notes || '');
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [customSubject, setCustomSubject] = useState(`Sobre tu pedido ${String(order.id).slice(0, 8).toUpperCase()}`);
  const [customBody, setCustomBody] = useState('<p>Hola, te escribimos sobre tu pedido.</p>');

  const submitNotes = async () => {
    await requestJson(`/api/admin/orders/${order.id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
    toast.success('Notas guardadas');
    router.refresh();
  };

  const markShipped = async () => {
    setSending(true);
    try {
      await requestJson(`/api/admin/orders/${order.id}/ship`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          shipping_company: company,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          estimated_delivery_date: estimatedDelivery,
        }),
      });
      toast.success('Pedido actualizado y cliente notificado');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el pedido');
    } finally {
      setSending(false);
    }
  };

  const sendCustomEmail = async () => {
    await requestJson('/api/admin/emails/send', {
      method: 'POST',
      body: JSON.stringify({
        recipientScope: 'custom_email',
        recipientPayload: { emails: [order.user?.email] },
        subject: customSubject,
        htmlBody: customBody,
      }),
    });
    toast.success('Email enviado');
    setComposeOpen(false);
  };

  const totalOrdersCount = Number(order.user?.orders_count || 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_380px]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Order items</h3>
          <div className="mt-4 space-y-3">
            {(Array.isArray(order.order_items) ? order.order_items : []).map((item: Record<string, any>, index: number) => (
              <div key={String(item.id || index)} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div>
                  <p className="font-medium text-[var(--admin-text)]">{item.product_id || 'Producto'}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">Cantidad: {item.quantity || 1}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--admin-text)]">{toCurrency(Number(item.unit_price || 0) / 100)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm text-[var(--admin-text-muted)]">
            <div className="flex items-center justify-between"><span>Subtotal</span><strong className="text-[var(--admin-text)]">{toCurrency(Number(order.total || 0) / 100)}</strong></div>
            <div className="flex items-center justify-between"><span>Shipping</span><strong className="text-[var(--admin-text)]">{toCurrency(Number(order.shipping_cost || 0) / 100)}</strong></div>
            <div className="flex items-center justify-between"><span>Discount</span><strong className="text-[var(--admin-text)]">-{toCurrency(Number(order.coupon_discount || 0) / 100)}</strong></div>
            <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-3 text-base"><span>Total</span><strong className="text-[var(--admin-text)]">{toCurrency(Number(order.total || 0) / 100)}</strong></div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Timeline</h3>
          <div className="mt-4 space-y-4">
            {timeline.map((event, index) => (
              <div key={String(event.id || index)} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-[var(--admin-primary)]" />
                  {index < timeline.length - 1 ? <span className="mt-2 h-full w-px bg-[var(--admin-border)]" /> : null}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{String(event.status || 'pending')}</Badge>
                    <span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(String(event.created_at || new Date().toISOString()))}</span>
                  </div>
                  {event.note ? <p className="mt-2 text-sm text-[var(--admin-text-muted)]">{String(event.note)}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Status</h3>
          <div className="mt-4 space-y-4">
            <Field label="Fulfillment status">
              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </Select>
            </Field>
            {status === 'shipped' ? (
              <div className="space-y-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <Field label="Shipping company">
                  <Select value={company} onChange={(event) => setCompany(event.target.value)}>
                    {['DHL', 'FedEx', 'UPS', 'Correos', 'GLS', 'MRW', 'SEUR', 'Other'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                </Field>
                <Field label="Tracking number">
                  <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
                </Field>
                <Field label="Carrier tracking URL">
                  <Input value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} />
                </Field>
                <Field label="Estimated delivery date">
                  <Input type="date" value={estimatedDelivery} onChange={(event) => setEstimatedDelivery(event.target.value)} />
                </Field>
              </div>
            ) : null}
            <button type="button" disabled={sending} onClick={markShipped} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {status === 'shipped' ? 'Mark as Shipped & Notify Customer' : 'Guardar estado'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Customer</h3>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(108,99,255,0.18)] text-[var(--admin-accent)]"><UserRound className="h-6 w-6" /></div>
            <div>
              <p className="font-semibold text-[var(--admin-text)]">{order.user?.name || order.user?.full_name || order.user?.email || 'Cliente'}</p>
              <p className="text-sm text-[var(--admin-text-muted)]">{order.user?.email || 'Sin email'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-[var(--admin-text-muted)]">
            <p>Total orders: <strong className="text-[var(--admin-text)]">{totalOrdersCount}</strong></p>
            <Link href={`/admin/users/${order.user?.id}`} className="inline-flex rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)]">Abrir perfil</Link>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Shipping address</h3>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4 text-sm text-[var(--admin-text-muted)]">{JSON.stringify(order.shipping_address || {}, null, 2)}</pre>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Internal notes</h3>
          <div className="mt-4 space-y-4">
            <Textarea rows={6} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas internas del pedido" />
            <button type="button" onClick={submitNotes} className="rounded-2xl border border-[var(--admin-border)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)]">Guardar notas</button>
          </div>
        </section>

        <button type="button" onClick={() => setComposeOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">
          <Send className="h-4 w-4" /> Send Custom Email to Customer
        </button>
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Enviar email al cliente">
        <div className="space-y-4">
          <Field label="Subject">
            <Input value={customSubject} onChange={(event) => setCustomSubject(event.target.value)} />
          </Field>
          <Field label="HTML body">
            <RichTextEditor value={customBody} onChange={setCustomBody} />
          </Field>
          <button type="button" onClick={sendCustomEmail} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white">Enviar ahora</button>
        </div>
      </Modal>
    </div>
  );
}

export function UserProfileManager({ data }: { data: { user: AdminUserRecord | null; pageViews: PageViewRecord[]; sessions: UserSessionRecord[]; loginHistory: LoginActivityRecord[]; orders: any[]; tickets: any[]; messages: any[] } }) {
  const router = useRouter();
  const [tab, setTab] = useState<'profile' | 'orders' | 'activity' | 'messages'>('profile');
  const [notes, setNotes] = useState(data.user?.notes || '');
  const [role, setRole] = useState(data.user?.role || 'user');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!data.user) {
    return <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-[var(--admin-text-muted)]">Usuario no encontrado.</div>;
  }

  const saveProfile = async () => {
    setBusy(true);
    try {
      await requestJson(`/api/admin/customers/users/${data.user?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role, notes }),
      });
      toast.success('Perfil actualizado');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el perfil');
    } finally {
      setBusy(false);
    }
  };

  const banUser = async (action: 'ban' | 'unban') => {
    await requestJson(`/api/admin/customers/users/${data.user?.id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    toast.success(action === 'ban' ? 'Usuario bloqueado' : 'Usuario restaurado');
    router.refresh();
  };

  const resetPassword = async () => {
    await requestJson(`/api/admin/customers/users/${data.user?.id}/password-reset`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    toast.success('Email de restablecimiento enviado');
  };

  const deleteAccount = async () => {
    await fetch(`/api/admin/customers/users/${data.user?.id}`, { method: 'DELETE' });
    toast.success('Cuenta eliminada');
    router.replace('/admin/users');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ['profile', 'Profile'],
          ['orders', 'Orders'],
          ['activity', 'Activity'],
          ['messages', 'Messages'],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key as any)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-[var(--admin-primary)] text-white' : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <div className="flex items-center gap-4">
              {data.user.avatar_url ? <img src={data.user.avatar_url} alt={data.user.full_name || data.user.email} className="h-20 w-20 rounded-full object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(108,99,255,0.18)] text-3xl font-semibold text-[var(--admin-accent)]">{data.user.email.slice(0, 1).toUpperCase()}</div>}
              <div>
                <p className="text-2xl font-semibold text-[var(--admin-text)]">{data.user.full_name || 'Sin nombre'}</p>
                <p className="text-sm text-[var(--admin-text-muted)]">{data.user.email}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Email"><Input value={data.user.email} readOnly /></Field>
              <Field label="Rol">
                <Select value={role} onChange={(event) => setRole(event.target.value as 'user' | 'admin' | 'banned')}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="banned">Banned</option>
                </Select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Admin internal notes">
                <Textarea rows={10} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={busy} onClick={saveProfile} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">Guardar perfil</button>
              <button type="button" onClick={resetPassword} className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">Send Password Reset Email</button>
              <button type="button" onClick={() => void banUser(data.user?.status === 'banned' ? 'unban' : 'ban')} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">
                {data.user.status === 'banned' ? <ShieldCheck className="h-4 w-4" /> : <ShieldBan className="h-4 w-4" />}
                {data.user.status === 'banned' ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.06)] p-6">
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Danger zone</h3>
            <p className="mt-2 text-sm text-[var(--admin-text-muted)]">La eliminación es permanente y también borrará el acceso de Auth para este usuario.</p>
            <button type="button" onClick={() => setConfirmDelete(true)} className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[rgba(239,68,68,0.4)] px-5 py-3 text-sm font-semibold text-[var(--admin-error)]">
              <Trash2 className="h-4 w-4" /> Delete Account
            </button>
          </section>
        </div>
      ) : null}

      {tab === 'orders' ? (
        <div className="space-y-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Order history</h3>
            <Badge variant="info">Total spent {toCurrency((data.user.total_spent_cents || 0) / 100)}</Badge>
          </div>
          <div className="space-y-3">
            {data.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <div>
                  <p className="font-medium text-[var(--admin-text)]">Pedido {String(order.id).slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--admin-text)]">{toCurrency(Number(order.total || 0) / 100)}</p>
                  <Link href={`/admin/orders/${order.id}`} className="text-xs font-semibold text-[var(--admin-accent)]">Abrir pedido</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 xl:col-span-2">
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Page view history</h3>
            <div className="mt-4 space-y-3">
              {data.pageViews.slice(0, 30).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--admin-text)]">{item.page_title || item.url}</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{item.url}</p>
                    </div>
                    <span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Login history</h3>
            <div className="mt-4 space-y-3">
              {data.loginHistory.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                  <div className="flex items-center justify-between"><Badge variant={item.success ? 'success' : 'error'}>{item.event_type}</Badge><span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(item.created_at)}</span></div>
                  <p className="mt-2 text-sm text-[var(--admin-text-muted)]">{item.browser || 'Browser desconocido'} · {item.os || 'SO desconocido'}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'messages' ? (
        <div className="space-y-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Mensajes relacionados</h3>
          {data.tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-[var(--admin-text)]">{ticket.subject}</p>
                <span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(ticket.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void deleteAccount()}
        title="Eliminar cuenta"
        description="Esta acción elimina el acceso del usuario y no se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        variant="danger"
      />
    </div>
  );
}

export function EmailTemplateEditor({ template }: { template: EmailTemplateRecord }) {
  const router = useRouter();
  const [subject, setSubject] = useState(template.subject);
  const [htmlBody, setHtmlBody] = useState(template.html_body);
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await requestJson(`/api/admin/emails/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ subject, html_body: htmlBody }),
      });
      toast.success('Template guardada');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    await requestJson(`/api/admin/emails/templates/${template.id}`, {
      method: 'POST',
      body: JSON.stringify({ testEmail }),
    });
    toast.success('Email de prueba enviado');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <div className="space-y-4">
          <Field label="Subject line">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </Field>
          <Field label="HTML body">
            <RichTextEditor value={htmlBody} onChange={setHtmlBody} />
          </Field>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((item) => (
              <button key={item} type="button" onClick={() => setHtmlBody((prev) => `${prev}<p>${item}</p>`)} className="rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs font-semibold text-[var(--admin-text)]">
                {item}
              </button>
            ))}
          </div>
          <button type="button" disabled={saving} onClick={save} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">Guardar plantilla</button>
        </div>
      </section>
      <section className="space-y-6 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Preview</h3>
          <div className="prose prose-invert mt-4 max-w-none rounded-2xl border border-[var(--admin-border)] bg-white p-6 text-slate-900" dangerouslySetInnerHTML={{ __html: htmlBody }} />
        </div>
        <div className="space-y-4">
          <Field label="Send test email">
            <Input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="tu@email.com" />
          </Field>
          <button type="button" onClick={sendTest} className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">Send Test Email</button>
        </div>
      </section>
    </div>
  );
}

export function EmailComposer({ templates, scheduled }: { templates: EmailTemplateRecord[]; scheduled: ScheduledEmailRecord[] }) {
  const [recipientScope, setRecipientScope] = useState<'all_users' | 'buyers' | 'selected_users' | 'custom_email'>('all_users');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('<p>Escribe aquí tu campaña.</p>');
  const [schedule, setSchedule] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const selectedTemplate = templates.find((template) => template.id === templateId);
    if (!selectedTemplate) return;
    setSubject(selectedTemplate.subject);
    setHtmlBody(selectedTemplate.html_body);
  }, [templateId, templates]);

  const submit = async () => {
    setSending(true);
    try {
      await requestJson('/api/admin/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientScope,
          recipientPayload: recipientScope === 'custom_email'
            ? { emails: recipientQuery.split(',').map((item) => item.trim()).filter(Boolean) }
            : recipientScope === 'selected_users'
              ? { query: recipientQuery }
              : {},
          templateId: templateId || null,
          subject,
          htmlBody,
          scheduleFor: schedule || null,
        }),
      });
      toast.success(schedule ? 'Campaña programada' : 'Campaña enviada');
      setSchedule('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo procesar la campaña');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Step 1 · Recipients</h3>
          <div className="mt-4 space-y-4">
            <Field label="Recipient group">
              <Select value={recipientScope} onChange={(event) => setRecipientScope(event.target.value as any)}>
                <option value="all_users">All users</option>
                <option value="buyers">All users with orders</option>
                <option value="selected_users">Select specific user(s)</option>
                <option value="custom_email">Custom email address</option>
              </Select>
            </Field>
            {recipientScope === 'selected_users' || recipientScope === 'custom_email' ? (
              <Field label={recipientScope === 'custom_email' ? 'Emails (comma separated)' : 'Search users'}>
                <Input value={recipientQuery} onChange={(event) => setRecipientQuery(event.target.value)} placeholder={recipientScope === 'custom_email' ? 'uno@email.com, dos@email.com' : 'nombre o email'} />
              </Field>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Step 2 · Compose</h3>
          <div className="mt-4 space-y-4">
            <Field label="Use template">
              <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                <option value="">Custom</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </Select>
            </Field>
            <Field label="Subject">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </Field>
            <Field label="HTML body">
              <RichTextEditor value={htmlBody} onChange={setHtmlBody} />
            </Field>
            <Field label="Programar envío (opcional)">
              <Input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} />
            </Field>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Step 3 · Review</h3>
          <div className="mt-4 space-y-3 text-sm text-[var(--admin-text-muted)]">
            <p>Recipients: <strong className="text-[var(--admin-text)]">{recipientScope}</strong></p>
            <p>Subject: <strong className="text-[var(--admin-text)]">{subject || 'Sin asunto'}</strong></p>
            <p>Status: <strong className="text-[var(--admin-text)]">{schedule ? 'Scheduled' : 'Send now'}</strong></p>
          </div>
          <div className="prose prose-invert mt-5 max-w-none rounded-2xl border border-[var(--admin-border)] bg-white p-6 text-slate-900" dangerouslySetInnerHTML={{ __html: htmlBody }} />
          <button type="button" disabled={sending} onClick={submit} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {schedule ? 'Schedule' : 'Send Now'}
          </button>
        </section>

        <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--admin-text)]">Scheduled emails</h3>
          <div className="mt-4 space-y-3">
            {scheduled.slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4">
                <p className="font-medium text-[var(--admin-text)]">{item.subject}</p>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{item.status} · {toDateTimeLabel(item.scheduled_for)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function toDateTimeLocalValue(value: string | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (input: number) => String(input).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function SettingsManager({
  settings,
  initialTab = 'general',
}: {
  settings: AdminSettingRecord[];
  initialTab?: 'general' | 'integrations' | 'notifications' | 'retroville' | 'account' | 'danger';
}) {
  const router = useRouter();
  const initial = useMemo(() => Object.fromEntries(settings.map((setting) => [setting.key, setting.value || ''])), [settings]);
  const [tab, setTab] = useState<'general' | 'integrations' | 'notifications' | 'retroville' | 'account' | 'danger'>(initialTab);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [confirmAnalytics, setConfirmAnalytics] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  const updateValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const save = async (keys: string[]) => {
    await requestJson('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings: keys.map((key) => ({ key, value: values[key] || '' })) }),
    });
    toast.success('Ajustes guardados');
    router.refresh();
  };

  const clearAnalytics = async () => {
    await requestJson('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear_analytics' }),
    });
    toast.success('Analítica eliminada');
    router.refresh();
  };

  const resetTemplates = async () => {
    await requestJson('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_templates' }),
    });
    toast.success('Plantillas restauradas');
    router.refresh();
  };

  const exportBackup = async () => {
    const data = await requestJson<Record<string, unknown>>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ action: 'export_backup' }),
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'advancedretro-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateAdminAccount = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error('Supabase no está disponible');
      return;
    }

    setAccountLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No se pudo cargar la sesión actual');

      const currentPassword = values.admin_current_password || '';
      const newPassword = values.admin_new_password || '';
      const confirmPassword = values.admin_confirm_password || '';
      const displayName = values.admin_display_name || '';

      if (newPassword || confirmPassword) {
        if (!currentPassword) throw new Error('Introduce tu contraseña actual');
        if (newPassword !== confirmPassword) throw new Error('La nueva contraseña y su confirmación no coinciden');
        const loginAttempt = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (loginAttempt.error) throw loginAttempt.error;
        const passwordUpdate = await supabase.auth.updateUser({ password: newPassword });
        if (passwordUpdate.error) throw passwordUpdate.error;
      }

      if (displayName) {
        const metadataUpdate = await supabase.auth.updateUser({
          data: { full_name: displayName, name: displayName },
        });
        if (metadataUpdate.error) throw metadataUpdate.error;
      }

      setValues((prev) => ({
        ...prev,
        admin_current_password: '',
        admin_new_password: '',
        admin_confirm_password: '',
      }));
      toast.success('Cuenta de administrador actualizada');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la cuenta');
    } finally {
      setAccountLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ['general', 'General'],
          ['integrations', 'Integrations'],
          ['notifications', 'Notifications'],
          ['retroville', 'Retroville'],
          ['account', 'Admin Account'],
          ['danger', 'Danger Zone'],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key as any)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-[var(--admin-primary)] text-white' : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' ? (
        <section className="grid gap-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 md:grid-cols-2">
          <Field label="Store name"><Input value={values.store_name || ''} onChange={(e) => updateValue('store_name', e.target.value)} /></Field>
          <Field label="Contact email"><Input value={values.contact_email || ''} onChange={(e) => updateValue('contact_email', e.target.value)} /></Field>
          <Field label="Currency"><Input value={values.currency || ''} onChange={(e) => updateValue('currency', e.target.value)} /></Field>
          <Field label="Timezone"><Input value={values.timezone || ''} onChange={(e) => updateValue('timezone', e.target.value)} /></Field>
          <button type="button" onClick={() => void save(['store_name', 'contact_email', 'currency', 'timezone'])} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">Guardar general</button>
        </section>
      ) : null}

      {tab === 'integrations' ? (
        <section className="grid gap-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 md:grid-cols-2">
          <Field label="eBay API Key"><Input value={values.ebay_api_key || ''} onChange={(e) => updateValue('ebay_api_key', e.target.value)} type="password" /></Field>
          <Field label="Resend API Key"><Input value={values.resend_api_key || ''} onChange={(e) => updateValue('resend_api_key', e.target.value)} type="password" /></Field>
          <Field label="Resend From Email"><Input value={values.resend_from_email || ''} onChange={(e) => updateValue('resend_from_email', e.target.value)} /></Field>
          <Field label="Admin alert email"><Input value={values.admin_alert_email || ''} onChange={(e) => updateValue('admin_alert_email', e.target.value)} /></Field>
          <button type="button" onClick={() => void save(['ebay_api_key', 'resend_api_key', 'resend_from_email', 'admin_alert_email'])} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">Guardar integraciones</button>
        </section>
      ) : null}

      {tab === 'notifications' ? (
        <section className="grid gap-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 md:grid-cols-2">
          {['notify_new_order', 'notify_new_user', 'notify_critical_error', 'notify_low_stock', 'notify_new_message'].map((key) => (
            <Field key={key} label={key}>
              <Select value={values[key] || 'true'} onChange={(e) => updateValue(key, e.target.value)}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </Field>
          ))}
          <Field label="Low stock threshold"><Input value={values.low_stock_threshold || '3'} onChange={(e) => updateValue('low_stock_threshold', e.target.value)} /></Field>
          <button type="button" onClick={() => void save(['notify_new_order', 'notify_new_user', 'notify_critical_error', 'notify_low_stock', 'notify_new_message', 'low_stock_threshold'])} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">Guardar notificaciones</button>
        </section>
      ) : null}

      {tab === 'retroville' ? (
        <section className="space-y-5 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Launch date de Retroville"
              hint="Fecha usada por la cuenta atrás pública y por el panel interno de Retroville."
            >
              <Input
                type="datetime-local"
                value={toDateTimeLocalValue(values.retroville_launch_date || '')}
                onChange={(event) => updateValue('retroville_launch_date', fromDateTimeLocalValue(event.target.value))}
              />
            </Field>
            <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-4 text-sm text-[var(--admin-text-muted)]">
              <p className="font-semibold text-[var(--admin-text)]">Centro de control Retroville</p>
              <p className="mt-2">
                Desde aquí ajustas la fecha de lanzamiento y puedes saltar al panel dedicado con tráfico, países,
                ciudades, páginas top y comportamiento de la waitlist.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save(['retroville_launch_date'])}
              className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white"
            >
              Guardar Retroville
            </button>
            <Link
              href="/admin/retroville"
              className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]"
            >
              Abrir panel Retroville
            </Link>
            <Link
              href="/retroville"
              target="_blank"
              className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]"
            >
              Ver landing publica
            </Link>
          </div>
        </section>
      ) : null}

      {tab === 'account' ? (
        <section className="grid gap-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 md:grid-cols-2">
          <Field label="Nuevo display name"><Input value={values.admin_display_name || ''} onChange={(e) => updateValue('admin_display_name', e.target.value)} /></Field>
          <Field label="Contraseña actual"><Input type="password" value={values.admin_current_password || ''} onChange={(e) => updateValue('admin_current_password', e.target.value)} /></Field>
          <Field label="Nueva contraseña"><Input type="password" value={values.admin_new_password || ''} onChange={(e) => updateValue('admin_new_password', e.target.value)} /></Field>
          <Field label="Confirmar nueva contraseña"><Input type="password" value={values.admin_confirm_password || ''} onChange={(e) => updateValue('admin_confirm_password', e.target.value)} /></Field>
          <button type="button" disabled={accountLoading} onClick={() => void updateAdminAccount()} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2">Guardar cuenta</button>
        </section>
      ) : null}

      {tab === 'danger' ? (
        <section className="space-y-5 rounded-3xl border border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.05)] p-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--admin-text)]">Clear all analytics data</h3>
            <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Escribe CONFIRMAR para vaciar page_views, user_sessions y login_activity_logs.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Input value={confirmAnalytics} onChange={(e) => setConfirmAnalytics(e.target.value)} placeholder="CONFIRMAR" className="max-w-xs" />
              <button type="button" disabled={confirmAnalytics !== 'CONFIRMAR'} onClick={() => void clearAnalytics()} className="rounded-2xl border border-[rgba(239,68,68,0.4)] px-5 py-3 text-sm font-semibold text-[var(--admin-error)] disabled:opacity-40">Borrar analítica</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void resetTemplates()} className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">Reset email templates</button>
            <button type="button" onClick={() => void exportBackup()} className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">Export full database backup as JSON</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function AddUserButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'banned'>('user');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await requestJson('/api/admin/customers/users/create', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role,
          send_welcome_email: sendWelcomeEmail,
        }),
      });
      toast.success('Usuario creado');
      setOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('user');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white">
        Add User
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Crear usuario" widthClass="max-w-xl">
        <div className="space-y-4">
          <Field label="Nombre completo"><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Contraseña"><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
          <Field label="Rol">
            <Select value={role} onChange={(event) => setRole(event.target.value as 'user' | 'admin' | 'banned')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="banned">Banned</option>
            </Select>
          </Field>
          <label className="flex items-center gap-3 text-sm text-[var(--admin-text-muted)]">
            <input type="checkbox" checked={sendWelcomeEmail} onChange={(event) => setSendWelcomeEmail(event.target.checked)} />
            Enviar welcome email
          </label>
          <button type="button" disabled={loading} onClick={() => void submit()} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            Crear usuario
          </button>
        </div>
      </Modal>
    </>
  );
}

export function ErrorLogsToolbar() {
  const [clearing, setClearing] = useState(false);

  const exportLogs = async () => {
    const data = await requestJson<{ rows: Array<Record<string, any>>; total: number; critical: number; today: number; unresolved: number }>('/api/admin/errors');
    const content = data.rows
      .map((row) => `========================================\n[${String(row.severity || 'error').toUpperCase()}] ${row.created_at}\nURL: ${row.url || 'N/D'}\nUser: ${row.user_id || 'N/D'}\nMessage: ${row.message}\nStack: ${row.stack_trace || 'N/D'}\n========================================`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'advancedretro-error-logs.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearResolved = async () => {
    setClearing(true);
    try {
      await requestJson('/api/admin/errors/clear-resolved', { method: 'POST' });
      toast.success('Logs resueltos eliminados');
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron eliminar los logs');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => void exportLogs()} className="rounded-2xl border border-[var(--admin-border)] px-5 py-3 text-sm font-semibold text-[var(--admin-text)]">
        Export Logs
      </button>
      <button type="button" disabled={clearing} onClick={() => void clearResolved()} className="rounded-2xl border border-[rgba(239,68,68,0.35)] px-5 py-3 text-sm font-semibold text-[var(--admin-error)] disabled:opacity-60">
        Clear Resolved Logs
      </button>
    </div>
  );
}

export function MessageReviewPanel({ ticket }: { ticket: Record<string, any> }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replySubject, setReplySubject] = useState(`Sobre tu mensaje: ${ticket.title}`);
  const [replyBody, setReplyBody] = useState('<p>Hola, te escribimos desde AdvancedRetro.</p>');

  const updateStatus = async (review_status: 'approved' | 'rejected') => {
    await requestJson(`/api/admin/messages/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, review_reason: review_status === 'rejected' ? 'Revisión manual del equipo' : null }),
    });
    toast.success(review_status === 'approved' ? 'Mensaje aprobado' : 'Mensaje rechazado');
    window.location.reload();
  };

  const sendReply = async () => {
    await requestJson(`/api/admin/messages/${ticket.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'reply',
        email: ticket.user?.email,
        subject: replySubject,
        htmlBody: replyBody,
      }),
    });
    toast.success('Respuesta enviada');
    setReplyOpen(false);
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void updateStatus('approved')} className="rounded-2xl bg-[rgba(34,197,94,0.15)] px-4 py-3 text-sm font-semibold text-[var(--admin-success)]">
          Approve
        </button>
        <button type="button" onClick={() => void updateStatus('rejected')} className="rounded-2xl bg-[rgba(239,68,68,0.15)] px-4 py-3 text-sm font-semibold text-[var(--admin-error)]">
          Reject
        </button>
        <button type="button" onClick={() => setReplyOpen(true)} className="rounded-2xl border border-[var(--admin-border)] px-4 py-3 text-sm font-semibold text-[var(--admin-text)]">
          Reply
        </button>
      </div>

      <Modal open={replyOpen} onClose={() => setReplyOpen(false)} title="Responder al usuario">
        <div className="space-y-4">
          <Field label="Asunto"><Input value={replySubject} onChange={(event) => setReplySubject(event.target.value)} /></Field>
          <Field label="Mensaje"><RichTextEditor value={replyBody} onChange={setReplyBody} /></Field>
          <button type="button" onClick={() => void sendReply()} className="rounded-2xl bg-[var(--admin-primary)] px-5 py-3 text-sm font-semibold text-white">Enviar respuesta</button>
        </div>
      </Modal>
    </>
  );
}

function deviceIcon(deviceType: string | null | undefined) {
  if (deviceType === 'mobile') return <Smartphone className="h-4 w-4" />;
  if (deviceType === 'tablet') return <Tablet className="h-4 w-4" />;
  return <Laptop className="h-4 w-4" />;
}

export function OnlineSessionsView({ initialSessions, timeline }: { initialSessions: Array<Record<string, any>>; timeline: Array<{ label: string; value: number }> }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selected, setSelected] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await requestJson<{ sessions: Array<Record<string, any>> }>('/api/admin/online');
        if (active) setSessions(data.sessions);
      } catch {
        // ignore
      }
    };
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel('admin-online-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, load)
      .subscribe();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const onlineCount = sessions.filter((item) => new Date(item.last_heartbeat).getTime() >= Date.now() - 120000).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--admin-text-muted)]">Usuarios online</p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--admin-text)]">{onlineCount}</h2>
          </div>
          <div className="rounded-full bg-[rgba(34,197,94,0.12)] px-3 py-1 text-xs font-semibold text-[var(--admin-success)]">Auto-refresh 30s</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {sessions.map((session) => {
          const heartbeatAge = Date.now() - new Date(session.last_heartbeat).getTime();
          const active = heartbeatAge <= 30000;
          return (
            <button key={session.id} type="button" onClick={() => setSelected(session)} className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 text-left transition hover:border-[var(--admin-primary)] hover:bg-[var(--admin-surface-2)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--admin-text)]">{session.user?.full_name || session.user?.email || 'Anonymous visitor'}</p>
                  <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{session.current_page || '/'}</p>
                </div>
                <span className={`h-3 w-3 rounded-full ${active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--admin-text-muted)]">
                <span className="inline-flex items-center gap-1">{deviceIcon(session.device_type)} {session.browser || 'Browser'}</span>
                <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" /> {session.country || '—'} {session.city ? `· ${session.city}` : ''}</span>
                <span className="inline-flex items-center gap-1"><CalendarClock className="h-4 w-4" /> {formatDistanceToNowStrict(new Date(session.started_at), { locale: es })}</span>
              </div>
            </button>
          );
        })}
      </div>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--admin-text)]">Sessions Timeline</h3>
        <div className="mt-6 flex h-52 items-end gap-2">
          {timeline.map((item) => {
            const height = Math.max(8, item.value * 18);
            return (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#6c63ff,#a78bfa)]" style={{ height }} />
                <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Session details" widthClass="max-w-4xl">
        {selected ? (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4 rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface-2)] p-5">
              <p className="font-semibold text-[var(--admin-text)]">{selected.user?.full_name || selected.user?.email || 'Anonymous visitor'}</p>
              <p className="text-sm text-[var(--admin-text-muted)]">{selected.session_id}</p>
              <div className="space-y-2 text-sm text-[var(--admin-text-muted)]">
                <p>Current page: <strong className="text-[var(--admin-text)]">{selected.current_page || '/'}</strong></p>
                <p>Started: <strong className="text-[var(--admin-text)]">{toDateTimeLabel(selected.started_at)}</strong></p>
                <p>Heartbeat: <strong className="text-[var(--admin-text)]">{toDateTimeLabel(selected.last_heartbeat)}</strong></p>
                <p>Device: <strong className="text-[var(--admin-text)]">{selected.device_type || 'desktop'}</strong></p>
                <p>Browser: <strong className="text-[var(--admin-text)]">{selected.browser || '—'}</strong></p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--admin-text-muted)]">Page history</h4>
              <div className="mt-4 space-y-3">
                {(selected.history || []).map((item: PageViewRecord) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--admin-text)]">{item.page_title || item.url}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">{item.url}</p>
                      </div>
                      <span className="text-xs text-[var(--admin-text-muted)]">{toDateTimeLabel(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function RetrovilleWaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await requestJson('/api/retroville/waitlist', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccess('Te hemos apuntado a la lista de espera. Te avisaremos antes del lanzamiento.');
      setEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto mt-8 max-w-xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required className="bg-white/10 text-white placeholder:text-white/55" />
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {loading ? 'Guardando...' : 'Unirme a la waitlist'}
        </button>
      </div>
      {success ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{success}</p> : null}
    </form>
  );
}

export function StoreCreatorLeadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('Coleccionismo');
  const [planInterest, setPlanInterest] = useState('Pro');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await requestJson('/api/store-creator/lead', {
        method: 'POST',
        body: JSON.stringify({ name, email, business_type: businessType, plan_interest: planInterest }),
      });
      setSuccess(true);
      setName('');
      setEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(79,70,229,0.08)] md:grid-cols-2">
      <Field label="Nombre">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400" />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" className="border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400" />
      </Field>
      <Field label="Tipo de negocio">
        <Select value={businessType} onChange={(event) => setBusinessType(event.target.value)} className="border-slate-200 bg-slate-50 text-slate-900">
          {['Ropa', 'Electrónica', 'Coleccionismo', 'Otro'].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </Field>
      <Field label="Plan de interés">
        <Select value={planInterest} onChange={(event) => setPlanInterest(event.target.value)} className="border-slate-200 bg-slate-50 text-slate-900">
          {['Free', 'Pro', 'Business'].map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
      </Field>
      <button type="submit" disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5,#7c3aed)] px-6 py-3 text-sm font-semibold text-white md:col-span-2">
        {loading ? 'Enviando...' : 'Quiero enterarme primero'}
      </button>
      {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">Perfecto. Te avisaremos en cuanto abramos el acceso anticipado.</p> : null}
    </form>
  );
}
