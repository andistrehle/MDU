import { AdminSidebar } from '@/components/mdu/admin-sidebar';
import { Icon } from '@/components/mdu/icon';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#05070A' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 70, padding: '0 30px', background: '#0D1117',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#05070A', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '10px 14px', flex: 1, maxWidth: 360,
          }}>
            <Icon name="search" size={15} style={{ color: '#5A5F6C' }} />
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#5A5F6C' }}>Suchen… </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#5A5F6C', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9AA4B2' }}>
              <Icon name="bell" size={16} />
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9AA4B2' }}>
              <Icon name="settings" size={16} />
            </div>
          </div>
        </div>

        <main style={{ flex: 1, padding: '24px 30px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
