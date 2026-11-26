import { useEffect, useRef } from 'react';

/** Accessible dialog using the native <dialog> element. */
export function Modal({ open, title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose} onCancel={onClose} aria-labelledby="modal-title">
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button className="btn btn-link" aria-label="Đóng" onClick={onClose}>✕</button>
      </div>
      {open && children}
    </dialog>
  );
}
