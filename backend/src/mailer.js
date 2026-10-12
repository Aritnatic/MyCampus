import { config } from './config.js'

// Outgoing email.
//   console — development: prints the message to the server log (and the API returns codes to the caller)
//   resend  — production: https://resend.com over HTTPS, no extra dependency
// Failures never throw: sign-up and password reset must not 500 because a mail provider hiccuped (the
// person can ask for a new code). They're logged, and the caller gets { delivered: false }.
export async function sendMail({ to, subject, text }) {
  if (config.mailProvider === 'console') {
    if (process.env.NODE_ENV !== 'test') console.log(`[mail] to=${to} subject="${subject}"\n${text}\n`)
    return { delivered: true }
  }
  if (config.mailProvider === 'resend') {
    try {
      const res = await fetch(config.resendUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: config.mailFrom, to: [to], subject, text }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) {
        console.error(`[mail] Resend rejected the message to ${to}: ${res.status} ${(await res.text()).slice(0, 200)}`)
        return { delivered: false }
      }
      return { delivered: true }
    } catch (err) {
      console.error(`[mail] Resend request failed: ${err.message}`)
      return { delivered: false }
    }
  }
  console.warn(`[mail] no mail provider configured: not sending "${subject}" to ${to}`)
  return { delivered: false }
}

// Whether API responses may include verification codes. Only the console provider, and never in production.
export const exposeCodes = () => config.mailProvider === 'console' && !config.production
