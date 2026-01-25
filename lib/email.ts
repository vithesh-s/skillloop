import { createTransport } from 'nodemailer'

interface SendVerificationRequestParams {
    identifier: string
    url: string
    provider: {
        server: string
        from: string
    }
    theme?: {
        brandColor?: string
        buttonText?: string
    }
}

/**
 * Send a verification email with a magic link
 * This function is called by NextAuth when a user requests to sign in
 */
export async function sendVerificationRequest(
    params: SendVerificationRequestParams
) {
    const { identifier, url, provider, theme } = params
    const { host } = new URL(url)

    // Create nodemailer transporter
    const transport = createTransport(provider.server)

    try {
        const result = await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `Sign in to ${host}`,
            text: text({ url, host }),
            html: html({ url, host, theme }),
        })

        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
            throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`)
        }

        console.log(`✅ Verification email sent to ${identifier}`)
    } catch (error) {
        console.error('❌ Error sending verification email:', error)
        throw error
    }
}

/**
 * Email HTML body
 */
function html(params: {
    url: string
    host: string
    theme?: { brandColor?: string; buttonText?: string }
}) {
    const { url, host, theme } = params

    const escapedHost = host.replace(/\./g, '&#8203;.')

    const brandColor = theme?.brandColor || '#10b981' // emerald-500
    const color = {
        background: '#f9fafb', // gray-50
        text: '#111827', // gray-900
        mainBackground: '#fff',
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: theme?.buttonText || '#fff',
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${escapedHost}</title>
</head>
<body style="background: ${color.background}; margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td align="center" style="padding: 40px 0 30px 0;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: ${color.text};">
          Skill Loop
        </h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
          Training Management System
        </p>
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: ${color.mainBackground}; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: ${color.text};">
                Sign in to <strong>${escapedHost}</strong>
              </h2>
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #6b7280;">
                Click the button below to securely sign in to your account. This link will expire in 24 hours.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table border="0" cellspacing="0" cellpadding="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: ${color.buttonText}; background-color: ${color.buttonBackground}; border: 2px solid ${color.buttonBorder}; border-radius: 8px; text-decoration: none; transition: all 0.2s;">
                      Sign in to Skill Loop
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #9ca3af; text-align: center;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #9ca3af; text-align: center; word-break: break-all;">
                ${url}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                ⚠️ <strong>Security Notice:</strong> If you did not request this email, please ignore it. This link is valid for 24 hours and can only be used once. Never share this link with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 30px 0;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          © ${new Date().getFullYear()} Skill Loop. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Email text body (fallback for email clients that don't render HTML)
 */
function text({ url, host }: { url: string; host: string }) {
    return `Sign in to ${host}\n\nClick this link to sign in:\n${url}\n\nThis link will expire in 24 hours.\n\nIf you did not request this email, you can safely ignore it.\n`
}
