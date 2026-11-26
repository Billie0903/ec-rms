import { useId } from 'react';

/** Label + input + error message, wired for accessibility. */
export function FormField({ label, error, hint, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={error ? 'input input-invalid' : 'input'}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {hint && !error && <small className="muted">{hint}</small>}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
  );
}
