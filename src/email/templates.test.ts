import { describe, it, expect } from 'vitest'
import { renderTemplate, defaultTemplates } from './templates.js'

describe('defaultTemplates', () => {
  it('has confirmation template', () => {
    expect(defaultTemplates.confirmation).toBeDefined()
    expect(defaultTemplates.confirmation.subject).toContain('{{patientName}}')
  })
})

describe('renderTemplate', () => {
  it('replaces variables in subject and html', () => {
    const result = renderTemplate(
      { subject: 'Hi {{patientName}}', html: '<p>Your appointment on {{date}}</p>' },
      { patientName: 'Jane', date: '2026-03-15' },
    )
    expect(result.subject).toBe('Hi Jane')
    expect(result.html).toBe('<p>Your appointment on 2026-03-15</p>')
  })

  it('handles missing variables gracefully', () => {
    const result = renderTemplate(
      { subject: 'Hi {{patientName}}', html: '<p>{{missing}}</p>' },
      { patientName: 'Jane' },
    )
    expect(result.subject).toBe('Hi Jane')
    expect(result.html).toBe('<p>{{missing}}</p>')
  })
})
