/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eye, Mail, Package2, ShieldBan, Trash2 } from 'lucide-react';
import { Badge } from '@/components/admin/ui/Badge';
import { DataTable } from '@/components/admin/ui/DataTable';
import { SearchInput } from '@/components/admin/ui/SearchInput';
import { toCurrency, toDateTimeLabel, truncate } from '@/lib/admin/format';
import type { DataTableBulkAction, DataTableColumn, EmailLogRecord, ErrorLogRecord } from '@/types/admin';

type ProductRow = Record<string, any>;
type OrderRow = Record<string, any>;
type UserRow = Record<string, any>;
type MessageRow = Record<string, any>;

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)] transition hover:bg-[var(--admin-surface-2)]">
      <Eye className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

async function postJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error || 'No se pudo completar la acción');
  }
  return payload.data;
}

async function patchJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error || 'No se pudo completar la acción');
  }
  return payload.data;
}

export function ProductsTableView({ rows }: { rows: ProductRow[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const categories = useMemo(() => ['all', ...new Set(rows.map((row) => String(row.category || 'Sin categoría')))], [rows]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesCategory = category === 'all' || String(row.category || 'Sin categoría') === category;
    const rowStatus = row.is_active === false ? 'draft' : 'active';
    const matchesStatus = status === 'all' || rowStatus === status;
    return matchesCategory && matchesStatus;
  }), [category, rows, status]);

  const bulkActions: DataTableBulkAction<ProductRow>[] = [
    {
      id: 'activate',
      label: 'Activar',
      onClick: async (selected) => {
        await postJson('/api/admin/catalog/products/bulk', { action: 'activate', ids: selected.map((row) => row.id) });
        toast.success('Productos activados');
        window.location.reload();
      },
    },
    {
      id: 'deactivate',
      label: 'Desactivar',
      onClick: async (selected) => {
        await postJson('/api/admin/catalog/products/bulk', { action: 'deactivate', ids: selected.map((row) => row.id) });
        toast.success('Productos desactivados');
        window.location.reload();
      },
    },
    {
      id: 'delete',
      label: 'Eliminar',
      variant: 'danger',
      onClick: async (selected) => {
        await postJson('/api/admin/catalog/products/bulk', { action: 'delete', ids: selected.map((row) => row.id) });
        toast.success('Productos eliminados');
        window.location.reload();
      },
    },
  ];

  const columns: DataTableColumn<ProductRow>[] = [
    {
      key: 'image',
      header: 'Image',
      render: (row) => (
        <img src={row.image || row.images?.[0] || '/placeholder.svg'} alt={String(row.name || 'Producto')} className="h-14 w-14 rounded-2xl border border-[var(--admin-border)] object-cover" />
      ),
    },
    {
      key: 'name',
      header: 'Title',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[var(--admin-text)]">{row.name}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">/{row.meta?.seo_handle || row.slug || row.id}</p>
        </div>
      ),
      accessor: (row) => row.name,
    },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (row) => toCurrency(Number(row.price || 0) / 100),
      accessor: (row) => Number(row.price || 0),
    },
    { key: 'stock', header: 'Stock', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.is_active === false ? 'warning' : 'success'}>{row.is_active === false ? 'Draft' : 'Active'}</Badge>,
      accessor: (row) => (row.is_active === false ? 'draft' : 'active'),
    },
    {
      key: 'ebay',
      header: 'eBay Price',
      render: (row) => row.ebay_marketplace_id ? <span className="text-xs text-[var(--admin-text-muted)]">{row.ebay_marketplace_id}</span> : '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => <ActionLink href={`/admin/products/${row.id}`} label="Editar" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
        <SearchInput placeholder="Buscar por nombre, slug o SKU" value={search} onChange={setSearch} />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none">
          {categories.map((item) => (
            <option key={item} value={item}>{item === 'all' ? 'Todas las categorías' : item}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none">
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="draft">Borrador / Inactivo</option>
        </select>
      </div>
      <DataTable rows={filteredRows} columns={columns} bulkActions={bulkActions} search={search} searchKeys={['name', 'slug']} pageSize={12} />
    </div>
  );
}

export function OrdersTableView({ rows }: { rows: OrderRow[] }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const tabs = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const filteredRows = useMemo(() => rows.filter((row) => tab === 'all' || String(row.meta?.fulfillment_status || row.status || 'pending') === tab), [rows, tab]);

  const columns: DataTableColumn<OrderRow>[] = [
    {
      key: 'id',
      header: 'Order #',
      sortable: true,
      render: (row) => <span className="font-semibold">{String(row.id).slice(0, 8).toUpperCase()}</span>,
      accessor: (row) => row.id,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{row.user?.name || row.user?.full_name || row.user?.email || 'Cliente'}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{row.user?.email || 'Sin email'}</p>
        </div>
      ),
      accessor: (row) => row.user?.email || '',
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (row) => toDateTimeLabel(row.created_at),
      accessor: (row) => row.created_at,
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => String(Array.isArray(row.order_items) ? row.order_items.length : Array.isArray(row.items) ? row.items.length : 0),
      accessor: (row) => Array.isArray(row.order_items) ? row.order_items.length : 0,
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      render: (row) => toCurrency(Number(row.total || 0) / 100),
      accessor: (row) => Number(row.total || 0),
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (row) => <Badge variant={String(row.meta?.payment_status || 'pending') === 'paid' ? 'success' : String(row.meta?.payment_status || 'pending') === 'failed' ? 'error' : 'warning'}>{row.meta?.payment_status || 'pending'}</Badge>,
      accessor: (row) => row.meta?.payment_status || 'pending',
    },
    {
      key: 'fulfillment_status',
      header: 'Fulfillment',
      render: (row) => <Badge variant={String(row.meta?.fulfillment_status || row.status || 'pending') === 'delivered' ? 'success' : String(row.meta?.fulfillment_status || row.status || 'pending') === 'cancelled' ? 'error' : 'info'}>{row.meta?.fulfillment_status || row.status || 'pending'}</Badge>,
      accessor: (row) => row.meta?.fulfillment_status || row.status || 'pending',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => <ActionLink href={`/admin/orders/${row.id}`} label="Abrir" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-[var(--admin-primary)] text-white' : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'}`}>
            {item === 'all' ? 'Todos' : item}
          </button>
        ))}
      </div>
      <SearchInput placeholder="Buscar por pedido o email de cliente" value={search} onChange={setSearch} />
      <DataTable rows={filteredRows} columns={columns} search={search} searchKeys={['id']} pageSize={12} />
    </div>
  );
}

export function UsersTableView({ rows }: { rows: UserRow[] }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');

  const filteredRows = useMemo(() => rows.filter((row) => role === 'all' || String(row.role) === role), [role, rows]);
  const bulkActions: DataTableBulkAction<UserRow>[] = [
    {
      id: 'ban',
      label: 'Ban selected',
      variant: 'danger',
      onClick: async (selected) => {
        await Promise.all(selected.map((row) => postJson(`/api/admin/customers/users/${row.id}/ban`, { action: 'ban' })));
        toast.success('Usuarios bloqueados');
        window.location.reload();
      },
    },
  ];

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: 'avatar',
      header: 'Avatar',
      render: (row) => row.avatar_url ? <img src={row.avatar_url} alt={row.full_name || row.email} className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(108,99,255,0.18)] text-sm font-semibold text-[var(--admin-accent)]">{String(row.email || '?').slice(0, 1).toUpperCase()}</div>,
    },
    {
      key: 'full_name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{row.full_name || 'Sin nombre'}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{row.email}</p>
        </div>
      ),
      accessor: (row) => row.full_name || row.email,
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge variant={row.role === 'admin' ? 'info' : row.role === 'banned' ? 'error' : 'default'}>{row.role}</Badge>,
      accessor: (row) => row.role,
    },
    {
      key: 'created_at',
      header: 'Join Date',
      sortable: true,
      render: (row) => row.created_at ? toDateTimeLabel(row.created_at) : '—',
      accessor: (row) => row.created_at || '',
    },
    {
      key: 'last_login_at',
      header: 'Last Login',
      render: (row) => row.last_login_at ? toDateTimeLabel(row.last_login_at) : '—',
      accessor: (row) => row.last_login_at || '',
    },
    { key: 'orders_count', header: 'Orders', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'banned' ? 'error' : 'success'}>{row.status}</Badge>,
      accessor: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => <ActionLink href={`/admin/users/${row.id}`} label="Gestionar" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <SearchInput placeholder="Buscar por nombre o email" value={search} onChange={setSearch} />
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none">
          <option value="all">Todos los roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      <DataTable rows={filteredRows} columns={columns} bulkActions={bulkActions} search={search} searchKeys={['full_name', 'email']} pageSize={12} />
    </div>
  );
}

export function MessagesTableView({ rows }: { rows: MessageRow[] }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const filteredRows = useMemo(() => rows.filter((row) => tab === 'all' || String(row.status) === tab), [rows, tab]);
  const tabs = ['all', 'pending_review', 'approved', 'rejected'];

  const bulkActions: DataTableBulkAction<MessageRow>[] = [
    {
      id: 'approve',
      label: 'Approve selected',
      onClick: async (selected) => {
        await postJson('/api/admin/messages', { action: 'approve', ids: selected.map((row) => row.id) });
        toast.success('Mensajes aprobados');
        window.location.reload();
      },
    },
    {
      id: 'reject',
      label: 'Reject selected',
      variant: 'danger',
      onClick: async (selected) => {
        await postJson('/api/admin/messages', { action: 'reject', ids: selected.map((row) => row.id), reason: 'Revisión masiva desde admin' });
        toast.success('Mensajes rechazados');
        window.location.reload();
      },
    },
  ];

  const columns: DataTableColumn<MessageRow>[] = [
    { key: 'date', header: 'Date', render: (row) => toDateTimeLabel(row.date), accessor: (row) => row.date },
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-medium">{row.user?.full_name || row.user?.email || 'Anónimo'}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{row.user?.email || 'Sin cuenta'}</p>
        </div>
      ),
      accessor: (row) => row.user?.email || '',
    },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'preview', header: 'Message Preview', render: (row) => truncate(String(row.preview || ''), 80) },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'error' : 'warning'}>{row.status}</Badge>, accessor: (row) => row.status },
    { key: 'actions', header: 'Actions', render: (row) => <ActionLink href={`/admin/messages?ticket=${row.id}`} label="Revisar" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-[var(--admin-primary)] text-white' : 'border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)]'}`}>
            {item === 'all' ? 'Todos' : item}
          </button>
        ))}
      </div>
      <SearchInput placeholder="Buscar por asunto o usuario" value={search} onChange={setSearch} />
      <DataTable rows={filteredRows} columns={columns} bulkActions={bulkActions} search={search} searchKeys={['title', 'preview']} pageSize={12} />
    </div>
  );
}

