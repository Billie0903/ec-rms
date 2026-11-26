import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { FormField } from './FormField.jsx';
import { Alert } from './StateViews.jsx';
import { validateReason } from '../validation/resident.js';
import { errorMessage } from '../utils/messages.js';

/** Asks for a reason (min 10 chars) and runs onConfirm(reason). */
export function ReasonDialog({ open, title, description, confirmLabel, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  function close() {
    setReason(''); setError(''); setFormError('');
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    const found = validateReason(reason);
    setError(found);
    if (found) return;
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      close();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={close}>
      <form onSubmit={submit} noValidate>
        {description && <p className="muted">{description}</p>}
        <Alert>{formError}</Alert>
        <FormField as="textarea" label="Lý do" required value={reason} onChange={(e) => setReason(e.target.value)} error={error} />
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Hủy</button>
          <button className="btn btn-danger" disabled={busy}>{busy ? 'Đang gửi…' : confirmLabel}</button>
        </div>
      </form>
    </Modal>
  );
}
