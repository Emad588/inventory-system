import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function WarehousesPage() {
  const { t } = useLang();
  const { isAdmin } = useAuth();

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    warehouseNumber: '',
    warehouseName: '',
    location: '',
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await api.get('/warehouses', { params });
      // API returns { warehouses: [...] }
      setWarehouses(response.data.warehouses || []);
    } catch (error) {
      toast.error('Failed to fetch warehouses');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({ warehouseNumber: '', warehouseName: '', location: '' });
    setEditingWarehouse(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleAddWarehouse = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      warehouseNumber: warehouse.warehouseNumber || '',
      warehouseName: warehouse.warehouseName || '',
      location: warehouse.location || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.warehouseNumber.trim() || !formData.warehouseName.trim() || !formData.location.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      if (editingWarehouse) {
        await api.put(`/warehouses/${editingWarehouse.id}`, formData);
        toast.success('Warehouse updated');
      } else {
        await api.post('/warehouses', formData);
        toast.success('Warehouse created');
      }
      closeModal();
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save warehouse');
    }
  };

  const handleDelete = async (warehouseId) => {
    try {
      await api.delete(`/warehouses/${warehouseId}`);
      toast.success('Warehouse deleted');
      setDeleteConfirm(null);
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete warehouse');
    }
  };

  // Client-side filter for instant feedback
  const filtered = warehouses.filter((w) =>
    (w.warehouseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.warehouseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('warehouses')}</h1>
        <button
          onClick={handleAddWarehouse}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
        >
          + {t('addWarehouse')}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('warehouseNumber')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('warehouseName')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('location')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{warehouse.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{warehouse.warehouseNumber}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{warehouse.warehouseName}</td>
                    <td className="px-4 py-3 text-gray-600">{warehouse.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditWarehouse(warehouse)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {t('edit')}
                        </button>
                        {deleteConfirm === warehouse.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(warehouse.id)}
                              className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {t('confirm')}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(warehouse.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            {t('delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal
          title={editingWarehouse ? t('edit') + ' ' + t('warehouses') : t('addWarehouse')}
          onClose={closeModal}
          onSave={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('warehouseNumber')} *</label>
              <input
                type="text" value={formData.warehouseNumber}
                onChange={(e) => setFormData({ ...formData, warehouseNumber: e.target.value })}
                placeholder="e.g., WH-RYD-01"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('warehouseName')} *</label>
              <input
                type="text" value={formData.warehouseName}
                onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                placeholder="e.g., Riyadh Central"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('location')} *</label>
              <input
                type="text" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Riyadh, Industrial Area"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
