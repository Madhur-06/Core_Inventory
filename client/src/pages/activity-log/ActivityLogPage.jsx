import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, User, Clock, Filter } from 'lucide-react';
import api from '../../lib/api';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Pagination from '../../components/shared/Pagination';

const actionColors = {
  LOGIN: 'bg-blue-50 text-blue-700 border border-blue-100',
  CREATE: 'bg-green-50 text-green-700 border border-green-100',
  UPDATE: 'bg-amber-50 text-amber-700 border border-amber-100',
  DELETE: 'bg-red-50 text-red-700 border border-red-100',
  VALIDATE: 'bg-purple-50 text-purple-700 border border-purple-100',
  BULK_IMPORT: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  BULK_ADJUSTMENT: 'bg-orange-50 text-orange-700 border border-orange-100',
};

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, entityFilter],
    queryFn: () =>
      api.get('/activity-logs', {
        params: { page, limit: 20, entityType: entityFilter || undefined },
      }).then((r) => r.data),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 mt-1">Complete audit trail of all system actions</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              className="w-48 rounded-xl bg-gray-50"
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              <option value="User">User</option>
              <option value="Product">Product</option>
              <option value="StockOperation">Operations</option>
              <option value="StockLevel">Stock Levels</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="space-y-3">
            {data?.logs?.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow animate-slide-up"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-gray-100 mt-0.5">
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${actionColors[log.action] || 'bg-gray-50 text-gray-700'}`}>
                        {log.action}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.entityType}
                      </Badge>
                    </div>
                    {log.details && (
                      <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user?.name} ({log.user?.role?.replace('_', ' ')})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data?.logs?.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Activity className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No activity logs found</p>
              </div>
            )}
          </div>
          <Pagination page={page} limit={20} total={data?.total || 0} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
