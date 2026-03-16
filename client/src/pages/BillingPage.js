import { useState, useEffect, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const statusColors = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-yellow-100 text-yellow-700',
};

const emptyItem = { description: '', descriptionAr: '', quantity: 1, unitPrice: 0, discount: 0, productId: null, barcode: '', hsCode: '' };

export default function BillingPage() {
  const { t } = useLang();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    customerName: '', customerNameAr: '', customerEmail: '', customerPhone: '',
    customerAddress: '', customerTaxId: '', invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '', taxRate: 15, discount: 0, currency: 'QAR', paymentMethod: '',
    notes: '', notesAr: '', items: [{ ...emptyItem }],
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/billing', { params });
      setInvoices(data.invoices);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/billing/summary');
      setSummary(data);
    } catch { /* ignore */ }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 200 } });
      setProducts(data.products || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchSummary(); fetchProducts(); }, []);

  const resetForm = () => {
    setForm({
      customerName: '', customerNameAr: '', customerEmail: '', customerPhone: '',
      customerAddress: '', customerTaxId: '', invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '', taxRate: 15, discount: 0, currency: 'QAR', paymentMethod: '',
      notes: '', notesAr: '', items: [{ ...emptyItem }],
    });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (inv) => {
    setEditing(inv);
    setForm({
      customerName: inv.customerName || '',
      customerNameAr: inv.customerNameAr || '',
      customerEmail: inv.customerEmail || '',
      customerPhone: inv.customerPhone || '',
      customerAddress: inv.customerAddress || '',
      customerTaxId: inv.customerTaxId || '',
      invoiceDate: inv.invoiceDate || '',
      dueDate: inv.dueDate || '',
      taxRate: inv.taxRate || 0,
      discount: inv.discount || 0,
      currency: inv.currency || 'SAR',
      paymentMethod: inv.paymentMethod || '',
      notes: inv.notes || '',
      notesAr: inv.notesAr || '',
      items: (inv.items || []).map(i => ({
        description: i.description, descriptionAr: i.descriptionAr || '',
        quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount || 0,
        productId: i.productId, barcode: i.barcode || '', hsCode: i.hsCode || '',
      })),
    });
    setShowForm(true);
  };

  const openView = async (inv) => {
    try {
      const { data } = await api.get(`/billing/${inv.id}`);
      setViewing(data);
      setShowView(true);
    } catch {
      toast.error('Failed to load invoice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/billing/${editing.id}`, form);
        toast.success('Invoice updated');
      } else {
        await api.post('/billing', form);
        toast.success('Invoice created');
      }
      setShowForm(false);
      resetForm();
      fetchInvoices();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await api.delete(`/billing/${id}`);
      toast.success('Invoice deleted');
      fetchInvoices();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`/billing/${id}/pay`, { paymentMethod: 'Cash' });
      toast.success('Invoice marked as paid');
      fetchInvoices();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  // Item management
  const updateItem = (idx, field, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    // Auto-fill from product
    if (field === 'productId' && val) {
      const prod = products.find(p => p.id === parseInt(val));
      if (prod) {
        items[idx].description = prod.productNameEn || '';
        items[idx].descriptionAr = prod.productNameAr || '';
        items[idx].barcode = prod.barcode || '';
        items[idx].hsCode = prod.hsCode || '';
      }
    }
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  // Calculate live totals
  const calcSubtotal = () => form.items.reduce((s, i) => s + (parseFloat(i.quantity) * parseFloat(i.unitPrice)) - parseFloat(i.discount || 0), 0);
  const calcTax = () => calcSubtotal() * (parseFloat(form.taxRate) / 100);
  const calcTotal = () => calcSubtotal() + calcTax() - parseFloat(form.discount || 0);

  const statusLabel = (s) => {
    const map = { Draft: t('draft'), Sent: t('sent'), Paid: t('paid'), Overdue: t('overdue'), Cancelled: t('cancelled') };
    return map[s] || s;
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500">{t('invoices')}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.totalInvoices || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-green-600">{t('totalRevenue')}</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{(summary.totalRevenue || 0).toLocaleString()} {t('qar')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-blue-600">{t('totalPending')}</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{(summary.totalPending || 0).toLocaleString()} {t('qar')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-red-600">{t('totalOverdue')}</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{(summary.totalOverdue || 0).toLocaleString()} {t('qar')}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text" placeholder={t('search')} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="">{t('filters')}</option>
            <option value="Draft">{t('draft')}</option>
            <option value="Sent">{t('sent')}</option>
            <option value="Paid">{t('paid')}</option>
            <option value="Overdue">{t('overdue')}</option>
            <option value="Cancelled">{t('cancelled')}</option>
          </select>
          <button onClick={openCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            {t('addInvoice')}
          </button>
        </div>
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('loading')}</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('noData')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('invoiceNumber')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('customerName')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('invoiceDate')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('dueDate')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600">{t('totalAmount')}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">{t('transactionType')}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-primary-700 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.customerName}</td>
                  <td className="px-4 py-3">{inv.invoiceDate}</td>
                  <td className="px-4 py-3">{inv.dueDate || '-'}</td>
                  <td className="px-4 py-3 font-semibold">{parseFloat(inv.totalAmount).toLocaleString()} {inv.currency}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status] || ''}`}>
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openView(inv)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs">{t('viewInvoice')}</button>
                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                        <>
                          <button onClick={() => openEdit(inv)} className="px-2 py-1 text-yellow-600 hover:bg-yellow-50 rounded text-xs">{t('edit')}</button>
                          <button onClick={() => handleMarkPaid(inv.id)} className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs">{t('markPaid')}</button>
                        </>
                      )}
                      <button onClick={() => handleDelete(inv.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">{t('delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded border text-sm disabled:opacity-40">‹</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded border text-sm disabled:opacity-40">›</button>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {showView && viewing && (
        <Modal wide onClose={() => { setShowView(false); setViewing(null); }}>
          <div className="p-2">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{viewing.invoiceNumber}</h2>
                <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[viewing.status] || ''}`}>
                  {statusLabel(viewing.status)}
                </span>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{t('invoiceDate')}: {viewing.invoiceDate}</p>
                {viewing.dueDate && <p>{t('dueDate')}: {viewing.dueDate}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="font-medium text-gray-700">{t('customerName')}</p>
                <p>{viewing.customerName}</p>
                {viewing.customerNameAr && <p className="text-gray-500">{viewing.customerNameAr}</p>}
                {viewing.customerEmail && <p>{viewing.customerEmail}</p>}
                {viewing.customerPhone && <p>{viewing.customerPhone}</p>}
              </div>
              <div>
                {viewing.customerAddress && <><p className="font-medium text-gray-700">{t('customerAddress')}</p><p>{viewing.customerAddress}</p></>}
                {viewing.customerTaxId && <><p className="font-medium text-gray-700 mt-2">{t('customerTaxId')}</p><p>{viewing.customerTaxId}</p></>}
              </div>
            </div>
            <table className="w-full text-sm mb-4 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-start">#</th>
                  <th className="px-3 py-2 text-start">{t('description')}</th>
                  <th className="px-3 py-2 text-start">{t('quantity')}</th>
                  <th className="px-3 py-2 text-start">{t('unitPrice')}</th>
                  <th className="px-3 py-2 text-start">{t('discountAmount')}</th>
                  <th className="px-3 py-2 text-start">{t('itemTotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(viewing.items || []).map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{item.description}{item.descriptionAr ? ` / ${item.descriptionAr}` : ''}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{parseFloat(item.unitPrice).toLocaleString()}</td>
                    <td className="px-3 py-2">{parseFloat(item.discount || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium">{parseFloat(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end">
              <div className="w-64 text-sm space-y-1">
                <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{parseFloat(viewing.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{t('taxRate')}:</span><span>{viewing.taxRate}%</span></div>
                <div className="flex justify-between"><span>{t('taxAmount')}:</span><span>{parseFloat(viewing.taxAmount).toLocaleString()}</span></div>
                {parseFloat(viewing.discount) > 0 && (
                  <div className="flex justify-between"><span>{t('discountAmount')}:</span><span>-{parseFloat(viewing.discount).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>{t('totalAmount')}:</span><span>{parseFloat(viewing.totalAmount).toLocaleString()} {viewing.currency}</span>
                </div>
              </div>
            </div>
            {viewing.notes && <p className="mt-4 text-sm text-gray-500">{viewing.notes}</p>}
          </div>
        </Modal>
      )}

      {/* Create/Edit Invoice Modal */}
      {showForm && (
        <Modal wide onClose={() => { setShowForm(false); resetForm(); }}>
          <h2 className="text-lg font-bold mb-4">{editing ? t('editInvoice') : t('addInvoice')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Customer info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerName')} *</label>
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerNameAr')}</label>
                <input value={form.customerNameAr} onChange={(e) => setForm({ ...form, customerNameAr: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerEmail')}</label>
                <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerPhone')}</label>
                <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerTaxId')}</label>
                <input value={form.customerTaxId} onChange={(e) => setForm({ ...form, customerTaxId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('customerAddress')}</label>
                <input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>

            {/* Dates and settings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('invoiceDate')}</label>
                <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('dueDate')}</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('taxRate')}</label>
                <input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('currencyLabel')}</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="QAR">{t('qar')}</option>
                  <option value="USD">{t('usd')}</option>
                </select>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{t('items')}</label>
                <button type="button" onClick={addItem} className="text-xs px-3 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100">
                  + {t('addItem')}
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 rounded-lg">
                    <div className="col-span-3">
                      <label className="block text-[10px] text-gray-500">{t('selectProduct')}</label>
                      <select value={item.productId || ''} onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs">
                        <option value="">-- {t('selectProduct')} --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.productNameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] text-gray-500">{t('description')}</label>
                      <input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs" required />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] text-gray-500">{t('quantity')}</label>
                      <input type="number" step="0.001" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs" required />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-gray-500">{t('unitPrice')}</label>
                      <input type="number" step="0.001" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs" required />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] text-gray-500">{t('discountAmount')}</label>
                      <input type="number" step="0.001" value={item.discount} onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-xs" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] text-gray-500">{t('itemTotal')}</label>
                      <p className="px-2 py-1.5 text-xs font-medium">
                        {((parseFloat(item.quantity) * parseFloat(item.unitPrice)) - parseFloat(item.discount || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length <= 1}
                        className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded text-xs disabled:opacity-30">
                        {t('removeItem')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 text-sm space-y-1 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{calcSubtotal().toLocaleString()}</span></div>
                <div className="flex justify-between"><span>{t('taxAmount')} ({form.taxRate}%):</span><span>{calcTax().toLocaleString()}</span></div>
                <div>
                  <label className="block text-[10px] text-gray-500">{t('discountAmount')}</label>
                  <input type="number" step="0.001" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-xs" />
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>{t('totalAmount')}:</span><span>{calcTotal().toLocaleString()} {form.currency}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('notesLabel')} (EN)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('notesLabel')} (AR)</label>
                <textarea rows={2} value={form.notesAr} onChange={(e) => setForm({ ...form, notesAr: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" dir="rtl" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 border rounded-lg text-sm">{t('cancel')}</button>
              <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                {t('save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