export function EmailLogsTableView({ rows }: { rows: EmailLogRecord[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const filteredRows = useMemo(() => rows.filter((row) => status === 'all' || row.status === status), [rows, status]);

  const columns: DataTableColumn<EmailLogRecord>[] = [
    { key: 'sent_at', header: 'Date', render: (row) => toDateTimeLabel(row.sent_at), accessor: (row) => row.sent_at },
    { key: 'recipient_email', header: 'Recipient', sortable: true },
    { key: 'subject', header: 'Subject', render: (row) => truncate(row.subject, 80), accessor: (row) => row.subject },
    { key: 'template_name', header: 'Template', render: (row) => row.template_name || 'Custom', accessor: (row) => row.template_name || '' },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'sent' ? 'success' : row.status === 'failed' ? 'error' : 'warning'}>{row.status}</Badge>, accessor: (row) => row.status },
    { key: 'error_message', header: 'Error', render: (row) => row.error_message ? truncate(row.error_message, 60) : '—', accessor: (row) => row.error_message || '' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => row.status === 'failed' ? (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)]"
          onClick={async () => {
            await postJson('/api/admin/emails/send', { retryLogId: row.id });
            toast.success('Reintento en cola');
          }}
        >
          <Mail className="h-3.5 w-3.5" /> Reintentar
        </button>
      ) : '—',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <SearchInput placeholder="Buscar por destinatario o asunto" value={search} onChange={setSearch} />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none">
          <option value="all">Todos los estados</option>
          <option value="sent">Enviados</option>
          <option value="failed">Fallidos</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>
      <DataTable rows={filteredRows} columns={columns} search={search} searchKeys={['recipient_email', 'subject']} pageSize={12} />
    </div>
  );
}

