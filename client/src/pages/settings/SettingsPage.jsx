import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, MapPin, ShieldAlert, Users, UserPlus, Warehouse as WarehouseIcon, UserX, UserCheck } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'INVENTORY_MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Settings are only available to Inventory Managers. Contact your manager if you need changes.
        </p>
      </div>
    );
  }

  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('warehouses');
  const [whForm, setWhForm] = useState({ name: '', code: '', address: '' });
  const [editingWh, setEditingWh] = useState(null);
  const [locForm, setLocForm] = useState({ name: '', code: '' });
  const [addingLocTo, setAddingLocTo] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'WAREHOUSE_STAFF' });
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((r) => r.data),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createWhMutation = useMutation({
    mutationFn: (data) => api.post('/warehouses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setWhForm({ name: '', code: '', address: '' });
      addToast('Warehouse created');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed', 'error'),
  });

  const updateWhMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/warehouses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setEditingWh(null);
      setWhForm({ name: '', code: '', address: '' });
      addToast('Warehouse updated');
    },
  });

  const deleteWhMutation = useMutation({
    mutationFn: (id) => api.delete(`/warehouses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast('Warehouse deleted');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed', 'error'),
  });

  const createLocMutation = useMutation({
    mutationFn: ({ whId, data }) => api.post(`/warehouses/${whId}/locations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setLocForm({ name: '', code: '' });
      setAddingLocTo(null);
      addToast('Location created');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed', 'error'),
  });

  const deleteLocMutation = useMutation({
    mutationFn: ({ whId, locId }) => api.delete(`/warehouses/${whId}/locations/${locId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast('Location deleted');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed', 'error'),
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserForm({ name: '', email: '', password: '', role: 'WAREHOUSE_STAFF' });
      addToast('User created successfully');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed to create user', 'error'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast('User deleted');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed to delete user', 'error'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast(res.data.message);
    },
    onError: (err) => addToast(err.response?.data?.error || 'Failed', 'error'),
  });

  const handleWhSubmit = (e) => {
    e.preventDefault();
    if (editingWh) {
      updateWhMutation.mutate({ id: editingWh, data: whForm });
    } else {
      createWhMutation.mutate(whForm);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Settings</h1>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'warehouses'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <WarehouseIcon className="h-4 w-4" /> Warehouses
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users className="h-4 w-4" /> User Management
        </button>
      </div>

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <>
          {/* Warehouse Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{editingWh ? 'Edit Warehouse' : 'Add Warehouse'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWhSubmit} className="flex gap-4">
                <Input placeholder="Name" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} required />
                <Input placeholder="Code (e.g. WH-01)" value={whForm.code} onChange={(e) => setWhForm({ ...whForm, code: e.target.value })} required />
                <Input placeholder="Address" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} />
                <Button type="submit">{editingWh ? 'Update' : <><Plus className="h-4 w-4 mr-1" /> Add</>}</Button>
                {editingWh && (
                  <Button type="button" variant="outline" onClick={() => { setEditingWh(null); setWhForm({ name: '', code: '', address: '' }); }}>
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Warehouse List */}
          {warehouses?.map((wh) => (
            <Card key={wh.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{wh.name}</CardTitle>
                    <Badge variant="outline">{wh.code}</Badge>
                    {!wh.isActive && <Badge className="bg-red-100 text-red-800">Inactive</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setAddingLocTo(addingLocTo === wh.id ? null : wh.id); }}>
                      <MapPin className="h-4 w-4 mr-1" /> Add Location
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingWh(wh.id); setWhForm({ name: wh.name, code: wh.code, address: wh.address || '' }); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setConfirmAction({ title: 'Delete Warehouse', message: 'Are you sure you want to delete this warehouse?', onConfirm: () => { deleteWhMutation.mutate(wh.id); setConfirmAction(null); } }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {wh.address && <p className="text-sm text-muted-foreground">{wh.address}</p>}
              </CardHeader>
              <CardContent>
                {addingLocTo === wh.id && (
                  <form
                    className="flex gap-2 mb-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      createLocMutation.mutate({ whId: wh.id, data: locForm });
                    }}
                  >
                    <Input placeholder="Location name" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} required />
                    <Input placeholder="Code" value={locForm.code} onChange={(e) => setLocForm({ ...locForm, code: e.target.value })} required />
                    <Button type="submit" size="sm">Add</Button>
                  </form>
                )}
                {wh.locations?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wh.locations.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell>{loc.name}</TableCell>
                          <TableCell className="font-mono">{loc.code}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => { setConfirmAction({ title: 'Delete Location', message: 'Are you sure you want to delete this location?', onConfirm: () => { deleteLocMutation.mutate({ whId: wh.id, locId: loc.id }); setConfirmAction(null); } }); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No locations defined</p>
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Create New User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createUserMutation.mutate(userForm);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <Input
                    placeholder="Employee name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <Input
                    type="email"
                    placeholder="employee@company.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <Input
                    type="password"
                    placeholder="Min 6 characters"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Create User
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <LoadingSpinner />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge className={u.role === 'INVENTORY_MANAGER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}>
                            {u.role === 'INVENTORY_MANAGER' ? 'Manager' : 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={u.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {u.id !== user?.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={u.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}
                                title={u.isActive ? 'Disable user' : 'Enable user'}
                                onClick={() => { setConfirmAction({ title: `${u.isActive ? 'Disable' : 'Enable'} User`, message: `Are you sure you want to ${u.isActive ? 'disable' : 'enable'} user "${u.name}"?`, onConfirm: () => { toggleUserMutation.mutate(u.id); setConfirmAction(null); } }); }}
                              >
                                {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                title="Delete user"
                                onClick={() => { setConfirmAction({ title: 'Delete User', message: `Are you sure you want to delete user "${u.name}"?`, onConfirm: () => { deleteUserMutation.mutate(u.id); setConfirmAction(null); } }); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.onConfirm}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
      />
    </div>
  );
}
