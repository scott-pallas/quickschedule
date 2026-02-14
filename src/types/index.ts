import type { CollectionConfig } from 'payload'

// --- Plugin Configuration ---

export interface QuickScheduleEmailConfig {
  provider?: 'resend' | 'ses' | 'console' | 'custom'
  apiKey?: string
  from?: string
  replyTo?: string
  region?: string
  sendFn?: (email: EmailPayload) => Promise<void>
  templates?: Partial<Record<EmailTemplateName, EmailTemplate>>
  variables?: Record<string, string>
}

export interface QuickScheduleNotificationsConfig {
  sendConfirmation?: boolean
  sendReminder?: boolean
  reminderHours?: number
  notifyProvider?: boolean
  notifyEmail?: string
}

export interface QuickScheduleCollectionOverrides {
  slug?: string
  fields?: CollectionConfig['fields']
  hooks?: CollectionConfig['hooks']
}

export interface QuickScheduleValidationConfig {
  requirePhone?: boolean
  requireEmail?: boolean
  customValidation?: (booking: BookingInput) => Promise<{ valid: boolean; message?: string }>
}

export interface QuickScheduleConfig {
  slotInterval?: number
  bookingWindow?: number
  minNotice?: number
  timezone?: string
  email?: QuickScheduleEmailConfig
  notifications?: QuickScheduleNotificationsConfig
  collections?: {
    providers?: QuickScheduleCollectionOverrides
    appointmentTypes?: QuickScheduleCollectionOverrides
    bookings?: QuickScheduleCollectionOverrides
    blockedTimes?: QuickScheduleCollectionOverrides
  }
  routePrefix?: string
  validation?: QuickScheduleValidationConfig
  enabled?: boolean
}

export interface ResolvedQuickScheduleConfig {
  slotInterval: number
  bookingWindow: number
  minNotice: number
  timezone: string
  email: QuickScheduleEmailConfig
  notifications: Required<QuickScheduleNotificationsConfig>
  collections: {
    providers: { slug: string; fields: CollectionConfig['fields']; hooks?: CollectionConfig['hooks'] }
    appointmentTypes: { slug: string; fields: CollectionConfig['fields']; hooks?: CollectionConfig['hooks'] }
    bookings: { slug: string; fields: CollectionConfig['fields']; hooks?: CollectionConfig['hooks'] }
    blockedTimes: { slug: string; fields: CollectionConfig['fields']; hooks?: CollectionConfig['hooks'] }
  }
  routePrefix: string
  validation: QuickScheduleValidationConfig
}

// --- Domain Types ---

export interface ProviderScheduleEntry {
  dayOfWeek: '0' | '1' | '2' | '3' | '4' | '5' | '6'
  startTime: string
  endTime: string
}

export interface Provider {
  id: string
  name: string
  email: string
  photo?: string | { url: string }
  bio?: unknown
  active: boolean
  schedule: ProviderScheduleEntry[]
  bufferMinutes: number
  timezone?: string
}

export interface AppointmentType {
  id: string
  name: string
  slug: string
  description?: string
  duration: number
  price?: number
  provider?: string | Provider
  providers?: (string | Provider)[]
  color?: string
  active: boolean
  maxPerDay?: number
  requiresNewPatient: boolean
  bufferBefore: number
  bufferAfter: number
}

export interface Booking {
  id: string
  summary?: string
  appointmentType: string | AppointmentType
  provider: string | Provider
  date: string
  time: string
  duration: number
  endTime?: string
  patientName: string
  patientEmail: string
  patientPhone: string
  notes?: string
  status: 'confirmed' | 'cancelled' | 'completed' | 'no-show'
  confirmationSent: boolean
  reminderSent: boolean
  cancelledAt?: string
  cancelReason?: string
  confirmationNumber?: string
  cancelToken?: string
}

export interface BlockedTime {
  id: string
  provider: string | Provider
  reason?: string
  startDate: string
  endDate: string
  allDay: boolean
  startTime?: string
  endTime?: string
  recurring: 'none' | 'daily' | 'weekly'
}

// --- API Types ---

export interface BookingInput {
  appointmentTypeId: string
  providerId: string
  date: string
  time: string
  patient: {
    name: string
    email: string
    phone: string
    notes?: string
  }
}

export interface AvailabilityQuery {
  providerId: string
  appointmentTypeId: string
  date: string
}

export interface AvailabilityResponse {
  date: string
  provider: { id: string; name: string }
  appointmentType: { id: string; name: string; duration: number }
  availableSlots: string[]
}

export interface BookingResponse {
  success: boolean
  booking?: Booking
  token?: string
  error?: string
  message?: string
}

// --- Email Types ---

export type EmailTemplateName = 'confirmation' | 'cancellation' | 'reminder' | 'providerNotification'

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailTemplateVariables {
  patientName: string
  patientEmail: string
  patientPhone: string
  providerName: string
  appointmentTypeName: string
  date: string
  formattedDate: string
  time: string
  formattedTime: string
  duration: string
  confirmationNumber: string
  cancelUrl: string
  [key: string]: string
}
