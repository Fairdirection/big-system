# 📄 project-setup.md
# SalesFlow Frontend — Project Setup Guide

## Prerequisites

Ensure the following are installed before starting:

```bash
node --version   # v20+ required
npm --version    # v10+
ng version       # Angular CLI — install below if missing
```

---

## 1. Install Angular CLI (Latest)

```bash
npm install -g @angular/cli@latest
```

---

## 2. Create the Angular Project

```bash
ng new salesflow-frontend \
  --style=css \
  --routing=true \
  --ssr=false \
  --strict=true

cd salesflow-frontend
```

> ✅ Use `--strict=true` for production-grade type safety aligned with this backend's strongly typed responses.

---

## 3. Install Tailwind CSS v3 (Angular-compatible)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

---

## 4. Configure PostCSS

Create `postcss.config.js` at project root:

```js
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 5. Configure `styles.css`

Replace contents of `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* SalesFlow global base */
@layer base {
  html {
    @apply bg-sf-bg text-sf-text font-body antialiased;
  }

  * {
    @apply box-border;
  }

  ::-webkit-scrollbar {
    @apply w-1.5;
  }
  ::-webkit-scrollbar-track {
    @apply bg-sf-surface;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-sf-border rounded-full;
  }
}
```

---

## 6. Install Core Dependencies

```bash
# HTTP + Routing (built-in, but needed packages)
npm install @angular/common @angular/forms

# Charts for dashboard
npm install chart.js ng2-charts

# Icons
npm install @ng-icons/core @ng-icons/heroicons

# Date utilities (matches backend date fields)
npm install date-fns

# HTTP interceptor utilities
npm install rxjs
```

---

## 7. Environment Configuration

Create `src/environments/environment.ts`:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
};
```

Create `src/environments/environment.prod.ts`:

```ts
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api/v1',
};
```

> 🔗 `apiUrl` must match backend `server.js` — default port is `3000`, CORS already allows `http://localhost:4200`.

---

## 8. Start the Development Server

```bash
ng serve --open
# Runs on http://localhost:4200
# Proxy to backend at http://localhost:3000
```

### Optional: Add Dev Proxy (recommended)

Create `proxy.conf.json` at root:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Update `angular.json` under `serve > options`:

```json
"proxyConfig": "proxy.conf.json"
```

Then run:

```bash
ng serve --proxy-config proxy.conf.json --open
```

---

## 9. Verify Setup

```bash
ng build --configuration=production
# Should complete with 0 errors
```

---

## Quick Start Summary

| Step | Command |
|---|---|
| Install CLI | `npm install -g @angular/cli@latest` |
| Create project | `ng new salesflow-frontend --style=css --routing=true --ssr=false --strict=true` |
| Add Tailwind | `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init` |
| Install deps | `npm install chart.js ng2-charts @ng-icons/core @ng-icons/heroicons date-fns` |
| Dev server | `ng serve --open` |
