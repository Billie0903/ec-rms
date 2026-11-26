import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Badge } from '../../components/Badge.jsx';
import { CopyLink } from '../../components/CopyLink.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { ACCOUNT_STATUS, formatDate, options } from '../../utils/labels.js';
import { ROLE_LABELS, errorMessage } from '../../utils/messages.js';
import { validatePerson } from '../../validation/admin.js';

const STATUS_TONE = { invited: 'pending', active: 'approved', disabled: 'rejected' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useFetch(() => adminApi.listUsers({ role, q: dq }), [role, dq]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);

  async function resend(u) {
    try { setInviteResult({ ...(await adminApi.resendInvite(u.id)), name: u.full_name }); } catch (err) { toast(errorMessage(err), 'error'); }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Tài khoản</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Tạo tài khoản</button>
      </div>

      <div className="toolbar card">
        <input className="input search" type="search" placeholder="Tìm theo tên, email, số điện thoại…" aria-label="Tìm kiếm" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Lọc theo vai trò" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Mọi vai trò</option>
          {options(ROLE_LABELS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title="Không tìm thấy tài khoản" />
      ) : (
        <table className="table responsive-table">
          <thead><tr><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th /></tr></thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <td data-label="Họ tên"><strong>{u.full_name}</strong>{u.id === me.id && <span className="muted"> (bạn)</span>}
                  {u.role === 'relative' && <div className="muted small">{u.linkedResidents} người được liên kết</div>}</td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Điện thoại">{u.phone || '—'}</td>
                <td data-label="Vai trò">{ROLE_LABELS[u.role]}</td>
                <td data-label="Trạng thái"><Badge value={STATUS_TONE[u.status]} label={ACCOUNT_STATUS[u.status]} /></td>
                <td data-label="Đăng nhập gần nhất">{formatDate(u.last_login_at, true)}</td>
                <td data-label="">
                  <div className="row-actions">
                    <button className="btn btn-link" onClick={() => setEditing(u)}>Sửa</button>
                    {u.status === 'invited' && <button className="btn btn-link" onClick={() => resend(u)}>Gửi lại link</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CreateUserModal open={creating} onClose={() => setCreating(false)}
        onCreated={(res) => { setCreating(false); setInviteResult({ ...res, name: res.user.full_name }); reload(); }} />
      <EditUserModal user={editing} isSelf={editing?.id === me.id} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); toast('Đã cập nhật tài khoản.'); reload(); }} />
      <Modal open={Boolean(inviteResult)} title={`Đường dẫn kích hoạt cho ${inviteResult?.name ?? ''}`} onClose={() => setInviteResult(null)}>
        {inviteResult && <CopyLink link={inviteResult.activationLink} emailSent={inviteResult.emailSent} />}
        <div className="actions"><button className="btn btn-secondary" onClick={() => setInviteResult(null)}>Xong</button></div>
      </Modal>
    </section>
  );
}

function CreateUserModal({ open, onClose, onCreated }) {
  const blank = { fullName: '', email: '', phone: '', role: '' };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = (name) => ({ name, value: form[name], error: errors[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) });
  const close = () => { setForm(blank); setErrors({}); setFormError(''); onClose(); };

  async function submit(e) {
    e.preventDefault();
    const found = validatePerson(form, { requireRole: true });
    setErrors(found); setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const res = await adminApi.createUser(form);
      setForm(blank);
      onCreated(res);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      setFormError(errorMessage(err, { CONFLICT: 'Email này đã được dùng cho tài khoản khác.' }));
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} title="Tạo tài khoản" onClose={close}>
      <form onSubmit={submit} noValidate>
        <p className="muted small">Người dùng sẽ nhận đường dẫn để tự đặt mật khẩu. Để liên kết người thân với người cao tuổi, hãy dùng tab “Người thân” trong hồ sơ.</p>
        <Alert>{formError}</Alert>
        <FormField label="Họ và tên" required {...field('fullName')} />
        <FormField type="email" label="Email" required {...field('email')} />
        <FormField type="tel" label="Số điện thoại" {...field('phone')} />
        <FormField as="select" label="Vai trò" required placeholder="Chọn…" options={options(ROLE_LABELS)} {...field('role')} />
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo và lấy đường dẫn'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, isSelf, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = form ?? (user && { fullName: user.full_name, phone: user.phone ?? '', role: user.role, status: user.status });
  const close = () => { setForm(null); setFormError(''); onClose(); };

  async function submit(e) {
    e.preventDefault();
    const body = { fullName: current.fullName, phone: current.phone, role: current.role };
    if (current.status !== user.status) body.status = current.status;
    if (current.role === 'admin' && user.role !== 'admin' && !window.confirm(`Cấp quyền Quản trị viên cho ${user.full_name}? Quản trị viên có toàn quyền trên hệ thống.`)) return;
    setBusy(true);
    try { await adminApi.updateUser(user.id, body); setForm(null); onSaved(); } catch (err) { setFormError(errorMessage(err)); } finally { setBusy(false); }
  }

  const set = (k) => (e) => setForm({ ...current, [k]: e.target.value });

  return (
    <Modal open={Boolean(user)} title="Sửa tài khoản" onClose={close}>
      {user && (
        <form onSubmit={submit} noValidate>
          <Alert>{formError}</Alert>
          <p className="muted small">{user.email}</p>
          <FormField label="Họ và tên" value={current.fullName} onChange={set('fullName')} />
          <FormField type="tel" label="Số điện thoại" value={current.phone} onChange={set('phone')} />
          <FormField as="select" label="Vai trò" options={options(ROLE_LABELS)} value={current.role} onChange={set('role')}
            hint={current.role === 'admin' && user.role !== 'admin' ? 'Người này sẽ có toàn quyền quản trị.' : undefined} />
          {user.status !== 'invited' && !isSelf && (
            <FormField as="select" label="Trạng thái" value={current.status} onChange={set('status')}
              options={[{ value: 'active', label: 'Đang hoạt động' }, { value: 'disabled', label: 'Khóa tài khoản' }]} />
          )}
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
