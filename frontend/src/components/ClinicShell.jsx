import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import Swal from "sweetalert2";
import { api, apiUrl, jsonRequest } from "../lib/api.js";
import ThemeToggle from "./ThemeToggle.jsx";

function showToast(icon, title, text, theme = "dark") {
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

const navigationByRole = {
  patient: [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "doctors", label: "Find a doctor", icon: "✳" },
    { id: "appointments", label: "My appointments", icon: "▦" },
  ],
  doctor: [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "appointments", label: "Appointment requests", icon: "▦" },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "doctors", label: "Doctors", icon: "✳" },
    { id: "users", label: "People", icon: "♧" },
    { id: "appointments", label: "Appointments", icon: "▦" },
  ],
};

const pageTitles = {
  overview: "Your care, at a glance",
  doctors: "Find your doctor",
  users: "People & access",
  appointments: "Appointments",
};

const dateLabel = (value, options = { month: "short", day: "numeric", year: "numeric" }) =>
  value ? new Date(value).toLocaleDateString(undefined, options) : "—";

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
}

function Avatar({ name, image, className = "mini-avatar" }) {
  return (
    <span className={`${className}${image ? " has-image" : ""}`}>
      {image ? <img src={apiUrl(image)} alt="" /> : initials(name)}
    </span>
  );
}

function StatCard({ label, value, note, icon, tone = "" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <strong>{value ?? "—"}</strong>
      <small>{note}</small>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function EmptyState({ icon = "✳", title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(cardRef.current, { autoAlpha: 0, y: 16, scale: 0.98 }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.24,
        ease: "power2.out",
      });
    });
    return () => context.revert();
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        <span className="section-eyebrow">SEREIN CLINIC</span>
        <h2 id="modal-title">{title}</h2>
        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        {children}
      </section>
    </div>
  );
}

