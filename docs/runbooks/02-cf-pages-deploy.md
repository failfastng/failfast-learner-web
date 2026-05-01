# Runbook 02 — Cloudflare Pages Deploy + Custom Domain + OG Verification

> **Executor:** propersam personally (propersam2012@gmail.com)
> **Item:** Checklist Item 3
> **Prereqs:** Item 1 (repo exists, `main` branch pushed to GitHub), Item 2 (OCI VM running; DNS **A** record `learner-api` under `failfastng.com` → VM public IP so `https://learner-api.failfastng.com` resolves)

---

## URLs (how they fit together)

| Role | URL |
|------|-----|
| **Cloudflare Pages default hostname** | `https://failfast-learner-web.pages.dev` (exact slug matches your Pages project name in the dashboard) |
| **Production site (canonical)** | `https://learner.failfastng.com` — custom domain on the **same** Pages project |
| **Learner API** | `https://learner-api.failfastng.com` (OCI + Caddy; not proxied through Cloudflare unless you choose to) |

Every production build should set **`EXPO_PUBLIC_SITE_URL=https://learner.failfastng.com`** so Open Graph tags, `og:url`, and in-app share links point at the public domain—not at `*.pages.dev`.

Use **`failfast-learner-web.pages.dev`** only to smoke-test a deploy before DNS is ready, or for a deliberate staging project.

---

## DNS — do not break Google Workspace mail

Wherever **authoritative DNS** for `failfastng.com` lives (Squarespace, Cloudflare, etc.), do **not** delete or rewrite:

- **MX** → Google (`smtp.google.com` / Workspace values)
- **SPF** (`TXT` at apex)
- **DKIM** (`TXT` at `google._domainkey` or your Workspace hostnames)

If you add or edit records for Learner web, only add the **`learner`** CNAME described below unless you know exactly what you are changing.

---

## Step 1 — Create the Cloudflare Pages project

1. Log in to the Cloudflare dashboard: https://dash.cloudflare.com
2. Navigate to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select the `failfastng` GitHub organisation → repository `failfast-learner-web`
4. Set the following build configuration:

   | Field              | Value                                      |
   |--------------------|--------------------------------------------|
   | Production branch  | `main`                                     |
   | Build command      | `npx expo export --platform web`        |
   | Build output dir   | `dist`                                     |
   | Project name       | `failfast-learner-web`                     |

5. Under **Environment variables**, add:

   | Variable                 | Value                                      |
   |--------------------------|--------------------------------------------|
   | `NODE_VERSION`           | `22`                                       |
   | `EXPO_PUBLIC_API_BASE`   | `https://learner-api.failfastng.com`         |
   | `EXPO_PUBLIC_SITE_URL`   | `https://learner.failfastng.com`           |

6. Click **Save and Deploy**
7. Wait for the first build — typically 2–4 minutes. Cloudflare assigns **`https://failfast-learner-web.pages.dev`** (or a suffix variant if the name was taken—copy the exact hostname from the project overview).

> If the project slug differs, use that slug’s **`*.pages.dev`** everywhere this runbook says `failfast-learner-web.pages.dev`.

---

## Step 2 — Attach custom domain in Cloudflare Pages

After the first deploy succeeds:

1. In the project: **Settings** → **Custom domains** → **Add custom domain**
2. Enter: **`learner.failfastng.com`**
3. Cloudflare shows the record you must create at your DNS host. Typically:

   ```
   Type: CNAME
   Name: learner
   Target: failfast-learner-web.pages.dev
   ```

   Use the **exact** target string Cloudflare displays.

4. Add the record at your DNS provider (**Step 3**), then return here until the domain shows **Active**.

---

## Step 3 — Create the `learner` CNAME at your DNS provider

### Option A — DNS managed in Cloudflare (same account as Pages)

