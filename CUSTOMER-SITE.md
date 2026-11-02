# Customer website (standalone)

A separate site for policyholders. They sign in with a username (email or phone) and password, see
only **their own** motor policies, file a claim on one of them, upload documents and follow the
claim. It has no module launcher and none of the staff screens, and it shares no code or session with
the staff app (`src/customer/` imports nothing from the rest of `src/`, apart from CSS and the logo).

| | Staff app | Customer site |
|---|---|---|
| Entry | `index.html` | `customer.html` |
| Config | `vite.config.ts` | `vite.customer.config.ts` |
| Dev | `npm run dev` (5173) | `npm run dev:customer` (5174) |
| Build | `npm run build` → `dist/` | `npm run build:customer` → `dist-customer/` |
| Session | `userDetail` in localStorage | `customer.session` in localStorage |

## Who can use it
- Sign-in accepts only customers (user type or role `CLIENT`). A staff account is refused with
  "This website is for customers" and nothing is stored.
- The backend decides what a customer may do, not the page: claims, documents and policy lookups are
  allowed only on policies/claims that belong to the signed-in insured (`MotorAuthorization.ownsPolicy`,
  `ownsClaim`). A policy number that is not theirs answers 403.
- The customer role must hold **no staff privileges**. If `CLIENT` is given staff privileges (as a
  local shortcut can do), the backend treats the user as staff and the ownership rules stop applying.

## Pages
`/login` · `/policies` (my policies, find by number) · `/policies/:policyNumber/claim` (claim form,
review, documents) · `/claims` · `/claims/:claimUuid` (progress, details, documents)

## Run locally
1. Start the backend (gateway on 8888). The dev server forwards `/api` to `VITE_CUSTOMER_API_HOST`,
   else `VITE_BACKEND_HOST`, else `http://localhost:8888`.
2. `npm run dev:customer` and open http://localhost:5174.

## Deploy
Serve `dist-customer/` from any static host on its own domain and forward `/api/` to the API gateway
(same origin, so no CORS), with a single-page-app fallback to `index.html`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    location /api/ { proxy_pass https://YOUR-GATEWAY/; proxy_ssl_server_name on; }
    location / { try_files $uri $uri/ /index.html; }
}
```

If the API is on another host, build with `VITE_CUSTOMER_API_HOST=https://api.example.com` instead
(the gateway must then allow the site's origin for CORS).

## Not built yet
- Self-registration and "forgot password" (the page tells customers to contact their branch).
- Policies other than motor.
