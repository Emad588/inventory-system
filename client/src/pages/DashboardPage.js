import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';

export default function DashboardPage() {
  const { t, dir } = useLang();
  const isRTL = dir === 'rtl';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/summary');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <div className="flex-1">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-red-600 hover:text-red-900 font-medium text-sm flex-shrink-0"
          >
            {t('retry') || 'Retry'}
          </button>
        </div>
      )}

      {/* Stat Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon="📦" title={t('totalProducts')} value={data.totalProducts || 0} />
            <StatCard icon="🏭" title={t('totalWarehouses')} value={data.totalWarehouses || 0} />
            <StatCard icon="📊" title={t('totalTransactions')} value={data.totalTransactions || 0} />
            <StatCard icon="📈" title={t('todayTransactions')} value={data.todayTransactions || 0} highlight />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <RecentTransactionsTable
                transactions={data.recentTransactions || []}
                t={t}
                isRTL={isRTL}
              />
            </div>

            {/* Transaction Type Breakdown */}
            <div>
              <TransactionTypeBreakdown
                breakdown={data.typeBreakdown || []}
                t={t}
              />
            </div>
          </div>

          {/* Warehouse Summary */}
          {data.warehouseSummary && data.warehouseSummary.length > 0 && (
            <div className="mt-8">
              <WarehouseSummary warehouses={data.warehouseSummary} t={t} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, highlight = false }) {
  return (
    <div
      className={`rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
        highlight
          ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md'
          : 'bg-white text-gray-900 shadow-sm border'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${highlight ? 'text-primary-100' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${highlight ? 'text-white' : 'text-gray-900'}`}>
            {(value || 0).toLocaleString()}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function RecentTransactionsTable({ transactions, t, isRTL }) {
  const getTypeColor = (type) => {
    const typeMap = {
      sale: 'bg-green-100 text-green-800',
      return: 'bg-red-100 text-red-800',
      transfer: 'bg-blue-100 text-blue-800',
    };
    return typeMap[(type || '').toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getTypeName = (type) => {
    const typeMap = {
      Sale: t('sale'),
      Return: t('return'),
      Transfer: t('transfer'),
    };
    return typeMap[type] || type || '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getProductName = (tx) => {
    return tx.Product?.productNameEn || tx.Product?.productNameAr || '-';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{t('recentTransactions')}</h2>
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('transactionType')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('product')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('quantity')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('transactionDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.slice(0, 10).map((tx, index) => (
                <tr key={tx.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{tx.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(tx.transactionType)}`}>
                      {getTypeName(tx.transactionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{getProductName(tx)}</td>
                  <td className="px-4 py-3 text-gray-700">{tx.quantity || 0}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(tx.transactionDatetime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500">{t('noData')}</div>
      )}
    </div>
  );
}

function TransactionTypeBreakdown({ breakdown, t }) {
  // breakdown is an array: [{transactionType: 'Sale', count: '5', totalQuantity: '100'}, ...]
  const typeLabels = {
    Sale: t('sale'),
    Return: t('return'),
    Transfer: t('transfer'),
  };

  const colors = {
    Sale: 'bg-green-500',
    Return: 'bg-red-500',
    Transfer: 'bg-blue-500',
  };

  const total = (breakdown || []).reduce((sum, item) => sum + parseInt(item.count || 0), 0) || 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        {t('typeBreakdown')}
      </h2>

      <div className="space-y-4">
        {(breakdown || []).map((item) => {
          const count = parseInt(item.count || 0);
          const percentage = ((count / total) * 100).toFixed(1);
          const color = colors[item.transactionType] || 'bg-gray-500';
          const label = typeLabels[item.transactionType] || item.transactionType;

          return (
            <div key={item.transactionType}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-bold text-gray-900">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="text-center">
          <p className="text-gray-600 text-sm">{t('totalTransactions')}</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">
            {(breakdown || []).reduce((sum, item) => sum + parseInt(item.count || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function WarehouseSummary({ warehouses, t }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{t('warehouseSummary')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="border rounded-lg p-4 hover:border-primary-400 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{warehouse.warehouseName}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{warehouse.warehouseNumber}</code>
                </p>
              </div>
              <div className="text-2xl">🏭</div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('location')}</span>
                <span className="font-medium text-gray-900">{warehouse.location || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('totalTransactions')}</span>
                <span className="font-semibold text-gray-900">{warehouse.transactionCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
