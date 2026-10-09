# Content editor setup

## Set up Supabase

1. Create a dedicated Supabase project for this website.
2. Run supabase/schema.sql, then supabase/seed.sql in the SQL Editor. Re-run schema.sql for an existing installation to add the PIN rate limiter.
3. Set Authentication Site URL and redirect URL to https://genys.agne.dev/admin/. Disable public sign-ups.
4. Create an owner account with your email and personal password. Run the SQL below after replacing OWNER_EMAIL_HERE.

~~~sql
insert into public.content_editors (user_id, email, role)
select id, lower(email), 'owner' from auth.users
where lower(email) = lower('OWNER_EMAIL_HERE')
on conflict (user_id) do update
set email = excluded.email, role = 'owner';
~~~

## Configure and deploy

Set these server environment variables in Vercel and redeploy:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)
- SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)
- EDITOR_SHARED_PIN: one shared 6–12 digit editor PIN; preserve leading zeroes. Separate from attendance PINs.
- EDITOR_AUTH_SECRET: a random secret of at least 32 characters. Keep unchanged; changing it requires resetting or removing and re-adding editor accounts.

Keep the PIN, auth secret and service key in Vercel environment settings only. Never commit them or put them in browser code.

## Manage editors

1. Open https://genys.agne.dev/admin/ and choose Owner sign-in. Use your email and personal password.
2. Open Access and add approved editor emails. No invitation email or individual password setup is needed.
3. Give editors the shared PIN privately. They select Editor sign-in and enter their approved email and that PIN.
4. Remove an email from Access to revoke editing, including existing sessions. Shared PIN users never get owner permissions.

PIN login permits five attempts per email and thirty per client IP in fifteen minutes. An approved email is a username; a shared PIN does not verify which person is using it.

Successful PIN login issues a normal Supabase session. PIN rotation changes future PIN logins but does not end existing sessions. Supabase password changes/recovery outside this page may provide another sign-in route; the membership list is the authority for editing access. Remove an email to reliably revoke access.

Posts support LT/EN content, drafts, preview, publishing and photos. Uploaded photos are public, even while a post is a draft. This editor provides no access to attendance records.

Existing Auth accounts created outside this PIN editor are not overwritten. To migrate a previous invitation account, configure its internal password and the server-controlled genys_pin_editor app metadata separately. Use a dedicated Supabase project.
