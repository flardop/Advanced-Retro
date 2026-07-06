import { Badge } from '@/components/admin/ui/Badge';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import RetrovilleAdminSeoActions from '@/components/retroville/admin/RetrovilleAdminSeoActions';
import { getRetrovilleAdminSeoData } from '@/lib/retroville-admin/data';
import { toDateTimeLabel } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

export default async function RetrovilleAdminSeoPage() {
  const data = await getRetrovilleAdminSeoData();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="SEO y rastreo"
        description="Estado SEO consolidado por página: títulos, descripciones, canonical, structured data, sitemap, robots y huella de Googlebot."
        breadcrumbs={[{ label: 'Retroville Admin' }, { label: 'SEO y rastreo' }]}
        actions={<RetrovilleAdminSeoActions />}
      />

      <section className="overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--admin-border)]">
              <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[var(--admin-text-muted)]">
                <th className="px-4 py-4">Página</th>
                <th className="px-4 py-4">SEO title</th>
                <th className="px-4 py-4">Meta description</th>
                <th className="px-4 py-4">Canonical</th>
                <th className="px-4 py-4">Lighthouse</th>
                <th className="px-4 py-4">Structured data</th>
                <th className="px-4 py-4">Sitemap</th>
                <th className="px-4 py-4">Robots</th>
                <th className="px-4 py-4">Googlebot</th>
                <th className="px-4 py-4">Último cambio</th>
              </tr>
            </thead>
            <tbody>
              {data.pages.map((page) => (
                <tr key={page.path} className="border-b border-[var(--admin-border)] align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[var(--admin-text)]">{page.label}</p>
                    <p className="mt-1 [font-family:var(--admin-mono)] text-xs text-[var(--admin-text-muted)]">
                      {page.path}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{page.seoTitle || '—'}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{page.metaDescription || '—'}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{page.canonical || '—'}</td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">
                    {page.lighthouseSeoScore == null ? '—' : `${page.lighthouseSeoScore}/100`}
                  </td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">
                    {Array.isArray(page.structuredData) && page.structuredData.length
                      ? page.structuredData.join(', ')
                      : 'No'}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={page.inSitemap ? 'success' : 'warning'}>
                      {page.inSitemap ? 'Incluida' : 'Fuera'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={page.robotsAllowed ? 'success' : 'warning'}>
                      {page.robotsAllowed ? 'Permitida' : 'Bloqueada'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">
                    {page.lastGooglebotVisit ? toDateTimeLabel(page.lastGooglebotVisit) : 'Sin registro'}
                  </td>
                  <td className="px-4 py-4 text-[var(--admin-text)]">{page.lastModified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-text-muted)]">Keywords detectadas</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {data.keywords.length ? (
            data.keywords.map((item) => (
              <div
                key={item.label}
                className="rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-2)] px-4 py-2 text-sm text-[var(--admin-text)]"
              >
                <span className="font-medium">{item.label}</span>{' '}
                <span className="text-[var(--admin-text-muted)]">({item.value})</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--admin-text-muted)]">
              Todavía no hay referrers de buscadores con query parseable guardada en los datos disponibles.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
