import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Pagination from '../../components/shared/Pagination';
import ExportButtons from '../../components/shared/ExportButtons';
import { formatDate } from '../../lib/utils';

const moveTypeLabels = {
  IN: { label: 'In', color: 'bg-green-100 text-green-800' },
  OUT: { label: 'Out', color: 'bg-red-100 text-red-800' },
  ADJUSTMENT: { label: 'Adjustment', color: 'bg-blue-100 text-blue-800' },
  TRANSFER_IN: { label: 'Transfer In', color: 'bg-purple-100 text-purple-800' },
  TRANSFER_OUT: { label: 'Transfer Out', color: 'bg-orange-100 text-orange-800' },
};

export default function MoveHistoryPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    moveType: '',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['move-history', filters, page],
    queryFn: () =>
      api.get('/move-history', {
        params: {
          page,
          limit: 20,
          ...(filters.moveType && { moveType: filters.moveType }),
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate }),
        },
      }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Move History</h1>
          <p className="text-muted-foreground">Complete stock movement ledger</p>
        </div>
        <ExportButtons endpoint="move-history" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <Select
              className="w-48"
              value={filters.moveType}
              onChange={(e) => { setFilters({ ...filters, moveType: e.target.value }); setPage(1); }}
            >
              <option value="">All Move Types</option>
              <option value="IN">In (Receipt)</option>
              <option value="OUT">Out (Delivery)</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="TRANSFER_IN">Transfer In</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
            </Select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From:</label>
              <Input
                type="date"
                className="w-40"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">To:</label>
              <Input
                type="date"
                className="w-40"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.moves?.map((move) => {
                  const mt = moveTypeLabels[move.moveType] || { label: move.moveType, color: 'bg-gray-100' };
                  return (
                    <TableRow key={move.id}>
                      <TableCell className="text-sm">{formatDate(move.timestamp)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{move.product?.name}</p>
                          <p className="text-xs text-gray-500">{move.product?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {move.location?.warehouse?.name} — {move.location?.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={mt.color}>{mt.label}</Badge>
                      </TableCell>
                      <TableCell className={`font-mono font-medium ${move.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {move.quantityChange > 0 ? '+' : ''}{move.quantityChange}
                      </TableCell>
                      <TableCell className="font-mono">{move.balanceAfter}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {move.operation?.referenceNumber || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{move.creator?.name}</TableCell>
                    </TableRow>
                  );
                })}
                {data?.moves?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No move history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data?.total > 0 && (
        <Pagination page={page} limit={20} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
