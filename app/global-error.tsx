"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="not-found">
          <p className="kicker">Sillage</p>
          <h1>The house is closed for a moment.</h1>
          <p>A fault reached the root. Try the page again.</p>
          <button className="button" onClick={reset} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
