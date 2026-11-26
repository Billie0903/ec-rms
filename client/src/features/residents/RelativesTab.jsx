import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Badge } from '../../components/Badge.jsx';
import { CopyLink } from '../../components/CopyLink.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { ACCESS_LEVEL, ACCOUNT_STATUS, formatDate, options } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';
import { validateLink } from '../../validation/admin.js';

/** Who may see this resident's information. Staff can view; only Admins change links. */
export default function RelativesTab({ residentId, residentName, readOnly }) {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin' && !readOnly;
  const { data, loading, error, reload } = useFetch(() => adminApi.listRelatives(residentId), [residentId]);
  const [adding, setAdding] = useState(false);
  const [invite, setInvite] = useState(null);

  async function change(link, body, message) {
    try { await adminApi.updateLink(link.id, body); toast(message); reload(); } catch (err) { toast(errorMessage(err), 'error'); }
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2>Người thân được xem thông tin</h2>
        {isAdmin && <button className="btn btn-secondary" onClick={() => setAdding(true)}>+ Thêm người thân</button>}
      </div>
      <p className="muted small">
        <strong>Đầy đủ:</strong> xem lịch, tóm tắt, sức khỏe, thuốc và ghi chú được chia sẻ. <strong>Cơ bản:</strong> chỉ xem lịch và tóm tắt tuần.
      </p>

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title="Chưa có người thân nào được liên kết"
          action={isAdmin && <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Thêm người thân</button>} />
      ) : (
        <ul className="record-list">
          {data.map((l) => (
            <li key={l.id} className={l.active ? undefined : 'inactive'}>
              <div>
                <strong>{l.fullName}</strong> · {l.relationship}{' '}
                <Badge value={l.accessLevel === 'full' ? 'approved' : 'cancelled'} label={`Quyền ${ACCESS_LEVEL[l.accessLevel].toLowerCase()}`} />
                {l.isLegalGuardian && <span className="pill pill-amber">Người giám hộ</span>}
                {l.isEmergencyContact && <span className="pill pill-red">Liên hệ khẩn cấp</span>}
                {!l.active && <span className="pill pill-gray">Đã hủy liên kết</span>}
                <div className="muted small">{l.email}{l.phone && ` · ${l.phone}`} · {ACCOUNT_STATUS[l.accountStatus]}</div>
                <div className="muted small">
                  Đồng ý ghi nhận {formatDate(l.consentRecordedAt)}{l.consentRecordedByName && ` bởi ${l.consentRecordedByName}`}{l.consentNote && ` · ${l.consentNote}`}
                </div>
              </div>
              {isAdmin && (
                <div className="row-actions">
                  {l.active ? (
                    <>
                      <button className="btn btn-link" onClick={() => change(l, { accessLevel: l.accessLevel === 'full' ? 'basic' : 'full' }, 'Đã đổi quyền xem.')}>
                        Đổi sang {l.accessLevel === 'full' ? 'cơ bản' : 'đầy đủ'}
                      </button>
                      <button className="btn btn-link danger" onClick={() => window.confirm(`Hủy liên kết ${l.fullName}? Người này sẽ không xem được thông tin của ${residentName} nữa.`) && change(l, { active: false }, 'Đã hủy liên kết.')}>
                        Hủy liên kết
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-link" onClick={() => change(l, { active: true }, 'Đã liên kết lại.')}>Liên kết lại</button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <AddRelativeModal open={adding} residentId={residentId} residentName={residentName} linkedIds={(data ?? []).filter((l) => l.active).map((l) => l.relativeUserId)} onClose={() => setAdding(false)}
          onDone={(res) => { setAdding(false); toast('Đã liên kết người thân.'); if (res.activationLink) setInvite(res); reload(); }} />
      )}
      <Modal open={Boolean(invite)} title="Gửi đường dẫn kích hoạt" onClose={() => setInvite(null)}>
        {invite && <CopyLink link={invite.activationLink} emailSent={invite.emailSent} />}
        <div className="actions"><button className="btn btn-secondary" onClick={() => setInvite(null)}>Xong</button></div>
      </Modal>
    </div>
  );
}

const BLANK = {
  mode: 'new', relativeUserId: '', fullName: '', email: '', phone: '',
  relationship: '', accessLevel: 'basic', isEmergencyContact: false, isLegalGuardian: false, consentNote: '', consentConfirmed: false,
};

function AddRelativeModal({ open, residentId, residentName, linkedIds, onClose, onDone }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: relatives } = useFetch(() => (open ? adminApi.listUsers({ role: 'relative' }) : Promise.resolve([])), [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const field = (k) => ({ name: k, value: form[k], error: errors[k], onChange: set(k) });
  const close = () => { setForm(BLANK); setErrors({}); setFormError(''); onClose(); };

  async function submit(e) {
    e.preventDefault();
    const found = validateLink(form);
    setErrors(found); setFormError('');
    if (Object.keys(found).length) return;
    const body = {
      relationship: form.relationship, accessLevel: form.accessLevel, isEmergencyContact: form.isEmergencyContact,
      isLegalGuardian: form.isLegalGuardian, consentNote: form.consentNote, consentConfirmed: form.consentConfirmed,
      ...(form.mode === 'existing'
        ? { relativeUserId: Number(form.relativeUserId) }
        : { newRelative: { fullName: form.fullName, email: form.email, phone: form.phone } }),
    };
    setBusy(true);
    try { const res = await adminApi.linkRelative(residentId, body); setForm(BLANK); onDone(res); } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k.replace('newRelative.', ''), v])));
      setFormError(errorMessage(err, { CONFLICT: 'Người này đã được liên kết, hoặc email đã được dùng.' }));
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} title={`Thêm người thân cho ${residentName}`} onClose={close}>
      <form onSubmit={submit} noValidate>
        <Alert>{formError}</Alert>
        <div className="segmented full" role="group" aria-label="Loại tài khoản">
          <button type="button" className={form.mode === 'new' ? 'active' : ''} onClick={() => setForm({ ...form, mode: 'new' })}>Tài khoản mới</button>
          <button type="button" className={form.mode === 'existing' ? 'active' : ''} onClick={() => setForm({ ...form, mode: 'existing' })}>Đã có tài khoản</button>
        </div>

        {form.mode === 'new' ? (
          <div className="grid-2">
            <FormField label="Họ và tên" required {...field('fullName')} />
            <FormField type="tel" label="Số điện thoại" {...field('phone')} />
            <FormField type="email" label="Email" required {...field('email')} />
          </div>
        ) : (
          <FormField as="select" label="Tài khoản người thân" required placeholder="Chọn…"
            options={(relatives ?? []).filter((u) => !linkedIds.includes(u.id)).map((u) => ({ value: String(u.id), label: `${u.full_name} (${u.email})` }))} {...field('relativeUserId')} />
        )}

        <div className="grid-2">
          <FormField label="Quan hệ" required placeholder="VD: Con gái" {...field('relationship')} />
          <FormField as="select" label="Quyền xem" options={options(ACCESS_LEVEL)} {...field('accessLevel')} />
        </div>
        <label className="checkbox"><input type="checkbox" checked={form.isLegalGuardian} onChange={set('isLegalGuardian')} /> Người giám hộ hợp pháp</label>
        <label className="checkbox"><input type="checkbox" checked={form.isEmergencyContact} onChange={set('isEmergencyContact')} /> Liên hệ khi khẩn cấp</label>
        <FormField label="Ghi chú về sự đồng ý" placeholder="VD: Mẫu đồng ý ký ngày 26/11/2026" {...field('consentNote')} />

        <div className="privacy-box">
          <label className="checkbox">
            <input type="checkbox" checked={form.consentConfirmed} onChange={set('consentConfirmed')} />
            Tôi xác nhận {residentName} (hoặc người giám hộ hợp pháp) đã đồng ý cho người này xem thông tin theo quyền đã chọn.
          </label>
          {errors.consentConfirmed && <small className="field-error">{errors.consentConfirmed}</small>}
        </div>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Liên kết'}</button>
        </div>
      </form>
    </Modal>
  );
}
