# quickschedule - Open Source Scheduling Plugin for Payload CMS

**Date:** 2026-02-11
**Status:** Draft
**Package:** `@nineteenlabs/quickschedule`
**License:** MIT

---

## Overview

An open-source scheduling plugin for Payload CMS that provides appointment booking functionality. Drop-in solution for any Payload 3 + Next.js project. Used across Nineteen Labs client projects.

## Design Goals

- Install via npm, configure in `payload.config.ts`
- Provides collections, API routes, and headless React components
- Zero external dependencies (no Calendly, Cal.com, etc.)
- Configurable with sensible defaults
- Works with any Payload 3 + Next.js project

## Package Scope

**Backend + Headless Components (BYOS - Bring Your Own Styles)**

- Payload collections for providers, appointment types, bookings
- API routes for availability and booking
- Unstyled React components with render props for full styling control
- Hooks for custom implementations

---

## Package Structure

```
@nineteenlabs/quickschedule
├── src/
│   ├── index.ts                 # Main plugin export
│   ├── plugin.ts                # Payload plugin definition
│   ├── collections/
│   │   ├── Providers.ts
│   │   ├── AppointmentTypes.ts
│   │   ├── Bookings.ts
│   │   ├── BlockedTimes.ts
│   │   └── index.ts
│   ├── api/
│   │   ├── available-slots.ts   # Core availability logic
│   │   ├── create-booking.ts    # Booking creation + validation
│   │   ├── routes.ts            # Next.js route handlers
│   │   └── index.ts
│   ├── react/
│   │   ├── BookingProvider.tsx  # Context for booking state
│   │   ├── AppointmentTypePicker.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   ├── BookingForm.tsx
│   │   ├── BookingConfirmation.tsx
│   │   ├── hooks/
│   │   │   ├── useAvailableSlots.ts
│   │   │   ├── useBooking.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── email/
│   │   ├── templates.ts         # Default email templates
│   │   └── send.ts              # Pluggable email sender
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── slots.ts             # Time slot generation logic
│       ├── validation.ts
│       └── index.ts
└── examples/
    └── basic-nextjs/            # Example implementation
```

---

## Exports

```typescript
// Payload plugin
import { quickschedulePlugin } from '@nineteenlabs/quickschedule'

// API helpers
import { getAvailableSlots, createBooking } from '@nineteenlabs/quickschedule/api'

// React components (headless)
import {
  BookingProvider,
  AppointmentTypePicker,
  DatePicker,
  TimeSlotPicker,
  BookingForm,
  BookingConfirmation,
} from '@nineteenlabs/quickschedule/react'

// Hooks
import {
  useBookingContext,
  useAvailableSlots,
  useCreateBooking,
  useProviders,
  useAppointmentTypes,
} from '@nineteenlabs/quickschedule/react'

// Types
import type { Provider, AppointmentType, Booking } from '@nineteenlabs/quickschedule/types'
```

---

## Plugin Configuration

### Full Configuration

```typescript
import { buildConfig } from 'payload'
import { quickschedulePlugin } from '@nineteenlabs/quickschedule'

export default buildConfig({
  plugins: [
    quickschedulePlugin({
      // Slot configuration
      slotInterval: 30,           // minutes (default: 30)
      bookingWindow: 60,          // days ahead to allow booking (default: 60)
      minNotice: 24,              // hours minimum notice (default: 24)

      // Timezone
      timezone: 'America/Detroit', // default: UTC

      // Email configuration
      email: {
        provider: 'resend',       // 'resend' | 'nodemailer' | 'console' | 'custom'
        apiKey: process.env.RESEND_API_KEY,
        from: 'appointments@example.com',
        replyTo: 'office@example.com',

        // Or custom sender
        sendFn: async ({ to, subject, html, text }) => {
          await myEmailService.send({ to, subject, html })
        },

        // Template overrides
        templates: {
          confirmation: {
            subject: 'See you soon! - {{businessName}}',
            html: customTemplate,
          },
        },

        // Variables available in all templates
        variables: {
          businessName: 'My Practice',
          phone: '555-123-4567',
          address: '123 Main St',
        },
      },

      // Notifications
      notifications: {
        sendConfirmation: true,   // email patient on booking
        sendReminder: false,      // requires cron setup
        reminderHours: 24,
        notifyProvider: true,     // email provider on new booking
        notifyEmail: 'office@example.com',
      },

      // Collection customization
      collections: {
        providers: {
          slug: 'providers',      // override slug
          fields: [               // extend with additional fields
            { name: 'licenseNumber', type: 'text' },
          ],
        },
        bookings: {
          slug: 'bookings',
          hooks: {
            afterCreate: [async ({ doc }) => { /* custom logic */ }],
          },
        },
      },

      // API route prefix
      routePrefix: '/api/booking', // default: '/api/quickschedule'

      // Validation
      validation: {
        requirePhone: true,
        requireEmail: true,
        customValidation: async (booking) => {
          return { valid: true }
        },
      },
    }),
  ],
})
```

