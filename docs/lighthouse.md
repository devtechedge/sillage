# Lighthouse

Production build, local `next start`, 3 November 2026.

| Surface | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Landing, desktop | 95 | 100 | 100 | 100 |
| Landing, mobile | 94 | 100 | 100 | 100 |

Metrics on the mobile run: LCP 2.0 s, CLS 0.002, TBT 30 ms.

Command:

```bash
npx lighthouse@12 http://localhost:3000 --preset=desktop \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=docs/lighthouse-desktop.json
```

The mobile run uses the default Lighthouse mobile preset. The app ships self-hosted fonts, no analytics, no third-party scripts and no runtime service except PostgreSQL.
