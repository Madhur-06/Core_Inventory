import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Pagination from '../../components/shared/Pagination';
import ExportButtons from '../../components/shared/ExportButtons';
import Breadcrumbs from '../../components/shared/Breadcrumbs';
import { TableSkeleton } from '../../components/shared/SkeletonLoader';
import { formatDate, statusColors, operationTypeLabels } from '../../lib/utils';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function OperationListPage({ type }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === 'INVENTORY_MANAGER';
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const label = operationTypeLabels[type] || type;
  const typeLabels = { RECEIPT: 'Receipts', DELIVERY: 'Deliveries', TRANSFER: 'Transfers', ADJUSTMENT: 'Adjustments' };

  const { data, isLoading } = useQuery({
    queryKey: ['operations', type, statusFilter, page],
    queryFn: () =>
      api.get('/operations', { params: { type, status: statusFilter || undefined, page, limit: 15 } }).then((r) => r.data),
  });

  if (isLoading) return <><Breadcrumbs items={[{ label: typeLabels[type] || 'Operations' }]} /><TableSkeleton rows={8} cols={6} /></>;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: typeLabels[type] || 'Operations' }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{label}s</h1>
          <p className="text-muted-foreground">{data?.total || 0} total</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons endpoint="operations" params={{ type }} />
          {(isManager || (type !== 'RECEIPT' && type !== 'DELIVERY')) && (
            <Button onClick={() => navigate(`/operations/new/${type.toLowerCase()}`)}>
              <Plus className="h-4 w-4 mr-2" /> New {label}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select className="w-48" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </CardContent>
      </Card>

      {data?.operations?.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  {type === 'RECEIPT' && <TableHead>Supplier</TableHead>}
                  {type === 'DELIVERY' && <TableHead>Customer</TableHead>}
                  {type === 'TRANSFER' && <><TableHead>From</TableHead><TableHead>To</TableHead></>}
                  <TableHead>Items</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.operations.map((op) => (
                  <TableRow
                    key={op.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/operations/${op.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{op.referenceNumber}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[op.status]}>{op.status}</Badge>
                    </TableCell>
                    {type === 'RECEIPT' && <TableCell>{op.supplierName || '—'}</TableCell>}
                    {type === 'DELIVERY' && <TableCell>{op.customerName || '—'}</TableCell>}
                    {type === 'TRANSFER' && (
                      <>
                        <TableCell>{op.sourceLocation?.name} ({op.sourceLocation?.warehouse?.name})</TableCell>
                        <TableCell>{op.destinationLocation?.name} ({op.destinationLocation?.warehouse?.name})</TableCell>
                      </>
                    )}
                    <TableCell>{op._count?.lines || op.lines?.length || 0}</TableCell>
                    <TableCell>{op.creator?.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(op.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} limit={15} total={data.total} onPageChange={setPage} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title={`No ${label.toLowerCase()}s found`}
          description={`Create your first ${label.toLowerCase()}`}
          action={`New ${label}`}
          onAction={() => navigate(`/operations/new/${type.toLowerCase()}`)}
        />
      )}
    </div>
  );
}
