# Mobile OTP login

Customers can sign in (or sign up) with a mobile number + 6-digit SMS code, on the website and in the Android app. The "Mobile OTP" tab appears only when an SMS provider is configured on Render.

## Choose a provider (Render → Environment)
| Provider | Variables | Notes |
|---|---|---|
| **Brevo** | `BREVO_API_KEY` (same as email) + `BREVO_SMS_SENDER` (≤11 letters/digits, e.g. `AAPLAK`) | Needs **SMS credits** bought in Brevo (not free). India traffic requires DLT registration + approved sender/template; unregistered messages are usually blocked. |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Trial sends only to numbers you verified in Twilio. |
| Fast2SMS / 2Factor | `FAST2SMS_API_KEY` / `TWOFACTOR_API_KEY` | Indian providers with DLT-ready OTP routes. |
| Test mode | `SMS_PROVIDER=log` | Nothing sent; code printed in Render logs. |

Set `SMS_PROVIDER=brevo` to force it. Redeploy, then Admin → Business → **Send test SMS** shows the provider's real error if it fails.

## Rules
Code valid 5 min · 30 s between sends · 5 sends/hour/number · 5 wrong tries · single use · codes stored only as hashes.

## Notes
- Phone-only accounts have no email: no email receipts; push and tracking still work. They delete their account by typing DELETE.
- Existing users are matched by their saved phone number (auto-migrated at server start).
- Rebuild the APK (push to GitHub) to get the OTP screen in the app.
- Keep secrets only in Render env vars / a local `.env`; `.env.example` must hold placeholders only.
