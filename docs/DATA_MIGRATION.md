# Legacy data decision

Decision date: 2026-10-02

The old MongoDB deployment is not available from this workspace, and the old API
endpoint is offline. Local development therefore starts with a new `fitness`
database at `mongodb://127.0.0.1:27017/fitness`.

No legacy records have been deleted or migrated. The application creates its
collections when data is first written.

If access to the previous database is recovered later:

1. Export it without changing the source database.
2. Store the export outside Git and treat it as sensitive user/health data.
3. Inspect record counts, invalid references, duplicate emails, and plaintext
   password fields.
4. Do not copy plaintext passwords into the rebuilt User model. Require affected
   users to reset their passwords or perform a controlled one-time hash migration
   only if the original values are legitimately recoverable and authorized.
5. Transform parallel chart arrays into individual progress records.
6. Import into a non-production database and verify owner relationships before a
   production migration.
