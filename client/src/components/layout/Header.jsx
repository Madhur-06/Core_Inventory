import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Badge } from '../ui/Badge';

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  const { data: alertData } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
    refetchInterval: 60000,
  });

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Alerts */}
        <div className="relative">
          <button
            onClick={() => { setShowAlerts(!showAlerts); setShowUserMenu(false); }}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {alertData?.count > 0 && (
              <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full gradient-danger text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse-soft">
                {alertData.count}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-14 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="font-semibold text-sm">Alerts</span>
                {alertData?.count > 0 && (
                  <Badge className="gradient-danger text-white text-xs">{alertData.count}</Badge>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alertData?.alerts?.length > 0 ? (
                  alertData.alerts.map((alert) => (
                    <div key={alert.id} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 cursor-pointer text-sm transition-colors"
                      onClick={() => { navigate(`/products`); setShowAlerts(false); }}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{alert.name}</span>
                        <Badge className={`text-xs ${alert.alert_type === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                          {alert.alert_type === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mt-1.5">
                        Stock: <span className="font-mono font-medium text-gray-600">{alert.total_stock}</span> / Reorder at: <span className="font-mono font-medium text-gray-600">{alert.reorder_point}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">All clear — no alerts</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowAlerts(false); }}
            className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-14 w-52 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-in">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <User className="h-4 w-4 text-gray-400" /> My Profile
                </button>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
