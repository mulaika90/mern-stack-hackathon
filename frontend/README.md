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

API requests use the hosted backend at
`https://mern-stack-hackathon-snowy.vercel.app` in production. During local
development, Vite proxies `/api` to `http://localhost:3000` so browser auth
cookies remain same-origin; start the local backend before signing in. Set
`VITE_API_PROXY_TARGET` to use a different development backend, or
`VITE_API_BASE_URL` to use another API directly. The backend allows the
deployed frontend origin `https://mern-stack-hackathon-7xqr.vercel.app` by
default; configure `FRONTEND_ORIGINS` on the backend deployment if the frontend
origin changes. Patients can sign up publicly; staff sign in with accounts
provisioned by the administrator.

## Validate and build

```sh
npm run lint
npm run build
```
