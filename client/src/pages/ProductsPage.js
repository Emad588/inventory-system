import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const COUNTRIES = [
  'Qatar', 'United States', 'China', 'India', 'Turkey', 'Germany',
  'United Kingdom', 'Italy', 'France', 'Japan', 'South Korea', 'UAE', 'Saudi Arabia',
];
const UOM_OPTIONS = ['kg', 'liter', 'piece'];

export default function ProductsPage() {
  const { t } = useLang();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showCustomCountry, setShowCustomCountry] = useState(false);

  const [formData, setFormData] = useState({
    productNameEn: '', productNameAr: '', barcode: '', hsCode: '',
    brand: '', countryOfOrigin: '', unitOfMeasurement: '', unitWeightSize: '',
  });

  const ITEMS_PER_PAGE = 10;

  const fetchProducts = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await api.get('/products', {
        params: { page, limit: ITEMS_PER_PAGE, search: search || undefined },
      });
      setProducts(response.data.products || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(1, searchTerm); }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    fetchProducts(1, value);
  };

  const resetForm = () => {
    setFormData({
      productNameEn: '', productNameAr: '', barcode: '', hsCode: '',
      brand: '', countryOfOrigin: '', unitOfMeasurement: '', unitWeightSize: '',
    });
    setShowCustomCountry(false);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    const isCustom = product.countryOfOrigin && !COUNTRIES.includes(product.countryOfOrigin);
    setShowCustomCountry(isCustom);
    setFormData({
      productNameEn: product.productNameEn || '',
      productNameAr: product.productNameAr || '',
      barcode: product.barcode || '',
      hsCode: product.hsCode || '',
      brand: product.brand || '',
      countryOfOrigin: product.countryOfOrigin || '',
      unitOfMeasurement: product.unitOfMeasurement || '',
      unitWeightSize: product.unitWeightSize || '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingProduct(null); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountrySelect = (e) => {
    const val = e.target.value;
    if (val === '__other__') {
      setShowCustomCountry(true);
      setFormData((prev) => ({ ...prev, countryOfOrigin: '' }));
    } else {
      setShowCustomCountry(false);
      setFormData((prev) => ({ ...prev, countryOfOrigin: val }));
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.productNameEn || !formData.productNameAr) {
      toast.error('Product name (EN & AR) is required');
      return;
    }
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      closeModal();
      fetchProducts(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
      fetchProducts(currentPage, searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    }
  };

  const countryDropdownValue = showCustomCountry ? '__other__' : (COUNTRIES.includes(formData.countryOfOrigin) ? formData.countryOfOrigin : (formData.countryOfOrigin ? '__other__' : ''));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('products')}</h1>
        <button onClick={handleAddProduct}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
          + {t('addProduct')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <input type="text" placeholder={t('search')} value={searchTerm} onChange={handleSearch}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">{t('loading')}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('productNameEn')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('productNameAr')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('barcode')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('hsCode')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('brand')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('countryOfOrigin')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('unitOfMeasurement')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{product.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{product.productNameEn || '-'}</td>
                    <td className="px-4 py-3 text-gray-600" dir="rtl">{product.productNameAr || '-'}</td>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-xs">{product.barcode || '-'}</code></td>
                    <td className="px-4 py-3 text-gray-600">{product.hsCode || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.brand || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.countryOfOrigin || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.unitOfMeasurement || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium">{t('edit')}</button>
                        <button onClick={() => setDeleteConfirm(product)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={currentPage <= 1} onClick={() => fetchProducts(currentPage - 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8249;</button>
          <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => fetchProducts(currentPage + 1, searchTerm)}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40">&#8250;</button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showModal && (
        <Modal title={editingProduct ? t('edit') + ' ' + t('products') : t('addProduct')} onClose={closeModal} onSave={handleSaveProduct}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('productNameEn')} <span className="text-red-500">*</span></label>
              <input type="text" name="productNameEn" value={formData.productNameEn} onChange={handleFormChange}
                placeholder="Enter English product name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('productNameAr')} <span className="text-red-500">*</span></label>
              <input type="text" name="productNameAr" value={formData.productNameAr} onChange={handleFormChange}
                placeholder="أدخل اسم المنتج بالعربية" dir="rtl" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('barcode')}</label>
                <input type="text" name="barcode" value={formData.barcode} onChange={handleFormChange}
                  placeholder="Enter barcode" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('hsCode')}</label>
                <input type="text" name="hsCode" value={formData.hsCode} onChange={handleFormChange}
                  placeholder="Enter HS Code" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('brand')}</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleFormChange}
                  placeholder="Enter brand" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('countryOfOrigin')}</label>
                <select value={countryDropdownValue} onChange={handleCountrySelect}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">-- Select Country --</option>
                  {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  <option value="__other__">{t('otherCountry')}</option>
                </select>
                {showCustomCountry && (
                  <input type="text" name="countryOfOrigin" value={formData.countryOfOrigin} onChange={handleFormChange}
                    placeholder="Type country name" className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('unitOfMeasurement')}</label>
                <select name="unitOfMeasurement" value={formData.unitOfMeasurement} onChange={handleFormChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">-- Select Unit --</option>
                  {UOM_OPTIONS.map((u) => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('unitWeightSize')}</label>
                <input type="text" name="unitWeightSize" value={formData.unitWeightSize} onChange={handleFormChange}
                  placeholder="e.g., 500g, 2L" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title={t('confirm')} onClose={() => setDeleteConfirm(null)} onSave={() => handleDeleteProduct(deleteConfirm.id)}>
          <div className="space-y-3">
            <p className="text-gray-700">{t('confirmDelete')}</p>
            <p className="font-semibold text-gray-800">{deleteConfirm.productNameEn}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
