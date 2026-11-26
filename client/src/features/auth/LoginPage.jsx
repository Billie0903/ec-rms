import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert } from '../../components/StateViews.jsx';
import { validateLogin } from '../../validation/auth.js';
import { errorMessage } from '../../utils/messages.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || homePathFor(user), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err, {
        UNAUTHORIZED: 'Email hoặc mật khẩu không đúng.',
        FORBIDDEN: 'Tài khoản đã bị khóa. Vui lòng liên hệ trung tâm.',
      }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Đăng nhập</h1>
        <p className="muted">Hệ thống quản lý người cao tuổi</p>

        <Alert>{formError}</Alert>

        <FormField label="Email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
        <FormField label="Mật khẩu" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} error={errors.password} />

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        <p className="muted small">Người thân chưa có tài khoản? Trung tâm sẽ gửi đường dẫn kích hoạt qua email hoặc Zalo.</p>
      </form>
    </div>
  );
}
