import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { ROLE_LABELS } from '../utils/messages.js';

const NAV = {
  admin: [
    { to: '/residents', label: 'Người cao tuổi' },
    { to: '/admin/approvals', label: 'Yêu cầu lưu trữ' },
    { to: '/admin/users', label: 'Tài khoản' },
    { to: '/admin/audit', label: 'Nhật ký' },
  ],
  operator: [{ to: '/residents', label: 'Người cao tuổi' }],
  relative: [{ to: '/family', label: 'Người thân của tôi' }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="menu-toggle" aria-label="Mở menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>☰</button>
        <span className="brand">EC-RMS</span>
        <div className="topbar-user">
          <span className="user-name">{user.full_name}</span>
          <span className="badge">{ROLE_LABELS[user.role]}</span>
          <button className="btn btn-link" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>

      <nav className={menuOpen ? 'sidebar open' : 'sidebar'} onClick={() => setMenuOpen(false)}>
        {NAV[user.role].map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link">{item.label}</NavLink>
        ))}
      </nav>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
