# CareerKit

CareerKit will turn career materials into a resume for a target role.
The project contains a Next.js and TypeScript foundation with Supabase Auth.
Users can sign in with Google or GitHub.
The website and Agent code share one application.
No Python service is required.
Use pnpm to manage dependencies, Tailwind CSS for styles, and shadcn/ui for UI components.

## Project structure

```text
public/
src/
  app/
    account/page.tsx
    api/auth/account/route.ts
    api/health/route.ts
    auth/
      actions.ts
      callback/route.ts
    layout.tsx
    login/page.tsx
    page.tsx
  components/
    header-account.tsx
    site-header.tsx
    ui/
  lib/
    supabase/
  proxy.ts
  server/
    agent/
package.json
pnpm-lock.yaml
components.json
postcss.config.mjs
next.config.ts
tsconfig.json
SPEC.md
```

The project root contains the Next.js application and its configuration.
The [App Router directory](src/app) contains pages and HTTP routes.
The App Router maps files to pages and HTTP routes.
The [Agent directory](src/server/agent) reserves space for server-side workflows.
The [specification](SPEC.md) defines the planned product.

## Local development

Use Node.js 20.9 or newer and pnpm 12.15.0.
The `packageManager` field pins the pnpm version for Corepack.
Run these commands in PowerShell from the project root:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000.
The home page and health route work without Supabase configuration.
Sign-in requires the configuration below.
No model credentials or application database connection are required.

## Authentication setup

Supabase Auth manages user accounts and sessions.
Google and GitHub sign-in use OAuth, a protocol that delegates sign-in to another service.
CareerKit does not send confirmation or password recovery emails.
Users recover access through Google or GitHub.
Application data storage remains unchanged.

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` to the project URL from the Supabase Connect dialog.
4. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the publishable key from that dialog.
5. In Supabase Authentication URL Configuration, set the Site URL to `http://localhost:3000`.
6. Add `http://localhost:3000/auth/callback` to the Supabase redirect URL allowlist.
7. Enable Google and GitHub in Supabase Authentication Sign In / Providers.
8. Restart the development server after you change environment variables.

`SITE_URL` is optional on Vercel and localhost.
Vercel supplies the request domain, so callbacks use the domain that started sign-in, with HTTPS.
Local development uses HTTP and the requested localhost or loopback port.
Forwarded host and protocol headers are not used to choose authentication destinations.
Outside Vercel and localhost, set `SITE_URL` to the public HTTPS origin without a path.
An explicit `SITE_URL` overrides automatic detection in every environment.
Only set `VERCEL=1` through Vercel's automatic system environment variables, not on a self-hosted server.

Never use a Supabase secret key or service-role key in this application.
Keep provider client secrets in the Supabase dashboard, not in this repository.
The publishable key identifies the project but does not grant administrative access.
Supabase supports these providers on its Free plan, subject to its current usage limits.

### Google provider

Create a project in Google Cloud Console.
Configure the Google Auth Platform branding, audience, and consent screen.
Create an OAuth client with the Web application type.
Add your site origin as an authorized JavaScript origin.
For development, use `http://localhost:3000`.
Copy the Google callback URL shown by Supabase into Google's authorized redirect URIs.
It normally has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
Enter the client ID and client secret in the Supabase Google provider configuration.
Use the basic identity scopes: `openid`, `email`, and `profile`.
If the Google app is in testing mode, add the accounts that will test sign-in.
Before public launch, publish the app and complete any Google requirements.

### GitHub provider

In GitHub Developer settings, create an OAuth App.
Set its homepage URL to your site URL.
Set its Authorization callback URL to the callback URL shown by Supabase.
It normally has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
Enter the GitHub client ID and client secret in the Supabase GitHub provider configuration.
CareerKit does not request repository access.

The provider callback and CareerKit callback are different.
Google and GitHub redirect to Supabase.
Supabase then redirects to CareerKit at `/auth/callback`.

### Sessions and deployment

