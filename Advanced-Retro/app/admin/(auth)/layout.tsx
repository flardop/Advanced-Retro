export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">{children}</div>;
}
