import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import { GuestOnly, HomeRedirect, RequireAuth } from './routes/guards.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import ActivatePage from './features/auth/ActivatePage.jsx';
import ResidentsPage from './features/residents/ResidentsPage.jsx';
import ResidentDetailPage from './features/residents/ResidentDetailPage.jsx';
import ResidentFormPage from './features/residents/ResidentFormPage.jsx';
import ApprovalsPage from './features/admin/ApprovalsPage.jsx';
import FamilyPage from './features/family/FamilyPage.jsx';
import AdminPlaceholder from './features/admin/AdminPlaceholder.jsx';
import NotFoundPage from './features/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/activate/:token" element={<ActivatePage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<HomeRedirect />} />

              <Route element={<RequireAuth roles={['admin', 'operator']} />}>
                <Route path="/residents" element={<ResidentsPage />} />
                <Route path="/residents/new" element={<ResidentFormPage />} />
                <Route path="/residents/:id" element={<ResidentDetailPage />} />
                <Route path="/residents/:id/edit" element={<ResidentFormPage />} />
              </Route>

              <Route element={<RequireAuth roles={['relative']} />}>
                <Route path="/family" element={<FamilyPage />} />
              </Route>

              <Route element={<RequireAuth roles={['admin']} />}>
                <Route path="/admin/approvals" element={<ApprovalsPage />} />
                <Route path="/admin/users" element={<AdminPlaceholder title="Tài khoản" />} />
                <Route path="/admin/audit" element={<AdminPlaceholder title="Nhật ký hoạt động" />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