export function ErrorsTableView({ rows }: { rows: ErrorLogRecord[] }) {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const filteredRows = useMemo(() => rows.filter((row) => severity === 'all' || row.severity === severity), [rows, severity]);

  const columns: DataTableColumn<ErrorLogRecord>[] = [
    { key: 'created_at', header: 'Timestamp', render: (row) => toDateTimeLabel(row.created_at), accessor: (row) => row.created_at },
    { key: 'severity', header: 'Severity', render: (row) => <Badge variant={row.severity === 'critical' ? 'error' : row.severity === 'warning' ? 'warning' : row.severity === 'info' ? 'info' : 'default'}>{row.severity}</Badge>, accessor: (row) => row.severity },
    { key: 'url', header: 'URL', render: (row) => row.url || '—', accessor: (row) => row.url || '' },
    { key: 'user_id', header: 'User', render: (row) => row.user_id || '—', accessor: (row) => row.user_id || '' },
    { key: 'message', header: 'Message Preview', render: (row) => truncate(row.message, 90), accessor: (row) => row.message },
    { key: 'resolved', header: 'Resolved', render: (row) => <Badge variant={row.resolved ? 'success' : 'warning'}>{row.resolved ? 'Sí' : 'No'}</Badge>, accessor: (row) => String(row.resolved) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {!row.resolved ? (
            <button
              type="button"
              className="rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)]"
              onClick={async () => {
                await patchJson(`/api/admin/errors/${row.id}`, { resolved: true });
                toast.success('Error marcado como resuelto');
                window.location.reload();
              }}
            >
              Resolver
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-xl border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold text-[var(--admin-text)]"
            onClick={async () => {
              await navigator.clipboard.writeText(row.stack_trace || row.message);
              toast.success('Stack copiado');
            }}
          >
            Copiar stack
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <SearchInput placeholder="Buscar por mensaje o URL" value={search} onChange={setSearch} />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text)] outline-none">
          <option value="all">Todas las severidades</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
      <DataTable rows={filteredRows} columns={columns} search={search} searchKeys={['message', 'url']} pageSize={12} />
    </div>
  );
}
