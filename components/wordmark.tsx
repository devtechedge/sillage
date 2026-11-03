import Link from "next/link";

export function Wordmark({ href = "/", small = false }: { href?: string; small?: boolean }) {
  return (
    <Link href={href} className={small ? "wordmark wordmark--small" : "wordmark"} aria-label="Sillage home">
      SILLAGE
    </Link>
  );
}
