import { useState } from 'react';
import { careApi } from '../../api/care.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useInlineForm } from '../../hooks/useInlineForm.js';
import { useToast } from '../../hooks/useToast.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { NOTE_CATEGORY, formatDate, options } from '../../utils/labels.js';
import { validateCareNote } from '../../validation/care.js';
import { errorMessage } from '../../utils/messages.js';

const BLANK = { category: 'daily', note: '', visibleToFamily: false };

export default function CareNotesTab({ residentId, readOnly }) {
  const { user } = useAuth();
  const toast = useToast();
  const [category, setCategory] = useState('');
  const { data, loading, error, reload } = useFetch(() => careApi.listCareNotes(residentId, category), [residentId, category]);
  const f = useInlineForm(BLANK, validateCareNote);

  async function remove(n) {
    if (!window.confirm('Xóa ghi chú này?')) return;
    try { await careApi.deleteCareNote(n.id); toast('Đã xóa ghi chú.'); reload(); } catch (err) { toast(errorMessage(err), 'error'); }
  }

  const canEdit = (n) => !readOnly && (user.role === 'admin' || n.authorId === user.id);

  return (
    <div className="card">
      <div className="section-header">
        <h2>Ghi chú chăm sóc</h2>
        <div className="header-actions">
          <select className="input" aria-label="Lọc theo loại" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Tất cả loại</option>
            {options(NOTE_CATEGORY).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {!readOnly && f.editing === null && <button className="btn btn-secondary" onClick={() => f.open(null)}>+ Thêm ghi chú</button>}
        </div>
      </div>

      {f.editing !== null && (
        <form className="inline-form" noValidate onSubmit={async (e) => {
          const ok = await f.submit(e, (body, id) => (id === 'new' ? careApi.createCareNote(residentId, body) : careApi.updateCareNote(id, body)));
          if (ok) { toast('Đã lưu ghi chú.'); reload(); }
        }}>
          <Alert>{f.formError}</Alert>
          <FormField as="select" label="Loại" options={options(NOTE_CATEGORY)} {...f.field('category')} />
          <FormField as="textarea" label="Nội dung" required rows={4} {...f.field('note')} />
          <label className="checkbox">
            <input type="checkbox" name="visibleToFamily" checked={f.form.visibleToFamily} onChange={f.field('visibleToFamily').onChange} />
            Cho phép gia đình xem ghi chú này
          </label>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={f.close}>Hủy</button>
            <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        </form>
      )}

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title="Chưa có ghi chú nào" />
      ) : (
        <ul className="timeline">
          {data.map((n) => (
            <li key={n.id} className={n.category === 'incident' ? 'incident' : undefined}>
              <div className="timeline-meta">
                <span className={`pill ${n.category === 'incident' ? 'pill-red' : 'pill-gray'}`}>{NOTE_CATEGORY[n.category]}</span>
                {n.visibleToFamily && <span className="pill pill-green">Gia đình xem được</span>}
                <span className="muted small">{formatDate(n.createdAt, true)} · {n.authorName || '—'}</span>
              </div>
              <p>{n.note}</p>
              {canEdit(n) && (
                <div className="row-actions">
                  <button className="btn btn-link" onClick={() => f.open(n, (x) => ({ category: x.category, note: x.note, visibleToFamily: x.visibleToFamily }))}>Sửa</button>
                  {user.role === 'admin' && <button className="btn btn-link danger" onClick={() => remove(n)}>Xóa</button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
