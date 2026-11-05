# Security

Sillage is a demonstration application. It holds seeded fiction, no real client data and no payment details.

## Report a problem

Write to devtechedge@gmail.com with the route, a short reproduction and the impact. Do not post a guessing, ticket or token in public issues.

## Supported version

`main` and the current production deployment.

## Threat model

- Authentication: passwords are hashed with scrypt using a random 16 byte salt and are compared in constant time. Sessions are random 256 bit tokens; only SHA-256 token hashes are stored. Cookies are HttpOnly, SameSite Lax and Secure in production. Session lifetime is seven days.
- Authorization: every mutation checks role and house scope on the server. Membership is re-read inside approval and production transactions. Owner actions require the owner role and the last owner cannot be demoted.
- Tenant isolation: every house query is scoped by `houseId`. Another house's record returns 404. Tenant scope and role checks are covered by integration and browser tests.
- Input validation: request bodies are parsed with Zod before domain code runs. Formula parts are integer 1 to 1000; concentration and role values are allow listed; all database relations are parameterized.
- Data integrity: money is integer cents, parts are integer parts per thousand and stock is integer milligrams. Batch production and approvals run in serializable transactions with retry. Approval rechecks material maxima and exact total before locking a version.
- XSS and content: React escapes text. No dangerouslySetInnerHTML is used for user content. Content Security Policy, nosniff, referrer policy, frame denial, COOP and CORP headers are set.
- CSRF: all state-changing routes use POST server actions. Cookies are SameSite Lax and the server requires the membership before allowing a mutation. The demo route only accepts seeded demo emails.
- Secrets: no secret is committed. `.env.local` and `.env` are ignored. Session pepper is an environment secret. Local test databases must include `test` or `e2e` in their name.
- Privacy: all sample records are fictional. The demo database is public. Demo accounts and passwords are public by design and are accepted residual risk for a demonstration. Do not put real personal, client or commercial data in it.
- Supply chain: production dependency audit is clean. No third-party auth, email, storage, queue or model provider calls are made at runtime. Fonts are self hosted.
- Availability: serializable transactions retry on serialization failures. The seed refuses production unless explicitly allowed. The health route returns database reachability and the deployed commit SHA without infrastructure details.

## Known accepted risk

The demo login buttons and the public password allow anyone to use the seeded demo house. The rival house demonstrates isolation but is not a separate deployment boundary. The application must not be used for real client or commercial data while demo access is enabled.

## Out of scope

Accuracy of fictional fragrance costs, persistence, sillage and IFRA style guardrails. The interface states they are house estimates and not legal or safety advice.