1. **DNS** → zone **`failfastng.com`** → **Add record**
2. **Type:** CNAME · **Name:** `learner` · **Target:** `failfast-learner-web.pages.dev` (or value from Step 2) · **Proxy status:** usually **DNS only** (grey cloud) for a straightforward Pages custom domain unless you intentionally want the orange cloud.

### Option B — DNS still at Squarespace (registrar)

1. Squarespace → **Domains** → **failfastng.com** → **DNS Settings** → **Custom Records**
2. **Add record:**

   | Field | Value                              |
   |-------|------------------------------------|
   | Type  | CNAME                              |
   | Name  | `learner`                          |
   | Data  | `failfast-learner-web.pages.dev`   |
   | TTL   | `300`                              |

3. Save. Propagation is often 1–5 minutes at TTL 300.

Do **not** remove unrelated records (especially mail-related TXT/MX).

---

## Step 4 — Verify OG tag injection

Run this **after** `learner.failfastng.com` is active on Pages (and **`EXPO_PUBLIC_SITE_URL`** is set to that origin—Step 1).

```bash
curl -s https://learner.failfastng.com | grep -E 'property="(og:|twitter:)'
```

**Expected shape** (paths must match the repo—currently **`og-preview.png`** in `app/+html.tsx` / `app.config.ts`):

```html
<meta property="og:title" content="FailFast Learner"/>
<meta property="og:description" content="Practice that counts the effort, not just the answer."/>
<meta property="og:image" content="https://learner.failfastng.com/og-preview.png"/>
<meta property="og:url" content="https://learner.failfastng.com"/>
<meta property="twitter:card" content="summary_large_image"/>
<meta property="twitter:title" content="FailFast Learner"/>
<meta property="twitter:description" content="Practice that counts the effort, not just the answer."/>
<meta property="twitter:image" content="https://learner.failfastng.com/og-preview.png"/>
```

**Before** the custom domain is live, you can probe the default hostname only to confirm HTML ships:

```bash
curl -s https://failfast-learner-web.pages.dev | grep -E 'property="(og:|twitter:)'
```

Meta URLs will still show **`learner.failfastng.com`** if `EXPO_PUBLIC_SITE_URL` was set correctly at build time—that is expected.

**If the probe returns nothing**, try the fallback ladder (Expo Router `<Head>`, `public/index.html`, etc.) documented in older checklist notes—or inspect `app/+html.tsx` / `app.config.ts` in this repo.

---

## Step 5 — Test link preview

1. Open the Twitter Card Validator: https://cards-dev.twitter.com/validator  
2. Paste: **`https://learner.failfastng.com`**  
3. **Preview card**

**Expected:** title, description, and **`og-preview.png`** (replace when final marketing asset exists).

---

## Step 6 — Verify auto-deploy on push

1. Trivial commit on `main` (e.g. comment in `README.md`)
2. Confirm a new deployment appears under **Deployments**
3. Hard-refresh **`https://learner.failfastng.com`** and confirm the change

---

## Step 7 — Mail + marketing sanity check

```bash
dig MX failfastng.com +short
# Expected: Google Workspace / smtp.google.com (unchanged)
```

Confirm `www.failfastng.com` / apex behave as you intend for the marketing site (that stack may be Cloudflare Pages or another host—adjust expectations to match production).

---

## Checklist

- [ ] CF Pages project **`failfast-learner-web`** created; first build green
- [ ] Env vars: `EXPO_PUBLIC_API_BASE`, `EXPO_PUBLIC_SITE_URL`, `NODE_VERSION`
- [ ] Custom domain **`learner.failfastng.com`** active on the Pages project
- [ ] CNAME **`learner` → `failfast-learner-web.pages.dev`** at authoritative DNS (Cloudflare or Squarespace, depending on where DNS lives)
- [ ] **`curl`** OG probe against **`https://learner.failfastng.com`** passes
- [ ] Link preview validator OK for **`https://learner.failfastng.com`**
- [ ] Push-to-deploy verified
- [ ] MX / Workspace mail still correct (`dig MX`)
