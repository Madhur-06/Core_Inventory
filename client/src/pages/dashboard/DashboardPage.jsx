import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, DollarSign, BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import KPICard from '../../components/shared/KPICard';
import { DashboardSkeleton } from '../../components/shared/SkeletonLoader';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { formatDate, statusColors, operationTypeLabels } from '../../lib/utils';
import { useState } from 'react';
import { Select } from '../../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: '', status: '', warehouse: '', location: '' });
  const [chartPeriod, setChartPeriod] = useState('30');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', dateRange.from, dateRange.to],
    queryFn: () => api.get('/dashboard', { params: { dateFrom: dateRange.from || undefined, dateTo: dateRange.to || undefined } }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', chartPeriod],
    queryFn: () => api.get('/analytics/stock-movements', { params: { period: chartPeriod } }).then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: valuation } = useQuery({
    queryKey: ['valuation'],
    queryFn: () => api.get('/analytics/valuation').then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((r) => r.data),
  });

  if (isLoading) return <DashboardSkeleton />;

  const filteredOps = data?.recentOperations?.filter((op) => {
    if (filters.type && op.type !== filters.type) return false;
    if (filters.status && op.status !== filters.status) return false;
    if (filters.warehouse) {
      const srcWh = op.sourceLocation?.warehouse?.id;
      const destWh = op.destinationLocation?.warehouse?.id;
      if (srcWh !== filters.warehouse && destWh !== filters.warehouse) return false;
    }
    if (filters.location) {
      const srcLoc = op.sourceLocationId;
      const destLoc = op.destinationLocationId;
      if (srcLoc !== filters.location && destLoc !== filters.location) return false;
    }
    return true;
  }) || [];

  const selectedWarehouse = warehouses?.find(w => w.id === filters.warehouse);

  const totalValue = valuation?.warehouseValuation?.find((v) => v.warehouse_name === 'Total');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'INVENTORY_MANAGER' ? 'Full inventory overview' : 'Your operations overview'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live · Auto-refreshing
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'Today', fn: () => { const d = new Date().toISOString().split('T')[0]; setDateRange({ from: d, to: d }); }},
              { label: '7 Days', fn: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 7); setDateRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }); }},
              { label: '30 Days', fn: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 30); setDateRange({ from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }); }},
              { label: 'All', fn: () => setDateRange({ from: '', to: '' }) },
            ].map(({ label, fn }) => (
              <button key={label} onClick={fn} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
                {label}
              </button>
            ))}
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange(r => ({ ...r, from: e.target.value }))} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange(r => ({ ...r, to: e.target.value }))} className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
            <button
              onClick={() => {
                const month = dateRange.from ? dateRange.from.substring(0, 7) : new Date().toISOString().substring(0, 7);
                const token = sessionStorage.getItem('accessToken');
                fetch(`http://localhost:5000/api/export/monthly-report?month=${month}&format=pdf`, {
                  headers: { Authorization: `Bearer ${token}` }
                }).then(r => r.blob()).then(blob => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `inventory-report-${month}.pdf`;
                  a.click(); URL.revokeObjectURL(url);
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Download monthly report"
            >
              <Download className="h-3.5 w-3.5" /> Report
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <KPICard title="Total Products" value={data?.kpis?.totalProducts || 0} icon={Package} gradient="gradient-primary" />
        <KPICard
          title="Low / Out of Stock"
          value={data?.kpis?.lowStockItems || 0}
          icon={AlertTriangle}
          gradient={data?.kpis?.lowStockItems > 0 ? 'gradient-warning' : 'gradient-success'}
        />
        <KPICard title="Pending Receipts" value={data?.kpis?.pendingReceipts || 0} icon={ArrowDownToLine} gradient="gradient-info" />
        <KPICard title="Pending Deliveries" value={data?.kpis?.pendingDeliveries || 0} icon={ArrowUpFromLine} gradient="gradient-danger" />
        <KPICard
          title="Inventory Value"
          value={totalValue ? `$${Number(totalValue.total_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0'}
          icon={DollarSign}
          gradient="gradient-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Moving Products */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Moving Products</h3>
              <p className="text-sm text-gray-400">Most active in the last {chartPeriod} days</p>
            </div>
            <Select
              className="w-32 rounded-xl text-sm h-9 bg-gray-50"
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </Select>
          </div>
          {analytics?.topMovers?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.topMovers.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--chart-text, #9ca3af)' }} stroke="var(--chart-text, #9ca3af)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-text, #9ca3af)' }} stroke="var(--chart-text, #9ca3af)" width={120} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--chart-border, #e5e7eb)', background: 'var(--chart-tooltip-bg, #fff)', color: 'var(--chart-tooltip-text, #111)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                <Bar dataKey="total_volume" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-300">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">No movement data yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown Pie */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Stock by Category</h3>
          <p className="text-sm text-gray-400 mb-4">Distribution overview</p>
          {analytics?.categoryBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    dataKey="total_stock"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                  >
                    {analytics.categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--chart-border, #e5e7eb)', background: 'var(--chart-tooltip-bg, #fff)', color: 'var(--chart-tooltip-text, #111)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {analytics.categoryBreakdown.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{cat.category}</span>
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{cat.total_stock}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-100 dark:border-amber-800/40 p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl gradient-warning">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Low Stock Alerts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.lowStockProducts.length} products need attention</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-amber-100 dark:border-amber-800/40 rounded-xl cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                onClick={() => navigate(`/products`)}
              >
                <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                <Badge className={`text-xs font-bold ${p.total_stock === 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                  {p.total_stock} / {p.reorder_point}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + Recent Operations */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Operations</h3>
            <p className="text-sm text-gray-400 mt-0.5">{filteredOps.length} operations</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              className="w-40 rounded-xl text-sm h-9 bg-gray-50 border-gray-200"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="RECEIPT">Receipts</option>
              <option value="DELIVERY">Deliveries</option>
              <option value="TRANSFER">Transfers</option>
              <option value="ADJUSTMENT">Adjustments</option>
            </Select>
            <Select
              className="w-40 rounded-xl text-sm h-9 bg-gray-50 border-gray-200"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Select
              className="w-44 rounded-xl text-sm h-9 bg-gray-50 border-gray-200"
              value={filters.warehouse}
              onChange={(e) => setFilters({ ...filters, warehouse: e.target.value, location: '' })}
            >
              <option value="">All Warehouses</option>
              {warehouses?.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </Select>
            <Select
              className="w-44 rounded-xl text-sm h-9 bg-gray-50 border-gray-200"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              disabled={!filters.warehouse}
            >
              <option value="">All Locations</option>
              {selectedWarehouse?.locations?.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Reference</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Items</TableHead>
              <TableHead className="font-semibold">Created By</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOps.map((op, idx) => (
              <TableRow
                key={op.id}
                className="cursor-pointer hover:bg-primary/[0.02] transition-colors"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/operations/${op.id}`)}
              >
                <TableCell className="font-mono text-sm font-semibold text-primary">{op.referenceNumber}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {op.type === 'RECEIPT' && <ArrowDownToLine className="h-3.5 w-3.5 text-green-500" />}
                    {op.type === 'DELIVERY' && <ArrowUpFromLine className="h-3.5 w-3.5 text-red-500" />}
                    {op.type === 'TRANSFER' && <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />}
                    {operationTypeLabels[op.type]}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[op.status]} text-xs font-semibold px-2.5 py-1 rounded-lg`}>{op.status}</Badge>
                </TableCell>
                <TableCell className="text-gray-600">{op._count?.lines || 0} items</TableCell>
                <TableCell className="text-gray-600">{op.creator?.name}</TableCell>
                <TableCell className="text-sm text-gray-400">{formatDate(op.createdAt)}</TableCell>
              </TableRow>
            ))}
            {filteredOps.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No operations found</p>
                  <p className="text-xs text-gray-300 mt-1">Operations will appear here once created</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
