'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabaseClient } from '@/lib/supabaseClient';

type SellerProfile = {
  id: string;
  role: 'user' | 'admin';
  is_verified_seller: boolean;
  name: string | null;
  email: string;
};

type ListingPolicy = {
  listing_fee_cents: number;
  commission_rate: number;
  featured_fee_per_day_cents: number;
  showcase_fee_per_day_cents: number;
  min_images: number;
  max_images: number;
};

const CATEGORY_OPTIONS = [
  { value: 'juegos-gameboy', label: 'Juegos Game Boy' },
  { value: 'juegos-gameboy-color', label: 'Juegos Game Boy Color' },
  { value: 'juegos-gameboy-advance', label: 'Juegos Game Boy Advance' },
  { value: 'juegos-super-nintendo', label: 'Juegos Super Nintendo' },
  { value: 'juegos-gamecube', label: 'Juegos GameCube' },
  { value: 'cajas-gameboy', label: 'Cajas' },
  { value: 'manuales', label: 'Manuales' },
  { value: 'accesorios', label: 'Accesorios' },
  { value: 'consolas-retro', label: 'Consolas retro' },
];

const CONDITION_OPTIONS = [
  { value: 'used', label: 'Usado' },
  { value: 'new', label: 'Nuevo' },
  { value: 'restored', label: 'Restaurado' },
];

const ORIGINALITY_OPTIONS = [
  { value: 'original_verificado', label: 'Original verificado' },
  { value: 'original_sin_verificar', label: 'Original sin verificar' },
  { value: 'repro_1_1', label: 'Repro 1:1' },
  { value: 'mixto', label: 'Mixto' },
];

const PEGI_OPTIONS = [
  { value: 'none', label: 'Sin PEGI / No aplica' },
  { value: '3', label: 'PEGI 3' },
  { value: '7', label: 'PEGI 7' },
  { value: '12', label: 'PEGI 12' },
  { value: '16', label: 'PEGI 16' },
  { value: '18', label: 'PEGI 18' },
];

const PACKAGE_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
  { value: 'oversize', label: 'Muy grande' },
];

function toEuro(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.max(0, Number(cents || 0)) / 100);
}

