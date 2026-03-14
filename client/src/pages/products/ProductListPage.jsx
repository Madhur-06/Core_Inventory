import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Package, Upload } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Pagination from '../../components/shared/Pagination';
import ExportButtons from '../../components/shared/ExportButtons';
import BulkImportModal from '../../components/shared/BulkImportModal';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import { TableSkeleton } from '../../components/shared/SkeletonLoader';
import ConfirmModal from '../../components/shared/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const isManager = user?.role === 'INVENTORY_MANAGER';
  const debounceRef = useRef(null);

  // Debounce search input — waits 400ms after typing stops
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, categoryFilter, page],
    queryFn: () =>
      api.get('/products', { params: { search, categoryId: categoryFilter || undefined, page, limit: 15 } }).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast('Product deleted');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Delete failed', 'error'),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    setSearch(searchInput);
    setSearchParams(searchInput ? { search: searchInput } : {});
    setPage(1);
  };

  if (isLoading) return <><Breadcrumbs items={[{ label: 'Products' }]} /><TableSkeleton rows={8} cols={6} /></>;

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Products' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">{data?.total || 0} products in inventory</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons endpoint="products" />
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>
          <Button variant="outline" onClick={() => navigate('/products/categories')}>
            Categories
          </Button>
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onSuccess={(data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            addToast(`Imported: ${data.created} created, ${data.updated} updated`);
          }}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search by name or SKU..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Select className="w-48" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      {data?.products?.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.category?.name || '—'}</TableCell>
                    <TableCell>{product.unitOfMeasure}</TableCell>
                    <TableCell className="font-mono text-sm">${product.costPrice?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.totalStock === 0
                            ? 'bg-red-100 text-red-800'
                            : product.totalStock <= product.reorderPoint
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {product.totalStock}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.reorderPoint}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${product.id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction({ title: 'Delete Product', message: 'Are you sure you want to delete this product?', onConfirm: () => { deleteMutation.mutate(product.id); setConfirmAction(null); } });
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} limit={15} total={data.total} onPageChange={setPage} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Add your first product to get started"
          action="Add Product"
          onAction={() => navigate('/products/new')}
        />
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
