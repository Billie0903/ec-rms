import { useState } from 'react';
import { careApi } from '../../api/care.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useInlineForm } from '../../hooks/useInlineForm.js';
import { useToast } from '../../hooks/useToast.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { ROUTE, formatDate, options } from '../../utils/labels.js';
import { validateMedication } from '../../validation/care.js';
import { errorMessage } from '../../utils/messages.js';

const TODAY = new Date().toISOString().slice(0, 10);
const BLANK = { name: '', dosage: '', route: 'oral', timesOfDay: ['08:00'], instructions: '', startDate: TODAY, endDate: '', prescribedBy: '' };

export default function MedicationsTab({ residentId, readOnly }) {
  const toast = useToast();
  const [showStopped, setShowStopped] = useState(false);
  const { data, loading, error, reload } = useFetch(() => careApi.listMedications(residentId, showStopped), [residentId, showStopped]);
  const f = useInlineForm(BLANK, validateMedication);

  const setTime = (i, v) => f.setForm((x) => ({ ...x, timesOfDay: x.timesOfDay.map((t, j) => (j === i ? v : t)) }));

  async function stop(med) {
    if (!window.confirm(`Ngưng thuốc ${med.name}?`)) return;
    try { await careApi.stopMedication(med.id); toast('Đã ngưng thuốc.'); reload(); } catch (err) { toast(errorMessage(err), 'error'); }
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2>Thuốc đang dùng</h2>
        <div className="header-actions">
          <label className="checkbox small"><input type="checkbox" checked={showStopped} onChange={(e) => setShowStopped(e.target.checked)} /> Hiện thuốc đã ngưng</label>
          {!readOnly && f.editing === null && <button className="btn btn-secondary" onClick={() => f.open(null)}>+ Thêm thuốc</button>}
        </div>
      </div>

      {f.editing !== null && (
        <form className="inline-form" noValidate onSubmit={async (e) => {
          const ok = await f.submit(e, (body, id) => (id === 'new' ? careApi.createMedication(residentId, body) : careApi.updateMedication(id, body)));
          if (ok) { toast('Đã lưu thuốc.'); reload(); }
        }}>
          <Alert>{f.formError}</Alert>
          <div className="grid-2">
            <FormField label="Tên thuốc" required {...f.field('name')} />
            <FormField label="Liều dùng" required placeholder="VD: 5 mg" {...f.field('dosage')} />
            <FormField as="select" label="Đường dùng" options={options(ROUTE)} {...f.field('route')} />
            <FormField label="Bác sĩ kê đơn" {...f.field('prescribedBy')} />
            <FormField type="date" label="Ngày bắt đầu" required {...f.field('startDate')} />
            <FormField type="date" label="Ngày kết thúc" {...f.field('endDate')} />
          </div>
          <div className="field">
            <label>Giờ dùng <span className="required">*</span></label>
            <div className="time-list">
              {f.form.timesOfDay.map((t, i) => (
                <span key={i} className="time-item">
                  <input type="time" className="input" aria-label={`Giờ ${i + 1}`} value={t} onChange={(e) => setTime(i, e.target.value)} />
                  {f.form.timesOfDay.length > 1 && (
                    <button type="button" className="btn btn-link danger" aria-label="Xóa giờ"
                      onClick={() => f.setForm((x) => ({ ...x, timesOfDay: x.timesOfDay.filter((_, j) => j !== i) }))}>✕</button>
                  )}
                </span>
              ))}
              <button type="button" className="btn btn-link" onClick={() => f.setForm((x) => ({ ...x, timesOfDay: [...x.timesOfDay, '20:00'] }))}>+ thêm giờ</button>
            </div>
            {f.errors.timesOfDay && <small className="field-error">{f.errors.timesOfDay}</small>}
          </div>
          <FormField as="textarea" label="Hướng dẫn" placeholder="VD: Uống sau ăn" {...f.field('instructions')} />
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={f.close}>Hủy</button>
            <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        </form>
      )}

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title="Chưa có thuốc nào" />
      ) : (
        <ul className="record-list">
          {data.map((m) => (
            <li key={m.id} className={m.active ? undefined : 'inactive'}>
              <div>
                <strong>{m.name}</strong> · {m.dosage} <span className="muted">({ROUTE[m.route]})</span>
                {!m.active && <span className="pill pill-gray"> Đã ngưng</span>}
                <div className="time-pills">{m.timesOfDay.map((t) => <span key={t} className="pill pill-green">{t}</span>)}</div>
                {m.instructions && <div className="small">{m.instructions}</div>}
                <div className="muted small">
                  Từ {formatDate(m.startDate)}{m.endDate && ` đến ${formatDate(m.endDate)}`}{m.prescribedBy && ` · ${m.prescribedBy}`}
                </div>
              </div>
              {!readOnly && m.active && (
                <div className="row-actions">
                  <button className="btn btn-link" onClick={() => f.open(m, (x) => ({ ...x, instructions: x.instructions ?? '', endDate: x.endDate ?? '', prescribedBy: x.prescribedBy ?? '' }))}>Sửa</button>
                  <button className="btn btn-link danger" onClick={() => stop(m)}>Ngưng</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
