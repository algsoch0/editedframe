# MongoDB Review System Setup

## 1) Configure API environment
Create `server/.env` from `server/.env.example` and fill values:

- `MONGODB_URI` = your MongoDB connection string
- `SESSION_SECRET` = long random string
- `CLIENT_ORIGIN` = your frontend origins, comma-separated
  - Example: `http://localhost:8000,https://algsoch0.github.io`
- `ADMIN_USERNAME` = `Sachin`
- `ADMIN_PASSWORD` = `Iit7065@`

## 2) Set frontend API URL
Edit `js/config.js`:

- For production, set `apiBaseUrl` to your deployed API URL
  - Example: `https://your-api-domain.com/api`

## 3) Run locally
From project root:

- `npm install`
- `npm run api:start`
- In another terminal: `npm run dev`

Open:

- Main site: `http://localhost:8000`
- Admin panel: `http://localhost:8000/admin-reviews.html`

## 4) Admin access
Admin panel requires login using:

- Name: `Sachin`
- Password: `Iit7065@`

(Or whatever values are in your `server/.env`.)

## 5) Deploy
Deploy API separately (Render/Railway/VPS/etc.) and keep frontend on GitHub Pages.

Important production settings:

- `NODE_ENV=production`
- HTTPS enabled on API domain
- `CLIENT_ORIGIN` includes your GitHub Pages origin

## 6) Notes
- Reviews now live in MongoDB, not browser local storage.
- Public page shows approved reviews from MongoDB.
- Admin panel can approve/reject/delete reviews after login.
