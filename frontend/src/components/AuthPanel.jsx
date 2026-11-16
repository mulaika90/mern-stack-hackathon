import { useEffect, useState } from "react";
import AuthForm from "./AuthForm.jsx";
import AuthTabs from "./AuthTabs.jsx";
import Brand from "./Brand.jsx";

export default function AuthPanel() {
  const [mode, setMode] = useState("login");
  const isSignup = mode === "signup";

  useEffect(() => {
    document.title = `${isSignup ? "Create account" : "Welcome"} — Serein`;
  }, [isSignup]);

  return (
    <section className="form-panel" aria-label="Account access">
      <div className="form-topline">
        <Brand mobile />
        <span className="secure-note">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2m-8 0h9v7h-9V7Z" />
          </svg>
          Secure access
        </span>
      </div>

      <div className="form-content">
        <div className="form-heading">
          <span className="eyebrow form-eyebrow">YOUR SPACE, YOUR PACE</span>
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isSignup
              ? "A fresh start is just a few details away."
              : "Pick up right where you left off."}
          </p>
        </div>

        <AuthTabs mode={mode} onChange={setMode} />
        <AuthForm mode={mode} />

        <p className="terms-note">A thoughtful space, made just for you.</p>

        <div className="form-bottom">
          <span>Made for the moments in between</span>
          <span className="bottom-spark" aria-hidden="true">
            ✳
          </span>
        </div>
      </div>
    </section>
  );
}
