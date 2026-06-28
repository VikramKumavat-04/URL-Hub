<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Deployed-Render-46E3B7?style=flat&logo=render&logoColor=white" />

<br/><br/>

# URLHub

**A URL shortener built for real campaigns — not just shorter links.**

Track clicks, protect links with passwords, set expiry dates, generate QR codes, and manage everything from one dashboard.

<br/>

[**Live Demo →**](https://url-hub.onrender.com)&nbsp;&nbsp;https://url-hub.onrender.com  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[Source Code](https://github.com/VikramKumavat-04/urlhub)

<br/>
<img width="1345" height="926" alt="image" src="https://github.com/user-attachments/assets/790f7395-053d-4d74-9673-54f878720a88" />
<img width="1470" height="882" alt="image" src="https://github.com/user-attachments/assets/4263d332-529e-4bc7-9237-1714164d9747" />
<img width="1480" height="890" alt="image" src="https://github.com/user-attachments/assets/ff9288de-85f5-467b-ae95-edb7ce9dad5d" />




<!-- Add a screenshot here once you have one -->
<!-- ![URLHub Dashboard](./screenshots/dashboard.png) -->

</div>

---

## Why I built this

Most URL shorteners give you a short link and nothing else. I wanted something closer to Bitly — where you can lock a link behind a password, kill it after a date, tag it for a campaign, and see exactly what device and browser clicked it. This is that, built from scratch.

---

## Features

| | |
|---|---|
| 🔗 **Instant shortening** | Paste a URL, get a short slug via nanoid |
| 🔒 **Password protection** | Lock any link — visitors must enter a password to redirect |
| ⏳ **Expiry dates** | Links stop working automatically after a set date/time |
| 📊 **Per-link analytics** | Clicks, devices, browsers, platforms, referrers, recent history |
| 🏷️ **Tags & descriptions** | Organize links by campaign, project, or team |
| 📱 **QR code download** | Generate and download a QR code for any link |
| 🔁 **Enable / disable** | Pause a link without deleting it |
| 📥 **CSV export** | Export the current filtered table view |
| 🌙 **Dark mode** | Automatic based on system preference |

---

## Tech Stack

```
Frontend          Backend           Infrastructure
─────────────     ───────────────   ──────────────────
React 19          Node.js           Render (free tier)
TanStack Router   Express 5         MongoDB Atlas
Redux Toolkit     Mongoose          Single-service deploy
redux-persist     JWT (httpOnly)
Axios             bcryptjs
Tailwind CSS v4   nanoid · qrcode
```

---

## How the deploy works

There's no separate frontend service. The build script compiles React into `dist/`, copies it into `backend/public/`, and Express serves it. One Render service, one URL.

```
npm run render-build
  └── cd frontend && npm run build
  └── cp -r dist ../backend/public
```

Short URL redirects (`/:slug`) are matched before the static file middleware so `/abc123` always hits the redirect handler first, not the React app.

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/VikramKumavat-04/urlhub.git
cd urlhub

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run dev          # http://localhost:3000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env  # set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev           # http://localhost:5173
```

**.env variables**

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/urlhub
JWT_SECRET=any_long_random_string_32_chars_minimum
APP_URL=https://url-hub.onrender.com/
PORT=3000
NODE_ENV=production
```

---

## Project Structure

```
urlhub/
├── backend/
│   ├── app.js                  # Express app, static serve, redirect handler
│   ├── src/
│   │   ├── config/             # DB connection, cookie options
│   │   ├── controller/         # Auth + short URL controllers
│   │   ├── dao/                # DB queries
│   │   ├── middleware/         # JWT auth middleware
│   │   ├── model/              # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   └── utils/              # JWT helpers, error handler
│   └── public/                 # Built React app (generated at build time)
└── frontend/
    └── src/
        ├── api/                # Axios API calls
        ├── components/         # LoginForm, RegisterForm, UrlForm, Navbar
        ├── pages/              # Home, Dashboard, Auth, Settings
        ├── routing/            # TanStack Router config
        └── store/              # Redux slices (auth, url)
```

---

<div align="center">

Built by **[Vikram Kumavat](https://linkedin.com/in/vikramkumavat)** · [GitHub](https://github.com/VikramKumavat-04)

⭐ Star the repo if you found it useful

</div>
