import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Warehouse, MapPin, Package, AlertTriangle, Search } from 'lucide-react';
import api from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

export default function WarehouseStockPage() {
  const navigate = useNavigate();
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then((r) => r.data),
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['warehouse-stock', warehouseFilter],
    queryFn: () =>
      api.get('/warehouse-stock', { params: { warehouseId: warehouseFilter || undefined } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  // Filter by search
  const filterProducts = (products) => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Warehouse Stock</h1>
          <p className="text-gray-500 mt-1">View stock levels across all warehouses and locations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 rounded-xl bg-gray-50 border-gray-200"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          className="w-56 rounded-xl bg-gray-50 border-gray-200"
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {warehouses?.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
      </div>

      {/* Warehouse Cards */}
      {stockData?.length > 0 ? (
        stockData.map((wh) => (
          <div key={wh.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
            {/* Warehouse Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl gradient-primary shadow-lg shadow-primary/20">
                    <Warehouse className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{wh.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">{wh.code}</Badge>
                      <span className="text-sm text-gray-400">{wh.locations.length} locations</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">{wh.totalItems}</p>
                    <p className="text-xs text-gray-400 font-medium">Products</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-primary">{wh.totalQuantity}</p>
                    <p className="text-xs text-gray-400 font-medium">Total Units</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Locations */}
            {wh.locations.map((loc) => {
              const filtered = filterProducts(loc.products);
              if (search && filtered.length === 0) return null;

              return (
                <div key={loc.id} className="border-b border-gray-50 last:border-0">
                  <div className="px-6 py-3 bg-gray-50/50 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-sm text-gray-700">{loc.name}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{loc.code}</Badge>
                    <span className="text-xs text-gray-400 ml-auto">{filtered.length} products</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent">
                        <TableHead className="font-semibold text-xs">Product</TableHead>
                        <TableHead className="font-semibold text-xs">SKU</TableHead>
                        <TableHead className="font-semibold text-xs">Category</TableHead>
                        <TableHead className="font-semibold text-xs">Unit</TableHead>
                        <TableHead className="font-semibold text-xs text-center">Available</TableHead>
                        <TableHead className="font-semibold text-xs text-center">Reserved</TableHead>
                        <TableHead className="font-semibold text-xs text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((product) => {
                        const isLow = product.reorderPoint > 0 && product.quantity <= product.reorderPoint;
                        const isOut = product.quantity === 0;
                        return (
                          <TableRow
                            key={product.id}
                            className="cursor-pointer hover:bg-primary/[0.02] transition-colors"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-500">{product.sku}</TableCell>
                            <TableCell className="text-sm text-gray-500">{product.category || '—'}</TableCell>
                            <TableCell className="text-sm text-gray-500">{product.unitOfMeasure}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold text-lg ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-gray-900'}`}>
                                {product.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-400">
                              {product.reservedQty || 0}
                            </TableCell>
                            <TableCell className="text-center">
                              {isOut ? (
                                <Badge className="bg-red-50 text-red-700 border border-red-100 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Out
                                </Badge>
                              ) : isLow ? (
                                <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Low
                                </Badge>
                              ) : (
                                <Badge className="bg-green-50 text-green-700 border border-green-100 text-xs">
                                  In Stock
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        ))
      ) : (
        <EmptyState
          icon={Warehouse}
          title="No stock data found"
          description="Stock will appear here once products are received into warehouse locations"
        />
      )}
    </div>
  );
}
