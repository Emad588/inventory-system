import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';

export default function IntegrationPage() {
  const { t } = useLang();
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    transactionType: 'all',
    warehouse: '',
  });

  const [warehouses, setWarehouses] = useState([]);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await api.get('/warehouses');
        setWarehouses(response.data.warehouses || []);
      } catch (error) {
        toast.error('Failed to load warehouses');
      }
    };
    fetchWarehouses();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.transactionType !== 'all') params.append('type', filters.transactionType);
    if (filters.warehouse) params.append('warehouse', filters.warehouse);
    return params.toString();
  };

  const handleJsonExport = async () => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams();
      const url = `/export/json${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url);
      setJsonData(response.data);
      toast.success(t('exportJSON') + ' ✓');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvExport = async () => {
    setLoading(true);
    try {
      const queryParams = buildQueryParams();
      const url = `/export/csv${queryParams ? '?' + queryParams : ''}`;
      const response = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t('exportCSV') + ' ✓');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const getApiUrl = () => {
    const baseUrl = window.location.origin;
    const queryParams = buildQueryParams();
    return `${baseUrl}/api/export/json${queryParams ? '?' + queryParams : ''}`;
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(getApiUrl()).then(() => {
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  const recordCount = jsonData?.data?.length || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('integration')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Export inventory data in MOCI-compatible formats for integration with external systems.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">{t('filters')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateFrom')}</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateTo')}</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('transactionType')}</label>
            <select
              name="transactionType"
              value={filters.transactionType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{t('all') || 'All'}</option>
              <option value="Sale">{t('sale')}</option>
              <option value="Return">{t('return')}</option>
              <option value="Transfer">{t('transfer')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('warehouse')}</label>
            <select
              name="warehouse"
              value={filters.warehouse}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('all') || 'All'}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.warehouseName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleJsonExport}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
          >
            {loading ? t('loading') : t('exportJSON')}
          </button>

          <button
            onClick={handleCsvExport}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? t('loading') : t('exportCSV')}
          </button>

          <button
            onClick={handleCopyApiUrl}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
          >
            {copied ? '✓ Copied' : t('apiEndpoint')}
          </button>
        </div>
      </div>

      {/* JSON Export Result */}
      {jsonData && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            {t('export')} ({recordCount} records)
          </h2>

          {recordCount > 0 && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Found: <span className="font-bold">{recordCount}</span> records
              </p>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
            <pre className="text-gray-100 text-xs font-mono">
              {JSON.stringify(jsonData.data?.slice(0, 5), null, 2)}
            </pre>
            {recordCount > 5 && (
              <p className="text-gray-400 text-xs mt-2">
                Showing 5 of {recordCount} records
              </p>
            )}
          </div>
        </div>
      )}

      {/* API Endpoint Section */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h2 className="text-base font-semibold text-gray-800 mb-3">{t('apiEndpoint')}</h2>

        <div className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between gap-3">
          <code className="text-xs text-gray-800 break-all flex-1">{getApiUrl()}</code>
          <button
            onClick={handleCopyApiUrl}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 whitespace-nowrap"
          >
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
