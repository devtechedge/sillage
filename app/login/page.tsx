import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "@/components/login-form";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Enter the house" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/desk");

  return (
    <main className="auth">
      <div className="auth__toggle"><ThemeToggle /></div>
      <section className="auth__brand">
        <Wordmark />
        <p className="kicker">Maison Verre / formula room</p>
        <h1>
          The door is
          <span>on the left.</span>
        </h1>
        <p className="auth__lede">
          Four roles keep the house. The perfumer writes, the evaluator reads, the lab weighs, and
          the owner holds the keys. Enter as any of them.
        </p>
        <p className="auth__note">
          Sillage is a demonstration. The materials, formulas and trials are seeded fiction.
        </p>
      </section>

      <section className="auth__panel" aria-labelledby="login-heading">
        <h2 id="login-heading">Sign in</h2>
        <LoginForm />

        <div className="auth__divider">
          <span>or enter a demo role</span>
        </div>

        <div className="demo-list">
          {DEMO_ACCOUNTS.map((account) => (
            <form action="/api/auth/demo" method="post" key={account.email}>
              <input type="hidden" name="email" value={account.email} />
              <button className="demo-card" type="submit">
                <span className="demo-card__role">{account.label}</span>
                <span className="demo-card__name">{account.name}</span>
                <span className="demo-card__blurb">{account.blurb}</span>
              </button>
            </form>
          ))}
        </div>

        <p className="micro auth__password">
          Demo password: <code>{DEMO_PASSWORD}</code>
        </p>
      </section>
    </main>
  );
}
