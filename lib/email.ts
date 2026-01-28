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


export interface SendEmailParams {
  to: string
  subject: string
  template: 'training-assigned' | 'calendar-updated' | 'assessment-due' | 'general' | 'feedback-reminder' | 'progress-reminder' | 'post-assessment-scheduled' | 'skill-progression' | 'mentor-assigned'
  data: any
}

function getTemplate(template: string, data: any) {
  const header = `
     <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header { background: #1f2937; padding: 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6b7280; background: #f3f4f6; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: 600; color: #4b5563; width: 120px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
                <h1>Skill Loop</h1>
            </div>
            <div class="content">
    `;

  const footer = `
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Skill Loop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
    `;

  let body = '';

  if (template === 'training-assigned') {
    body = `
            <h2>New Training Assigned</h2>
            <p>Hello ${data.userName},</p>
            <p>You have been assigned to a new training session. Please mark your calendar.</p>
            
            <table class="info-table">
                <tr><td class="label">Topic:</td><td>${data.trainingName}</td></tr>
                <tr><td class="label">Mode:</td><td>${data.mode}</td></tr>
                <tr><td class="label">Start Date:</td><td>${data.startDate}</td></tr>
                <tr><td class="label">End Date:</td><td>${data.completionDate}</td></tr>
                <tr><td class="label">Duration:</td><td>${data.duration} hours</td></tr>
            </table>

            <p>An assessment has been scheduled for the completion date.</p>

            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/employee/calendar" class="button">View in Calendar</a>
            </div>
        `;
  } else if (template === 'calendar-updated') {
    body = `
            <h2>Schedule Update</h2>
            <p>Hello ${data.userName},</p>
            <p>The schedule for <strong>${data.trainingName}</strong> has been updated.</p>
            
            <table class="info-table">
                <tr><td class="label">New Date:</td><td>${data.newDate}</td></tr>
                <tr><td class="label">Venue/Link:</td><td>${data.newLocation}</td></tr>
            </table>

            <div style="text-align: center;">
                 <a href="${process.env.NEXTAUTH_URL}/employee/calendar" class="button">Check Updated Schedule</a>
            </div>
        `;
  } else if (template === 'assessment-due') {
    body = `
             <h2>Assessment Due Reminder</h2>
            <p>Hello ${data.userName},</p>
            <p>This is a reminder that you have an assessment due today for <strong>${data.trainingName}</strong>.</p>
            
            <div style="text-align: center;">
                 <a href="${process.env.NEXTAUTH_URL}/employee/assessments" class="button">Take Assessment</a>
            </div>
        `;
  } else if (template === 'feedback-reminder') {
    body = `
            <h2>Training Feedback Reminder</h2>
            <p>Hello ${data.userName},</p>
            <p>We noticed you haven't submitted feedback for the training <strong>"${data.trainingName}"</strong> that you completed on ${data.completionDate}.</p>
            
            <p>Your feedback is invaluable in helping us improve our training programs. It will only take a few minutes!</p>

            <div style="text-align: center;">
                <a href="${data.feedbackUrl}" class="button">Submit Feedback Now</a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                This is a friendly reminder. We appreciate your time and insights!
            </p>
        `;
  } else if (template === 'progress-reminder') {
    body = `
            <h2>Training Progress Update Reminder</h2>
            <p>Hello ${data.userName},</p>
            <p>It's time to submit your weekly progress update for the ongoing training <strong>"${data.trainingName}"</strong>.</p>
            
            <table class="info-table">
                <tr><td class="label">Last Update:</td><td>${data.daysSinceUpdate} days ago</td></tr>
                <tr><td class="label">Your Mentor:</td><td>${data.mentorName}</td></tr>
            </table>

            <p>Keeping your mentor informed helps ensure you get the support you need throughout your training journey.</p>

            <div style="text-align: center;">
                <a href="${data.progressUrl}" class="button">Submit Progress Update</a>
            </div>
        `;
  } else if (template === 'post-assessment-scheduled') {
    body = `
            <h2>🎉 Training Completed - Assessment Scheduled</h2>
            <p>Hello ${data.userName},</p>
            <p>Congratulations on completing the training <strong>"${data.trainingName}"</strong>!</p>
            
            <p>To evaluate your learning and track your skill progression, a post-training assessment has been scheduled:</p>

            <table class="info-table">
                <tr><td class="label">Assessment Date:</td><td>${data.assessmentDate}</td></tr>
                <tr><td class="label">Skill:</td><td>${data.skillName}</td></tr>
            </table>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937;">📚 Preparation Tips:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li>Review your training materials and notes</li>
                    <li>Practice the concepts you learned</li>
                    <li>Revisit any challenging topics</li>
                    <li>Prepare your questions in advance</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/employee/assessments" class="button">View Assessment Details</a>
            </div>

            <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                You'll receive another reminder 3 days before the assessment date. Good luck!
            </p>
        `;
  } else if (template === 'skill-progression') {
    body = `
            <h2>🌟 Skill Level Updated</h2>
            <p>Hello ${data.userName},</p>
            <p>Great news! Your skill level has been updated based on your recent assessment performance.</p>
            
            <table class="info-table">
                <tr><td class="label">Skill:</td><td>${data.skillName}</td></tr>
                <tr><td class="label">New Level:</td><td><strong style="color: #10b981;">${data.newLevel}</strong></td></tr>
                <tr><td class="label">Pre-Assessment:</td><td>${data.preScore}%</td></tr>
                <tr><td class="label">Post-Assessment:</td><td>${data.postScore}%</td></tr>
                <tr><td class="label">Improvement:</td><td><strong style="color: #3b82f6;">+${data.improvement}%</strong></td></tr>
            </table>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white; text-align: center;">
                <h3 style="margin: 0 0 10px 0; font-size: 20px;">🎯 Excellent Progress!</h3>
                <p style="margin: 0; font-size: 16px;">Keep up the great work on your learning journey!</p>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/employee/skill-gaps" class="button">View Skill Matrix</a>
            </div>
        `;
  } else if (template === 'mentor-assigned') {
    body = `
            <h2>Mentor Assignment Notification</h2>
            <p>Hello ${data.mentorName},</p>
            <p>You have been assigned as a mentor for a new journey phase.</p>
            
            <table class="info-table">
                <tr><td class="label">Employee:</td><td>${data.employeeName}</td></tr>
                <tr><td class="label">Phase:</td><td>${data.phaseTitle}</td></tr>
                <tr><td class="label">Start Date:</td><td>${data.startDate}</td></tr>
                <tr><td class="label">Duration:</td><td>${data.duration} days</td></tr>
            </table>

            <p>Please connect with the employee to guide them through this phase.</p>

            <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/employee/mentorship" class="button">View Mistorship Dashboard</a>
            </div>
        `;
  } else {
    body = `
            <h2>Notification</h2>
            <p>${data.message || 'You have a new notification.'}</p>
             <div style="text-align: center;">
                 <a href="${process.env.NEXTAUTH_URL}" class="button">Go to Dashboard</a>
            </div>
        `;
  }

  return header + body + footer;
}

export async function sendEmail({ to, subject, template, data }: SendEmailParams) {
  // Use the same robust configuration as auth.ts
  const serverConfig = {
    host: process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || "smtp.office365.com",
    port: Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587),
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_SERVER_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: false,
    requireTLS: true,
    tls: {
      ciphers: "SSLv3",
    }
  }

  // Fallback to EMAIL_SERVER string if specific vars aren't present - though the object above has defaults, 
  // we want to ensure we have credentials. 
  // If SMTP_USER is missing, we might want to fall back to EMAIL_SERVER.
  // But strictly speaking the user has the vars in .env.

  const transport = createTransport(serverConfig)
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@skillloop.com'

  // Simple template logic for now
  // Use template engine
  const htmlBody = getTemplate(template, data);

  try {
    await transport.sendMail({
      to,
      from,
      subject,
      html: htmlBody,
    })
    console.log(`✅ Email sent to ${to}`)
  } catch (error) {
    console.error('❌ Error sending email:', error)
    // Don't throw, just log
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
