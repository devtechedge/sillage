import Link from "next/link";
import { Status } from "@/components/status";
import { NotePyramid } from "@/components/note-pyramid";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCents, formatHours } from "@/lib/format";
import { publicFormula } from "@/services/landing";

export const dynamic = "force-dynamic";

const FALLBACK = {
  name: "No. 07 Iris Cendre",
  brief: "Iris Cendre",
  client: "Hotel Verre, lobby",
  concentrationBp: 2000,
  version: 3,
  noteShare: { TOP: 25, HEART: 45, BASE: 30 },
  totalPpt: 1000,
  costCents: 5554,
  tenacity: 12.4,
  sillage: 58,
  fit: 100,
  warnings: 0,
  materialCount: 18,
};

export default async function LandingPage() {
  let formula = FALLBACK;
  try {
    const live = await publicFormula();
    if (live) formula = live;
  } catch {
    // The landing page can still explain the house if the database is asleep.
  }

  return (
    <main className="landing">
      <header className="site-head">
        <Wordmark />
        <p className="site-head__meta">
          Maison Verre, Bombay
          <span>Formula room / private edition</span>
        </p>
        <nav className="site-head__nav" aria-label="Public">
          <a href="#house">The house</a>
          <Link href="/login">Sign in</Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <p className="kicker">Private edition / MMXXVI</p>
          <h1>
            Every perfume
            <span>is a version.</span>
          </h1>
          <p className="hero__lede">
            Sillage is the private formula room of Maison Verre. Compose in parts per thousand,
            keep every trial, approve one version, and follow the materials into the bottle.
          </p>
          <div className="hero__actions">
            <form action="/api/auth/demo" method="post">
              <input type="hidden" name="email" value="owner@sillage.demo" />
              <button className="button" type="submit">
                Enter the atelier
              </button>
            </form>
            <Link className="quiet-link" href="/login">
              Use another demo role
            </Link>
          </div>
          <dl className="hero__facts">
            <div>
              <dt>1,000</dt>
              <dd>parts to a formula</dd>
            </div>
            <div>
              <dt>21</dt>
              <dd>days in the maceration room</dd>
            </div>
            <div>
              <dt>{formula.materialCount}</dt>
              <dd>materials in this composition</dd>
            </div>
          </dl>
        </div>

        <article className="formula-card">
          <header className="formula-card__head">
            <span className="mono">Version {String(formula.version).padStart(2, "0")}</span>
            <Status value="APPROVED" />
          </header>
          <p className="kicker">{formula.client}</p>
          <h2>{formula.name}</h2>
          <p className="formula-card__brief">{formula.brief}</p>
          <NotePyramid
            top={formula.noteShare.TOP}
            heart={formula.noteShare.HEART}
            base={formula.noteShare.BASE}
            total={formula.totalPpt}
            label="MAISON VERRE"
          />
          <dl className="formula-card__metrics">
            <div>
              <dt>Cost / 100 ml</dt>
              <dd>{formatCents(formula.costCents)}</dd>
            </div>
            <div>
              <dt>Tenacity</dt>
              <dd>{formatHours(formula.tenacity)}</dd>
            </div>
            <div>
              <dt>Sillage</dt>
              <dd>{formula.sillage} / 100</dd>
            </div>
            <div>
              <dt>Brief fit</dt>
              <dd>{formula.fit.toFixed(1)} / 100</dd>
            </div>
          </dl>
          <footer className="formula-card__foot">
            <span>20 percent concentration</span>
            <span>{formula.warnings === 0 ? "No guardrails raised" : `${formula.warnings} notes`}</span>
          </footer>
        </article>
      </section>

      <section className="landing-rail" id="house" aria-label="How the house works">
        <article>
          <span className="rail-number">01</span>
          <h2>Compose</h2>
          <p>
            Open a brief and build against it. The cabinet shows cost, stock, persistence and the
            house cap for every material. The pyramid and the totals move as you work.
          </p>
        </article>
        <article>
          <span className="rail-number">02</span>
          <h2>Evaluate</h2>
          <p>
            Submit a version of exactly one thousand parts. The evaluator scores a strip, writes
            what they smell, and returns the formula with a note or approves it for the lab.
          </p>
        </article>
        <article>
          <span className="rail-number">03</span>
          <h2>Produce</h2>
          <p>
            An approved version becomes a lot. Every milligram is drawn from the cabinet in one
            transaction, written to the ledger, and kept with the code on the bottle.
          </p>
        </article>
      </section>

      <footer className="landing-foot">
        <p>Maison Verre, Bombay. Sillage is a demonstration house; no materials are sold here.</p>
        <p className="mono">SV / 2026</p>
      </footer>
    </main>
  );
}
