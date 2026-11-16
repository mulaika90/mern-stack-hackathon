# Serein frontend

The Serein signup, login, and clinic dashboard are built with React and Vite.
Reusable UI components are in `src/components/`; responsive light and dark
theme styles are in `src/clinic.css`. GSAP powers reduced-motion-aware page
entrances, and SweetAlert2 provides confirmations and feedback toasts.
Administrators can find the complete doctor directory from the **Doctors**
navigation item.

## Run locally

```sh
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`. Start
the Express backend on that port to use authentication, profile editing, and
clinic features. Patients can sign up publicly; staff sign in with accounts
provisioned by the administrator.

## Validate and build

```sh
npm run lint
npm run build
```
