import Link from "next/link";
import { signOut } from "@/app/auth-actions";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireHouse } from "@/lib/auth";

export default async function HouseLayout({ children }: { children: React.ReactNode }) {
  const context = await requireHouse();

  return (
    <div className="house">
      <header className="house-bar">
        <Wordmark href="/desk" small />
        <div className="house-bar__identity">
          <span>{context.house.name}</span>
          <span className="mono">{context.role}</span>
        </div>
        <nav className="house-nav" aria-label="Atelier">
          <Link href="/desk">Desk</Link>
          <Link href="/trials">Trials</Link>
          <Link href="/batches">Batches</Link>
          <Link href="/materials">Materials</Link>
          <Link href="/archive">Archive</Link>
          {context.role === "OWNER" && <Link href="/team">Team</Link>}
        </nav>
        <div className="house-bar__user">
          <span>{context.user.name}</span>
          <form action={signOut}>
            <button className="text-button" type="submit">
              Sign out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </header>
      <main className="house-main">{children}</main>
      <footer className="house-foot">
        <span>Maison Verre / {context.house.timezone.replace("_", " ")}</span>
        <span className="mono">Formula room, private</span>
      </footer>
    </div>
  );
}
