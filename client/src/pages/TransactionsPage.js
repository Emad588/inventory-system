import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 15;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const emptyForm = {
    transactionRefNumber: '', productId: '', warehouseId: '',
    transactionType: 'Sale', quantity: '', salesPrice: '',
    noOfInvoices: '', supplierCategory: '',
    transactionDatetime: new Date().toISOString().split('T')[0],
    fromCPNumberB2B: '', toCPNumberB2B: '', isSupplier: false,
  };
  const [formData, setFormData] = useState({ ...emptyForm });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          api.get('/products', { params: { limit: 500 } }),
          api.get('/warehouses'),
        ]);
        setProducts(prodRes.data.products || []);
        setWarehouses(whRes.data.warehouses || []);
      } catch (error) {
        console.error('Failed to load dropdowns:', error);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const resetForm = () => { setFormData({ ...emptyForm }); setEditingId(null); };
  const closeModal = () => { setShowModal(false); resetForm(); };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setFormData(prev => ({ ...prev, productId }));
  };

  const handleSave = async () => {
    if (!formData.transactionRefNumber || !formData.productId || !formData.warehouseId || !formData.quantity || !formData.salesPrice) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, formData);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', formData);
        toast.success('Transaction created');
      }
      closeModal();
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save transaction');
    }
  };

  const handleEdit = (tx) => {
    setFormData({
      transactionRefNumber: tx.transactionRefNumber || '',
      productId: tx.productId || '',
      warehouseId: tx.warehouseId || '',
      transactionType: tx.transactionType || 'Sale',
      quantity: tx.quantity || '',
      salesPrice: tx.salesPrice || '',
      noOfInvoices: tx.noOfInvoices || '',
      supplierCategory: tx.supplierCategory || '',
      transactionDatetime: tx.transactionDatetime ? tx.transactionDatetime.split('T')[0] : '',
      fromCPNumberB2B: tx.fromCPNumberB2B || '',
      toCPNumberB2B: tx.toCPNumberB2B || '',
      isSupplier: tx.isSupplier || false,
    });
    setEditingId(tx.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${deleteConfirm}`);
      toast.success('Transaction deleted');
      setDeleteConfirm(null);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  const typeColor = (type) => {
    if (type === 'Sale') return 'bg-green-100 text-green-700';
    if (type === 'Return') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getProductName = (tx) => {
    if (tx.Product) return lang === 'ar' ? (tx.Product.productNameAr || tx.Product.productNameEn) : tx.Product.productNameEn;
    return '-';
  };

  const getWarehouseName = (tx) => {
    if (tx.Warehouse) return tx.Warehouse.warehouseName || tx.Warehouse.warehouseNumber;
    return '-';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('transactions')}</h1>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + {t('addTransaction')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('search')}</label>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('search')} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('transactionType')}</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border rounded-lg">
              <option value="">{t('filters')}</option>
              <option value="Sale">{t('sale')}</option>
              <option value="Return">{t('return')}</option>
              <option value="Transfer">{t('transfer')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('dateFrom')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('dateTo')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg" />
          </div>
          <button onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-3 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">{t('clear')}</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading')}</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('transactionRef')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('product')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('warehouse')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('transactionType')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('quantity')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('salesPrice')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('transactionDate')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{tx.transactionRefNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{getProductName(tx)}</td>
                    <td className="px-4 py-3 text-gray-600">{getWarehouseName(tx)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor(tx.transactionType)}`}>
                        {t(tx.transactionType.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{Number(tx.quantity).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(tx.salesPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {tx.transactionDatetime ? new Date(tx.transactionDatetime).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(tx)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('edit')}</button>
                        <button onClick={() => setDeleteConfirm(tx.id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium">{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">‹</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">›</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingId ? t('edit') + ' ' + t('transactions') : t('addTransaction')}
          onClose={closeModal}
          onSave={handleSave}
          wide
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('transactionRef')} *</label>
              <input type="text" name="transactionRefNumber" value={formData.transactionRefNumber}
                onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('selectProduct')} *</label>
              <select name="productId" value={formData.productId} onChange={handleProductSelect}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-- {t('selectProduct')} --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.productNameEn} ({p.productNameAr})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('selectWarehouse')} *</label>
              <select name="warehouseId" value={formData.warehouseId} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-- {t('selectWarehouse')} --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.warehouseName} ({w.warehouseNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('transactionType')} *</label>
              <select name="transactionType" value={formData.transactionType} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="Sale">{t('sale')}</option>
                <option value="Return">{t('return')}</option>
                <option value="Transfer">{t('transfer')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('quantity')} *</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange}
                step="0.001" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('salesPrice')} *</label>
              <input type="number" name="salesPrice" value={formData.salesPrice} onChange={handleInputChange}
                step="0.001" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('transactionDate')} *</label>
              <input type="date" name="transactionDatetime" value={formData.transactionDatetime}
                onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('noOfInvoices')}</label>
              <input type="number" name="noOfInvoices" value={formData.noOfInvoices} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('supplierCategory')}</label>
              <input type="text" name="supplierCategory" value={formData.supplierCategory} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('fromCP')}</label>
              <input type="text" name="fromCPNumberB2B" value={formData.fromCPNumberB2B} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('toCP')}</label>
              <input type="text" name="toCPNumberB2B" value={formData.toCPNumberB2B} onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" name="isSupplier" checked={formData.isSupplier} onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
              <label className="text-sm text-gray-700">{t('isSupplier')}</label>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal title={t('confirm')} onClose={() => setDeleteConfirm(null)} onSave={handleDelete}>
          <p className="text-gray-700">{t('confirmDelete')}</p>
        </Modal>
      )}
    </div>
  );
}
