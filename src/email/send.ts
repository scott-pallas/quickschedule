import type {
  QuickScheduleEmailConfig,
  EmailTemplateName,
  EmailTemplateVariables,
} from '../types/index.js'
import { defaultTemplates, renderTemplate } from './templates.js'

export async function sendEmail(
  templateName: EmailTemplateName,
  variables: Partial<EmailTemplateVariables>,
  to: string,
  emailConfig: QuickScheduleEmailConfig,
): Promise<void> {
  const template = emailConfig.templates?.[templateName] ?? defaultTemplates[templateName]
  if (!template) return

  const allVars = { ...emailConfig.variables, ...variables } as Record<string, string>
  const rendered = renderTemplate(template, allVars)

  const payload = {
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  }

  if (emailConfig.sendFn) {
    await emailConfig.sendFn(payload)
    return
  }

  switch (emailConfig.provider) {
    case 'console':
      console.log('[quickschedule] Email:', JSON.stringify(payload, null, 2))
      break
    case 'resend':
      await sendViaResend(payload, emailConfig)
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.log('[quickschedule] Email (no provider):', payload.subject, '->', payload.to)
      }
  }
}

async function sendViaResend(
  payload: { to: string; subject: string; html: string; text?: string },
  config: QuickScheduleEmailConfig,
): Promise<void> {
  if (!config.apiKey) {
    console.warn('[quickschedule] Resend API key not configured')
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from || 'noreply@example.com',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: config.replyTo,
    }),
  })

  if (!response.ok) {
    console.error('[quickschedule] Resend error:', await response.text())
  }
}
