import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LangProvider } from './contexts/LangContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import WarehousesPage from './pages/WarehousesPage';
import TransactionsPage from './pages/TransactionsPage';
import IntegrationPage from './pages/IntegrationPage';
import AuditPage from './pages/AuditPage';
import UsersPage from './pages/UsersPage';
import BillingPage from './pages/BillingPage';
import PurchasePage from './pages/PurchasePage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Layout><ProductsPage /></Layout></PrivateRoute>} />
      <Route path="/warehouses" element={<PrivateRoute><Layout><WarehousesPage /></Layout></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Layout><TransactionsPage /></Layout></PrivateRoute>} />
      <Route path="/billing" element={<PrivateRoute><Layout><BillingPage /></Layout></PrivateRoute>} />
      <Route path="/purchase" element={<PrivateRoute><Layout><PurchasePage /></Layout></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Layout><CustomersPage /></Layout></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Layout><SuppliersPage /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Layout><ReportsPage /></Layout></PrivateRoute>} />
      <Route path="/integration" element={<PrivateRoute><Layout><IntegrationPage /></Layout></PrivateRoute>} />
      <Route path="/audit" element={<AdminRoute><Layout><AuditPage /></Layout></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><Layout><UsersPage /></Layout></AdminRoute>} />
      <Route path="/settings" element={<AdminRoute><Layout><SettingsPage /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
          <AppRoutes />
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
