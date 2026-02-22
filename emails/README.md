# Email Templates — Supabase Auth

Reference HTML templates for Supabase Auth emails. These files are the source of truth — deploy them manually via the Supabase dashboard.

## Deployment

1. Go to **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Copy the HTML content of each file into the corresponding template slot
3. Set the subject line in the dashboard (not included in the HTML)

## Template Mapping

| File                       | Supabase Slot  | Subject Line                           |
| -------------------------- | -------------- | -------------------------------------- |
| `signup-confirmation.html` | Confirm signup | Confirmez votre compte Fullstackhuman  |
| `password-reset.html`      | Reset password | Réinitialisation de votre mot de passe |
| `email-change.html`        | Change email   | Confirmez votre nouvelle adresse email |

## Template Variables

Supabase uses Go template syntax. Available variables:

| Variable                 | Description                        |
| ------------------------ | ---------------------------------- |
| `{{ .ConfirmationURL }}` | Full confirmation/reset URL        |
| `{{ .Token }}`           | OTP token (if OTP mode is enabled) |
| `{{ .SiteURL }}`         | Base site URL from Supabase config |
| `{{ .RedirectTo }}`      | Redirect URL after confirmation    |

## Known Limitation — French Only

Supabase Auth does not support per-user locale for email templates. All emails are sent in French regardless of the user's language preference. If bilingual emails become a priority, consider using Supabase Edge Functions to intercept auth hooks and send localized emails via a custom provider.

## Testing

Open each `.html` file directly in a browser to preview the layout and branding before deploying to Supabase.
