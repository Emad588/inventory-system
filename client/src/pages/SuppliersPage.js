import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const { t } = useLang();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    contactPerson: '',
    taxId: '',
    notes: '',
    isActive: true,
  });

  const ITEMS_PER_PAGE = 10;

  const fetchSuppliers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/suppliers', {
        params: { page, limit: ITEMS_PER_PAGE, search: search || undefined },
      });
      setSuppliers(response.data.suppliers || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1, searchTerm);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchSuppliers(1, value);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      code: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      contactPerson: '',
      taxId: '',
      notes: '',
      isActive: true,
    });
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      nameAr: supplier.nameAr || '',
      code: supplier.code || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      contactPerson: supplier.contactPerson || '',
      taxId: supplier.taxId || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required');
      return;
    }
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created successfully');
      }
      closeModal();
      fetchSuppliers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    try {
      await api.delete(`/suppliers/${supplierId}`);
      toast.success('Supplier deleted successfully');
      setDeleteConfirm(null);
      fetchSuppliers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete supplier');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('suppliers') || 'Suppliers'}</h1>
        <button onClick={handleAddSupplier}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + {t('addSupplier') || 'Add Supplier'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <input type="text" placeholder={t('search') || 'Search...'} value={searchTerm} onChange={handleSearch}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading') || 'Loading...'}</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noData') || 'No data'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('name') || 'Name'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('code') || 'Code'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('email') || 'Email'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('phone') || 'Phone'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('city') || 'City'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('status') || 'Status'}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{supplier.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600"><code className="bg-gray-100 px-2 py-1 rounded text-xs">{supplier.code || '-'}</code></td>
                    <td className="px-4 py-3 text-gray-600">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.city || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {supplier.isActive ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('edit') || 'Edit'}</button>
                        <button onClick={() => setDeleteConfirm(supplier)}
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
          <button disabled={currentPage <= 1} onClick={() => fetchSuppliers(currentPage - 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8249;</button>
          <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => fetchSuppliers(currentPage + 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8250;</button>
        </div>
      )}

      {/* Add/Edit Supplier Modal */}
      {showModal && (
        <Modal title={editingSupplier ? t('edit') + ' ' + (t('suppliers') || 'Supplier') : t('addSupplier') || 'Add Supplier'} onClose={closeModal} onSave={handleSaveSupplier} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('name') || 'Name'} <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                  placeholder="Enter supplier name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('nameAr') || 'Name (Arabic)'}</label>
                <input type="text" name="nameAr" value={formData.nameAr} onChange={handleFormChange}
                  placeholder="الاسم بالعربية" dir="rtl" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('code') || 'Code'} <span className="text-red-500">*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleFormChange}
                  placeholder="Enter supplier code" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('email') || 'Email'}</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                  placeholder="supplier@example.com" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('phone') || 'Phone'}</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange}
                  placeholder="+974 1234 5678" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('city') || 'City'}</label>
                <input type="text" name="city" value={formData.city} onChange={handleFormChange}
                  placeholder="Enter city" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('address') || 'Address'}</label>
              <input type="text" name="address" value={formData.address} onChange={handleFormChange}
                placeholder="Enter address" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('contactPerson') || 'Contact Person'}</label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange}
                  placeholder="Enter contact person" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('taxId') || 'Tax ID'}</label>
                <input type="text" name="taxId" value={formData.taxId} onChange={handleFormChange}
                  placeholder="Enter tax ID" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('notes') || 'Notes'}</label>
              <textarea name="notes" value={formData.notes} onChange={handleFormChange}
                placeholder="Enter any notes" rows="2" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleFormChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">{t('isActive') || 'Active'}</label>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal title={t('confirm') || 'Confirm'} onClose={() => setDeleteConfirm(null)} onSave={() => handleDeleteSupplier(deleteConfirm.id)}>
          <div className="space-y-3">
            <p className="text-gray-700">{t('confirmDelete') || 'Are you sure you want to delete this supplier?'}</p>
            <p className="font-semibold text-gray-800">{deleteConfirm.name}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
