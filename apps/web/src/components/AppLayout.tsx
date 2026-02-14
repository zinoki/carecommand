import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/recruiting', label: 'Recruiting' },
  { to: '/app/caregivers', label: 'Caregivers' },
  { to: '/app/compliance', label: 'Compliance' },
  { to: '/app/tasks', label: 'Tasks' },
  { to: '/app/reports', label: 'Reports' },
];

export function AppLayout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="font-semibold text-lg">CareCommand</h1>
          {tenant && <p className="text-sm text-slate-400 truncate">{tenant.name}</p>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <NavLink
            to="/app/settings/profile"
            className="block text-sm text-slate-400 hover:text-white mb-2"
          >
            Profile
          </NavLink>
          {tenant && (
            <NavLink
              to="/app/settings/organization"
              className="block text-sm text-slate-400 hover:text-white mb-2"
            >
              Organization
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
          <h2 className="text-slate-600 font-medium">CareCommand</h2>
          <span className="text-sm text-slate-500">{user?.email}</span>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
