"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="not-found">
      <div className="page-toggle"><ThemeToggle /></div>
      <p className="kicker">The room went quiet</p>
      <h1>Something did not land.</h1>
      <p>The page could not be read. Try once more; if it stays dark, the house needs a look.</p>
      <button className="button" onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