### Zero-Config (Defaults)

```typescript
quickschedulePlugin({})
// Gets you:
// - 30 min slots
// - 60 day booking window
// - 24 hour minimum notice
// - UTC timezone
// - No email (logs to console in dev)
// - Standard collection slugs (qs-providers, etc.)
// - /api/quickschedule/* routes
```

---

## Collections

### qs-providers

```typescript
{
  slug: 'qs-providers',
  admin: { useAsTitle: 'name', group: 'Scheduling' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', type: 'richText' },
    { name: 'active', type: 'checkbox', defaultValue: true },

    // Weekly schedule
    {
      name: 'schedule',
      type: 'array',
      fields: [
        {
          name: 'dayOfWeek',
          type: 'select',
          required: true,
          options: [
            { label: 'Sunday', value: '0' },
            { label: 'Monday', value: '1' },
            { label: 'Tuesday', value: '2' },
            { label: 'Wednesday', value: '3' },
            { label: 'Thursday', value: '4' },
            { label: 'Friday', value: '5' },
            { label: 'Saturday', value: '6' },
          ],
        },
        { name: 'startTime', type: 'text', required: true },  // "09:00"
        { name: 'endTime', type: 'text', required: true },    // "17:00"
      ],
    },

    { name: 'bufferMinutes', type: 'number', defaultValue: 0 },
    { name: 'timezone', type: 'text' },  // override global

    // Extensible via plugin config
  ],
}
```

### qs-appointment-types

```typescript
{
  slug: 'qs-appointment-types',
  admin: { useAsTitle: 'name', group: 'Scheduling' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea' },
    { name: 'duration', type: 'number', required: true },  // minutes
    { name: 'price', type: 'number' },

    // Single provider
    { name: 'provider', type: 'relationship', relationTo: 'qs-providers' },
    // Or multiple providers for same type
    { name: 'providers', type: 'relationship', relationTo: 'qs-providers', hasMany: true },

    { name: 'color', type: 'text' },  // admin calendar
    { name: 'active', type: 'checkbox', defaultValue: true },

    // Booking rules
    { name: 'maxPerDay', type: 'number' },
    { name: 'requiresNewPatient', type: 'checkbox', defaultValue: false },
    { name: 'bufferBefore', type: 'number', defaultValue: 0 },
    { name: 'bufferAfter', type: 'number', defaultValue: 0 },
  ],
}
```

### qs-bookings

```typescript
{
  slug: 'qs-bookings',
  admin: {
    useAsTitle: 'summary',
    group: 'Scheduling',
    defaultColumns: ['date', 'time', 'patientName', 'appointmentType', 'status'],
  },
  fields: [
    { name: 'summary', type: 'text', admin: { readOnly: true } },

    // Booking info
    { name: 'appointmentType', type: 'relationship', relationTo: 'qs-appointment-types', required: true },
    { name: 'provider', type: 'relationship', relationTo: 'qs-providers', required: true },
    { name: 'date', type: 'date', required: true },
    { name: 'time', type: 'text', required: true },
    { name: 'duration', type: 'number', required: true },
    { name: 'endTime', type: 'text' },

    // Patient info
    { name: 'patientName', type: 'text', required: true },
    { name: 'patientEmail', type: 'email', required: true },
    { name: 'patientPhone', type: 'text', required: true },
    { name: 'notes', type: 'textarea' },

    // Status
    {
      name: 'status',
      type: 'select',
      defaultValue: 'confirmed',
      options: [
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
        { label: 'No Show', value: 'no-show' },
      ],
    },

    // Tracking
    { name: 'confirmationSent', type: 'checkbox', defaultValue: false },
    { name: 'reminderSent', type: 'checkbox', defaultValue: false },
    { name: 'cancelledAt', type: 'date' },
    { name: 'cancelReason', type: 'text' },
    { name: 'confirmationNumber', type: 'text', admin: { readOnly: true } },
    { name: 'cancelToken', type: 'text', admin: { hidden: true } },
  ],
  hooks: {
    beforeChange: [/* compute summary, endTime, confirmationNumber */],
    afterChange: [/* send confirmation email */],
  },
}
```

