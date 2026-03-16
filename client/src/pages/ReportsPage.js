import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';

// Helper to compute dateFrom/dateTo from a period string
const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let dateFrom, dateTo;

  switch (period) {
    case 'thisMonth': {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      break;
    }
    case 'lastMonth': {
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      break;
    }
    case 'thisQuarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      dateFrom = new Date(now.getFullYear(), qStart, 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), qStart + 3, 0).toISOString().split('T')[0];
      break;
    }
    case 'thisYear': {
      dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      dateTo = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      break;
    }
    case 'custom': {
      dateFrom = customStart;
      dateTo = customEnd;
      break;
    }
    default: {
      dateFrom = undefined;
      dateTo = undefined;
    }
  }
  return { dateFrom, dateTo };
};

export default function ReportsPage() {
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('billing');
  const [period, setPeriod] = useState('thisMonth');
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [billingData, setBillingData] = useState({
    revenueByMonth: [],
    invoicesByStatus: [],
    topCustomers: [],
  });

  const [transactionData, setTransactionData] = useState({
    byType: [],
    byWarehouse: [],
    dailyCounts: [],
  });

  const [loading, setLoading] = useState(false);

  const fetchBillingReports = async (selectedPeriod) => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getDateRange(selectedPeriod, customStartDate, customEndDate);
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await api.get('/reports/billing', { params });
      const data = response.data || {};
      setBillingData({
        revenueByMonth: Array.isArray(data.revenueByMonth) ? data.revenueByMonth : [],
        invoicesByStatus: Array.isArray(data.invoicesByStatus) ? data.invoicesByStatus : [],
        topCustomers: Array.isArray(data.topCustomers) ? data.topCustomers : [],
      });
    } catch (error) {
      toast.error('Failed to fetch billing reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionReports = async (selectedPeriod) => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getDateRange(selectedPeriod, customStartDate, customEndDate);
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await api.get('/reports/transactions', { params });
      const data = response.data || {};
      setTransactionData({
        byType: Array.isArray(data.byType) ? data.byType : [],
        byWarehouse: Array.isArray(data.byWarehouse) ? data.byWarehouse : [],
        dailyCounts: Array.isArray(data.dailyCounts) ? data.dailyCounts : [],
      });
    } catch (error) {
      toast.error('Failed to fetch transaction reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBillingReports(period);
    } else {
      fetchTransactionReports(period);
    }
  }, [activeTab, period]);

  const handlePeriodChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomDates(true);
    } else {
      setShowCustomDates(false);
    }
    setPeriod(value);
  };

  const handleCustomDateApply = () => {
    if (activeTab === 'billing') {
      fetchBillingReports('custom');
    } else {
      fetchTransactionReports('custom');
    }
  };

  // Compute summary from invoicesByStatus
  const billingSummary = {
    totalRevenue: billingData.invoicesByStatus.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0),
    paidCount: (billingData.invoicesByStatus.find(s => s.status === 'Paid') || {}).count || 0,
    pendingCount: (billingData.invoicesByStatus.find(s => s.status === 'Sent' || s.status === 'Draft') || {}).count || 0,
    overdueCount: (billingData.invoicesByStatus.find(s => s.status === 'Overdue') || {}).count || 0,
  };

  // Compute summary from byType
  const transactionSummary = {
    totalTransactions: transactionData.byType.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0),
    inboundCount: (transactionData.byType.find(item => item.transactionType === 'Inbound' || item.transactionType === 'Purchase') || {}).count || 0,
    outboundCount: (transactionData.byType.find(item => item.transactionType === 'Outbound' || item.transactionType === 'Sale') || {}).count || 0,
    adjustmentCount: (transactionData.byType.find(item => item.transactionType === 'Adjustment') || {}).count || 0,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('reports') || 'Reports'}</h1>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('period') || 'Period'}</label>
            <select value={period} onChange={handlePeriodChange}
              className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="thisMonth">{t('thisMonth') || 'This Month'}</option>
              <option value="lastMonth">{t('lastMonth') || 'Last Month'}</option>
              <option value="thisQuarter">{t('thisQuarter') || 'This Quarter'}</option>
              <option value="thisYear">{t('thisYear') || 'This Year'}</option>
              <option value="custom">{t('custom') || 'Custom'}</option>
            </select>
          </div>

          {showCustomDates && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('startDate') || 'Start Date'}</label>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('endDate') || 'End Date'}</label>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <button onClick={handleCustomDateApply}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
                {t('apply') || 'Apply'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'billing'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('billingReports') || 'Billing Reports'}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('transactionReports') || 'Transaction Reports'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">{t('loading') || 'Loading...'}</p>
        </div>
      ) : activeTab === 'billing' ? (
        <div>
          {/* Billing Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('totalRevenue') || 'Total Revenue'}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {billingSummary.totalRevenue.toFixed(2)} {t('qar') || 'QAR'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('paidInvoices') || 'Paid Invoices'}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {billingSummary.paidCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('pendingInvoices') || 'Pending Invoices'}</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {billingSummary.pendingCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('overdueInvoices') || 'Overdue Invoices'}</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {billingSummary.overdueCount}
              </p>
            </div>
          </div>

          {/* Revenue by Month Table */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('revenueByMonth') || 'Revenue by Month'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium text-gray-600">{t('month') || 'Month'}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-600">{t('revenue') || 'Revenue'}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-600">{t('invoiceCount') || 'Invoice Count'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {billingData.revenueByMonth.length > 0 ? (
                    billingData.revenueByMonth.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">{item.month || '-'}</td>
                        <td className="px-4 py-3 text-end text-gray-700 font-medium">
                          {parseFloat(item.totalAmount || 0).toFixed(2)} {t('qar') || 'QAR'}
                        </td>
                        <td className="px-4 py-3 text-end text-gray-600">{item.count || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-gray-500">
                        {t('noData') || 'No data'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoices by Status & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('invoicesByStatus') || 'Invoices by Status'}</h2>
              <div className="space-y-3">
                {billingData.invoicesByStatus.length > 0 ? (
                  billingData.invoicesByStatus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">{item.status || '-'}</span>
                      <div className="text-end">
                        <span className="text-2xl font-bold text-primary-600">{item.count || 0}</span>
                        <span className="text-xs text-gray-500 ml-2">({parseFloat(item.totalAmount || 0).toFixed(2)} {t('qar') || 'QAR'})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('noData') || 'No data'}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('topCustomers') || 'Top Customers'}</h2>
              <div className="space-y-3">
                {billingData.topCustomers.length > 0 ? (
                  billingData.topCustomers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium truncate">{item.customerName || '-'}</span>
                      <span className="text-lg font-bold text-primary-600">
                        {parseFloat(item.totalAmount || 0).toFixed(2)} {t('qar') || 'QAR'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('noData') || 'No data'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Transaction Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('totalTransactions') || 'Total Transactions'}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {transactionSummary.totalTransactions}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('inbound') || 'Inbound'}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {transactionSummary.inboundCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('outbound') || 'Outbound'}</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {transactionSummary.outboundCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600 text-sm font-medium">{t('adjustment') || 'Adjustment'}</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {transactionSummary.adjustmentCount}
              </p>
            </div>
          </div>

          {/* Transactions by Type & Warehouse */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('transactionsByType') || 'Transactions by Type'}</h2>
              <div className="space-y-3">
                {transactionData.byType.length > 0 ? (
                  transactionData.byType.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium">{item.transactionType || '-'}</span>
                      <div className="text-end">
                        <span className="text-2xl font-bold text-primary-600">{item.count || 0}</span>
                        <span className="text-xs text-gray-500 ml-2">(qty: {parseFloat(item.totalQuantity || 0).toFixed(1)})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('noData') || 'No data'}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('transactionsByWarehouse') || 'Transactions by Warehouse'}</h2>
              <div className="space-y-3">
                {transactionData.byWarehouse.length > 0 ? (
                  transactionData.byWarehouse.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700 font-medium truncate">{item.warehouseName || '-'}</span>
                      <div className="text-end">
                        <span className="text-2xl font-bold text-primary-600">{item.count || 0}</span>
                        <span className="text-xs text-gray-500 ml-2">(qty: {parseFloat(item.totalQuantity || 0).toFixed(1)})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">{t('noData') || 'No data'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Daily Transactions Table */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('dailyTransactions') || 'Daily Transactions'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium text-gray-600">{t('date') || 'Date'}</th>
                    <th className="px-4 py-3 text-end font-medium text-gray-600">{t('count') || 'Count'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactionData.dailyCounts.length > 0 ? (
                    transactionData.dailyCounts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 font-medium">{item.date || '-'}</td>
                        <td className="px-4 py-3 text-end text-gray-600">{item.count || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-4 py-6 text-center text-gray-500">
                        {t('noData') || 'No data'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
