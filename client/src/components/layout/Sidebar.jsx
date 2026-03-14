import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ClipboardList,
  History,
  Settings,
  Warehouse,
  Activity,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  {
    label: 'Operations',
    children: [
      { label: 'Receipts', path: '/operations/receipts', icon: ArrowDownToLine },
      { label: 'Deliveries', path: '/operations/deliveries', icon: ArrowUpFromLine },
      { label: 'Transfers', path: '/operations/transfers', icon: ArrowLeftRight },
      { label: 'Adjustments', path: '/operations/adjustments', icon: ClipboardList },
    ],
  },
  { label: 'Move History', path: '/move-history', icon: History },
  { label: 'Warehouse Stock', path: '/warehouse-stock', icon: Warehouse },
  { label: 'Activity Log', path: '/activity-log', icon: Activity },
  { label: 'Settings', path: '/settings', icon: Settings, managerOnly: true },
];

export default function Sidebar({ open, onToggle, className = '' }) {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white/15 text-white shadow-lg shadow-white/5'
        : 'text-white/50 hover:bg-white/8 hover:text-white/80'
    }`;

  return (
    <aside
      className={`${
        open ? 'w-72' : 'w-0 overflow-hidden'
      } flex flex-col gradient-sidebar transition-all duration-300 relative ${className}`}
    >
      {/* Decorative blurs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />

      {/* Logo */}
      <div className="flex items-center justify-between p-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">Core Inventory</span>
            <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Management System</p>
          </div>
        </div>
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft className="h-4 w-4 text-white/50" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 relative z-10 mt-2">
        {navItems
          .filter((item) => !item.managerOnly || user?.role === 'INVENTORY_MANAGER')
          .map((item) =>
          item.children ? (
            <div key={item.label} className="mt-6 mb-2">
              <p className="px-3 mb-2 text-[11px] font-semibold text-white/25 uppercase tracking-[0.15em]">
                {item.label}
              </p>
              <div className="space-y-0.5">
                {item.children.map((child) => (
                  <NavLink key={child.path} to={child.path} className={linkClass}>
                    <child.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{child.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink key={item.path} to={item.path} className={linkClass}>
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* User section */}
      <div className="relative z-10 p-4 mx-4 mb-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <NavLink
            to="/profile"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <User className="h-3.5 w-3.5" /> Profile
          </NavLink>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
