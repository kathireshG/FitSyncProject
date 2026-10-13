# Security policy

## Reporting a vulnerability

Please do not open a public issue containing credentials, personal data, reset
tokens, or exploit details. Report vulnerabilities privately through GitHub's
private vulnerability reporting feature when it is enabled, or contact the
repository owner through the contact information on their GitHub profile.

Include the affected route or component, reproduction steps, potential impact,
and any suggested mitigation. Please allow reasonable time for investigation
before public disclosure.

## Implemented safeguards

- Passwords are hashed with bcrypt and excluded from normal database queries.
- JWT middleware authenticates protected routes.
- Resource queries derive ownership from the authenticated user.
- Role middleware protects administrator-only endpoints.
- Request validation, rate limiting, Helmet headers, an explicit CORS origin,
  upload restrictions, and centralized error handling are enabled.
- Password reset uses a hashed, expiring, single-use token and never returns the
  token in production responses.
- Local environment files and runtime uploads are excluded from Git.

These controls reduce risk but are not a formal security audit. Do not use
development defaults or local Docker credentials in a public deployment.

## Secrets and data

- Never commit `.env` files, API keys, passwords, database connection strings, or
  authentication tokens.
- Create local configuration from the committed `.env.example` files.
- Store production values in the hosting provider's encrypted secret manager.
- Rotate a credential immediately if it is committed or logged. Removing it from
  the latest source does not remove it from existing Git history or forks.
- Do not use real health or personal data in development or demonstration
  environments.

## Deployment limitations

Local avatar files require a persistent volume and are unsuitable for ephemeral
hosting. SMTP is optional in development but must be configured through secrets
for production password-reset email. Production deployments must also use HTTPS,
an exact CORS allowlist, a strong JWT secret, and a restricted MongoDB account.
