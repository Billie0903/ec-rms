import { useId } from 'react';

/**
 * Label + control + error message, wired for accessibility.
 * as="input" (default) | "select" (pass options=[{value,label}]) | "textarea"
 */
export function FormField({ label, error, hint, as = 'input', options = [], placeholder, required, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  const common = {
    id,
    className: error ? 'input input-invalid' : 'input',
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    ...props,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}{required && <span className="required" aria-hidden="true"> *</span>}</label>
      {as === 'select' ? (
        <select {...common}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : as === 'textarea' ? (
        <textarea rows={3} placeholder={placeholder} {...common} />
      ) : (
        <input placeholder={placeholder} {...common} />
      )}
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
  );
}
