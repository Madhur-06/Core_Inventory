import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate, statusColors, operationTypeLabels } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle } from 'lucide-react';

export default function OperationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: op, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => api.get(`/operations/${id}`).then((r) => r.data),
  });

  // Fetch current stock levels for the source location (for deliveries/transfers)
  const sourceLocationId = op?.sourceLocationId;
  const needsStockCheck = op && (op.type === 'DELIVERY' || op.type === 'TRANSFER') && op.status !== 'DONE' && op.status !== 'CANCELLED';
  const { data: stockLevels } = useQuery({
    queryKey: ['stock-levels', sourceLocationId],
    queryFn: () => api.get(`/products?locationId=${sourceLocationId}&limit=500`).then((r) => r.data),
    enabled: !!needsStockCheck && !!sourceLocationId,
    refetchInterval: needsStockCheck ? 10000 : false, // refresh every 10s for pending ops
  });

  // Build a map of productId → current stock at source location
  const stockMap = {};
  if (stockLevels?.products) {
    stockLevels.products.forEach((p) => {
      const sl = p.stockLevels?.find((s) => s.locationId === sourceLocationId);
      stockMap[p.id] = sl?.quantity ?? 0;
    });
  }

  const validateMutation = useMutation({
    mutationFn: () => api.post(`/operations/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Operation validated — stock updated');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Validation failed', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/operations/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      addToast('Operation cancelled');
    },
    onError: (err) => addToast(err.response?.data?.error || 'Cancel failed', 'error'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!op) return <div className="p-8 text-center">Operation not found</div>;

  const canValidate = op.status !== 'DONE' && op.status !== 'CANCELLED';
  const canCancel = op.status !== 'DONE' && op.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{op.referenceNumber}</h1>
            <Badge className={statusColors[op.status]}>{op.status}</Badge>
          </div>
          <p className="text-muted-foreground">{operationTypeLabels[op.type]}</p>
        </div>
        <div className="flex gap-2">
          {canValidate && (
            <Button
              onClick={() => { if (confirm('Validate this operation? Stock will be updated.')) validateMutation.mutate(); }}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? 'Validating...' : 'Validate'}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => { if (confirm('Cancel this operation?')) cancelMutation.mutate(); }}
              disabled={cancelMutation.isPending}
            >
              Cancel Operation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {op.supplierName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Supplier</dt>
                  <dd className="font-medium">{op.supplierName}</dd>
                </div>
              )}
              {op.customerName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="font-medium">{op.customerName}</dd>
                </div>
              )}
              {op.sourceLocation && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium">{op.sourceLocation.warehouse?.name} → {op.sourceLocation.name}</dd>
                </div>
              )}
              {op.destinationLocation && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Destination</dt>
                  <dd className="font-medium">{op.destinationLocation.warehouse?.name} → {op.destinationLocation.name}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created By</dt>
                <dd className="font-medium">{op.creator?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(op.createdAt)}</dd>
              </div>
              {op.validatedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Validated</dt>
                  <dd className="font-medium">{formatDate(op.validatedAt)}</dd>
                </div>
              )}
              {op.notes && (
                <div>
                  <dt className="text-muted-foreground mb-1">Notes</dt>
                  <dd className="font-medium">{op.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                  {needsStockCheck && <TableHead>Current Stock</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {op.lines?.map((line) => {
                  const currentStock = stockMap[line.productId];
                  const needed = line.actualQty ?? line.expectedQty;
                  const insufficient = needsStockCheck && currentStock !== undefined && currentStock < needed;
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{line.product?.name}</p>
                          <p className="text-xs text-gray-500">{line.product?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{line.expectedQty}</TableCell>
                      <TableCell>{line.actualQty ?? '—'}</TableCell>
                      {needsStockCheck && (
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={insufficient ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                              {currentStock ?? '—'}
                            </span>
                            {insufficient && (
                              <span className="flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle className="h-3.5 w-3.5" /> Low
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