The `/login` page starts sign-in and creates accounts on the first successful sign-in.
The `/auth/callback` route exchanges the authorization code for a cookie-based session.
Supabase verifies that the callback matches the browser that started sign-in.
The `/account` page checks the user with Supabase before it displays account details.
Sign-out ends the session in the current browser.
If Supabase cannot confirm sign-out, its client still clears the local session.
The login page displays the failure and lets the user sign in again.
The session verification and refresh code in `src/proxy.ts` runs before login and account pages.
Public pages do not wait for Supabase.
The header loads verified display fields from `GET /api/auth/account` after the page loads.
That endpoint refreshes expired sessions and writes replacement cookies.
Anonymous requests preserve the verification cookies for pending Google and GitHub sign-in.
Private responses use `Cache-Control: private, no-store`.
Future private pages and routes must verify the user and enforce ownership themselves.
The proxy matcher excludes API routes and static assets.
API routes that read sessions need their own session refresh and access checks.
Do not use this sign-in integration as a substitute for database access rules.

For Vercel deployment, set the two Supabase environment variables on the host.
No manual `SITE_URL` is required; keep Vercel's automatic system environment variables enabled.
Update the Supabase Site URL and allowlist with the exact production `/auth/callback` URL.
For preview sign-in, also allow your team's Vercel preview domains in Supabase.
Use the scoped pattern described in the [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls), not a wildcard for all Vercel sites.
Update the provider configuration for the production site.
Callback destinations use the detected site origin or an explicit `SITE_URL`, never user-supplied redirect parameters.
Disable the Supabase Email provider if you want to allow only Google and GitHub sign-in.

Test both providers with real accounts before launch.
Make sure that successful sign-in opens `/account` and survives a page reload.
Make sure that sign-out prevents access to `/account`.
Cancel sign-in once and make sure that the login page displays an error.

## Validation and production

Next.js and `eslint-config-next` are pinned to the same version.
pnpm 12 requires dependencies to be at least 24 hours old by default.
Version 16.4.2 meets that requirement without a release-age exception.
When updating Next.js, update both packages and keep the release-age check enabled.

Run these commands from the project root:

```powershell
pnpm lint
pnpm typecheck
pnpm test:auth
pnpm build
pnpm start
```

The start command serves the production build.
`GET /api/health` returns `{"status":"ok","service":"careerkit"}`.
The health route does not test a database or model provider.
`pnpm test:auth` builds the app and tests authentication against a local mock of Supabase.
The tests cover provider redirects, callbacks, protected pages, session refresh, sign-out, and the shared header.
They also cover the login-page exception, 404 navigation, and visible authentication failures.
Pending sign-in must survive navigation and account checks in another tab.
Public pages must finish within 1500 milliseconds while a mock account lookup remains blocked.
They do not contact Google, GitHub, or a real Supabase project.

## UI components

The root layout displays a shared header on all ordinary pages, including the standard error and 404 pages.
The header scrolls with the page and keeps the same layout on mobile.
Its briefcase icon and CareerKit name link to the home page.
Anonymous users see a single "Sign in / Sign up" button, except on the login page.
Signed-in users see an avatar menu with their name, email address, and a sign-out action.
If an avatar image fails, the menu button shows the first letter of the name or a user icon.
Account details load separately from page content.
The account area shows a loading placeholder until its independent request completes.
It refreshes on navigation, window focus, and return to a visible tab.
Requests from previous navigation are cancelled so they cannot restore an old avatar.
Authentication failures display an error instead of an anonymous account state.
The Retry button repeats a failed account request.
The header does not appear on HTTP API responses or when the root layout itself fails.

Tailwind CSS uses the PostCSS plugin in `postcss.config.mjs`.
Global styles and theme variables live in `src/app/globals.css`.
The `components.json` file configures shadcn/ui.

Add components from the project root:

```powershell
pnpm dlx shadcn@latest add button
```

Component source lives in `src/components/ui`.
UI components use the `cn` package to combine CSS classes.
Do not add a second package-manager lockfile.
The `pnpm-workspace.yaml` file records approved dependency build scripts.
It does not define additional applications.

## Current limits

Application data storage, Agent workflows, approvals, and resume exports are not implemented.
The Agent framework and model provider remain undecided.
Live provider sign-in requires your Supabase project and provider credentials.
Do not submit private career materials to this foundation.
