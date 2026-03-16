import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';

export default function AuditPage() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '', entity: '', dateFrom: '', dateTo: '' });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 30 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await api.get('/audit', { params });
      setLogs(res.data.logs);
      setPagination((prev) => ({ ...prev, ...res.data.pagination }));
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatDate = (d) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US');

  const actionColors = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    EXPORT: 'bg-yellow-100 text-yellow-700',
    API_ACCESS: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('auditLogs')}</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All</option>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'API_ACCESS'].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity</label>
            <select value={filters.entity} onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All</option>
              {['User', 'Product', 'Warehouse', 'Transaction', 'SupplierTransaction'].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('dateFrom')}</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('dateTo')}</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setPagination((p) => ({ ...p, page: 1 })); fetchLogs(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700">
              {t('apply')}
            </button>
            <button onClick={() => { setFilters({ action: '', entity: '', dateFrom: '', dateTo: '' }); setPagination((p) => ({ ...p, page: 1 })); }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Entity ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.entity}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.entityId || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.User?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {log.details ? (JSON.stringify(log.details) || '').substring(0, 80) + '...' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              {pagination.total} records — Page {pagination.page}/{pagination.pages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                &laquo;
              </button>
              <button onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-50">
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
