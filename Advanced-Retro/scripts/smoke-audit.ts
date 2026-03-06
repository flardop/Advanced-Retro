/* eslint-disable no-console */
export {};

type CheckResult = {
  name: string;
  ok: boolean;
  details: string;
};

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, { redirect: 'follow' });
  const body = await res.text();
  return { status: res.status, body };
}

async function fetchJson(url: string): Promise<{ status: number; data: any }> {
  const res = await fetch(url, { redirect: 'follow' });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function assertContains(body: string, text: string): boolean {
  return body.toLowerCase().includes(text.toLowerCase());
}

async function main() {
  const baseUrl = (process.env.SMOKE_BASE_URL || 'http://localhost:3020').replace(/\/+$/, '');
  const results: CheckResult[] = [];

  const pages = [
    { path: '/', mustContain: 'AdvancedRetro.es' },
    { path: '/tienda', mustContain: 'Catálogo' },
    { path: '/terminos', mustContain: 'Términos y condiciones' },
    { path: '/privacidad', mustContain: 'Política de privacidad' },
    { path: '/cookies', mustContain: 'Política de cookies' },
    { path: '/accesibilidad', mustContain: 'Accesibilidad' },
  ];

  for (const page of pages) {
    try {
      const { status, body } = await fetchText(`${baseUrl}${page.path}`);
      const statusOk = status >= 200 && status < 400;
      const contentOk = assertContains(body, page.mustContain);
      results.push({
        name: `GET ${page.path}`,
        ok: statusOk && contentOk,
        details: `status=${status} contain="${page.mustContain}" => ${contentOk}`,
      });
    } catch (error: any) {
      results.push({
        name: `GET ${page.path}`,
        ok: false,
        details: error?.message || 'request_failed',
      });
    }
  }

  try {
    const { status, data } = await fetchJson(`${baseUrl}/api/catalog/public`);
    const count = Number(data?.count || 0);
    results.push({
      name: 'GET /api/catalog/public',
      ok: status >= 200 && status < 400 && count > 0,
      details: `status=${status} count=${count} source=${String(data?.source || 'unknown')}`,
    });
  } catch (error: any) {
    results.push({
      name: 'GET /api/catalog/public',
      ok: false,
      details: error?.message || 'request_failed',
    });
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    const icon = result.ok ? 'OK' : 'FAIL';
    console.log(`[${icon}] ${result.name} :: ${result.details}`);
  }

  if (failed.length > 0) {
    console.error(`\nSmoke audit finished with ${failed.length} failing checks.`);
    process.exit(1);
  }

  console.log('\nSmoke audit finished successfully.');
}

void main();
