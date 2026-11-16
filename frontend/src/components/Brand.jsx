export default function Brand({ mobile = false }) {
  if (mobile) {
    return (
      <span className="mobile-brand">
        serein<span className="brand-period">.</span>
      </span>
    );
  }

  return (
    <a className="brand" href="/" aria-label="Serein home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3.5 18.8 13l9.7 3-9.7 2.9L16 28.5l-2.9-9.6L3.5 16l9.6-3L16 3.5Z"
            fill="currentColor"
          />
          <circle cx="24.8" cy="7.2" r="2" fill="currentColor" />
        </svg>
      </span>
      <span>
        serein<span className="brand-period">.</span>
      </span>
    </a>
  );
}
