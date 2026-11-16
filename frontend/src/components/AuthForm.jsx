import { useState } from "react";
import FormField from "./FormField.jsx";
import { api, jsonRequest } from "../lib/api.js";

const initialValues = {
  username: "",
  identity: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validate(values, mode) {
  const errors = {};

  if (mode === "signup") {
    if (values.username.trim().length < 2) {
      errors.username = "Please enter a name with at least 2 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
  } else if (!values.identity.trim()) {
    errors.identity = "Enter your email or username.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  } else if (mode === "signup" && values.password.length < 8) {
    errors.password = "Your password must be at least 8 characters.";
  }

  if (mode === "signup" && values.password !== values.confirmPassword) {
    errors.confirmPassword = "Your passwords do not match.";
  }

  return errors;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="12" rx="2" />
      <path d="m3.3 5 6.7 5.2L16.7 5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="6.3" r="3.1" />
      <path d="M3.7 17a6.3 6.3 0 0 1 12.6 0" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3.5" y="8.5" width="13" height="9" rx="2" />
      <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5m-3.5 4v1.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export default function AuthForm({ mode }) {
  const [values, setValues] = useState(initialValues);
  const [feedback, setFeedback] = useState({
    mode,
    errors: {},
    message: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const errors = feedback.mode === mode ? feedback.errors : {};
  const message = feedback.mode === mode ? feedback.message : null;

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFeedback((current) => ({
      mode,
      errors: {
        ...(current.mode === mode ? current.errors : {}),
        [name]: "",
      },
      message: current.mode === mode ? current.message : null,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values, mode);
    setFeedback({ mode, errors: nextErrors, message: null });

    if (Object.values(nextErrors).some(Boolean)) return;

    const payload = isSignup
      ? {
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        }
      : {
          username: values.identity.trim(),
          email: values.identity.trim(),
          password: values.password,
        };

    setIsSubmitting(true);

    try {
      await api(
        isSignup ? "/api/auth/register" : "/api/auth/login",
        jsonRequest("POST", payload),
      );

      setFeedback({
        mode,
        errors: {},
        message: {
          type: "success",
          text: isSignup
            ? "Your account is ready. Welcome to Serein!"
            : "You're signed in. Welcome back!",
        },
      });
      setValues((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setFeedback({
        mode,
        errors: {},
        message: {
          type: "error",
          text:
            error instanceof TypeError
              ? "Can't reach the server right now. Please try again in a moment."
              : error.message,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="auth-form"
      role="tabpanel"
      aria-labelledby={isSignup ? "signup-tab" : "login-tab"}
      onSubmit={handleSubmit}
      noValidate
    >
      {isSignup && (
        <>
          <FormField
            id="username"
            label="Your name"
            value={values.username}
            onChange={updateField}
            placeholder="How should we call you?"
            autoComplete="name"
            error={errors.username}
            icon={<UserIcon />}
          />
          <FormField
            id="email"
            label="Email address"
            type="email"
            value={values.email}
            onChange={updateField}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            icon={<MailIcon />}
          />
        </>
      )}

      {!isSignup && (
        <FormField
          id="identity"
          label="Email or username"
          value={values.identity}
          onChange={updateField}
          placeholder="you@example.com"
          autoComplete="username"
          error={errors.identity}
          icon={<MailIcon />}
        />
      )}

      <FormField
        id="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        value={values.password}
        onChange={updateField}
        placeholder="Enter your password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        error={errors.password}
        icon={<LockIcon />}
        trailing={
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <EyeIcon />
          </button>
        }
      />

      {isSignup && (
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={updateField}
          placeholder="Type it one more time"
          autoComplete="new-password"
          error={errors.confirmPassword}
          icon={<LockIcon />}
        />
      )}

      <div
        className={`form-message${message ? ` is-visible is-${message.type}` : ""}`}
        role="status"
        aria-live="polite"
      >
        {message?.text}
      </div>
      <button className="submit-button" type="submit" disabled={isSubmitting}>
        <span>
          {isSubmitting
            ? isSignup
              ? "Creating your account..."
              : "Signing you in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 10h12m-5-5 5 5-5 5" />
        </svg>
      </button>
    </form>
  );
}