export default function CommunityPublishView() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [policy, setPolicy] = useState<ListingPolicy>({
    listing_fee_cents: 0,
    commission_rate: 5,
    featured_fee_per_day_cents: 100,
    showcase_fee_per_day_cents: 500,
    min_images: 3,
    max_images: 10,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceEuro, setPriceEuro] = useState('');
  const [category, setCategory] = useState('juegos-gameboy');
  const [condition, setCondition] = useState('used');
  const [originalityStatus, setOriginalityStatus] = useState('original_sin_verificar');
  const [originalityNotes, setOriginalityNotes] = useState('');

  const [pegiRating, setPegiRating] = useState('none');
  const [genre, setGenre] = useState('');
  const [packageSize, setPackageSize] = useState('medium');
  const [itemColor, setItemColor] = useState('');

  const [isFeatured, setIsFeatured] = useState(false);
  const [featuredDays, setFeaturedDays] = useState(1);
  const [isShowcase, setIsShowcase] = useState(false);
  const [showcaseDays, setShowcaseDays] = useState(1);

  const [images, setImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canPublish = Boolean(profile) && (profile?.is_verified_seller || profile?.role === 'admin');

  const featuredFeeCents = isFeatured ? Math.max(1, featuredDays) * policy.featured_fee_per_day_cents : 0;
  const showcaseFeeCents = isShowcase ? Math.max(1, showcaseDays) * policy.showcase_fee_per_day_cents : 0;
  const promotionsTotal = featuredFeeCents + showcaseFeeCents;

  const imagesLeft = Math.max(0, policy.max_images - images.length);

  const descriptionCountClass = useMemo(() => {
    if (description.length > 4000) return 'text-red-400';
    if (description.length > 3600) return 'text-amber-300';
    return 'text-textMuted';
  }, [description.length]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [authRes, policyRes] = await Promise.all([
          fetch('/api/auth/profile', { cache: 'no-store' }),
          fetch('/api/profile/listings', { cache: 'no-store' }),
        ]);

        const authData = await authRes.json().catch(() => null);
        if (authRes.ok && mounted) {
          const p = authData?.user?.profile;
          if (p) {
            setProfile({
              id: String(p.id),
              role: p.role === 'admin' ? 'admin' : 'user',
              is_verified_seller: Boolean(p.is_verified_seller),
              name: typeof p.name === 'string' ? p.name : null,
              email: typeof authData?.user?.email === 'string' ? authData.user.email : '',
            });
          } else {
            setProfile(null);
          }
        } else if (mounted) {
          setProfile(null);
        }

        const policyData = await policyRes.json().catch(() => null);
        if (policyRes.ok && mounted && policyData?.policy) {
          setPolicy((prev) => ({
            ...prev,
            listing_fee_cents: Number(policyData.policy?.listing_fee_cents || 0),
            commission_rate: Number(policyData.policy?.commission_rate || 5),
            featured_fee_per_day_cents: Number(policyData.policy?.featured_fee_per_day_cents || 100),
            showcase_fee_per_day_cents: Number(policyData.policy?.showcase_fee_per_day_cents || 500),
            min_images: Number(policyData.policy?.min_images || 3),
            max_images: Number(policyData.policy?.max_images || 10),
          }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    const queue = Array.from(files || []);
    if (queue.length === 0) return;

    if (images.length + queue.length > policy.max_images) {
      toast.error(`Máximo ${policy.max_images} imágenes por anuncio`);
      return;
    }

    setUploadingImages(true);
    try {
      const nextUrls: string[] = [];
      for (const file of queue) {
        const formData = new FormData();
        formData.set('image', file);

        const res = await fetch('/api/community/listings/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || `No se pudo subir ${file.name}`);
        }

        const url = String(data?.url || '').trim();
        if (!url) throw new Error(`No se recibió URL para ${file.name}`);
        nextUrls.push(url);
      }

      setImages((prev) => [...prev, ...nextUrls]);
      toast.success(`${nextUrls.length} imagen(es) subida(s)`);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron subir las imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const addManualUrl = () => {
    const url = manualImageUrl.trim();
    if (!url) return;
    if (images.length >= policy.max_images) {
      toast.error(`Máximo ${policy.max_images} imágenes`);
      return;
    }
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      toast.error('URL no válida');
      return;
    }
    if (images.includes(url)) {
      toast.error('Esa imagen ya está añadida');
      return;
    }

    setImages((prev) => [...prev, url]);
    setManualImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submit = async () => {
    if (!profile) {
      toast.error('Debes iniciar sesión para publicar');
      return;
    }
    if (!canPublish) {
      toast.error('Tu cuenta no está verificada para vender en comunidad');
      return;
    }

    const priceCents = Math.round(Number(priceEuro || 0) * 100);

    if (images.length < policy.min_images) {
      toast.error(`Debes subir mínimo ${policy.min_images} imágenes`);
      return;
    }
    if (images.length > policy.max_images) {
      toast.error(`Máximo ${policy.max_images} imágenes por anuncio`);
      return;
    }
    if (description.length > 4000) {
      toast.error('La descripción no puede superar 4000 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: priceCents,
          category,
          condition,
          originality_status: originalityStatus,
          originality_notes: originalityNotes,
          images,
          pegi_rating: pegiRating,
          genre,
          package_size: packageSize,
          item_color: itemColor,
          is_featured: isFeatured,
          featured_days: isFeatured ? Math.max(1, featuredDays) : 0,
          is_showcase: isShowcase,
          showcase_days: isShowcase ? Math.max(1, showcaseDays) : 0,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo publicar el anuncio');
      }

      toast.success('Anuncio enviado a revisión');
      router.push('/perfil?tab=sell');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo publicar el anuncio');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6">
            <p className="text-textMuted">Cargando publicación de comunidad...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="section">
        <div className="container">
          <div className="glass p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Comunidad · Publicar</p>
            <h1 className="title-display text-3xl mt-2">Publica tu anuncio</h1>
            <p className="text-textMuted mt-3">Necesitas iniciar sesión para crear anuncios en la comunidad.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/login?redirect=/comunidad/publicar" className="button-primary">Iniciar sesión</Link>
              <Link href="/comunidad" className="chip">Volver a comunidad</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container space-y-6">
        <div className="glass p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Comunidad · Vender</p>
              <h1 className="title-display text-2xl sm:text-3xl mt-2">Crear anuncio</h1>
              <p className="text-textMuted mt-2">
                Comisión de tienda: <span className="text-primary font-semibold">{policy.commission_rate}%</span> por venta cerrada.
                Publicación base: {toEuro(policy.listing_fee_cents)}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/comunidad" className="chip">Volver a comunidad</Link>
              <Link href="/perfil?tab=sell" className="chip">Mis anuncios</Link>
            </div>
          </div>

          {!canPublish ? (
            <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-400/10 p-4">
              <p className="font-semibold text-amber-200">Tu cuenta aún no está verificada como vendedor</p>
              <p className="text-sm text-amber-100/80 mt-1">
                Pide verificación a soporte para habilitar publicación de anuncios.
              </p>
              <Link href="/perfil?tab=tickets" className="chip mt-3 inline-flex border-amber-200/40 text-amber-100">
                Abrir ticket de verificación
              </Link>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
          <div className="glass p-5 sm:p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Nombre del artículo</label>
                <input
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  placeholder="Ej. Pokémon Amarillo CIB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Descripción</label>
                <textarea
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2 min-h-[170px]"
                  placeholder="Describe estado, idioma, contenido, detalles técnicos, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={4000}
                />
                <p className={`text-xs mt-1 ${descriptionCountClass}`}>{description.length}/4000</p>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Precio (€)</label>
                <input
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  placeholder="49.99"
                  value={priceEuro}
                  onChange={(e) => setPriceEuro(e.target.value.replace(',', '.'))}
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">PEGI</label>
                <select
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  value={pegiRating}
                  onChange={(e) => setPegiRating(e.target.value)}
                >
                  {PEGI_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Categoría</label>
                <select
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Estado</label>
                <select
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Género</label>
                <input
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  placeholder="RPG, Acción, Plataformas..."
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  maxLength={80}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Color</label>
                <input
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  placeholder="Negro, amarillo, transparente..."
                  value={itemColor}
                  onChange={(e) => setItemColor(e.target.value)}
                  maxLength={60}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Tamaño de paquete</label>
                <select
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  value={packageSize}
                  onChange={(e) => setPackageSize(e.target.value)}
                >
                  {PACKAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Originalidad</label>
                <select
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  value={originalityStatus}
                  onChange={(e) => setOriginalityStatus(e.target.value)}
                >
                  {ORIGINALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs uppercase tracking-[0.14em] text-textMuted">Detalle de autenticidad</label>
                <textarea
                  className="mt-2 w-full bg-transparent border border-line rounded-xl px-3 py-2 min-h-[110px]"
                  placeholder="Incluye pruebas: número de serie, estado de etiqueta, placa, manual, etc."
                  value={originalityNotes}
                  onChange={(e) => setOriginalityNotes(e.target.value)}
                  maxLength={1500}
                />
              </div>
            </div>
          </div>

          <div className="glass p-5 sm:p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Fotos del anuncio</p>
              <p className="text-sm text-textMuted mt-2">
                Mínimo {policy.min_images} y máximo {policy.max_images}. Formatos: JPG, PNG, WEBP, GIF, AVIF o HEIC.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) void uploadFiles(files);
                  e.currentTarget.value = '';
                }}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages || imagesLeft <= 0}
                >
                  {uploadingImages ? 'Subiendo imágenes...' : 'Subir imágenes'}
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  placeholder="o pega URL de imagen"
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                />
                <button type="button" className="chip" onClick={addManualUrl}>
                  Añadir
                </button>
              </div>

              <p className="text-xs text-textMuted mt-2">Imágenes añadidas: {images.length}/{policy.max_images}</p>

              {images.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative rounded-xl border border-line bg-surface overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt={`Imagen ${index + 1}`}
                        className="h-28 w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full border border-line bg-black/70 px-2 py-0.5 text-xs"
                        onClick={() => removeImage(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.5)] space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Opciones premium</p>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span className="text-sm">
                  <span className="font-semibold text-primary">Destacar anuncio</span>
                  <span className="block text-textMuted">1,00 € al día. El anuncio se posiciona antes.</span>
                </span>
              </label>
              {isFeatured ? (
                <div>
                  <label className="text-xs text-textMuted">Días de destacado</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={featuredDays}
                    onChange={(e) => setFeaturedDays(Math.min(30, Math.max(1, Number(e.target.value || 1))))}
                    className="mt-1 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  />
                </div>
              ) : null}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={isShowcase}
                  onChange={(e) => setIsShowcase(e.target.checked)}
                />
                <span className="text-sm">
                  <span className="font-semibold text-primary">Vitrina del vendedor</span>
                  <span className="block text-textMuted">5,00 € al día. Sale en el bloque de vitrina del vendedor.</span>
                </span>
              </label>
              {isShowcase ? (
                <div>
                  <label className="text-xs text-textMuted">Días de vitrina</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={showcaseDays}
                    onChange={(e) => setShowcaseDays(Math.min(30, Math.max(1, Number(e.target.value || 1))))}
                    className="mt-1 w-full bg-transparent border border-line rounded-xl px-3 py-2"
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-line p-4 bg-[rgba(8,16,28,0.5)] space-y-1">
              <p className="text-sm text-textMuted">Resumen de costes</p>
              <p className="text-sm text-textMuted">Publicación base: {toEuro(policy.listing_fee_cents)}</p>
              <p className="text-sm text-textMuted">Destacado: {toEuro(featuredFeeCents)}</p>
              <p className="text-sm text-textMuted">Vitrina: {toEuro(showcaseFeeCents)}</p>
              <p className="text-sm font-semibold text-primary">Total promoción: {toEuro(promotionsTotal)}</p>
              <p className="text-xs text-textMuted mt-2">
                Comisión de tienda en venta cerrada: {policy.commission_rate}%.
              </p>
            </div>

            <button
              type="button"
              className="button-primary w-full"
              onClick={submit}
              disabled={submitting || !canPublish}
            >
              {submitting ? 'Enviando...' : 'Publicar anuncio'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
