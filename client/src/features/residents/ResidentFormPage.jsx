import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { residentsApi } from '../../api/residents.js';
import { useToast } from '../../hooks/useToast.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, ErrorState, Loading } from '../../components/StateViews.jsx';
import { FALL_RISK, GENDER, MOBILITY, STATUS, options } from '../../utils/labels.js';
import { validateResident } from '../../validation/resident.js';
import { errorMessage } from '../../utils/messages.js';

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY = {
  fullName: '', dateOfBirth: '', gender: '', room: '', admissionDate: TODAY,
  status: 'active', mobilityLevel: 'independent', fallRisk: 'low',
  dietNotes: '', cognitiveStatus: '', primaryDoctor: '', preferredHospital: '',
};

// 'archived' is set only through the archive flow, never from this form.
const EDITABLE_STATUS = options(STATUS).filter((o) => o.value !== 'archived');

/** Create (/residents/new) and edit (/residents/:id/edit) share this form. */
export default function ResidentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [loadState, setLoadState] = useState({ loading: isEdit, error: null });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    residentsApi.get(id)
      .then((r) => {
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, r[k] ?? ''])));
        setLoadState({ loading: false, error: r.status === 'archived' ? 'Hồ sơ đã lưu trữ. Khôi phục hồ sơ trước khi chỉnh sửa.' : null });
      })
      .catch((err) => setLoadState({ loading: false, error: errorMessage(err) }));
  }, [id, isEdit]);

  const field = (name) => ({
    name,
    value: form[name],
    error: errors[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateResident(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      setFormError('Vui lòng kiểm tra lại các ô được đánh dấu.');
      return;
    }

    setSaving(true);
    try {
      const saved = isEdit ? await residentsApi.update(id, form) : await residentsApi.create(form);
      toast(isEdit ? 'Đã lưu thay đổi.' : `Đã thêm ${saved.fullName} (${saved.residentCode}).`);
      navigate(`/residents/${saved.id}`);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loadState.loading) return <Loading />;
  if (loadState.error) return <ErrorState message={loadState.error} />;

  return (
    <section>
      <Link to={isEdit ? `/residents/${id}` : '/residents'} className="back-link">‹ Quay lại</Link>
      <h1>{isEdit ? 'Sửa hồ sơ' : 'Thêm người cao tuổi'}</h1>

      <form className="card form-grid" onSubmit={handleSubmit} noValidate>
        <Alert>{formError}</Alert>

        <fieldset>
          <legend>Thông tin cơ bản</legend>
          <div className="grid-2">
            <FormField label="Họ và tên" required autoComplete="off" {...field('fullName')} />
            <FormField as="select" label="Giới tính" required placeholder="Chọn…" options={options(GENDER)} {...field('gender')} />
            <FormField type="date" label="Ngày sinh" required max={TODAY} {...field('dateOfBirth')} />
            <FormField type="date" label="Ngày nhập viện" required max={TODAY} {...field('admissionDate')} />
            <FormField label="Phòng" placeholder="VD: A101" {...field('room')} />
            {isEdit && <FormField as="select" label="Tình trạng" options={EDITABLE_STATUS} {...field('status')} />}
          </div>
        </fieldset>

        <fieldset>
          <legend>Chăm sóc</legend>
          <div className="grid-2">
            <FormField as="select" label="Khả năng đi lại" options={options(MOBILITY)} {...field('mobilityLevel')} />
            <FormField as="select" label="Nguy cơ té ngã" options={options(FALL_RISK)} {...field('fallRisk')} />
            <FormField label="Chế độ ăn" placeholder="VD: Ít muối, cháo mềm" {...field('dietNotes')} />
            <FormField label="Tình trạng nhận thức" placeholder="VD: Tỉnh táo" {...field('cognitiveStatus')} />
            <FormField label="Bác sĩ phụ trách" {...field('primaryDoctor')} />
            <FormField label="Bệnh viện ưu tiên" {...field('preferredHospital')} />
          </div>
        </fieldset>

        <div className="actions">
          <Link to={isEdit ? `/residents/${id}` : '/residents'} className="btn btn-secondary">Hủy</Link>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Thêm hồ sơ'}</button>
        </div>
      </form>
    </section>
  );
}
