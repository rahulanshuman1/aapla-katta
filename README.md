# Aapla Katta – Restaurant Website

Full-stack site for **Aapla Katta – Good Mood Food, Family Restaurant (Chinchwad, Pune)**.

| Part | Stack | Deploy to |
|---|---|---|
| `frontend/` | React 18 + Vite + Framer Motion | **Vercel** |
| `backend/` | Node 18+ / Express + Mongoose | **Render** |
| Database | MongoDB | **MongoDB Atlas** (free M0) |

## Features

- **Animated brand logo** (steam, letter-by-letter reveal, shine sweep) + splash intro. Admin can replace it with an uploaded logo.
- Full menu (**20 categories, 247 dishes**) pre-loaded from your printed menu, with Half/Full sizes, 🌶️ spicy / 🍯 sweet / 👨‍🍳 chef tags, search and category navigation.
- **Sign up → email verification → welcome email**, sign in, forgot/reset password.
- Cart → checkout (dine-in / takeaway / delivery) → **Razorpay** payment (UPI, cards, netbanking) or pay-at-restaurant.
- **Order emails**: confirmation to the customer + "new order" alert to the owner; status-update emails when the owner moves an order along.
- Server-side price calculation and Razorpay signature verification (the browser can't tamper with prices).
- **Admin panel** (`/admin`, admin role only):
  - Live orders with one-tap status updates, today's orders / revenue
  - **Menu & prices**: add / edit / delete dishes and categories, quick price edit, sold-out switch, photos, Half/Full sizes
  - **Festival themes**: Diwali, Holi, Ganesh Chaturthi, Navratri, Christmas, Eid, Republic/Independence Day, Sankranti, New Year (colours + top banner + falling-emoji effect), live preview, plus full custom colour pickers
  - **Logo & branding**: upload logo and home-page hero photo, edit name/tagline
  - **Website text**: every heading/paragraph editable from one screen, *or* click **"Edit page text"** on any page and edit in place
  - **Contact & settings**: phone, WhatsApp, email, Instagram, address, hours, map link, GST %, delivery fee, minimum order, pause online orders, enable/disable pay-at-restaurant

## 1. Run locally

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (+ Razorpay / mail keys)
npm install
npm run dev                 # http://localhost:5000  (menu is auto-seeded on first start)

# Frontend (new terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

The admin account is created automatically from `ADMIN_EMAIL` / `ADMIN_PASSWORD` the first time the server starts. Sign in with those at `/login`.

## 2. Set up the third-party services

**MongoDB Atlas** – create a free cluster → Database Access: add a user → Network Access: allow `0.0.0.0/0` (Render IPs change) → Connect → copy the connection string into `MONGODB_URI` (add the DB name, e.g. `.../aapla-katta?retryWrites=true&w=majority`).

**Razorpay** – Dashboard → Settings → API Keys. Start with *Test mode* keys (`rzp_test_…`), complete KYC, then switch to *Live* keys. Test UPI/cards: <https://razorpay.com/docs/payments/payments/test-card-details/>.

**Email (important):** Render's **free** plan blocks SMTP ports, so use an HTTPS email API:
- **Brevo** (recommended, free 300 mails/day, no domain needed): create account → *SMTP & API → API keys* → set `BREVO_API_KEY`. Under *Senders* add and verify the address you want to send from, and use it as `MAIL_FROM_EMAIL`.
- Resend also works (`RESEND_API_KEY`) but needs a verified domain to email customers.
- SMTP (Gmail app password etc.) is supported for local use or a paid Render plan.

## 3. Deploy the backend on Render

1. Push this repo to GitHub.
2. Render → **New + → Blueprint** → select the repo (uses `render.yaml`), *or* **New Web Service** with Root Directory `backend`, Build `npm install`, Start `npm start`, Health check `/api/health`.
3. Fill the environment variables (see `backend/.env.example`). `CLIENT_URL` must be your Vercel URL(s), comma-separated, **no trailing slash** (e.g. `https://aapla-katta.vercel.app,https://www.aaplakatta.in`).
4. Deploy, then open `https://<your-service>.onrender.com/api/health` – you should see `{"ok":true}`.

> Free Render services sleep after ~15 min idle, so the first request after a pause can take ~30–60 s. The site shows a loader. Use a paid instance, or an uptime pinger on `/api/health`, to avoid this.

## 4. Deploy the frontend on Vercel

1. Vercel → **Add New Project** → import the repo → **Root Directory: `frontend`** (framework preset: Vite is auto-detected).
2. Environment variable: `VITE_API_URL = https://<your-service>.onrender.com`
3. Deploy. `vercel.json` already handles client-side routing.
4. Go back to Render and make sure `CLIENT_URL` contains the final Vercel URL; redeploy the backend if you changed it.

## 5. Using the admin panel

Sign in with the admin email → the navbar shows **Admin**, and pages show a floating **"✏️ Edit page text"** button.

- **Festival theme:** Admin → *Theme & logo* → click e.g. "Diwali" (previews live) → *Save appearance*. After the festival choose "Classic Katta" and save.
- **Change a price / hide a dish:** Admin → *Menu & prices* → pick a category → edit the ₹ box or toggle availability.
- **Replace the logo:** Admin → *Theme & logo* → *Upload logo*.
- To make another person an admin, set their `role` to `admin` in the MongoDB `users` collection.

## Notes & assumptions

- **Prices** were transcribed from the *newer leather-bound menu* (the spiral-bound menu photos show older, lower prices). Please skim the Menu tab once and correct anything I misread.
- `160/100`-style prices are treated as **Full / Half** (Half is the lower figure). If it means something else, edit the sizes in Admin → Menu.
- *Paneer Methi Chaman* had no visible price in the photo; I set ₹270 – please confirm.
- GST defaults to **0 %** (menu prices are shown as-is). Set the rate in Admin → *Contact & settings* if you charge GST on top.
- Images (logo, hero, dish photos) are resized in the browser and stored in MongoDB, because Render's disk is wiped on each deploy.
- Swiggy/Zomato appear as plain text badges (no third-party logos bundled).
- **Not included yet:** a Razorpay *webhook* (if a customer pays and closes the tab before the browser confirms, the order stays "Awaiting payment" and can be reconciled from the Razorpay dashboard); live table-QR ordering; push/WhatsApp notifications.

## Update notes (checkout, emails, appearance)

- **Order emails** are now sent in the background, so payment confirmation never waits on email. Render's free plan blocks SMTP, so **set `BREVO_API_KEY`** (and `MAIL_FROM_EMAIL` = a sender verified in Brevo) on Render. Check it from Admin → *Contact & settings* → **Send test email to me**; check Render logs for lines starting `[mail]`.
- **Appearance:** new footer background image; **Preview on site** shows unsaved changes on the real website (nothing is saved until *Save & publish*).

## Delivery tracking (Swiggy/Zomato style)

1. Customer picks **Delivery** at checkout and (recommended) pins their location on the map → the order gets a **Tracking ID** (`TRK-XXXXXXXXXX`), shown on My Orders and in the confirmation email.
2. Admin → **Delivery team**: add riders (name, mobile, email, password). Admin → **Orders**: choose a rider on the delivery order → the customer is emailed the rider's name/number and tracking link.
3. Rider signs in at `/login` (lands on **My deliveries**), taps **Start delivery** → phone GPS is shared every ~4 s (keep the page open) → customer sees the rider moving on the map at `/track/<ID>`, with ETA and a Call button.
4. Rider taps **Mark delivered** → order becomes *Delivered* everywhere (customer page, admin, email). Cash-on-delivery orders are marked paid.

Notes: maps use OpenStreetMap (free, no key; fine for light traffic – use a paid tile provider if you grow). Browsers only report GPS while the rider page stays open and the screen is on (the page requests a screen wake-lock). Run `npm install` in `frontend/` (new dependency: `leaflet`).

## Mobile apps (Android & iOS)

The same website is packaged as native apps with Capacitor, with push notifications, rider background GPS, delete-account, privacy policy and terms. See **[MOBILE.md](MOBILE.md)** for setup (`npm run mobile:setup`), Firebase push, and Play Store / App Store publishing.