### qs-blocked-times

```typescript
{
  slug: 'qs-blocked-times',
  admin: { useAsTitle: 'reason', group: 'Scheduling' },
  fields: [
    { name: 'provider', type: 'relationship', relationTo: 'qs-providers', required: true },
    { name: 'reason', type: 'text' },

    { name: 'startDate', type: 'date', required: true },
    { name: 'endDate', type: 'date', required: true },

    { name: 'allDay', type: 'checkbox', defaultValue: true },
    { name: 'startTime', type: 'text', admin: { condition: (data) => !data.allDay } },
    { name: 'endTime', type: 'text', admin: { condition: (data) => !data.allDay } },

    {
      name: 'recurring',
      type: 'select',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
      ],
      defaultValue: 'none',
    },
  ],
}
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/quickschedule/providers` | List active providers |
| GET | `/api/quickschedule/appointment-types` | List active types |
| GET | `/api/quickschedule/availability` | Get available slots |
| POST | `/api/quickschedule/book` | Create a booking |
| GET | `/api/quickschedule/booking/:id` | Get booking (with token) |
| POST | `/api/quickschedule/cancel/:id` | Cancel booking (with token) |

### Availability Endpoint

```typescript
// GET /api/quickschedule/availability
// ?providerId=xxx&appointmentTypeId=xxx&date=2024-03-15

// Response:
{
  date: "2024-03-15",
  provider: { id: "xxx", name: "Dr. Smith" },
  appointmentType: { id: "xxx", name: "New Patient", duration: 60 },
  availableSlots: ["09:00", "09:30", "10:30", "11:00", "14:00", "14:30"],
}
```

### Booking Endpoint

```typescript
// POST /api/quickschedule/book
{
  appointmentTypeId: "xxx",
  providerId: "xxx",
  date: "2024-03-15",
  time: "10:30",
  patient: {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-123-4567",
  }
}

// Response (success):
{
  success: true,
  booking: {
    id: "xxx",
    confirmationNumber: "QS-2024-0315-001",
    // ...
  },
  token: "xxx"  // for cancel/view
}

// Response (slot taken):
{
  success: false,
  error: "slot_unavailable",
  message: "This time slot is no longer available"
}
```

### Availability Logic

```typescript
function getAvailableSlots({ providerId, appointmentTypeId, date, payload, config }) {
  // 1. Get provider's schedule for this day of week
  // 2. Get appointment type duration + buffers
  // 3. Get existing bookings for provider on date
  // 4. Get blocked times
  // 5. Check maxPerDay limit
  // 6. Generate slots at configured interval
  // 7. Filter out conflicts, blocked times, min notice violations
  // 8. Return available slot times
}
```

---

## React Components

### BookingProvider

```tsx
<BookingProvider
  apiBase="/api/quickschedule"
  onBookingComplete={(booking) => router.push('/success')}
  onError={(error) => toast.error(error.message)}
>
  {children}
</BookingProvider>
```

### AppointmentTypePicker

```tsx
<AppointmentTypePicker
  providerId="xxx"  // optional filter
  renderType={({ type, isSelected, select }) => (
    <button onClick={select} className={isSelected ? 'selected' : ''}>
      <h3>{type.name}</h3>
      <p>{type.duration} min</p>
    </button>
  )}
/>
```

### DatePicker

```tsx
<DatePicker
  renderDay={({ date, isAvailable, isSelected, select }) => (
    <button
      disabled={!isAvailable}
      onClick={select}
      className={isSelected ? 'selected' : ''}
    >
      {date.getDate()}
    </button>
  )}

  // Or use custom date picker
  as={({ value, onChange, disabledDates }) => (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      excludeDates={disabledDates}
    />
  )}
/>
```

