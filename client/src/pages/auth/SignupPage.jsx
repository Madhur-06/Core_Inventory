import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Package, ArrowRight, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'WAREHOUSE_STAFF' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-green-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Package className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Core Inventory</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Join the modern way<br />to manage
            <span className="bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent"> inventory</span>
          </h1>
          <p className="text-lg text-white/60 max-w-md">
            Get started in minutes. Track stock, manage warehouses, and streamline operations — all from one place.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'].map((bg, i) => (
                <div key={i} className={`h-10 w-10 rounded-full ${bg} border-2 border-white/20 flex items-center justify-center text-xs font-bold`}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium">Trusted by teams</p>
              <p className="text-xs text-white/50">Join inventory managers worldwide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
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
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Start managing your inventory today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2 animate-scale-in border border-red-100">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                >
                  <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager</option>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
