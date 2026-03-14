import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import { ProductDetailSkeleton } from '../../components/shared/SkeletonLoader';
import { useState } from 'react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historyPeriod, setHistoryPeriod] = useState('30');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const { data: stockHistory } = useQuery({
    queryKey: ['product-stock-history', id, historyPeriod],
    queryFn: () => api.get(`/analytics/product-stock-history/${id}`, { params: { period: historyPeriod } }).then(r => r.data),
  });

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <div className="p-8 text-center">Product not found</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Products', href: '/products' }, { label: product.name }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground font-mono">{product.sku}</p>
        </div>
        <Button onClick={() => navigate(`/products/${id}/edit`)}>Edit Product</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">{product.category?.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unit of Measure</dt>
                <dd className="font-medium">{product.unitOfMeasure}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reorder Point</dt>
                <dd className="font-medium">{product.reorderPoint}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reorder Quantity</dt>
                <dd className="font-medium">{product.reorderQty}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="font-medium">{product.description || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-center">{product.totalStock}</p>
            <p className="text-sm text-center text-muted-foreground mt-1">{product.unitOfMeasure}</p>
            {product.totalStock <= product.reorderPoint && product.reorderPoint > 0 && (
              <Badge className="mt-3 mx-auto block w-fit bg-orange-100 text-orange-800">
                Below reorder point
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock per location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reserved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.stockLevels?.map((sl) => (
                <TableRow key={sl.id}>
                  <TableCell>{sl.location?.warehouse?.name}</TableCell>
                  <TableCell>{sl.location?.name}</TableCell>
                  <TableCell className="font-medium">{sl.quantity}</TableCell>
                  <TableCell>{sl.reservedQty}</TableCell>
                </TableRow>
              ))}
              {product.stockLevels?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No stock records
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock History Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Stock Level History</CardTitle>
            <select value={historyPeriod} onChange={(e) => setHistoryPeriod(e.target.value)} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {stockHistory?.history?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stockHistory.history.map(h => ({ date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), balance: h.balance }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f0f0f0)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--chart-text, #9ca3af)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text, #9ca3af)' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--chart-border, #e5e7eb)', background: 'var(--chart-tooltip-bg, #fff)', color: 'var(--chart-tooltip-text, #111)' }} />
                <Line type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-300 dark:text-gray-600">
              <p className="text-sm">No stock movement data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
