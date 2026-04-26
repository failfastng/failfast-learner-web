# Runbook 02 — Cloudflare Pages Deploy + Custom Domain + OG Verification

> **Executor:** propersam personally (propersam2012@gmail.com)
> **Item:** Checklist Item 3
> **Prereqs:** Item 1 (repo exists, `main` branch pushed to GitHub), Item 2 (OCI VM running, DNS A record for `api.learner` added)
> **DNS registrar:** Squarespace — add CNAME only; do NOT touch existing records

---

## DNS no-touch reminder

The following records at Squarespace are LOCKED — do not modify, delete, or migrate:

| Type  | Name              | Data                                       |
|-------|-------------------|--------------------------------------------|
| ALIAS | @                 | apex-loadbalancer.netlify.com              |
| CNAME | www               | failfastng.netlify.app                     |
| TXT   | google._domainkey | v=DKIM1; k=rsa; p=MIIBIjAN...             |
| TXT   | @                 | v=spf1 include:_spf.google.com ~all        |
| MX    | @                 | smtp.google.com (priority 1)               |

Email continuity (Google Workspace) depends on the DKIM, SPF, and MX records above remaining untouched.

---

## Step 1 — Create the Cloudflare Pages project

1. Log in to the Cloudflare dashboard: https://dash.cloudflare.com (account: propersam2012@gmail.com)
2. Navigate to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select the `failfastng` GitHub organisation → repository `failfast-learner-web`
4. Set the following build configuration:

   | Field              | Value                                      |
   |--------------------|---------------------------------------------|
   | Production branch  | `main`                                     |
   | Build command      | `npx expo export --platform web`           |
   | Build output dir   | `dist`                                     |
   | Project name       | `failfast-learner-web`                     |

5. Under **Environment variables**, add:

   | Variable               | Value                                      |
   |------------------------|--------------------------------------------|
   | `NODE_VERSION`         | `22`                                       |
   | `EXPO_PUBLIC_API_BASE` | `https://api.learner.failfastng.com`       |

6. Click **Save and Deploy**
7. Wait for the first build to complete — typically 2–4 minutes. The project URL will be `failfast-learner-web.pages.dev` (or a variant if the name was taken).

> Note: if the project name `failfast-learner-web` is already taken in your Cloudflare account, use a slug variant and update the CNAME target in Step 3 accordingly.

---

## Step 2 — Add custom domain in Cloudflare Pages

After the first deploy completes successfully:

1. In the project dashboard: **Settings** → **Custom domains** → **Add custom domain**
2. Enter: `learner.failfastng.com`
3. Cloudflare will display a CNAME record to add. It will be:
   ```
   Type: CNAME
   Name: learner
   Target: failfast-learner-web.pages.dev
   ```
   (Copy the exact value Cloudflare shows — it matches the project name you set in Step 1.)
4. Do NOT click "Activate domain" yet — add the DNS record first (Step 3), then return here to verify.

---

## Step 3 — Add CNAME at Squarespace

1. Log in to Squarespace → **Domains** → **failfastng.com** → **DNS Settings** → **Custom Records**
2. Click **Add Record** and enter:

   | Field | Value                              |
   |-------|------------------------------------|
   | Type  | CNAME                              |
   | Name  | `learner`                          |
   | Data  | `failfast-learner-web.pages.dev`   |
   | TTL   | 300                                |

   > If you named the CF Pages project differently in Step 1, replace `failfast-learner-web.pages.dev` with the value Cloudflare displayed in Step 2.

3. Save the record.
4. Return to the Cloudflare Pages custom domain panel and click **Activate domain** (or wait — CF will poll and activate automatically once the CNAME propagates, typically within 1–5 minutes at TTL 300).

**Do NOT modify any other records during this step.** The existing Squarespace records (listed in the DNS no-touch reminder above) must remain untouched.

---

## Step 4 — Verify OG tag injection

After the first deploy resolves at `https://learner.failfastng.com`, run:

```bash
curl -s https://learner.failfastng.com | grep -E 'property="(og:|twitter:)'
```

**Expected output** (four tags minimum):

```html
<meta property="og:title" content="FailFast Learner"/>
<meta property="og:description" content="Practice that counts the effort, not just the answer."/>
<meta property="og:image" content="https://learner.failfastng.com/og-placeholder.png"/>
<meta property="og:url" content="https://learner.failfastng.com"/>
<meta property="twitter:card" content="summary_large_image"/>
<meta property="twitter:title" content="FailFast Learner"/>
<meta property="twitter:description" content="Practice that counts the effort, not just the answer."/>
<meta property="twitter:image" content="https://learner.failfastng.com/og-placeholder.png"/>
```

