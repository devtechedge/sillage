# Contributing

Sillage is a small, opinionated product. Keep changes inside the existing domain and visual language.

## Before a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run e2e
npm run build
```

`npm test` needs a real PostgreSQL test database. `npm run e2e` builds the production bundle, seeds the e2e database and runs Playwright.

## Rules

- Keep the domain pure. No React or database imports in `domain/`.
- Every mutation checks the role and house scope on the server.
- Approval and batch production use serializable transactions.
- Approved versions and trials are immutable.
- Money is integer cents, parts are integer parts per thousand, stock is integer milligrams.
- New user-facing copy follows the house voice: concrete, calm, exact. No lorem ipsum and no em dashes.
- Commit messages use a conventional prefix and a specific sentence.
- Add a test for a new rule, not only a new screen.

## Demo data

The seed is reset, not merged. It refuses a non-test database unless `ALLOW_PROD_SEED=1`.
