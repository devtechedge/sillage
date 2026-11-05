import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="page-toggle"><ThemeToggle /></div>
      <Wordmark />
      <p className="kicker">404 / no such drawer</p>
      <h1>This page is not in the house.</h1>
      <p>
        A formula, a brief or a lot may have moved, or the link belongs to another house. The
        cabinet is still where you left it.
      </p>
      <Link className="button" href="/desk">
        Back to the desk
      </Link>
    </main>
  );
}