### TimeSlotPicker

```tsx
<TimeSlotPicker
  renderSlot={({ time, isSelected, select }) => (
    <button onClick={select}>{formatTime(time)}</button>
  )}
  renderLoading={() => <Skeleton count={8} />}
  renderEmpty={() => <p>No available times</p>}
/>
```

### BookingForm

```tsx
<BookingForm
  fields={[
    { name: 'name', label: 'Full Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ]}
  renderField={({ field, value, onChange, error }) => (
    <div>
      <label>{field.label}</label>
      <input
        type={field.type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  )}
  renderSubmit={({ isSubmitting, submit }) => (
    <button onClick={submit} disabled={isSubmitting}>
      {isSubmitting ? 'Booking...' : 'Confirm'}
    </button>
  )}
/>
```

### BookingConfirmation

```tsx
<BookingConfirmation
  render={({ booking, provider, appointmentType }) => (
    <div>
      <h1>You're all set!</h1>
      <p>{appointmentType.name} with {provider.name}</p>
      <p>{booking.date} at {booking.time}</p>
      <p>Confirmation #{booking.confirmationNumber}</p>
    </div>
  )}
/>
```

### Hooks

```tsx
import {
  useBookingContext,
  useAvailableSlots,
  useCreateBooking,
  useProviders,
  useAppointmentTypes,
} from '@nineteenlabs/quickschedule/react'

function CustomBooking() {
  const { selectedDate, selectedType } = useBookingContext()
  const { slots, isLoading } = useAvailableSlots(selectedDate, selectedType)
  const { book, isBooking } = useCreateBooking()
  // ... build custom UI
}
```

---

## Email Templates

### Built-in Templates

- `confirmation` - Sent to patient on booking
- `cancellation` - Sent to patient on cancel
- `reminder` - Sent before appointment (requires cron)
- `providerNotification` - Sent to provider/office on new booking

### Template Variables

```
{{patientName}}
{{patientEmail}}
{{patientPhone}}
{{providerName}}
{{appointmentTypeName}}
{{date}}
{{formattedDate}}
{{time}}
{{formattedTime}}
{{duration}}
{{confirmationNumber}}
{{cancelUrl}}
{{businessName}}       // from config
{{phone}}              // from config
{{address}}            // from config
```

### Custom Templates

```typescript
quickschedulePlugin({
  email: {
    templates: {
      confirmation: {
        subject: 'Your appointment at {{businessName}}',
        html: `<h1>Hi {{patientName}}</h1>...`,
      },
    },
  },
})
```

---

## Installation & Usage

### Install

```bash
npm install @nineteenlabs/quickschedule
```

### Minimal Setup

```typescript
// payload.config.ts
import { quickschedulePlugin } from '@nineteenlabs/quickschedule'

export default buildConfig({
  collections: [/* your collections */],
  plugins: [
    quickschedulePlugin({
      timezone: 'America/Detroit',
    }),
  ],
})
```

```typescript
// app/api/quickschedule/[...path]/route.ts
export { GET, POST } from '@nineteenlabs/quickschedule/api/routes'
```

```tsx
// app/book/page.tsx
import {
  BookingProvider,
  AppointmentTypePicker,
  DatePicker,
  TimeSlotPicker,
  BookingForm,
} from '@nineteenlabs/quickschedule/react'

export default function BookingPage() {
  return (
    <BookingProvider apiBase="/api/quickschedule">
      <h1>Schedule an Appointment</h1>
      <AppointmentTypePicker />
      <DatePicker />
      <TimeSlotPicker />
      <BookingForm
        fields={[
          { name: 'name', label: 'Name', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
        ]}
      />
    </BookingProvider>
  )
}
```

---

## Future Considerations (v2+)

- Multi-location support (`qs-locations` collection)
- Recurring appointments
- Waitlist
- Patient self-reschedule
- SMS reminders (Twilio integration)
- Calendar sync (Google/Outlook) - complex
- Admin calendar view component
- Stripe payment integration

---

## Next Steps

1. Initialize repo with TypeScript + build config
2. Implement core collections
3. Implement availability logic + API routes
4. Build React components with render props
5. Add email integration
6. Create example project
7. Publish to npm
8. Integrate into balancedhealthcc project
