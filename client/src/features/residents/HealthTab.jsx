import { useState } from 'react';
import { residentsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Badge } from '../../components/Badge.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { ALLERGY_TYPE, SEVERITY, formatDate, options } from '../../utils/labels.js';
import { validateAllergy, validateCondition } from '../../validation/resident.js';
import { errorMessage } from '../../utils/messages.js';

/** Allergies and health conditions, each with inline add / edit / delete. */
export default function HealthTab({ residentId, readOnly }) {
  return (
    <div className="stack">
      <RecordSection
        title="Dị ứng"
        emptyText="Chưa ghi nhận dị ứng nào."
        readOnly={readOnly}
        load={() => residentsApi.listAllergies(residentId)}
        deps={[residentId]}
        blank={{ allergen: '', type: '', reaction: '', severity: 'moderate' }}
        validate={validateAllergy}
        create={(d) => residentsApi.createAllergy(residentId, d)}
        update={(id, d) => residentsApi.updateAllergy(id, d)}
        remove={(id) => residentsApi.deleteAllergy(id)}
        renderItem={(a) => (
          <>
            <strong>{a.allergen}</strong> <span className="muted">({ALLERGY_TYPE[a.type]})</span>{' '}
            <Badge value={a.severity} label={SEVERITY[a.severity]} />
            {a.reaction && <div className="muted small">Phản ứng: {a.reaction}</div>}
          </>
        )}
        renderFields={(field) => (
          <div className="grid-2">
            <FormField label="Chất gây dị ứng" required {...field('allergen')} />
            <FormField as="select" label="Loại" required placeholder="Chọn…" options={options(ALLERGY_TYPE)} {...field('type')} />
            <FormField label="Phản ứng" {...field('reaction')} />
            <FormField as="select" label="Mức độ" options={options(SEVERITY)} {...field('severity')} />
          </div>
        )}
      />

      <RecordSection
        title="Bệnh lý"
        emptyText="Chưa ghi nhận bệnh lý nào."
        readOnly={readOnly}
        load={() => residentsApi.listConditions(residentId)}
        deps={[residentId]}
        blank={{ name: '', sinceDate: '', notes: '' }}
        validate={validateCondition}
        create={(d) => residentsApi.createCondition(residentId, d)}
        update={(id, d) => residentsApi.updateCondition(id, d)}
        remove={(id) => residentsApi.deleteCondition(id)}
        renderItem={(c) => (
          <>
            <strong>{c.name}</strong>{c.sinceDate && <span className="muted"> · từ {formatDate(c.sinceDate)}</span>}
            {c.notes && <div className="muted small">{c.notes}</div>}
          </>
        )}
        renderFields={(field) => (
          <div className="grid-2">
            <FormField label="Tên bệnh" required {...field('name')} />
            <FormField type="date" label="Từ ngày" max={new Date().toISOString().slice(0, 10)} {...field('sinceDate')} />
            <FormField as="textarea" label="Ghi chú" {...field('notes')} />
          </div>
        )}
      />
    </div>
  );
}

function RecordSection({ title, emptyText, readOnly, load, deps, blank, validate, create, update, remove, renderItem, renderFields }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(load, deps);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  function start(item) {
    setEditing(item ? item.id : 'new');
    setForm(item ? Object.fromEntries(Object.keys(blank).map((k) => [k, item[k] ?? ''])) : blank);
    setErrors({}); setFormError('');
  }

  const field = (name) => ({ value: form[name], error: errors[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) });

  async function save(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (editing === 'new') await create(form); else await update(editing, form);
      toast('Đã lưu.');
      setEditing(null);
      reload();
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Xóa mục này?')) return;
    try {
      await remove(item.id);
      toast('Đã xóa.');
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <div className="card">
      <div className="section-header">
        <h2>{title}</h2>
        {!readOnly && editing === null && <button className="btn btn-secondary" onClick={() => start(null)}>+ Thêm</button>}
      </div>

      {editing !== null && (
        <form className="inline-form" onSubmit={save} noValidate>
          <Alert>{formError}</Alert>
          {renderFields(field)}
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Hủy</button>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        </form>
      )}

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <ul className="record-list">
          {data.map((item) => (
            <li key={item.id}>
              <div>{renderItem(item)}</div>
              {!readOnly && (
                <div className="row-actions">
                  <button className="btn btn-link" onClick={() => start(item)}>Sửa</button>
                  <button className="btn btn-link danger" onClick={() => handleDelete(item)}>Xóa</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
