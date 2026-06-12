// app/+html.tsx
// Web-only: runs at `expo export` time in Node, not in the browser.

import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { getSiteUrl } from '../src/lib/site-url';
import { getGaMeasurementId } from '../src/lib/gtag';

const siteUrl = getSiteUrl();
const gaMeasurementId = getGaMeasurementId();

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        <title>FailFast Learner</title>
        <meta name="description" content="Practice that counts the effort, not just the answer." />

        <meta property="og:title" content="FailFast Learner" />
        <meta
          property="og:description"
          content="Practice that counts the effort, not just the answer."
        />
        <meta property="og:image" content={`${siteUrl}/og-preview.png`} />
        <meta property="og:image:secure_url" content={`${siteUrl}/og-preview.png`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FailFast Learner" />
        <meta
          name="twitter:description"
          content="Practice that counts the effort, not just the answer."
        />
        <meta name="twitter:image" content={`${siteUrl}/og-preview.png`} />

        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {gaMeasurementId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', { send_page_view: false });
                `,
              }}
            />
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
