# LocalHire

LocalHire is a beginner-friendly MERN web application for hyperlocal hiring. Employers can post local jobs, job seekers can search/apply/save jobs, and admins can moderate users, jobs, and reports.

## Tech Stack

Frontend:
- React.js
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- React Hot Toast

Backend:
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- bcrypt password hashing
- Cloudinary uploads

## Folder Structure

```txt
LocalHire/
  client/
    src/
      components/
      context/
      data/
      hooks/
      pages/
      services/
      utils/
      App.jsx
  server/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    server.js
```

## Main Features

- Register, login, logout
- JWT protected routes
- Role-based access for Job Seeker, Employer, and Admin
- Homepage with hero, search, categories, featured jobs, benefits, employer CTA, footer
- Search jobs page with filters, pagination, skeleton loading, and empty states
- Job details page with apply, save, share, report, call, and WhatsApp contact
- Employer dashboard with active jobs, applicants, edit/delete/filled actions
- Post job form with required validation and company logo upload
- Job seeker dashboard with profile, resume upload, skills, saved jobs, and application tracking
- Admin moderation panel with stats, users, jobs, reports, block/verify/delete actions
- Dark mode and responsive mobile navbar

## Backend Environment

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/localhire
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_REGISTER_SECRET=localhire-admin
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
MAIL_FROM=LocalHire <no-reply@example.com>
VAPID_SUBJECT=mailto:admin@example.com
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

Local email/password accounts must verify their email before login. Configure the SMTP variables above to send verification and password-reset emails. Without SMTP configuration, development links are printed in the backend console instead.

## Frontend Environment

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

Generate VAPID keys once with `npx web-push generate-vapid-keys`, then put the public key in both env files and keep the private key only in `server/.env`. Push notifications require HTTPS in production; `localhost` is allowed for development.

## Google Login Setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs & Services, then Credentials.
4. Create an OAuth Client ID.
5. Choose Web application.
6. Add this authorized JavaScript origin for local development:

```txt
http://localhost:5173
```

7. Copy the Web Client ID into both env files:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Google login is enabled for Job Seeker and Employer accounts. Admin accounts should use email and password with `ADMIN_REGISTER_SECRET`.

## Run Locally

Open two terminals.

Backend:

```bash
cd LocalHire/server
npm install
npm run dev
```

Frontend:

```bash
cd LocalHire/client
npm install
npm run dev
```

Visit:

```txt
http://localhost:5173
```

## Admin Account

To create an admin account from the Register page, choose the `Admin` role and enter the same value as `ADMIN_REGISTER_SECRET`.

## Demo Flow

For a quick demo, you can:

1. Register an admin account.
2. Register an employer account.
3. Post jobs from the employer account.
4. Register a job seeker account and apply.
5. Use the admin dashboard to verify employers, block users, delete fake jobs, and resolve reports.

## API Summary

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Jobs:
- `GET /api/jobs`
- `GET /api/jobs/featured`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `PATCH /api/jobs/:id/filled`
- `GET /api/jobs/employer/mine`

Applications:
- `POST /api/applications/:jobId`
- `GET /api/applications/me`
- `GET /api/applications/job/:jobId`
- `PATCH /api/applications/:id/status`

Saved Jobs:
- `POST /api/saved-jobs/:jobId`
- `GET /api/saved-jobs/me`
- `DELETE /api/saved-jobs/:jobId`

Reports:
- `POST /api/reports/:jobId`

Admin:
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/jobs`
- `GET /api/admin/reports`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/verify-employer`
- `DELETE /api/admin/jobs/:id`
- `PATCH /api/admin/reports/:id/resolve`

## Deploy Backend On Render

1. Push the `LocalHire/server` folder to GitHub.
2. Create a new Render Web Service.
3. Set root directory to `server` if deploying from the full repository.
4. Build command:

```bash
npm install
```

5. Start command:

```bash
npm start
```

6. Add all backend environment variables in Render.
7. Set `CLIENT_URL` to your Vercel frontend URL.

## Deploy Frontend On Vercel

1. Import the repository in Vercel.
2. Set root directory to `client`.
3. Build command:

```bash
npm run build
```

4. Output directory:

```txt
dist
```

5. Add:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```
