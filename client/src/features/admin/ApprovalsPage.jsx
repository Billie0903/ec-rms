import { useState } from 'react';
import { Link } from 'react-router-dom';
import { archiveRequestsApi } from '../../api/residents.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { FormField } from '../../components/FormField.jsx';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/StateViews.jsx';
import { REQUEST_STATUS, formatDate } from '../../utils/labels.js';
import { errorMessage } from '../../utils/messages.js';

export default function ApprovalsPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useFetch(() => archiveRequestsApi.list(status), [status]);
  const [rejecting, setRejecting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function approve(req) {
    if (!window.confirm(`Duyệt lưu trữ hồ sơ của ${req.residentName}?`)) return;
    setBusyId(req.id);
    try {
      await archiveRequestsApi.review(req.id, 'approve');
      toast(`Đã lưu trữ hồ sơ ${req.residentName}.`);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>Yêu cầu lưu trữ</h1>
        <select className="input" aria-label="Lọc theo trạng thái" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Chờ duyệt</option>
          <option value="all">Tất cả</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {loading && !data ? <Loading /> : error ? <ErrorState message={errorMessage(error)} onRetry={reload} /> : data.length === 0 ? (
        <EmptyState title={status === 'pending' ? 'Không có yêu cầu nào đang chờ' : 'Không có yêu cầu nào'} />
      ) : (
        <div className="stack">
          {data.map((req) => (
            <article key={req.id} className="card request-card">
              <div className="section-header">
                <h2><Link to={`/residents/${req.residentId}`}>{req.residentName}</Link> <span className="muted small">{req.residentCode}</span></h2>
                <Badge value={req.status} label={REQUEST_STATUS[req.status]} />
              </div>
              <p><strong>Lý do:</strong> {req.reason}</p>
              <p className="muted small">Yêu cầu bởi {req.requestedByName} · {formatDate(req.createdAt, true)}</p>
              {req.reviewedByName && (
                <p className="muted small">
                  {REQUEST_STATUS[req.status]} bởi {req.reviewedByName} · {formatDate(req.reviewedAt, true)}
                  {req.reviewNote && <> · “{req.reviewNote}”</>}
                </p>
              )}
              {req.status === 'pending' && (
                <div className="actions">
                  <button className="btn btn-secondary" onClick={() => setRejecting(req)}>Từ chối</button>
                  <button className="btn btn-danger" disabled={busyId === req.id} onClick={() => approve(req)}>Duyệt lưu trữ</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <RejectDialog request={rejecting} onClose={() => setRejecting(null)} onDone={() => { toast('Đã từ chối yêu cầu.'); reload(); }} />
    </section>
  );
}

function RejectDialog({ request, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  function close() { setNote(''); setError(''); setFormError(''); onClose(); }

  async function submit(e) {
    e.preventDefault();
    if (note.trim().length < 5) { setError('Vui lòng ghi lý do (ít nhất 5 ký tự).'); return; }
    try {
      await archiveRequestsApi.review(request.id, 'reject', note.trim());
      close();
      onDone();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  }

  return (
    <Modal open={Boolean(request)} title="Từ chối yêu cầu" onClose={close}>
      <form onSubmit={submit} noValidate>
        <Alert>{formError}</Alert>
        <FormField as="textarea" label="Lý do từ chối" required value={note} onChange={(e) => setNote(e.target.value)} error={error} />
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
          <button className="btn btn-primary">Từ chối</button>
        </div>
      </form>
    </Modal>
  );
}
