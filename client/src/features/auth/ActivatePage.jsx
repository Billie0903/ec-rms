import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../api/auth.js';
import { homePathFor, useAuth } from '../../hooks/useAuth.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, Loading } from '../../components/StateViews.jsx';
import { validateActivation } from '../../validation/auth.js';
import { errorMessage, ROLE_LABELS } from '../../utils/messages.js';

const INVITE_ERRORS = {
  NOT_FOUND: 'Đường dẫn kích hoạt không hợp lệ.',
  GONE: 'Đường dẫn đã được sử dụng hoặc đã hết hạn. Vui lòng đăng nhập hoặc liên hệ trung tâm để nhận đường dẫn mới.',
  FORBIDDEN: 'Tài khoản đã bị khóa. Vui lòng liên hệ trung tâm.',
};

/** Registration step: an invited user sets their password and accepts the privacy notice. */
export default function ActivatePage() {
  const { token } = useParams();
  const { activate } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '', acceptPrivacy: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    authApi.checkInvite(token)
      .then(setInvite)
      .catch((err) => setLoadError(errorMessage(err, INVITE_ERRORS)));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateActivation(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await activate({ token, ...form });
      navigate(homePathFor(user), { replace: true });
    } catch (err) {
      setFormError(errorMessage(err, INVITE_ERRORS));
    } finally {
      setSubmitting(false);
    }
  }

  if (!invite && !loadError) return <Loading label="Đang kiểm tra đường dẫn…" />;

  if (loadError) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h1>Kích hoạt tài khoản</h1>
          <Alert>{loadError}</Alert>
          <Link className="btn btn-secondary btn-block" to="/login">Về trang đăng nhập</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Kích hoạt tài khoản</h1>
        <p>Xin chào <strong>{invite.fullName}</strong> ({ROLE_LABELS[invite.role]}).</p>
        <p className="muted">Email đăng nhập: {invite.email}</p>

        <Alert>{formError}</Alert>

        <FormField label="Mật khẩu mới" type="password" autoComplete="new-password" hint="Ít nhất 8 ký tự, gồm cả chữ và số."
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <FormField label="Nhập lại mật khẩu" type="password" autoComplete="new-password"
          value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

        <div className="privacy-box">
          <p>
            Trung tâm chỉ cho phép bạn xem thông tin của người thân đã được đăng ký với bạn, theo sự đồng ý
            đã ghi nhận khi nhập viện. Thông tin sức khỏe là dữ liệu cá nhân nhạy cảm: vui lòng không chia sẻ
            tài khoản hoặc thông tin với người khác.
          </p>
          <label className="checkbox">
            <input type="checkbox" checked={form.acceptPrivacy}
              onChange={(e) => setForm({ ...form, acceptPrivacy: e.target.checked })} />
            Tôi đã đọc và đồng ý với thông báo bảo mật.
          </label>
          {errors.acceptPrivacy && <small className="field-error">{errors.acceptPrivacy}</small>}
        </div>

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Đang kích hoạt…' : 'Kích hoạt và đăng nhập'}
        </button>
      </form>
    </div>
  );
}
