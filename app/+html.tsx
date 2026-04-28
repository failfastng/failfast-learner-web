// app/+html.tsx
// Web-only: runs at `expo export` time in Node, not in the browser.

import { type PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

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
        <meta property="og:image" content="https://learner.failfastng.com/og-preview.png" />
        <meta property="og:url" content="https://learner.failfastng.com" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FailFast Learner" />
        <meta
          name="twitter:description"
          content="Practice that counts the effort, not just the answer."
        />
        <meta name="twitter:image" content="https://learner.failfastng.com/og-preview.png" />

        <link rel="icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
