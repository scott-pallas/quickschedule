import type { EmailTemplate, EmailTemplateName } from '../types/index.js'

export const defaultTemplates: Record<EmailTemplateName, EmailTemplate> = {
  confirmation: {
    subject: 'Appointment Confirmed - {{patientName}}',
    html: `
<h1>Appointment Confirmed</h1>
<p>Hi {{patientName}},</p>
<p>Your appointment has been confirmed:</p>
<ul>
  <li><strong>Type:</strong> {{appointmentTypeName}}</li>
  <li><strong>Provider:</strong> {{providerName}}</li>
  <li><strong>Date:</strong> {{formattedDate}}</li>
  <li><strong>Time:</strong> {{formattedTime}}</li>
  <li><strong>Duration:</strong> {{duration}} minutes</li>
</ul>
<p><strong>Confirmation #:</strong> {{confirmationNumber}}</p>
<p>Need to cancel? <a href="{{cancelUrl}}">Click here</a></p>
    `.trim(),
  },
  cancellation: {
    subject: 'Appointment Cancelled - {{patientName}}',
    html: `
<h1>Appointment Cancelled</h1>
<p>Hi {{patientName}},</p>
<p>Your appointment on {{formattedDate}} at {{formattedTime}} has been cancelled.</p>
    `.trim(),
  },
  reminder: {
    subject: 'Appointment Reminder - {{formattedDate}}',
    html: `
<h1>Appointment Reminder</h1>
<p>Hi {{patientName}},</p>
<p>This is a reminder about your upcoming appointment:</p>
<ul>
  <li><strong>Date:</strong> {{formattedDate}}</li>
  <li><strong>Time:</strong> {{formattedTime}}</li>
  <li><strong>Provider:</strong> {{providerName}}</li>
</ul>
    `.trim(),
  },
  providerNotification: {
    subject: 'New Booking - {{patientName}} on {{formattedDate}}',
    html: `
<h1>New Booking</h1>
<p>A new appointment has been booked:</p>
<ul>
  <li><strong>Patient:</strong> {{patientName}} ({{patientEmail}})</li>
  <li><strong>Phone:</strong> {{patientPhone}}</li>
  <li><strong>Type:</strong> {{appointmentTypeName}}</li>
  <li><strong>Date:</strong> {{formattedDate}} at {{formattedTime}}</li>
  <li><strong>Duration:</strong> {{duration}} minutes</li>
</ul>
    `.trim(),
  },
}

export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>,
): { subject: string; html: string; text?: string } {
  return {
    subject: interpolate(template.subject, variables),
    html: interpolate(template.html, variables),
    text: template.text ? interpolate(template.text, variables) : undefined,
  }
}

function interpolate(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match
  })
}
