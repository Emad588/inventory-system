import { useState, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { t } = useLang();

  const [formData, setFormData] = useState({
    companyName: '',
    companyNameAr: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    defaultCurrency: 'QAR',
    defaultTaxRate: 15,
    taxIdNumber: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('medco_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setFormData({
          companyName: settings.companyName || '',
          companyNameAr: settings.companyNameAr || '',
          companyEmail: settings.companyEmail || '',
          companyPhone: settings.companyPhone || '',
          companyAddress: settings.companyAddress || '',
          defaultCurrency: settings.defaultCurrency || 'QAR',
          defaultTaxRate: settings.defaultTaxRate || 15,
          taxIdNumber: settings.taxIdNumber || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'defaultTaxRate' ? parseFloat(value) : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.companyEmail || !formData.companyPhone) {
      toast.error('Please fill in company name, email, and phone');
      return;
    }

    setLoading(true);
    try {
      // Store settings in localStorage
      localStorage.setItem('medco_settings', JSON.stringify(formData));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings') || 'Settings'}</h1>
      </div>

      {/* General Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('generalSettings') || 'General Settings'}</h2>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Company Information Section */}
          <div className="border-b pb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('companyInformation') || 'Company Information'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('companyName') || 'Company Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleFormChange}
                  placeholder="Enter company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('companyNameAr') || 'Company Name (Arabic)'}
                </label>
                <input
                  type="text"
                  name="companyNameAr"
                  value={formData.companyNameAr}
                  onChange={handleFormChange}
                  placeholder="اسم الشركة بالعربية"
                  dir="rtl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('companyEmail') || 'Company Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleFormChange}
                  placeholder="company@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('companyPhone') || 'Company Phone'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleFormChange}
                  placeholder="+974 4444 5555"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {t('companyAddress') || 'Company Address'}
              </label>
              <textarea
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleFormChange}
                placeholder="Enter company address"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Financial Settings Section */}
          <div className="border-b pb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('financialSettings') || 'Financial Settings'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('defaultCurrency') || 'Default Currency'}
                </label>
                <select
                  name="defaultCurrency"
                  value={formData.defaultCurrency}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="QAR">QAR (Qatari Riyal)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="SAR">SAR (Saudi Riyal)</option>
                  <option value="KWD">KWD (Kuwaiti Dinar)</option>
                  <option value="BHD">BHD (Bahraini Dinar)</option>
                  <option value="OMR">OMR (Omani Rial)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {t('defaultTaxRate') || 'Default Tax Rate'} (%)
                </label>
                <input
                  type="number"
                  name="defaultTaxRate"
                  value={formData.defaultTaxRate}
                  onChange={handleFormChange}
                  placeholder="15"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {t('taxIdNumber') || 'Tax ID / CR Number'}
              </label>
              <input
                type="text"
                name="taxIdNumber"
                value={formData.taxIdNumber}
                onChange={handleFormChange}
                placeholder="Enter tax ID or commercial registration number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={loadSettings}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('reset') || 'Reset'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('saving') || 'Saving...') : (t('save') || 'Save Settings')}
            </button>
          </div>
        </form>
      </div>

      {/* Settings Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">{t('settingsSummary') || 'Settings Summary'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700">
              <span className="font-medium">{t('company') || 'Company'}:</span> {formData.companyName || t('notSet') || 'Not Set'}
            </p>
          </div>
          <div>
            <p className="text-blue-700">
              <span className="font-medium">{t('defaultCurrency') || 'Currency'}:</span> {formData.defaultCurrency}
            </p>
          </div>
          <div>
            <p className="text-blue-700">
              <span className="font-medium">{t('email') || 'Email'}:</span> {formData.companyEmail || t('notSet') || 'Not Set'}
            </p>
          </div>
          <div>
            <p className="text-blue-700">
              <span className="font-medium">{t('defaultTaxRate') || 'Tax Rate'}:</span> {formData.defaultTaxRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
