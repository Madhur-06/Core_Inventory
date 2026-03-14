import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, ArrowRight, Warehouse, BarChart3, Shield, Boxes } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Package className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Core Inventory</span>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight">
                Manage your<br />
                <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                  inventory smarter
                </span>
              </h1>
              <p className="text-lg text-white/60 mt-4 max-w-md">
                Replace spreadsheets with real-time stock tracking, automated workflows, and actionable insights.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Warehouse, label: 'Multi-Warehouse', desc: 'Manage multiple locations' },
                { icon: BarChart3, label: 'Real-time KPIs', desc: 'Live dashboard metrics' },
                { icon: Shield, label: 'Role-based Access', desc: 'Secure permissions' },
                { icon: Boxes, label: 'Stock Tracking', desc: 'Full audit trail' },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <f.icon className="h-5 w-5 text-purple-300 mb-2" />
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs text-white/50">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/30">© 2026 Core Inventory. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 rounded-xl gradient-primary">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">Core Inventory</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-8 border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 animate-scale-in border border-red-100">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@coreinventory.com"
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
              Contact your admin to get an account
            </p>
          </div>

          <p className="text-xs text-center text-gray-400 mt-6">
            Demo: manager@coreinventory.com / password123
          </p>
        </div>
      </div>
    </div>
  );
}
