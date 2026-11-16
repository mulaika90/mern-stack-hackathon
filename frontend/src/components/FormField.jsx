export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  icon,
  trailing,
}) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap${error ? " has-error" : ""}`}>
        {icon}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        {trailing}
      </div>
      <span className="field-error" id={`${id}-error`}>
        {error}
      </span>
    </div>
  );
}