**If the probe returns nothing** (the `app.config.ts > web.meta` mechanism did not inject tags), try fallbacks in this order:

### Fallback 1 — Expo Router `<Head>` component

Add to `app/_layout.tsx`:

```tsx
import { Head } from 'expo-router/head';

// Inside your root layout component:
<Head>
  <meta property="og:title" content="FailFast Learner" />
  <meta property="og:description" content="Practice that counts the effort, not just the answer." />
  <meta property="og:image" content="https://learner.failfastng.com/og-placeholder.png" />
  <meta property="og:url" content="https://learner.failfastng.com" />
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:title" content="FailFast Learner" />
  <meta property="twitter:description" content="Practice that counts the effort, not just the answer." />
  <meta property="twitter:image" content="https://learner.failfastng.com/og-placeholder.png" />
</Head>
```

Commit, push to main, wait for CF Pages to redeploy, re-run the probe.

### Fallback 2 — `public/index.html` template

Create `public/index.html` with a full HTML shell including the meta tags hardcoded in `<head>`. Expo uses this file as the template for `dist/index.html` during export.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="FailFast Learner" />
    <meta property="og:description" content="Practice that counts the effort, not just the answer." />
    <meta property="og:image" content="https://learner.failfastng.com/og-placeholder.png" />
    <meta property="og:url" content="https://learner.failfastng.com" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="FailFast Learner" />
    <meta property="twitter:description" content="Practice that counts the effort, not just the answer." />
    <meta property="twitter:image" content="https://learner.failfastng.com/og-placeholder.png" />
    <%- scripts %>
    <%- css %>
  </head>
  <body>
    <%- rootTag %>
  </body>
</html>
```

> Note: the `<%- scripts %>`, `<%- css %>`, and `<%- rootTag %>` template variables are injected by Expo at export time. Check `node_modules/expo/static/entry.html` for the exact template syntax your SDK 54 version expects, and match it.

### Fallback 3 — CF Pages `_headers` file

Create a `_headers` file at the repo root. This sets HTTP response headers, not HTML `<meta>` tags — useful for `Link` preloads and security headers, but NOT a replacement for OG meta tags (crawlers read the HTML, not HTTP headers). If OG tags are still missing after Fallbacks 1 and 2, this file will not fix it. Use Fallback 2.

---

After confirming which mechanism works: update `README.md > Web head injection` to record the winning mechanism and remove the fallback list.

---

## Step 5 — Test link preview

1. Open the Twitter Card Validator: https://cards-dev.twitter.com/validator
2. Paste: `https://learner.failfastng.com`
3. Click **Preview card**

**Expected result:** card renders with:
- Title: `FailFast Learner`
- Description: `Practice that counts the effort, not just the answer.`
- Image: the og-placeholder.png (a small solid-colour placeholder — Item 20 replaces this with the real designed asset)

> If the validator shows a cached result from a prior crawl, use the "Request re-crawl" option or append a cache-bust query parameter to the URL.

---

## Step 6 — Verify auto-deploy on push

1. Make a trivial change to the repo (e.g., add a blank line or comment to `README.md`)
2. Commit and push to `main`
3. In the Cloudflare Pages dashboard, watch the **Deployments** tab — a new build should appear within 30 seconds and go live within 2–3 minutes
4. Hard-refresh `https://learner.failfastng.com` in the browser and confirm the trivial change is live

This confirms the CI/CD loop: `git push main` → CF Pages build → live.

---

## Step 7 — DNS continuity check

Run this after all steps above to confirm email routing was not disrupted:

```bash
dig MX failfastng.com +short
# Expected: smtp.google.com
```

Also confirm the main site still resolves:

```bash
dig failfastng.com +short
# Expected: resolves to Netlify load balancer IPs (not OCI, not CF)

curl -sI https://failfastng.com | head -5
# Expected: HTTP 200 or 301/302 from Netlify
```

If `dig MX` no longer returns `smtp.google.com`, check Squarespace DNS immediately — a MX record was modified or deleted during this procedure. Restore it from the inventory in `failfast-learner/docs/runbooks/00-prebuild-dns-inventory.md`.

---

## Checklist

- [ ] CF Pages project created, first build green
- [ ] Custom domain `learner.failfastng.com` added in CF Pages Settings
- [ ] CNAME `learner → failfast-learner-web.pages.dev` added at Squarespace
- [ ] CF Pages shows custom domain as "Active"
- [ ] OG probe returns all 8 meta tags (or fallback mechanism applied and verified)
- [ ] Twitter Card Validator renders the preview card correctly
- [ ] Auto-deploy on push verified
- [ ] DNS continuity check: MX still returns `smtp.google.com`
- [ ] `README.md > Web head injection` updated with confirmed mechanism
