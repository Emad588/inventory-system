import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRTL = lang === 'ar';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError(t('emailPasswordRequired'));
        toast.error(t('emailPasswordRequired'));
        setLoading(false);
        return;
      }

      const result = await login(email, password);

      if (result.success) {
        toast.success(t('loginSuccess'));
        navigate('/');
      } else {
        setError(result.message || t('loginFailed'));
        toast.error(result.message || t('loginFailed'));
      }
    } catch (err) {
      const errorMessage = err.message || t('loginError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle Button */}
      <button
        onClick={toggleLang}
        className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} bg-white text-primary-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 font-medium text-sm`}
      >
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Main Login Card */}
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-12 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('appName') || 'Medco'}
            </h1>
            <p className="text-primary-100">
              {t('inventorySystem') || 'Inventory Management System'}
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {t('login')}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {t('loginDescription') || 'Sign in to your account to continue'}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className={`w-5 h-5 text-red-600 ${isRTL ? 'ml-3' : 'mr-3'} flex-shrink-0 mt-0.5`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('enterEmail') || 'your@email.com'}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                    isRTL ? 'text-right' : 'text-left'
                  } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t('password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword') || '••••••••'}
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all duration-200 placeholder-gray-400 ${
                    isRTL ? 'text-right' : 'text-left'
                  } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{t('loggingIn') || 'Logging in...'}</span>
                  </>
                ) : (
                  <span>{t('login')}</span>
                )}
              </button>
            </form>

            {/* Footer Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                {t('needHelp') || 'Need help?'}{' '}
                <a
                  href="#support"
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
                >
                  {t('contactSupport') || 'Contact support'}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs flex items-center justify-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t('secureConnection') || 'Secure connection'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
