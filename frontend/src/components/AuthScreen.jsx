import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";
import { api, jsonRequest } from "../lib/api.js";
import ThemeToggle from "./ThemeToggle.jsx";

function showAuthToast(icon, title, text, theme) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 3400,
    timerProgressBar: true,
    background: theme === "dark" ? "#202821" : "#ffffff",
    color: theme === "dark" ? "#e0e9e2" : "#30463a",
    customClass: { popup: "serein-swal-toast" },
  });
}

export default function AuthScreen({ onAuthenticated, theme, onThemeChange }) {
  const storyRef = useRef(null);
  const authCardRef = useRef(null);
  const [mode, setMode] = useState(() => window.location.pathname === "/signup" ? "signup" : "login");
  const [values, setValues] = useState({ username: "", identity: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  function navigate(nextMode) {
    const nextPath = nextMode === "signup" ? "/signup" : "/login";
    window.history.pushState({ authMode: nextMode }, "", nextPath);
    setMode(nextMode);
    setError("");
  }

  useEffect(() => {
    document.title = isSignup ? "Create account — Serein" : "Welcome — Serein";
  }, [isSignup]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(".story-main > *, .story-points > div", { autoAlpha: 0, y: 12 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
        clearProps: "all",
      });
      gsap.fromTo(".auth-heading, .auth-form > *, .auth-privacy, .auth-footnote", { autoAlpha: 0, y: 10 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        delay: 0.08,
        ease: "power2.out",
        clearProps: "all",
      });
    });
    return () => context.revert();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setMode(window.location.pathname === "/signup" ? "signup" : "login");
      setError("");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isSignup && values.username.trim().length < 2) {
      setError("Enter your name using at least 2 characters.");
      return;
    }
    if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (values.password.length < (isSignup ? 8 : 1)) {
      setError(isSignup ? "Use a password with at least 8 characters." : "Enter your password.");
      return;
    }
    if (isSignup && values.password !== values.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = isSignup
        ? {
            username: values.username.trim(),
            email: values.email.trim(),
            password: values.password,
          }
        : { identity: values.identity.trim(), password: values.password };
      const result = await api(
        isSignup ? "/api/auth/register" : "/api/auth/login",
        jsonRequest("POST", body),
      );
      window.history.replaceState({}, "", "/");
      showAuthToast("success", isSignup ? "Account created" : "Welcome back", `Signed in as ${result.user.username}.`, theme);
      onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError.message);
      showAuthToast("error", isSignup ? "Couldn't create your account" : "Couldn't sign in", requestError.message, theme);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`auth-page theme-${theme}`}>
      <section className="auth-story" ref={storyRef}>
        <div className="auth-topbar">
          <a className="clinic-brand clinic-brand-light" href="/" aria-label="Serein home">
            <span className="brand-symbol">+</span>
            <span>serein<span className="brand-dot">.</span></span>
          </a>
          <span className="auth-top-note">Your health, in good hands</span>
        </div>

        <div className="story-main">
          <span className="story-kicker"><span /> A better kind of care</span>
          <h1>Care that fits<br />your <em>life.</em></h1>
          <p>Find the right doctor, book with confidence, and keep every part of your care in one calm place.</p>
          <div className="story-points">
            <div><span className="point-icon">01</span><span><strong>Find your person</strong><small>Thoughtful care from trusted doctors</small></span></div>
            <div><span className="point-icon">02</span><span><strong>Book on your time</strong><small>Appointments that work for you</small></span></div>
            <div><span className="point-icon">03</span><span><strong>Feel in control</strong><small>All your visits, neatly together</small></span></div>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>Serein Clinic</span><span>Here for your next chapter.</span>
        </div>
        <div className="story-orbit story-orbit-one" />
        <div className="story-orbit story-orbit-two" />
      </section>

      <section className="auth-form-side" aria-label="Account access">
        <div className="mobile-auth-brand">
          <a className="clinic-brand" href="/" aria-label="Serein home">
            <span className="brand-symbol">+</span><span>serein<span className="brand-dot">.</span></span>
          </a>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
        <div className="auth-theme-row"><ThemeToggle theme={theme} onChange={onThemeChange} /></div>
        <div className="auth-card" ref={authCardRef}>
          <div className="auth-heading">
            <span className="section-eyebrow">{isSignup ? "A HEALTHIER START STARTS HERE" : "WELCOME TO SEREIN"}</span>
            <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p>{isSignup ? "Your care journey starts with a few details." : "Sign in to pick up right where you left off."}</p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            {isSignup ? (
              <>
                <label className="form-field">
                  <span>Your name</span>
                  <input name="username" value={values.username} onChange={update} placeholder="How should we call you?" autoComplete="name" required />
                </label>
                <label className="form-field">
                  <span>Email address</span>
                  <input name="email" type="email" value={values.email} onChange={update} placeholder="you@example.com" autoComplete="email" required />
                </label>
              </>
            ) : (
              <label className="form-field">
                <span>Email or username</span>
                <input name="identity" value={values.identity} onChange={update} placeholder="you@example.com" autoComplete="username" required />
              </label>
            )}
            <label className="form-field">
              <span>Password</span>
              <input name="password" type="password" value={values.password} onChange={update} placeholder={isSignup ? "At least 8 characters" : "Enter your password"} autoComplete={isSignup ? "new-password" : "current-password"} required />
            </label>
            {isSignup && (
              <label className="form-field">
                <span>Confirm password</span>
                <input name="confirmPassword" type="password" value={values.confirmPassword ?? ""} onChange={update} placeholder="Enter your password again" autoComplete="new-password" required />
              </label>
            )}
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : isSignup ? "Create my account" : "Sign in to Serein"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-privacy"><span>♧</span> Your personal health information stays private.</div>
          <p className="auth-footnote">
            {isSignup ? "Already have an account?" : "New to Serein?"}{" "}
            <button className="auth-link" type="button" onClick={() => navigate(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Create your patient account"}
            </button>
          </p>
          {!isSignup && <p className="auth-footnote auth-staff-note">Clinic team? Sign in with your staff account.</p>}
        </div>
        <div className="auth-legal">© 2026 Serein Clinic <span>•</span> A little better, every day.</div>
      </section>
    </main>
  );
}
