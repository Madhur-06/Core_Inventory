import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// App pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductListPage from '../pages/products/ProductListPage';
import ProductFormPage from '../pages/products/ProductFormPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import CategoriesPage from '../pages/products/CategoriesPage';
import OperationListPage from '../pages/operations/OperationListPage';
import OperationFormPage from '../pages/operations/OperationFormPage';
import OperationDetailPage from '../pages/operations/OperationDetailPage';
import MoveHistoryPage from '../pages/move-history/MoveHistoryPage';
import SettingsPage from '../pages/settings/SettingsPage';
import WarehouseStockPage from '../pages/settings/WarehouseStockPage';
import ActivityLogPage from '../pages/activity-log/ActivityLogPage';
import ProfilePage from '../pages/profile/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/products/categories" element={<CategoriesPage />} />
        <Route path="/operations/receipts" element={<OperationListPage type="RECEIPT" />} />
        <Route path="/operations/deliveries" element={<OperationListPage type="DELIVERY" />} />
        <Route path="/operations/transfers" element={<OperationListPage type="TRANSFER" />} />
        <Route path="/operations/adjustments" element={<OperationListPage type="ADJUSTMENT" />} />
        <Route path="/operations/new/:type" element={<OperationFormPage />} />
        <Route path="/operations/:id" element={<OperationDetailPage />} />
        <Route path="/move-history" element={<MoveHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/warehouse-stock" element={<WarehouseStockPage />} />
        <Route path="/activity-log" element={<ActivityLogPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
