# Lighthouse

Production build, local `next start`, 5 November 2026.

| Surface | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Landing, desktop | 95 | 100 | 100 | 100 |
| Landing, mobile | 95 | 100 | 100 | 100 |

Metrics on the desktop run: LCP 0.4 s, CLS 0, TBT 0 ms.
Metrics on the mobile run: LCP 1.7 s, CLS 0, TBT 0 ms.

Command:

```bash
npx lighthouse@12 http://localhost:3000 --preset=desktop \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=docs/lighthouse-desktop.json
```

The mobile run uses the default Lighthouse mobile preset. The app ships self-hosted fonts, no analytics, no third-party scripts and no runtime service except PostgreSQL.
