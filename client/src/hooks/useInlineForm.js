import { useState } from 'react';
import { errorMessage } from '../utils/messages.js';

/**
 * State for an inline add/edit form.
 * open(item?) starts editing, submit(saveFn) validates then saves.
 */
export function useInlineForm(blank, validate) {
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  function open(item, toForm = (x) => x) {
    setEditing(item ? item.id : 'new');
    setForm(item ? toForm(item) : blank);
    setErrors({}); setFormError('');
  }

  const close = () => setEditing(null);

  const field = (name) => ({
    name,
    value: form[name] ?? '',
    error: errors[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  async function submit(e, save) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError(found.form || '');
    if (Object.keys(found).length) return false;
    setBusy(true);
    try {
      await save(form, editing);
      setEditing(null);
      return true;
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { editing, form, setForm, errors, formError, busy, open, close, field, submit };
}
