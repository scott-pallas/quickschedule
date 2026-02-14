# @nineteenlabs/quickschedule

A scheduling plugin for [Payload CMS 3](https://payloadcms.com/) that adds appointment booking to any Payload project. Drop in 4 collections, wire up API routes, and build your own booking UI with headless React components.

## Features

- **4 collections** — providers, appointment types, bookings, blocked times
- **Slot computation** — intersects provider schedules with bookings and blocked times
- **Headless React components** — render-prop based, bring your own styles
- **Email notifications** — confirmation, cancellation, reminders (Resend, custom, or console)
- **Fully configurable** — custom slugs, extra fields, validation hooks, timezone support
- **TypeScript-first** — complete type definitions for everything

## Quick Start

### Install

```bash
npm install @nineteenlabs/quickschedule
# or
pnpm add @nineteenlabs/quickschedule
```

**Peer dependencies:** `payload@^3.0.0`, `react@^18 || ^19`

### Add the Plugin

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { quickschedulePlugin } from '@nineteenlabs/quickschedule'

export default buildConfig({
  plugins: [
    quickschedulePlugin({
      slotInterval: 30,       // minutes between slots (default: 30)
      timezone: 'America/New_York',
    }),
  ],
  // ... rest of your config
})
```

This adds 4 collections to your Payload admin:
- **qs-providers** — staff/practitioners with weekly schedules
- **qs-appointment-types** — services offered (duration, pricing, limits)
- **qs-bookings** — individual appointments
- **qs-blocked-times** — time-off, holidays, blocked periods

### Wire Up API Routes

Create a catch-all route in your Next.js app:

```typescript
// app/api/quickschedule/[...path]/route.ts
import { createRouteHandlers } from '@nineteenlabs/quickschedule/api'
import configPromise from '@payload-config'

const { GET, POST } = createRouteHandlers(configPromise)
export { GET, POST }
```

This exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quickschedule/providers` | List active providers |
| GET | `/api/quickschedule/appointment-types` | List appointment types (optional `?providerId=`) |
| GET | `/api/quickschedule/availability` | Get available slots (`?providerId=&appointmentTypeId=&date=`) |
| POST | `/api/quickschedule/book` | Create a booking |
| POST | `/api/quickschedule/cancel` | Cancel a booking |

### Add the Booking UI

Wrap your booking page with `BookingProvider` and compose the headless components:

```tsx
'use client'

import {
  BookingProvider,
  AppointmentTypePicker,
  DatePicker,
  TimeSlotPicker,
  BookingForm,
  BookingConfirmation,
} from '@nineteenlabs/quickschedule/react'

export default function BookingPage() {
  return (
    <BookingProvider>
      <h1>Book an Appointment</h1>
      <AppointmentTypePicker />
      <DatePicker />
      <TimeSlotPicker />
      <BookingForm />
      <BookingConfirmation />
    </BookingProvider>
  )
}
```

That's it. The components manage the booking flow automatically: select type, pick date, choose time, fill form, see confirmation.

## Configuration

All options with their defaults:

```typescript
quickschedulePlugin({
  // Scheduling
  slotInterval: 30,          // minutes between available slots
  bookingWindow: 60,         // how many days ahead bookings are allowed
  minNotice: 24,             // minimum hours before appointment
  timezone: 'UTC',           // IANA timezone

  // Enable/disable
  enabled: true,

  // API
  routePrefix: '/api/quickschedule',

  // Validation
  validation: {
    requirePhone: false,
    requireEmail: true,      // true by default
    customValidation: async (booking) => ({
      valid: true,
      message: undefined,
    }),
  },

  // Email
  email: {
    provider: 'ses',         // 'ses' | 'resend' | 'console' | 'custom'
    region: 'us-east-1',     // AWS region (for SES)
    apiKey: '',              // API key (for Resend)
    from: 'bookings@example.com',
    replyTo: 'support@example.com',
    templates: {},            // override default templates
    variables: {},            // extra template variables
  },

  // Notifications
  notifications: {
    sendConfirmation: true,
    sendReminder: false,
    reminderHours: 24,
    notifyProvider: false,
    notifyEmail: '',          // office email for notifications
  },

  // Collection overrides
  collections: {
    providers:        { slug: 'qs-providers' },
    appointmentTypes: { slug: 'qs-appointment-types' },
    bookings:         { slug: 'qs-bookings' },
    blockedTimes:     { slug: 'qs-blocked-times' },
  },
})
```

### Custom Collection Slugs

Rename any collection to fit your project:

```typescript
quickschedulePlugin({
  collections: {
    providers: { slug: 'staff' },
    bookings: { slug: 'appointments' },
  },
})
```

### Extra Fields

Add custom fields to any collection:

```typescript
quickschedulePlugin({
  collections: {
    providers: {
      fields: [
        { name: 'specialty', type: 'text' },
        { name: 'languages', type: 'select', options: ['English', 'Spanish'] },
      ],
    },
    bookings: {
      fields: [
        { name: 'insuranceProvider', type: 'text' },
      ],
    },
  },
})
```

## React Components

All components are headless — they handle data fetching and state, you control rendering through render props. Every component works out of the box with sensible defaults, but you can customize everything.

### BookingProvider

Wraps your booking UI and manages the multi-step flow.

```tsx
<BookingProvider
  apiBase="/api/quickschedule"           // API route prefix
  onBookingComplete={(response) => {}}   // called on successful booking
  onError={(error) => {}}                // called on errors
>
  {children}
</BookingProvider>
```

**Flow steps:** `type` → `date` → `time` → `form` → `confirmation`

### AppointmentTypePicker

Fetches and displays available appointment types.

```tsx
<AppointmentTypePicker
  providerId="optional-filter"
  renderType={({ type, isSelected, select }) => (
    <div
      onClick={select}
      className={isSelected ? 'selected' : ''}
    >
      <h3>{type.name}</h3>
      <p>{type.duration} minutes — ${type.price}</p>
    </div>
  )}
  renderLoading={() => <Spinner />}
  renderEmpty={() => <p>No appointment types available</p>}
/>
```

### DatePicker

A calendar date picker with month navigation.

```tsx
// Custom rendering
<DatePicker
  renderDay={({ date, dateStr, isSelected, isToday, isPast, select }) => (
    <button
      onClick={select}
      disabled={isPast}
      className={cn({ selected: isSelected, today: isToday })}
    >
      {date.getDate()}
    </button>
  )}
  renderHeader={({ month, year, prev, next }) => (
    <div className="calendar-header">
      <button onClick={prev}>←</button>
      <span>{month} {year}</span>
      <button onClick={next}>→</button>
    </div>
  )}
/>

// Or delegate to a third-party date picker
<DatePicker
  as={({ value, onChange }) => (
    <MyFancyDatePicker value={value} onChange={onChange} />
  )}
/>
```

### TimeSlotPicker

Shows available time slots for the selected provider, type, and date.

```tsx
<TimeSlotPicker
  renderSlot={({ time, isSelected, select }) => (
    <button
      onClick={select}
      className={isSelected ? 'ring-2 ring-blue-500' : ''}
    >
      {time}
    </button>
  )}
  renderLoading={() => <p>Finding available times...</p>}
  renderEmpty={() => <p>No times available for this date</p>}
/>
```

### BookingForm

Patient information form with validation.

```tsx
<BookingForm
  fields={[
    { name: 'name', label: 'Full Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'notes', label: 'Anything we should know?', type: 'textarea' },
  ]}
  renderField={({ field, value, onChange, error }) => (
    <div>
      <label>{field.label}</label>
      <input
        type={field.type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  )}
  renderSubmit={({ isSubmitting, submit }) => (
    <button onClick={submit} disabled={isSubmitting}>
      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
    </button>
  )}
  onSuccess={() => console.log('Booked!')}
/>
```

### BookingConfirmation

Renders after a successful booking.

```tsx
<BookingConfirmation
  render={({ booking, provider, appointmentType }) => (
    <div>
      <h2>You're booked!</h2>
      <p>Confirmation: {booking.confirmationNumber}</p>
      <p>{appointmentType.name} with {provider.name}</p>
      <p>{booking.date} at {booking.time}</p>
    </div>
  )}
/>
```

### Hooks

Use hooks directly for custom flows:

```tsx
import { useBookingContext, useAvailableSlots, useCreateBooking } from '@nineteenlabs/quickschedule/react'

// Access the full booking state
const { step, selectedType, selectDate, reset } = useBookingContext()

// Fetch available slots (reads provider/type/date from context)
const { slots, isLoading, error, refetch } = useAvailableSlots()

// Create a booking (reads selections from context)
const { book, isBooking, error } = useCreateBooking()
const result = await book({ name: 'Jane', email: 'jane@example.com', phone: '555-0123' })
```

## API Reference

### Booking Request

```
POST /api/quickschedule/book
Content-Type: application/json

{
  "appointmentTypeId": "abc123",
  "providerId": "def456",
  "date": "2026-03-16",
  "time": "10:00",
  "patient": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "555-123-4567",
    "notes": "First visit"
  }
}
```

**Success (201):**
```json
{
  "success": true,
  "booking": {
    "id": "booking-id",
    "confirmationNumber": "QS-2026-0316-001",
    "date": "2026-03-16",
    "time": "10:00",
    "duration": 30,
    "status": "confirmed"
  },
  "token": "cancel-token"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "slot_unavailable",
  "message": "This time slot is no longer available"
}
```

Error codes: `validation_error`, `provider_not_found`, `appointment_type_not_found`, `slot_unavailable`

### Cancel Request

```
POST /api/quickschedule/cancel
Content-Type: application/json

{
  "bookingId": "booking-id",
  "token": "cancel-token",
  "reason": "Schedule conflict"
}
```

### Availability Query

```
GET /api/quickschedule/availability?providerId=xxx&appointmentTypeId=xxx&date=2026-03-16
```

```json
{
  "date": "2026-03-16",
  "provider": { "id": "xxx", "name": "Dr. Smith" },
  "appointmentType": { "id": "xxx", "name": "Consultation", "duration": 30 },
  "availableSlots": ["09:00", "09:30", "10:30", "11:00", "14:00", "14:30"]
}
```

## Email Templates

Four built-in templates use `{{variable}}` interpolation:

| Template | Sent When | Recipient |
|----------|-----------|-----------|
| `confirmation` | Booking created | Patient |
| `cancellation` | Booking cancelled | Patient |
| `reminder` | Before appointment | Patient |
| `providerNotification` | Booking created | Provider/office |

**Supported providers:**

| Provider | Config | Install |
|----------|--------|---------|
| `ses` | `region` (default: `us-east-1`) | `npm install @aws-sdk/client-ses` |
| `resend` | `apiKey` | included (uses `fetch`) |
| `console` | none | included (logs to stdout) |
| `custom` | `sendFn` | bring your own |

SES uses your standard AWS credential chain (env vars, IAM role, `~/.aws/credentials`).

Override any template:

```typescript
quickschedulePlugin({
  email: {
    provider: 'ses',
    region: 'us-east-1',
    from: 'bookings@clinic.com',
    templates: {
      confirmation: {
        subject: 'Your appointment is confirmed, {{patientName}}!',
        html: `
          <h1>See you soon!</h1>
          <p>You have a {{appointmentTypeName}} with {{providerName}}
             on {{formattedDate}} at {{formattedTime}}.</p>
          <p>Confirmation: {{confirmationNumber}}</p>
          <p><a href="{{cancelUrl}}">Need to cancel?</a></p>
        `,
      },
    },
  },
})
```

**Available variables:** `patientName`, `patientEmail`, `patientPhone`, `providerName`, `appointmentTypeName`, `date`, `formattedDate`, `time`, `formattedTime`, `duration`, `confirmationNumber`, `cancelUrl`

## Using Without React

The availability and booking logic works standalone:

```typescript
import { getAvailableSlots, processBooking } from '@nineteenlabs/quickschedule/api'

// Pure function — compute available slots
const availability = getAvailableSlots({
  provider,
  appointmentType,
  date: '2026-03-16',
  bookings: existingBookings,
  blockedTimes: blockedTimes,
  config: { slotInterval: 30, minNotice: 24, timezone: 'UTC' },
})

// With dependency injection for testability
const result = await processBooking(bookingInput, {
  findProvider: async (id) => { /* your lookup */ },
  findAppointmentType: async (id) => { /* your lookup */ },
  findBookingsForDate: async (providerId, date) => { /* your query */ },
  findBlockedTimesForDate: async (providerId, date) => { /* your query */ },
  createBookingRecord: async (data) => { /* your insert */ },
  countBookingsForDate: async (providerId, date) => { /* your count */ },
  config: resolvedConfig,
})
```

## Types

Import types from the main package or the dedicated types entry:

```typescript
import type {
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
  BookingInput,
  BookingResponse,
  AvailabilityResponse,
  QuickScheduleConfig,
} from '@nineteenlabs/quickschedule'

// or
import type { Provider } from '@nineteenlabs/quickschedule/types'
```

## License

MIT
