export default function AuthTabs({ mode, onChange }) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Account action">
      <button
        className={`mode-tab${mode === "login" ? " is-active" : ""}`}
        id="login-tab"
        type="button"
        role="tab"
        aria-selected={mode === "login"}
        aria-controls="auth-form"
        onClick={() => onChange("login")}
      >
        Sign in
      </button>
      <button
        className={`mode-tab${mode === "signup" ? " is-active" : ""}`}
        id="signup-tab"
        type="button"
        role="tab"
        aria-selected={mode === "signup"}
        aria-controls="auth-form"
        onClick={() => onChange("signup")}
      >
        Create account
      </button>
    </div>
  );
}
