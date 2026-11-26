import { useState } from 'react';
import { careApi } from '../../api/care.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useInlineForm } from '../../hooks/useInlineForm.js';
import { useToast } from '../../hooks/useToast.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { SCHEDULE_TYPE, dayLabel, options, timeOf } from '../../utils/labels.js';
import { validateSchedule } from '../../validation/care.js';
import { errorMessage } from '../../utils/messages.js';

const BLANK = { title: '', type: 'activity', startAt: '', endAt: '', location: '', notes: '' };
const TONE = { activity: 'green', appointment: 'red', therapy: 'amber', visit: 'gray' };
const toInput = (dt) => (dt ? String(dt).replace(' ', 'T').slice(0, 16) : '');

/** Schedule items grouped by day. Also used read-only on the family page. */
export function ScheduleList({ items }) {
  const groups = items.reduce((acc, s) => {
    const key = dayLabel(s.startAt);
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  return Object.entries(groups).map(([day, list]) => (
    <div key={day} className="day-group">
      <h3>{day}</h3>
      <ul className="record-list">
        {list.map((s) => (
          <li key={s.id}>
            <div>
              <strong>{timeOf(s.startAt)}{s.endAt && `–${timeOf(s.endAt)}`}</strong> · {s.title}{' '}
              <span className={`pill pill-${TONE[s.type]}`}>{SCHEDULE_TYPE[s.type]}</span>
              {(s.location || s.notes) && <div className="muted small">{[s.location, s.notes].filter(Boolean).join(' · ')}</div>}
            </div>
            {s.actions}
          </li>
        ))}
      </ul>
    </div>
  ));
}

export default function ScheduleTab({ residentId, readOnly }) {
  const toast = useToast();
  const [when, setWhen] = useState('upcoming');
  const { data, loading, error, reload } = useFetch(() => careApi.listSchedules(residentId, when), [residentId, when]);
  const f = useInlineForm(BLANK, validateSchedule);

  async function remove(s) {
    if (!window.confirm(`Xóa “${s.title}”?`)) return;
    try { await careApi.deleteSchedule(s.id); toast('Đã xóa lịch.'); reload(); } catch (err) { toast(errorMessage(err), 'error'); }
  }

  const items = (data ?? []).map((s) => ({
    ...s,
    actions: !readOnly && (
      <div className="row-actions">
        <button className="btn btn-link" onClick={() => f.open(s, (x) => ({ ...x, startAt: toInput(x.startAt), endAt: toInput(x.endAt), location: x.location ?? '', notes: x.notes ?? '' }))}>Sửa</button>
        <button className="btn btn-link danger" onClick={() => remove(s)}>Xóa</button>
      </div>
    ),
  }));

  return (
    <div className="card">
      <div className="section-header">
        <h2>Lịch</h2>
        <div className="header-actions">
          <div className="segmented" role="group" aria-label="Thời gian">
            <button className={when === 'upcoming' ? 'active' : ''} onClick={() => setWhen('upcoming')}>Sắp tới</button>
            <button className={when === 'past' ? 'active' : ''} onClick={() => setWhen('past')}>Đã qua</button>
          </div>
          {!readOnly && f.editing === null && <button className="btn btn-secondary" onClick={() => f.open(null)}>+ Thêm lịch</button>}
        </div>
      </div>

      {f.editing !== null && (
        <form className="inline-form" noValidate onSubmit={async (e) => {
          const ok = await f.submit(e, (body, id) => (id === 'new' ? careApi.createSchedule(residentId, body) : careApi.updateSchedule(id, body)));
          if (ok) { toast('Đã lưu lịch.'); reload(); }
        }}>
          <Alert>{f.formError}</Alert>
          <div className="grid-2">
            <FormField label="Tiêu đề" required {...f.field('title')} />
            <FormField as="select" label="Loại" options={options(SCHEDULE_TYPE)} {...f.field('type')} />
            <FormField type="datetime-local" label="Bắt đầu" required {...f.field('startAt')} />
            <FormField type="datetime-local" label="Kết thúc" {...f.field('endAt')} />
            <FormField label="Địa điểm" {...f.field('location')} />
            <FormField label="Ghi chú" {...f.field('notes')} />
          </div>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={f.close}>Hủy</button>
            <button className="btn btn-primary" disabled={f.busy}>{f.busy ? 'Đang lưu…' : 'Lưu'}</button>
          </div>
        </form>
      )}

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState title={when === 'upcoming' ? 'Chưa có lịch nào sắp tới' : 'Không có lịch đã qua'}
          action={!readOnly && when === 'upcoming' && f.editing === null && <button className="btn btn-primary" onClick={() => f.open(null)}>+ Thêm lịch</button>} />
      ) : (
        <ScheduleList items={items} />
      )}
    </div>
  );
}
