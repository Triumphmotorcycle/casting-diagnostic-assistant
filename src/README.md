# Precious-Metal Casting Diagnostic Assistant

A React/Vite diagnostic assistant with a shared workshop case register.

## Shared register setup (required)

The hosted app needs a Supabase project to provide shared storage and authentication.

1. Create a project at https://supabase.com/.
2. In the Supabase dashboard, open **SQL Editor**, create a query, paste all of `supabase/schema.sql`, and run it.
3. In **Project Settings → API**, copy the Project URL and the publishable/anon key (not the service-role key).
4. In GitHub, open this repository's **Settings → Secrets and variables → Actions → New repository secret**. Add:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key
5. In GitHub **Actions**, run **Build and deploy casting diagnostic app** again (or commit a change to `main`).
6. Open the deployed site and create your account. Confirm your email if email confirmation is enabled.
7. In Supabase SQL Editor, promote your own account to administrator by running the following query with your sign-in email substituted:

   ```sql
   update public.workshop_profiles
   set role = 'admin'
   where user_id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
   ```

8. Promote nominated reviewers by running (replace the email):

   ```sql
   update public.workshop_profiles
   set role = 'reviewer'
   where user_id = (select id from auth.users where email = 'REVIEWER-EMAIL-HERE');
   ```

New accounts default to `member`. Members can create and submit cases for review. Reviewers/admins can move cases into investigation and close them. Closure is blocked by database rules unless review findings, corrective action and verification results are all provided. Cases are shared between signed-in users.

## Case workflow

- **New Case** clears the form; it does not reuse the last case's form values.
- **Save draft** creates a centrally stored draft or updates the existing draft.
- A database sequence assigns references such as `CAST-000001` when a case is first saved. References are read-only in the form.
- **Submit for review** sends the case to the shared register's Awaiting review queue.
- A reviewer moves it to Under investigation, records findings, corrective action and verification, then closes it.
- Closed cases remain searchable in the register.

## Run locally

```bash
npm install
npm run dev
```

For a local build:

```bash
npm run build
```

For local Supabase configuration, create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values. Never use a Supabase service-role key in the client-side app.

## Data and safety

The shared register stores case data in the configured Supabase project. Access requires an authenticated account. Review permissions are enforced by database policies and triggers, not just by buttons in the UI. Assess confidentiality, retention and privacy requirements before entering customer-identifying or commercially sensitive information.

The app is a decision-support tool, not an autonomous controller. Process changes require validation and approval by the responsible technical specialist.
