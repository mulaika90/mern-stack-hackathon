# Backend setup

1. Fill in the ignored `.env` file (or copy `.env.example` to `.env`).
2. Set `MONGODB_URI` to your MongoDB Atlas connection string. Use the
   database user's credentials from Atlas **Database Access**. URL-encode any
   special characters in the username or password, and allow your current IP
   under **Network Access**.
3. Set `JWT_SECRET` to a random secret with at least 32 characters.
4. Set `IMAGEKIT_PRIVATE_KEY` if you use product image uploads. Profile images
   are stored in MongoDB and do not require ImageKit.
5. Set `FRONTEND_ORIGINS` to the comma-separated frontend origins allowed to
   call the API. It defaults to
   `https://mern-stack-hackathon-7xqr.vercel.app`. Production session cookies
   are configured for cross-origin HTTPS requests.
6. To create the first clinic administrator, set `ADMIN_USERNAME`,
   `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters). The
   account is created on startup and its username/password are synchronized
   from these settings; leave them unset to skip seeding.
7. Optionally seed one doctor by setting `DOCTOR_USERNAME`, `DOCTOR_EMAIL`,
   and `DOCTOR_PASSWORD` (at least 8 characters). The account is created and
   its configured credentials are synchronized on startup.
   `DOCTOR_SPECIALIZATION` and `DOCTOR_EXPERIENCE` are optional.
8. Start the server with `npm start`.

The server connects to MongoDB before listening on port 3000. If the URI is
missing or invalid, startup prints the connection error and exits instead of
accepting requests that will fail.

Users, products, carts, and profile image files are persisted in MongoDB.
Product image files are hosted by ImageKit, with their URLs stored in MongoDB.
Keep `.env` private; it is excluded from Git.

After signing in as the clinic administrator, add doctor accounts from
**People & access → Add a doctor**. The doctor account is stored in MongoDB.
Share the email and temporary password with the doctor so they can sign in
through the same login page; the role automatically opens the doctor dashboard.
Patient accounts are created from the public signup page and are also stored in
MongoDB.

The first administrator is created in MongoDB at backend startup using
`ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Sign in with those
credentials through the same login page to open the admin dashboard. Never
allow public admin signup; only configure the initial administrator through
the private backend `.env`.

For a demo, the first doctor can be provisioned at startup with the
`DOCTOR_USERNAME`, `DOCTOR_EMAIL`, and `DOCTOR_PASSWORD` settings, or added
from **People & access → Add a doctor** after signing in as admin.

All account records and profile images are stored in MongoDB. Signed-in users
can change only their username and profile photo from the dashboard header;
email and staff role cannot be changed there.

Appointment APIs require a valid JWT session and enforce patient/doctor roles:
patients can create and view only their own appointments and cancel only
pending requests; only the assigned doctor can approve or reject a pending
request. Administrators can view all accounts and appointments, but cannot
book, cancel, or decide appointments. MongoDB indexes prevent duplicate
patient/doctor/date/time bookings and concurrent double-booking of an active
doctor slot. Passwords are hashed with bcrypt before storage.

The authenticated notifications inbox is stored in MongoDB. It notifies
doctors and administrators about appointment requests, patients about
appointment decisions, and administrators about new patient registrations.
Users can mark their own notifications as read.
