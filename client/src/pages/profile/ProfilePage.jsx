import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '' });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data),
  });

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, name: profile.name }));
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/profile', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Update local storage
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      sessionStorage.setItem('user', JSON.stringify({ ...stored, name: res.data.name }));
      addToast('Profile updated');
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    },
    onError: (err) => addToast(err.response?.data?.error || 'Update failed', 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name: form.name };
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }
    mutation.mutate(payload);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>{profile?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge className="mt-1" variant="outline">{profile?.role?.replace('_', ' ')}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edit Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Change Password (optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Current Password</label>
                  <Input
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">New Password</label>
                  <Input
                    type="password"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
