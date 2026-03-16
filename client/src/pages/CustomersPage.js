import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { t } = useLang();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
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

  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/customers', {
        params: { page, limit: ITEMS_PER_PAGE, search: search || undefined },
      });
      setCustomers(response.data.customers || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, searchTerm);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchCustomers(1, value);
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

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      nameAr: customer.nameAr || '',
      code: customer.code || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      contactPerson: customer.contactPerson || '',
      taxId: customer.taxId || '',
      notes: customer.notes || '',
      isActive: customer.isActive !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveCustomer = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and Code are required');
      return;
    }
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully');
      }
      closeModal();
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await api.delete(`/customers/${customerId}`);
      toast.success('Customer deleted successfully');
      setDeleteConfirm(null);
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete customer');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('customers') || 'Customers'}</h1>
        <button onClick={handleAddCustomer}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + {t('addCustomer') || 'Add Customer'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <input type="text" placeholder={t('search') || 'Search...'} value={searchTerm} onChange={handleSearch}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading') || 'Loading...'}</div>
        ) : customers.length === 0 ? (
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
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{customer.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600"><code className="bg-gray-100 px-2 py-1 rounded text-xs">{customer.code || '-'}</code></td>
                    <td className="px-4 py-3 text-gray-600">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.city || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.isActive ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('edit') || 'Edit'}</button>
                        <button onClick={() => setDeleteConfirm(customer)}
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
          <button disabled={currentPage <= 1} onClick={() => fetchCustomers(currentPage - 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8249;</button>
          <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => fetchCustomers(currentPage + 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8250;</button>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <Modal title={editingCustomer ? t('edit') + ' ' + (t('customers') || 'Customer') : t('addCustomer') || 'Add Customer'} onClose={closeModal} onSave={handleSaveCustomer} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('name') || 'Name'} <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange}
                  placeholder="Enter customer name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
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
                  placeholder="Enter customer code" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('email') || 'Email'}</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                  placeholder="customer@example.com" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
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
        <Modal title={t('confirm') || 'Confirm'} onClose={() => setDeleteConfirm(null)} onSave={() => handleDeleteCustomer(deleteConfirm.id)}>
          <div className="space-y-3">
            <p className="text-gray-700">{t('confirmDelete') || 'Are you sure you want to delete this customer?'}</p>
            <p className="font-semibold text-gray-800">{deleteConfirm.name}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