export default function ClinicShell({ user, onUserUpdate, onSignOut, theme, onThemeChange }) {
  const contentRef = useRef(null);
  const [activePage, setActivePage] = useState("overview");
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [peopleRole, setPeopleRole] = useState("all");
  const [specialization, setSpecialization] = useState("All specialties");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPatient = user.role === "patient" || user.role === "user";
  const role = isPatient ? "patient" : user.role;
  const navigation = navigationByRole[role] ?? navigationByRole.patient;
  const displayName = user.username?.split(/\s+/)[0] || "there";

  const loadNotifications = useCallback(async () => {
    try {
      const result = await api("/api/notifications");
      setNotifications(result.notifications);
      setUnreadNotifications(result.unreadCount);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  const loadData = useCallback(async () => {
    setError("");
    try {
      if (role === "patient") {
        const [doctorResult, appointmentResult] = await Promise.all([
          api("/api/doctors"),
          api("/api/appointments/my"),
        ]);
        setDoctors(doctorResult.doctors);
        setAppointments(appointmentResult.appointments);
      } else if (role === "doctor") {
        const { appointments: results } = await api("/api/appointments/doctor");
        setAppointments(results);
      } else {
        const [statsResult, appointmentResult, userResult] = await Promise.all([
          api("/api/admin/stats"),
          api("/api/admin/appointments"),
          api("/api/admin/users"),
        ]);
        setStats(statsResult.stats);
        setAppointments(appointmentResult.appointments);
        setUsers(userResult.users);
        setDoctors(userResult.users.filter((person) => person.role === "doctor"));
      }
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [loadNotifications, role]);

  useEffect(() => {
    document.title = `${pageTitles[activePage] ?? "Overview"} — Serein`;
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activePage, loadData]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !contentRef.current) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".page-intro, .stats-grid, .people-overview, .people-toolbar, .table-wrap, .appointment-list, .doctor-grid, .welcome-banner, .patient-summary, .section-heading, .empty-state",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.055, ease: "power2.out", clearProps: "all" },
      );
    }, contentRef);
    return () => context.revert();
  }, [activePage, appointments.length, doctors.length, users.length]);

  useEffect(() => {
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const filteredDoctors = useMemo(() => doctors.filter((doctor) => {
    const matchesSearch = `${doctor.username} ${doctor.specialization}`.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialization === "All specialties" || doctor.specialization === specialization;
    return matchesSearch && matchesSpecialty;
  }), [doctors, search, specialization]);
  const specialties = useMemo(
    () => ["All specialties", ...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))],
    [doctors],
  );
  const filteredPeople = useMemo(() => users.filter((person) => {
    const matchesRole = peopleRole === "all"
      || (peopleRole === "patient" && ["patient", "user"].includes(person.role))
      || person.role === peopleRole;
    const matchesSearch = `${person.username} ${person.email} ${person.specialization ?? ""}`
      .toLowerCase()
      .includes(peopleSearch.trim().toLowerCase());
    return matchesRole && matchesSearch;
  }), [users, peopleRole, peopleSearch]);

  async function performAction(action, successMessage) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      showToast("success", successMessage, "", theme);
      setModal(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
      showToast("error", "Something went wrong", requestError.message, theme);
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(formData) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api("/api/auth/profile", { method: "PATCH", body: formData });
      onUserUpdate(result.user);
      setModal(null);
      setNotice(result.message);
      showToast("success", "Profile updated", result.message, theme);
    } catch (requestError) {
      showToast("error", "Could not update profile", requestError.message, theme);
      throw requestError;
    } finally {
      setBusy(false);
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
      setUnreadNotifications(0);
      showToast("success", "All caught up", "Notifications marked as read.", theme);
    } catch (requestError) {
      setError(requestError.message);
      showToast("error", "Could not update notifications", requestError.message, theme);
    }
  }

  async function openNotification(notification) {
    if (!notification.readAt) {
      try {
        await api(`/api/notifications/${notification._id}/read`, { method: "PATCH" });
        setNotifications((current) => current.map((item) => item._id === notification._id
          ? { ...item, readAt: new Date().toISOString() }
          : item));
        setUnreadNotifications((count) => Math.max(0, count - 1));
      } catch (requestError) {
        setError(requestError.message);
        showToast("error", "Could not update notification", requestError.message, theme);
        return;
      }
    }
    if (notification.appointment) setActivePage("appointments");
    else if (notification.type === "new-patient") setActivePage("users");
    setNotificationsOpen(false);
  }

  async function confirmDeleteUser(person) {
    const result = await Swal.fire({
      title: `Delete ${person.username}?`,
      text: `This permanently deletes this ${person.role === "doctor" ? "doctor" : "patient"} account and associated appointments.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete account",
      cancelButtonText: "Keep account",
      confirmButtonColor: "#a95850",
      background: theme === "dark" ? "#202821" : "#ffffff",
      color: theme === "dark" ? "#e0e9e2" : "#30463a",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    await performAction(
      () => api(`/api/admin/users/${person._id}`, { method: "DELETE" }),
      `${person.role === "doctor" ? "Doctor" : "Patient"} account and related appointments deleted.`,
    );
  }

  async function updateAppointment(id, status) {
    await performAction(
      () => api(
        `/api/appointments/${id}/status`,
        jsonRequest("PATCH", { status }),
      ),
      status === "approved" ? "Appointment approved." : "Appointment updated.",
    );
  }

  function renderAppointments(list, context) {
    if (!list.length) {
      return (
        <EmptyState
          icon="▦"
          title={role === "doctor" ? "You're all caught up" : "No appointments yet"}
          description={role === "patient" ? "Choose a doctor to book your first visit." : "New appointment activity will appear here."}
          action={role === "patient" ? <button className="button button-primary" onClick={() => setActivePage("doctors")}>Find a doctor <span>→</span></button> : null}
        />
      );
    }

    return (
      <div className="appointment-list">
        {list.map((appointment) => {
          const otherPerson = role === "doctor" ? appointment.patient : appointment.doctor;
          const canReview = role === "doctor" && appointment.status === "pending";
          const canCancel = role === "patient" && appointment.status === "pending";
          return (
            <article className="appointment-row" key={appointment._id}>
              <div className="appointment-date-block">
                <strong>{dateLabel(appointment.appointmentDate, { month: "short", day: "numeric" }).split(" ")[1]?.replace(",", "")}</strong>
                <span>{dateLabel(appointment.appointmentDate, { month: "short" }).toUpperCase()}</span>
              </div>
              <div className="appointment-main">
                <div className="appointment-name">{role === "doctor" ? "Patient" : "Dr."} {otherPerson?.username ?? "Clinic member"}</div>
                <div className="appointment-meta">
                  <span>{appointment.appointmentTime}</span><span>·</span>
                  <span>{role === "doctor" ? "Visit request" : otherPerson?.specialization || "Clinic visit"}</span>
                </div>
                <p className="appointment-reason">{appointment.reason}</p>
              </div>
              <div className="appointment-side">
                <StatusBadge status={appointment.status} />
                {canReview && (
                  <div className="row-actions">
                    <button className="button button-small button-soft" disabled={busy} onClick={() => updateAppointment(appointment._id, "approved")}>Approve</button>
                    <button className="button button-small button-quiet" disabled={busy} onClick={() => updateAppointment(appointment._id, "rejected")}>Decline</button>
                  </div>
                )}
                {canCancel && <button className="button button-small button-quiet" disabled={busy} onClick={() => performAction(() => api(`/api/appointments/${appointment._id}/cancel`, jsonRequest("PATCH", {})), "Appointment cancelled.")}>Cancel request</button>}
                {context === "admin" && <span className="appointment-admin-name">{appointment.patient?.username} → {appointment.doctor?.username}</span>}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderDoctors(compact = false) {
    const shown = compact ? filteredDoctors.slice(0, 3) : filteredDoctors;
    if (!shown.length) {
      return <EmptyState icon="✳" title="No doctors found" description="Try another search, or check back soon." />;
    }
    return (
      <div className={`doctor-grid${compact ? " doctor-grid-compact" : ""}`}>
        {shown.map((doctor, index) => (
          <article className="doctor-card" key={doctor._id}>
            <Avatar name={doctor.username} image={doctor.profileImage} className={`doctor-avatar doctor-avatar-${index % 4}`} />
            <span className="doctor-available"><i /> Taking patients</span>
            <h3>Dr. {doctor.username}</h3>
            <p className="doctor-specialty">{doctor.specialization || "General practice"}</p>
            <p className="doctor-experience">{doctor.experience ?? 0} years experience <span>·</span> Serein Clinic</p>
            {isPatient && <button className="button button-outline doctor-book" onClick={() => setModal({ type: "booking", doctor })}>Book a visit <span>→</span></button>}
            {role === "admin" && <button className="button button-quiet doctor-book doctor-delete" onClick={() => confirmDeleteUser(doctor)}>Delete doctor</button>}
          </article>
        ))}
      </div>
    );
  }

  function renderAdminUsers() {
    const doctorCount = users.filter((person) => person.role === "doctor").length;
    const patientCount = users.filter((person) => person.role === "patient" || person.role === "user").length;
    const adminCount = users.filter((person) => person.role === "admin").length;
    return (
      <>
        <div className="people-overview">
          <article><span className="people-overview-icon people-icon-team">✳</span><div><small>Care team</small><strong>{doctorCount}</strong><span>doctors</span></div></article>
          <article><span className="people-overview-icon people-icon-patients">♧</span><div><small>Community</small><strong>{patientCount}</strong><span>patients</span></div></article>
          <article><span className="people-overview-icon people-icon-total">↗</span><div><small>Clinic admins</small><strong>{adminCount}</strong><span>protected accounts</span></div></article>
        </div>
        <div className="people-toolbar">
          <label className="search-field"><span>⌕</span><input aria-label="Search people" placeholder="Search name, email or specialty" value={peopleSearch} onChange={(event) => setPeopleSearch(event.target.value)} /></label>
          <select aria-label="Filter people by role" value={peopleRole} onChange={(event) => setPeopleRole(event.target.value)}>
            <option value="all">Everyone</option><option value="doctor">Doctors</option><option value="patient">Patients</option><option value="admin">Admins</option>
          </select>
          <span className="people-result-count">{filteredPeople.length} shown</span>
        </div>
        {!users.length ? <EmptyState icon="♧" title="Your clinic starts here" description="Add a doctor to your care team, or patient accounts will appear here when people sign up." action={<button className="button button-primary" onClick={() => setModal({ type: "doctor" })}>Add a doctor <span>→</span></button>} />
          : !filteredPeople.length ? <EmptyState icon="⌕" title="No matching people" description="Try a different search or role filter." />
          : <div className="table-wrap">
        <table className="clinic-table">
          <thead><tr><th>Person</th><th>Role</th><th>Specialty</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>{filteredPeople.map((person) => (
            <tr key={person._id}>
              <td><div className="table-person"><Avatar name={person.username} image={person.profileImage} /><span><strong>{person.username}</strong><small>{person.email}</small></span></div></td>
              <td><span className={`role-label role-${person.role}`}>{person.role === "user" ? "patient" : person.role}</span></td>
              <td>{person.role === "doctor" ? person.specialization || "General practice" : "—"}</td>
              <td><span className={`status-badge ${person.isActive ? "status-approved" : "status-cancelled"}`}>{person.isActive ? "Active" : "Paused"}</span></td>
              <td>{dateLabel(person.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
              <td>{person.role === "admin" ? <span className="protected-account">Protected staff access</span> : <div className="table-actions">
                <button className="text-button" onClick={() => performAction(() => api(`/api/admin/users/${person._id}/status`, jsonRequest("PATCH", { isActive: !person.isActive })), person.isActive ? "Account paused." : "Account reactivated.")}>{person.isActive ? "Pause" : "Reactivate"}</button>
                <button className="text-button text-danger" onClick={() => confirmDeleteUser(person)}>Delete</button>
              </div>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>}
      </>
    );
  }

  function renderPage() {
    if (activePage === "doctors" && role === "admin") {
      return (
        <>
          <div className="page-intro">
            <div><span className="section-eyebrow">YOUR CLINIC TEAM</span><h2>Doctors</h2><p>View and manage the doctors who care for your patients.</p></div>
            <button className="button button-primary" onClick={() => setModal({ type: "doctor" })}><span>＋</span> Add a doctor</button>
          </div>
          <div className="directory-tools">
            <label className="search-field"><span>⌕</span><input aria-label="Search doctors" placeholder="Search by name or specialty" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select aria-label="Filter doctors by specialty" value={specialization} onChange={(event) => setSpecialization(event.target.value)}>{specialties.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          {renderDoctors()}
        </>
      );
    }

    if (activePage === "doctors" && role !== "admin") {
      return (
        <>
          <div className="page-intro"><div><span className="section-eyebrow">CARE, YOUR WAY</span><h2>Meet your care team</h2><p>Thoughtful people, here to help you feel your best.</p></div></div>
          <div className="directory-tools">
            <label className="search-field"><span>⌕</span><input aria-label="Search doctors" placeholder="Search by name or specialty" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <select aria-label="Filter by specialty" value={specialization} onChange={(event) => setSpecialization(event.target.value)}>{specialties.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          {renderDoctors()}
        </>
      );
    }

    if (activePage === "appointments") {
      const heading = role === "doctor" ? "Requests & visits" : role === "admin" ? "All clinic appointments" : "Your visits";
      return <><div className="page-intro"><div><span className="section-eyebrow">YOUR CARE TIMELINE</span><h2>{heading}</h2><p>A clear view of every appointment, all in one place.</p></div>{isPatient && <button className="button button-primary" onClick={() => setActivePage("doctors")}>Book a visit <span>→</span></button>}</div>{role === "admin" ? renderAppointments(appointments, "admin") : renderAppointments(appointments)}</>;
    }

    if (activePage === "users" && role === "admin") {
      return <><div className="page-intro"><div><span className="section-eyebrow">THE PEOPLE BEHIND THE CARE</span><h2>People & access</h2><p>Manage your clinic team and patient accounts.</p></div><button className="button button-primary" onClick={() => setModal({ type: "doctor" })}><span>＋</span> Add a doctor</button></div>{renderAdminUsers()}</>;
    }

    if (role === "admin") {
      return (
        <>
          <div className="page-intro"><div><span className="section-eyebrow">SEREIN CLINIC · ADMIN</span><h2>A healthier clinic starts here</h2><p>Here’s the pulse of your practice today.</p></div><button className="button button-primary" onClick={() => setModal({ type: "doctor" })}><span>＋</span> Add a doctor</button></div>
          <div className="stats-grid">
            <StatCard label="Total patients" value={stats?.patients ?? 0} note="Registered with your clinic" icon="♧" />
            <StatCard label="Care team" value={stats?.doctors ?? 0} note="Active doctors" icon="✳" tone="stat-lilac" />
            <StatCard label="Appointments" value={stats?.appointments ?? 0} note="Across all time" icon="▦" tone="stat-blue" />
            <StatCard label="Needs attention" value={stats?.pending ?? 0} note="Waiting for a response" icon="◷" tone="stat-peach" />
          </div>
          <div className="section-heading"><div><span className="section-eyebrow">THE LATEST</span><h3>Recent appointments</h3></div><button className="text-button" onClick={() => setActivePage("appointments")}>View all →</button></div>
          {renderAppointments(appointments.slice(0, 4), "admin")}
        </>
      );
    }

    if (role === "doctor") {
      const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
      const upcoming = appointments.filter((appointment) => ["pending", "approved"].includes(appointment.status));
      return (
        <>
          <div className="page-intro"><div><span className="section-eyebrow">YOUR DOCTOR DASHBOARD</span><h2>Good day, Dr. {user.username}.</h2><p>Here’s what’s happening with your patients.</p></div></div>
          <div className="stats-grid stats-grid-three">
            <StatCard label="Total requests" value={appointments.length} note="All appointment requests" icon="▦" />
            <StatCard label="Needs your review" value={pendingCount} note="Pending a response" icon="◷" tone="stat-peach" />
            <StatCard label="Approved visits" value={appointments.filter((a) => a.status === "approved").length} note="Ready on your calendar" icon="✓" tone="stat-lilac" />
          </div>
          <div className="section-heading"><div><span className="section-eyebrow">UP NEXT</span><h3>Appointment requests</h3></div><button className="text-button" onClick={() => setActivePage("appointments")}>See all →</button></div>
          {renderAppointments(upcoming.slice(0, 4))}
        </>
      );
    }

    const upcoming = appointments.filter((appointment) => ["pending", "approved"].includes(appointment.status));
    return (
      <>
        <div className="welcome-banner">
          <div><span className="section-eyebrow">YOUR SEREIN SPACE</span><h2>Good to see you, {displayName}.</h2><p>Let’s make taking care of you a little easier.</p><button className="button button-white" onClick={() => setActivePage("doctors")}>Find a doctor <span>→</span></button></div>
          <div className="welcome-art" aria-hidden="true"><div className="art-sun" /><div className="art-leaf art-leaf-a" /><div className="art-leaf art-leaf-b" /><div className="art-vase" /></div>
        </div>
        <div className="patient-summary">
          <div className="summary-copy"><span className="section-eyebrow">YOUR NEXT STEP</span><h3>{upcoming.length ? "Your care is in motion." : "Make time for you."}</h3><p>{upcoming.length ? `${upcoming.length} upcoming ${upcoming.length === 1 ? "appointment" : "appointments"} in your care journey.` : "A quick visit today can make tomorrow feel better."}</p></div>
          <button className="button button-outline" onClick={() => setActivePage(upcoming.length ? "appointments" : "doctors")}>{upcoming.length ? "View appointments" : "Explore doctors"} <span>→</span></button>
        </div>
        <div className="section-heading"><div><span className="section-eyebrow">A GOOD PLACE TO START</span><h3>Meet your doctors</h3></div><button className="text-button" onClick={() => setActivePage("doctors")}>Browse all →</button></div>
        {renderDoctors(true)}
      </>
    );
  }

  return (
    <div className={`clinic-app theme-${theme}`}>
      <aside className="clinic-sidebar">
        <a className="clinic-brand" href="/" aria-label="Serein home"><span className="brand-symbol">+</span><span>serein<span className="brand-dot">.</span></span></a>
        <div className="sidebar-clinic"><span className="clinic-mark">S</span><span><strong>Serein Clinic</strong><small>Care, thoughtfully.</small></span><span className="sidebar-chevron">⌄</span></div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => { setActivePage(item.id); setNotice(""); setError(""); }}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === "appointments" && role === "doctor" && appointments.some((a) => a.status === "pending") && <i className="nav-dot" />}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">✳</span><strong>Here for you</strong><p>Need a hand? Your clinic team is just a message away.</p><a href="mailto:care@serein.example">Get in touch <span>→</span></a></div><button className="sidebar-signout" onClick={onSignOut}><span>↪</span> Sign out</button></div>
      </aside>

      <main className="clinic-main">
        <header className="clinic-topbar">
          <div className="breadcrumbs"><span>Serein Clinic</span><b>/</b><strong>{pageTitles[activePage]}</strong></div>
          <div className="topbar-actions"><span className="today-label">{dateLabel(new Date(), { weekday: "short", month: "short", day: "numeric" })}</span><ThemeToggle theme={theme} onChange={onThemeChange} /><div className="notification-control">
            <button className="icon-button notification-button" type="button" aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={() => setNotificationsOpen((open) => !open)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
              {unreadNotifications > 0 && <span className="notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
            </button>
            {notificationsOpen && <section className="notification-panel" id="notification-panel" aria-label="Notifications">
              <div className="notification-panel-header"><div><strong>Notifications</strong><small>{unreadNotifications ? `${unreadNotifications} unread` : "You're all caught up"}</small></div>{unreadNotifications > 0 && <button className="text-button" type="button" onClick={markAllNotificationsRead}>Mark all read</button>}</div>
              <div className="notification-list">
                {notifications.length ? notifications.map((notification) => <button className={`notification-item${notification.readAt ? "" : " notification-unread"}`} type="button" key={notification._id} onClick={() => openNotification(notification)}>
                  <span className={`notification-item-icon notification-type-${notification.type}`} aria-hidden="true">{notification.type === "appointment-update" ? "✓" : notification.type === "new-patient" ? "＋" : notification.type === "appointment-cancelled" ? "×" : "◷"}</span>
                  <span className="notification-item-copy"><strong>{notification.title}</strong><span>{notification.message}</span><small>{new Date(notification.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></span>
                  {!notification.readAt && <i className="notification-unread-dot" />}
                </button>) : <div className="notification-empty"><span>✳</span><strong>No notifications yet</strong><small>New appointment activity will appear here.</small></div>}
              </div>
            </section>}
          </div><button className="user-chip" type="button" onClick={() => setModal({ type: "profile" })} aria-label="Edit your profile"><Avatar name={user.username} image={user.profileImage} /><span><strong>{user.username}</strong><small>{role === "patient" ? "Patient" : role === "doctor" ? "Doctor" : "Clinic admin"}</small></span><span className="sidebar-chevron">⌄</span></button></div>
        </header>

        <div className="clinic-content" ref={contentRef}>
          <div className="mobile-page-title"><span className="section-eyebrow">SEREIN CLINIC</span><h1>{pageTitles[activePage]}</h1></div>
          {notice && <div className="alert alert-success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
          {error && <div className="alert alert-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
          {renderPage()}
          <footer className="clinic-footer"><span>© 2026 Serein Clinic</span><span>Care that meets you where you are <b>✳</b></span></footer>
        </div>
      </main>

      {modal?.type === "booking" && <BookingModal doctor={modal.doctor} busy={busy} onClose={() => setModal(null)} onSubmit={(data) => performAction(() => api("/api/appointments", jsonRequest("POST", data)), "Your appointment request is on its way.")} />}
      {modal?.type === "doctor" && <DoctorModal busy={busy} onClose={() => setModal(null)} onSubmit={(data) => performAction(() => api("/api/admin/doctors", jsonRequest("POST", data)), "Doctor added to your care team.")} />}
      {modal?.type === "profile" && <ProfileModal user={user} busy={busy} onClose={() => setModal(null)} onSubmit={saveProfile} />}
    </div>
  );
}

function ProfileModal({ user, busy, onClose, onSubmit }) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const imageUrl = previewUrl || user.profileImage;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (imageFile) formData.set("avatar", imageFile);
    onSubmit(formData).catch((requestError) => setError(requestError.message));
  }

  function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Your image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <Modal title="Your profile" subtitle="Keep your account details and photo up to date." onClose={onClose}>
      <form className="modal-form profile-form" onSubmit={submit}>
        <div className="profile-image-picker">
          <Avatar name={user.username} image={imageUrl} className="profile-avatar" />
          <div><strong>Profile photo</strong><small>JPG, PNG, or WebP · up to 5 MB</small>
            <label className="button button-outline profile-upload">Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /></label>
          </div>
        </div>
        <label className="form-field"><span>Username</span><input name="username" defaultValue={user.username} minLength="2" maxLength="80" autoComplete="username" required /></label>
        <p className="profile-email-note">Email address is kept unchanged: {user.email}</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button button-outline" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving..." : "Save changes"} <span>→</span></button></div>
      </form>
    </Modal>
  );
}

function BookingModal({ doctor, busy, onClose, onSubmit }) {
  const [form, setForm] = useState({ date: "", time: "", reason: "" });
  const [error, setError] = useState("");
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
  return (
    <Modal title="Book a visit" subtitle={`Request an appointment with Dr. ${doctor.username}, ${doctor.specialization || "General practice"}.`} onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); if (!form.date || !form.time || form.reason.trim().length < 3) { setError("Choose a date and time, and add a short reason for your visit."); return; } onSubmit({ doctorId: doctor._id, ...form }); }}>
        <label className="form-field"><span>Preferred date</span><input type="date" min={minDate} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
        <label className="form-field"><span>Preferred time</span><select value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required><option value="">Choose a time</option>{times.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
        <label className="form-field"><span>What would you like help with?</span><textarea rows="3" maxLength="500" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Share a little about your visit" required /></label>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Sending request..." : "Request appointment"} <span>→</span></button>
      </form>
    </Modal>
  );
}

function DoctorModal({ busy, onClose, onSubmit }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", specialization: "", experience: "0" });
  const [error, setError] = useState("");
  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  return (
    <Modal title="Welcome a new doctor" subtitle="Set up a secure staff account for your clinic." onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); if (form.password.length < 8) { setError("Use a temporary password with at least 8 characters."); return; } onSubmit({ ...form, experience: Number(form.experience) }); }}>
        <label className="form-field"><span>Doctor's name</span><input name="username" value={form.username} onChange={update} placeholder="Full name" required minLength="2" /></label>
        <label className="form-field"><span>Work email</span><input name="email" type="email" value={form.email} onChange={update} placeholder="doctor@clinic.com" required /></label>
        <label className="form-field"><span>Specialty</span><input name="specialization" value={form.specialization} onChange={update} placeholder="e.g. Cardiology" required /></label>
        <div className="modal-form-row"><label className="form-field"><span>Years of experience</span><input name="experience" type="number" min="0" max="70" value={form.experience} onChange={update} required /></label><label className="form-field"><span>Temporary password</span><input name="password" type="password" minLength="8" value={form.password} onChange={update} autoComplete="new-password" required /></label></div>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Adding doctor..." : "Create doctor account"} <span>→</span></button>
      </form>
    </Modal>
  );
}
