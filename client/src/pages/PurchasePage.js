import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const statusColors = {
  Ordered: 'bg-blue-100 text-blue-700',
  Received: 'bg-green-100 text-green-700',
  'Partially Received': 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const emptyLineItem = { productId: null, description: '', quantity: 1, unitPrice: 0 };

export default function PurchasePage() {
  const { t } = useLang();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    status: 'Ordered',
    notes: '',
    items: [{ ...emptyLineItem }],
  });

  const ITEMS_PER_PAGE = 10;

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/purchase', {
        params: { page, limit: ITEMS_PER_PAGE },
      });
      const data = response.data || {};
      setPurchases(Array.isArray(data.purchaseOrders) ? data.purchaseOrders : []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers', { params: { limit: 500 } });
      setSuppliers(Array.isArray(response.data.suppliers) ? response.data.suppliers : []);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 500 } });
      setProducts(Array.isArray(response.data.products) ? response.data.products : []);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchPurchases(1);
    fetchSuppliers();
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      status: 'Ordered',
      notes: '',
      items: [{ ...emptyLineItem }],
    });
  };

  const handleAddPurchase = () => {
    setEditingPurchase(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    const poItems = Array.isArray(purchase.items) ? purchase.items : [];
    setFormData({
      supplierId: purchase.supplierId || '',
      purchaseDate: purchase.purchaseDate || '',
      expectedDelivery: purchase.expectedDelivery || '',
      status: purchase.status || 'Ordered',
      notes: purchase.notes || '',
      items: poItems.length > 0
        ? poItems.map(item => ({
            productId: item.productId || null,
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
          }))
        : [{ ...emptyLineItem }],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPurchase(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyLineItem }],
    }));
  };

  const removeLineItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)), 0);
  };

  const handleSavePurchase = async () => {
    if (!formData.supplierId || formData.items.length === 0) {
      toast.error('Please select a supplier and add at least one line item');
      return;
    }
    try {
      const payload = {
        supplierId: parseInt(formData.supplierId),
        purchaseDate: formData.purchaseDate,
        expectedDelivery: formData.expectedDelivery || null,
        status: formData.status,
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: item.productId ? parseInt(item.productId) : null,
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      };

      if (editingPurchase) {
        await api.put(`/purchase/${editingPurchase.id}`, payload);
        toast.success('Purchase order updated successfully');
      } else {
        await api.post('/purchase', payload);
        toast.success('Purchase order created successfully');
      }
      closeModal();
      fetchPurchases(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save purchase order');
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    try {
      await api.delete(`/purchase/${purchaseId}`);
      toast.success('Purchase order deleted successfully');
      setDeleteConfirm(null);
      fetchPurchases(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete purchase order');
    }
  };

  const getSupplierName = (purchase) => {
    if (purchase.supplier && purchase.supplier.name) return purchase.supplier.name;
    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    return supplier ? supplier.name : '-';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('purchases') || 'Purchase Orders'}</h1>
        <button onClick={handleAddPurchase}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + {t('addPurchase') || 'Add PO'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('totalPoCount') || 'Total PO Count'}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{purchases.length}</p>
            </div>
            <div className="text-4xl text-blue-600">📋</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('pendingOrders') || 'Pending Orders'}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{purchases.filter(p => p.status === 'Ordered').length}</p>
            </div>
            <div className="text-4xl text-yellow-600">⏳</div>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading') || 'Loading...'}</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noData') || 'No data'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">PO Number</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">Supplier</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">Expected Delivery</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-end font-medium text-gray-600">Total Amount</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{purchase.poNumber || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{getSupplierName(purchase)}</td>
                    <td className="px-4 py-3 text-gray-600">{purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{purchase.expectedDelivery ? new Date(purchase.expectedDelivery).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[purchase.status] || 'bg-gray-100 text-gray-700'}`}>
                        {purchase.status || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-end font-medium">
                      {parseFloat(purchase.totalAmount || 0).toFixed(2)} {t('qar') || 'QAR'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditPurchase(purchase)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('edit') || 'Edit'}</button>
                        <button onClick={() => setDeleteConfirm(purchase)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium">{t('delete') || 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={currentPage <= 1} onClick={() => fetchPurchases(currentPage - 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8249;</button>
          <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => fetchPurchases(currentPage + 1)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8250;</button>
        </div>
      )}

      {/* Add/Edit Purchase Modal */}
      {showModal && (
        <Modal title={editingPurchase ? t('edit') + ' ' + (t('purchases') || 'Purchase') : t('addPurchase') || 'Add Purchase Order'} onClose={closeModal} onSave={handleSavePurchase} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('supplier') || 'Supplier'} <span className="text-red-500">*</span></label>
                <select name="supplierId" value={formData.supplierId} onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">PO Number</label>
                <input type="text" disabled value={editingPurchase ? editingPurchase.poNumber : '(Auto-generated)'}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('date') || 'Date'}</label>
                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('expectedDelivery') || 'Expected Delivery'}</label>
                <input type="date" name="expectedDelivery" value={formData.expectedDelivery} onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('status') || 'Status'}</label>
                <select name="status" value={formData.status} onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="Ordered">Ordered</option>
                  <option value="Received">Received</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('totalAmount') || 'Total Amount'}</label>
                <input type="text" disabled value={calculateTotal().toFixed(2)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('notes') || 'Notes'}</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormChange}
                placeholder="Enter any notes" rows="2" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            {/* Line Items */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">{t('lineItems') || 'Line Items'}</h3>
                <button type="button" onClick={addLineItem}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add Item</button>
              </div>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                        <select value={item.productId || ''} onChange={(e) => handleLineItemChange(index, 'productId', e.target.value || null)}
                          className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option value="">-- Select Product --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.productNameEn}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('quantity') || 'Qty'}</label>
                        <input type="number" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1" className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('unitPrice') || 'Unit Price'}</label>
                        <input type="number" value={item.unitPrice} onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0" step="0.01" className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeLineItem(index)}
                          disabled={formData.items.length <= 1}
                          className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 font-medium border border-red-300 rounded hover:bg-red-50 disabled:opacity-40">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('description') || 'Description'}</label>
                      <input type="text" value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        placeholder="Enter description" className="w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title={t('confirm') || 'Confirm'} onClose={() => setDeleteConfirm(null)} onSave={() => handleDeletePurchase(deleteConfirm.id)}>
          <div className="space-y-3">
            <p className="text-gray-700">{t('confirmDelete') || 'Are you sure?'}</p>
            <p className="font-semibold text-gray-800">{deleteConfirm.poNumber}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
