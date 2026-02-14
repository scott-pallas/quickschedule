# QuickSchedule Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `@nineteenlabs/quickschedule`, an open-source Payload CMS 3 scheduling plugin that provides collections, API routes, and headless React components for appointment booking.

**Architecture:** Payload plugin pattern — a higher-order function `(pluginConfig) => (config) => config` that injects 4 collections (providers, appointment-types, bookings, blocked-times), registers custom API endpoints, and exports headless React components with render props. Slot availability is computed server-side by intersecting provider schedules with existing bookings and blocked times.

**Tech Stack:** TypeScript, Payload CMS 3, React 18+, Next.js (peer), Vitest for testing, tsup for building.

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `.gitignore`
- Create: `.swcrc`
- Create: `vitest.config.ts`
- Create: `src/index.ts` (placeholder)

**Step 1: Create package.json**

```json
{
  "name": "@nineteenlabs/quickschedule",
  "version": "0.1.0",
  "description": "Open-source scheduling plugin for Payload CMS 3",
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./api": {
      "import": "./dist/api/index.js",
      "types": "./dist/api/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "types": "./dist/react/index.d.ts"
    },
    "./types": {
      "import": "./dist/types/index.js",
      "types": "./dist/types/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "clean": "rm -rf dist",
    "prepublishOnly": "pnpm run build"
  },
  "peerDependencies": {
    "payload": "^3.0.0",
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "payload": "^3.0.0",
    "react": "^19.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0",
    "tsup": "^8.0.0",
    "vitest": "^3.0.0",
    "@types/node": "^22.0.0"
  },
  "keywords": ["payload", "payload-plugin", "scheduling", "booking", "appointments"],
  "repository": {
    "type": "git",
    "url": "https://github.com/nineteenlabs/quickschedule"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["node"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

**Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'api/index': 'src/api/index.ts',
    'react/index': 'src/react/index.ts',
    'types/index': 'src/types/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['payload', 'react', 'react-dom'],
  treeshake: true,
})
```

**Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
*.tsbuildinfo
.DS_Store
.env
.env.local
```

**Step 6: Create placeholder src/index.ts**

```typescript
export {}
```

**Step 7: Install dependencies**

Run: `cd /Users/scottpallas/Code/quickschedule && pnpm install`
Expected: Dependencies installed, lockfile created.

**Step 8: Verify build works**

Run: `pnpm run lint`
Expected: No errors.

**Step 9: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts vitest.config.ts .gitignore pnpm-lock.yaml src/index.ts
git commit -m "chore: initialize project with TypeScript, tsup, and vitest"
```

---

## Task 2: Types

**Files:**
- Create: `src/types/index.ts`
- Test: `src/types/index.test.ts`

**Step 1: Create type definitions**

```typescript
// src/types/index.ts
import type { CollectionConfig } from 'payload'

// --- Plugin Configuration ---

export interface QuickScheduleEmailConfig {
  provider?: 'resend' | 'nodemailer' | 'console' | 'custom'
  apiKey?: string
  from?: string
  replyTo?: string
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

// --- Resolved Config (with defaults applied) ---

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
  startTime: string // "HH:mm"
  endTime: string   // "HH:mm"
}

export interface Provider {
  id: string
  name: string
  email: string
  photo?: string | { url: string }
  bio?: unknown // richText
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
```

**Step 2: Write type smoke test**

```typescript
// src/types/index.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type {
  QuickScheduleConfig,
  Provider,
  AppointmentType,
  Booking,
  BookingInput,
  AvailabilityResponse,
} from './index.js'

describe('types', () => {
  it('QuickScheduleConfig accepts empty object', () => {
    const config: QuickScheduleConfig = {}
    expectTypeOf(config).toMatchTypeOf<QuickScheduleConfig>()
  })

  it('BookingInput has required fields', () => {
    expectTypeOf<BookingInput>().toHaveProperty('appointmentTypeId')
    expectTypeOf<BookingInput>().toHaveProperty('providerId')
    expectTypeOf<BookingInput>().toHaveProperty('date')
    expectTypeOf<BookingInput>().toHaveProperty('time')
    expectTypeOf<BookingInput>().toHaveProperty('patient')
  })
})
```

**Step 3: Run tests**

Run: `pnpm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 3: Utility Functions — Slot Generation & Validation

**Files:**
- Create: `src/utils/slots.ts`
- Create: `src/utils/validation.ts`
- Create: `src/utils/index.ts`
- Create: `src/utils/time.ts`
- Test: `src/utils/slots.test.ts`
- Test: `src/utils/validation.test.ts`

**Step 1: Write time utility helpers**

```typescript
// src/utils/time.ts

/** Parse "HH:mm" string to minutes since midnight */
export function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Format minutes since midnight to "HH:mm" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Get day of week (0=Sunday) from a date string "YYYY-MM-DD" */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00') // noon to avoid timezone issues
  return date.getDay()
}

/** Format date for display: "March 15, 2024" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Format time for display: "9:00 AM" */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/** Generate a confirmation number: QS-YYYY-MMDD-NNN */
export function generateConfirmationNumber(date: string, sequence: number): string {
  const d = date.replace(/-/g, '').slice(0, 8)
  const year = d.slice(0, 4)
  const monthDay = d.slice(4, 8)
  return `QS-${year}-${monthDay}-${String(sequence).padStart(3, '0')}`
}

/** Generate a random cancel token */
export function generateCancelToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
```

**Step 2: Write failing slot generation tests**

```typescript
// src/utils/slots.test.ts
import { describe, it, expect } from 'vitest'
import { generateSlots, filterConflicts } from './slots.js'

describe('generateSlots', () => {
  it('generates 30-minute slots within a time range', () => {
    const slots = generateSlots('09:00', '12:00', 30)
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  it('generates 60-minute slots within a time range', () => {
    const slots = generateSlots('09:00', '12:00', 60)
    expect(slots).toEqual(['09:00', '10:00', '11:00'])
  })

  it('returns empty array if range is too small', () => {
    const slots = generateSlots('09:00', '09:15', 30)
    expect(slots).toEqual([])
  })

  it('handles end-of-day boundary', () => {
    const slots = generateSlots('16:00', '17:00', 30)
    expect(slots).toEqual(['16:00', '16:30'])
  })
})

describe('filterConflicts', () => {
  it('removes slots that overlap with existing bookings', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const bookings = [
      { time: '09:30', duration: 30 },
      { time: '10:30', duration: 60 },
    ]
    const result = filterConflicts(slots, 30, bookings, [])
    expect(result).toEqual(['09:00', '10:00'])
  })

  it('removes slots blocked by all-day blocked times', () => {
    const slots = ['09:00', '09:30', '10:00']
    const blockedTimes = [{ allDay: true, startTime: undefined, endTime: undefined }]
    const result = filterConflicts(slots, 30, [], blockedTimes)
    expect(result).toEqual([])
  })

  it('removes slots that overlap with partial-day blocked times', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const blockedTimes = [{ allDay: false, startTime: '09:30', endTime: '10:30' }]
    const result = filterConflicts(slots, 30, [], blockedTimes)
    expect(result).toEqual(['09:00', '10:30', '11:00'])
  })

  it('applies buffer minutes around bookings', () => {
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00']
    const bookings = [{ time: '10:00', duration: 30 }]
    const result = filterConflicts(slots, 30, bookings, [], 30)
    // 10:00 booked with 30 min buffer means 09:30 and 10:30 also blocked
    expect(result).toEqual(['09:00', '11:00'])
  })

  it('returns all slots when no conflicts', () => {
    const slots = ['09:00', '09:30', '10:00']
    const result = filterConflicts(slots, 30, [], [])
    expect(result).toEqual(['09:00', '09:30', '10:00'])
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `pnpm test src/utils/slots.test.ts`
Expected: FAIL — module not found

**Step 4: Implement slot generation**

```typescript
// src/utils/slots.ts
import { parseTime, formatTime } from './time.js'

/**
 * Generate time slots between start and end at the given interval.
 * Returns array of "HH:mm" strings.
 * Last slot must allow full appointment to fit before endTime.
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): string[] {
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const slots: string[] = []

  for (let time = start; time + intervalMinutes <= end; time += intervalMinutes) {
    slots.push(formatTime(time))
  }

  return slots
}

interface BookingConflict {
  time: string
  duration: number
}

interface BlockedTimeConflict {
  allDay: boolean
  startTime?: string
  endTime?: string
}

/**
 * Filter out slots that conflict with existing bookings or blocked times.
 */
export function filterConflicts(
  slots: string[],
  appointmentDuration: number,
  bookings: BookingConflict[],
  blockedTimes: BlockedTimeConflict[],
  bufferMinutes: number = 0,
): string[] {
  // If any blocked time is all-day, no slots available
  if (blockedTimes.some((bt) => bt.allDay)) {
    return []
  }

  return slots.filter((slotTime) => {
    const slotStart = parseTime(slotTime)
    const slotEnd = slotStart + appointmentDuration

    // Check booking conflicts
    for (const booking of bookings) {
      const bookingStart = parseTime(booking.time)
      const bookingEnd = bookingStart + booking.duration

      // Apply buffer: extend booking range by buffer on both sides
      const bufferedStart = bookingStart - bufferMinutes
      const bufferedEnd = bookingEnd + bufferMinutes

      // Overlap check: two ranges overlap if one starts before the other ends
      if (slotStart < bufferedEnd && slotEnd > bufferedStart) {
        return false
      }
    }

    // Check blocked time conflicts
    for (const blocked of blockedTimes) {
      if (!blocked.allDay && blocked.startTime && blocked.endTime) {
        const blockedStart = parseTime(blocked.startTime)
        const blockedEnd = parseTime(blocked.endTime)

        if (slotStart < blockedEnd && slotEnd > blockedStart) {
          return false
        }
      }
    }

    return true
  })
}
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test src/utils/slots.test.ts`
Expected: PASS

**Step 6: Write failing validation tests**

```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateBookingInput, isTimeInPast } from './validation.js'

describe('validateBookingInput', () => {
  const validInput = {
    appointmentTypeId: 'apt-1',
    providerId: 'prov-1',
    date: '2026-12-15',
    time: '10:00',
    patient: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-123-4567',
    },
  }

  it('accepts valid input', () => {
    const result = validateBookingInput(validInput)
    expect(result.valid).toBe(true)
  })

  it('rejects missing patient name', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, name: '' },
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient name is required')
  })

  it('rejects missing email when required', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, email: '' },
    }, { requireEmail: true })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient email is required')
  })

  it('rejects missing phone when required', () => {
    const result = validateBookingInput({
      ...validInput,
      patient: { ...validInput.patient, phone: '' },
    }, { requirePhone: true })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Patient phone is required')
  })

  it('rejects invalid date format', () => {
    const result = validateBookingInput({
      ...validInput,
      date: '15-12-2026',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid date format')
  })

  it('rejects invalid time format', () => {
    const result = validateBookingInput({
      ...validInput,
      time: '25:00',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid time format')
  })
})

describe('isTimeInPast', () => {
  it('returns true for past dates', () => {
    expect(isTimeInPast('2020-01-01', '09:00', 0)).toBe(true)
  })

  it('returns false for far future dates', () => {
    expect(isTimeInPast('2099-12-31', '09:00', 0)).toBe(false)
  })
})
```

**Step 7: Implement validation**

```typescript
// src/utils/validation.ts
import type { BookingInput } from '../types/index.js'

interface ValidationResult {
  valid: boolean
  errors: string[]
}

interface ValidationOptions {
  requireEmail?: boolean
  requirePhone?: boolean
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

export function validateBookingInput(
  input: BookingInput,
  options: ValidationOptions = {},
): ValidationResult {
  const errors: string[] = []

  if (!input.appointmentTypeId) errors.push('Appointment type is required')
  if (!input.providerId) errors.push('Provider is required')

  if (!input.date || !DATE_REGEX.test(input.date)) {
    errors.push('Invalid date format')
  }

  if (!input.time || !TIME_REGEX.test(input.time)) {
    errors.push('Invalid time format')
  }

  if (!input.patient?.name) errors.push('Patient name is required')

  if (options.requireEmail !== false && !input.patient?.email) {
    errors.push('Patient email is required')
  }

  if (options.requirePhone && !input.patient?.phone) {
    errors.push('Patient phone is required')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Check if a date+time is in the past (considering minNotice hours).
 */
export function isTimeInPast(
  date: string,
  time: string,
  minNoticeHours: number,
): boolean {
  const appointmentTime = new Date(`${date}T${time}:00`)
  const now = new Date()
  const minNoticeMs = minNoticeHours * 60 * 60 * 1000
  return appointmentTime.getTime() - now.getTime() < minNoticeMs
}
```

**Step 8: Create utils barrel export**

```typescript
// src/utils/index.ts
export { generateSlots, filterConflicts } from './slots.js'
export { validateBookingInput, isTimeInPast } from './validation.js'
export {
  parseTime,
  formatTime,
  getDayOfWeek,
  formatDate,
  formatTimeDisplay,
  generateConfirmationNumber,
  generateCancelToken,
} from './time.js'
```

**Step 9: Run all util tests**

Run: `pnpm test src/utils/`
Expected: ALL PASS

**Step 10: Commit**

```bash
git add src/utils/
git commit -m "feat: add slot generation and validation utilities"
```

---

## Task 4: Collections

**Files:**
- Create: `src/collections/Providers.ts`
- Create: `src/collections/AppointmentTypes.ts`
- Create: `src/collections/Bookings.ts`
- Create: `src/collections/BlockedTimes.ts`
- Create: `src/collections/index.ts`
- Test: `src/collections/index.test.ts`

**Step 1: Write failing collection factory test**

```typescript
// src/collections/index.test.ts
import { describe, it, expect } from 'vitest'
import { createCollections } from './index.js'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

const defaultConfig: ResolvedQuickScheduleConfig = {
  slotInterval: 30,
  bookingWindow: 60,
  minNotice: 24,
  timezone: 'UTC',
  email: {},
  notifications: {
    sendConfirmation: true,
    sendReminder: false,
    reminderHours: 24,
    notifyProvider: false,
    notifyEmail: '',
  },
  collections: {
    providers: { slug: 'qs-providers', fields: [] },
    appointmentTypes: { slug: 'qs-appointment-types', fields: [] },
    bookings: { slug: 'qs-bookings', fields: [] },
    blockedTimes: { slug: 'qs-blocked-times', fields: [] },
  },
  routePrefix: '/api/quickschedule',
  validation: {},
}

describe('createCollections', () => {
  it('returns 4 collections', () => {
    const collections = createCollections(defaultConfig)
    expect(collections).toHaveLength(4)
  })

  it('uses configured slugs', () => {
    const collections = createCollections(defaultConfig)
    const slugs = collections.map((c) => c.slug)
    expect(slugs).toContain('qs-providers')
    expect(slugs).toContain('qs-appointment-types')
    expect(slugs).toContain('qs-bookings')
    expect(slugs).toContain('qs-blocked-times')
  })

  it('uses custom slugs when configured', () => {
    const config = {
      ...defaultConfig,
      collections: {
        ...defaultConfig.collections,
        providers: { slug: 'staff', fields: [] },
      },
    }
    const collections = createCollections(config)
    const slugs = collections.map((c) => c.slug)
    expect(slugs).toContain('staff')
  })

  it('includes extra fields when configured', () => {
    const config = {
      ...defaultConfig,
      collections: {
        ...defaultConfig.collections,
        providers: {
          slug: 'qs-providers',
          fields: [{ name: 'licenseNumber', type: 'text' as const }],
        },
      },
    }
    const collections = createCollections(config)
    const providers = collections.find((c) => c.slug === 'qs-providers')!
    const fieldNames = providers.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('licenseNumber')
  })

  it('providers collection has schedule array field', () => {
    const collections = createCollections(defaultConfig)
    const providers = collections.find((c) => c.slug === 'qs-providers')!
    const fieldNames = providers.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('schedule')
  })

  it('bookings collection has status field', () => {
    const collections = createCollections(defaultConfig)
    const bookings = collections.find((c) => c.slug === 'qs-bookings')!
    const fieldNames = bookings.fields.map((f: any) => f.name).filter(Boolean)
    expect(fieldNames).toContain('status')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/collections/`
Expected: FAIL

**Step 3: Implement Providers collection**

```typescript
// src/collections/Providers.ts
import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createProvidersCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const { slug, fields: extraFields } = config.collections.providers

  return {
    slug,
    admin: {
      useAsTitle: 'name',
      group: 'Scheduling',
    },
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'photo', type: 'upload', relationTo: 'media' },
      { name: 'bio', type: 'richText' },
      { name: 'active', type: 'checkbox', defaultValue: true },
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
          { name: 'startTime', type: 'text', required: true },
          { name: 'endTime', type: 'text', required: true },
        ],
      },
      { name: 'bufferMinutes', type: 'number', defaultValue: 0 },
      { name: 'timezone', type: 'text' },
      ...extraFields,
    ],
  }
}
```

**Step 4: Implement AppointmentTypes collection**

```typescript
// src/collections/AppointmentTypes.ts
import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createAppointmentTypesCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const { slug, fields: extraFields } = config.collections.appointmentTypes

  return {
    slug,
    admin: {
      useAsTitle: 'name',
      group: 'Scheduling',
    },
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'description', type: 'textarea' },
      { name: 'duration', type: 'number', required: true },
      { name: 'price', type: 'number' },
      { name: 'provider', type: 'relationship', relationTo: providerSlug },
      { name: 'providers', type: 'relationship', relationTo: providerSlug, hasMany: true },
      { name: 'color', type: 'text' },
      { name: 'active', type: 'checkbox', defaultValue: true },
      { name: 'maxPerDay', type: 'number' },
      { name: 'requiresNewPatient', type: 'checkbox', defaultValue: false },
      { name: 'bufferBefore', type: 'number', defaultValue: 0 },
      { name: 'bufferAfter', type: 'number', defaultValue: 0 },
      ...extraFields,
    ],
  }
}
```

**Step 5: Implement Bookings collection**

```typescript
// src/collections/Bookings.ts
import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createBookingsCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const appointmentTypeSlug = config.collections.appointmentTypes.slug
  const { slug, fields: extraFields, hooks: extraHooks } = config.collections.bookings

  return {
    slug,
    admin: {
      useAsTitle: 'summary',
      group: 'Scheduling',
      defaultColumns: ['date', 'time', 'patientName', 'appointmentType', 'status'],
    },
    hooks: {
      ...(extraHooks || {}),
    },
    fields: [
      {
        name: 'summary',
        type: 'text',
        admin: { readOnly: true },
        hooks: {
          beforeChange: [
            ({ data }) => {
              if (data?.patientName && data?.date && data?.time) {
                return `${data.patientName} - ${data.date} ${data.time}`
              }
              return data?.summary
            },
          ],
        },
      },
      { name: 'appointmentType', type: 'relationship', relationTo: appointmentTypeSlug, required: true },
      { name: 'provider', type: 'relationship', relationTo: providerSlug, required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'time', type: 'text', required: true },
      { name: 'duration', type: 'number', required: true },
      { name: 'endTime', type: 'text' },
      { name: 'patientName', type: 'text', required: true },
      { name: 'patientEmail', type: 'email', required: true },
      { name: 'patientPhone', type: 'text', required: true },
      { name: 'notes', type: 'textarea' },
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
      { name: 'confirmationSent', type: 'checkbox', defaultValue: false },
      { name: 'reminderSent', type: 'checkbox', defaultValue: false },
      { name: 'cancelledAt', type: 'date' },
      { name: 'cancelReason', type: 'text' },
      { name: 'confirmationNumber', type: 'text', admin: { readOnly: true } },
      { name: 'cancelToken', type: 'text', admin: { hidden: true } },
      ...extraFields,
    ],
  }
}
```

**Step 6: Implement BlockedTimes collection**

```typescript
// src/collections/BlockedTimes.ts
import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'

export function createBlockedTimesCollection(config: ResolvedQuickScheduleConfig): CollectionConfig {
  const providerSlug = config.collections.providers.slug
  const { slug, fields: extraFields } = config.collections.blockedTimes

  return {
    slug,
    admin: {
      useAsTitle: 'reason',
      group: 'Scheduling',
    },
    fields: [
      { name: 'provider', type: 'relationship', relationTo: providerSlug, required: true },
      { name: 'reason', type: 'text' },
      { name: 'startDate', type: 'date', required: true },
      { name: 'endDate', type: 'date', required: true },
      { name: 'allDay', type: 'checkbox', defaultValue: true },
      {
        name: 'startTime',
        type: 'text',
        admin: { condition: (data) => !data.allDay },
      },
      {
        name: 'endTime',
        type: 'text',
        admin: { condition: (data) => !data.allDay },
      },
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
      ...extraFields,
    ],
  }
}
```

**Step 7: Create collections barrel with factory**

```typescript
// src/collections/index.ts
import type { CollectionConfig } from 'payload'
import type { ResolvedQuickScheduleConfig } from '../types/index.js'
import { createProvidersCollection } from './Providers.js'
import { createAppointmentTypesCollection } from './AppointmentTypes.js'
import { createBookingsCollection } from './Bookings.js'
import { createBlockedTimesCollection } from './BlockedTimes.js'

export function createCollections(config: ResolvedQuickScheduleConfig): CollectionConfig[] {
  return [
    createProvidersCollection(config),
    createAppointmentTypesCollection(config),
    createBookingsCollection(config),
    createBlockedTimesCollection(config),
  ]
}

export { createProvidersCollection } from './Providers.js'
export { createAppointmentTypesCollection } from './AppointmentTypes.js'
export { createBookingsCollection } from './Bookings.js'
export { createBlockedTimesCollection } from './BlockedTimes.js'
```

**Step 8: Run tests**

Run: `pnpm test src/collections/`
Expected: PASS

**Step 9: Commit**

```bash
git add src/collections/
git commit -m "feat: add collection factories for providers, appointment types, bookings, blocked times"
```

---

## Task 5: Plugin Entry Point & Config Resolution

**Files:**
- Create: `src/plugin.ts`
- Create: `src/defaults.ts`
- Modify: `src/index.ts`
- Test: `src/plugin.test.ts`

**Step 1: Write failing plugin tests**

```typescript
// src/plugin.test.ts
import { describe, it, expect } from 'vitest'
import { quickschedulePlugin } from './plugin.js'
import { resolveConfig } from './defaults.js'

describe('resolveConfig', () => {
  it('applies defaults for empty config', () => {
    const resolved = resolveConfig({})
    expect(resolved.slotInterval).toBe(30)
    expect(resolved.bookingWindow).toBe(60)
    expect(resolved.minNotice).toBe(24)
    expect(resolved.timezone).toBe('UTC')
    expect(resolved.routePrefix).toBe('/api/quickschedule')
  })

  it('overrides defaults with user config', () => {
    const resolved = resolveConfig({
      slotInterval: 15,
      timezone: 'America/Detroit',
    })
    expect(resolved.slotInterval).toBe(15)
    expect(resolved.timezone).toBe('America/Detroit')
  })

  it('uses default collection slugs', () => {
    const resolved = resolveConfig({})
    expect(resolved.collections.providers.slug).toBe('qs-providers')
    expect(resolved.collections.appointmentTypes.slug).toBe('qs-appointment-types')
    expect(resolved.collections.bookings.slug).toBe('qs-bookings')
    expect(resolved.collections.blockedTimes.slug).toBe('qs-blocked-times')
  })

  it('allows custom collection slugs', () => {
    const resolved = resolveConfig({
      collections: {
        providers: { slug: 'staff' },
      },
    })
    expect(resolved.collections.providers.slug).toBe('staff')
    expect(resolved.collections.bookings.slug).toBe('qs-bookings')
  })
})

describe('quickschedulePlugin', () => {
  it('returns a function', () => {
    const plugin = quickschedulePlugin({})
    expect(typeof plugin).toBe('function')
  })

  it('adds 4 collections to config', () => {
    const plugin = quickschedulePlugin({})
    const result = plugin({
      collections: [],
    } as any)
    expect((result as any).collections).toHaveLength(4)
  })

  it('preserves existing collections', () => {
    const plugin = quickschedulePlugin({})
    const existing = { slug: 'pages', fields: [] }
    const result = plugin({
      collections: [existing],
    } as any)
    expect((result as any).collections).toHaveLength(5)
    expect((result as any).collections[0]).toBe(existing)
  })

  it('returns config unchanged when enabled=false', () => {
    const plugin = quickschedulePlugin({ enabled: false })
    const input = { collections: [{ slug: 'pages', fields: [] }] } as any
    const result = plugin(input)
    expect(result).toBe(input)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/plugin.test.ts`
Expected: FAIL

**Step 3: Implement config defaults**

```typescript
// src/defaults.ts
import type { QuickScheduleConfig, ResolvedQuickScheduleConfig } from './types/index.js'

export function resolveConfig(config: QuickScheduleConfig): ResolvedQuickScheduleConfig {
  return {
    slotInterval: config.slotInterval ?? 30,
    bookingWindow: config.bookingWindow ?? 60,
    minNotice: config.minNotice ?? 24,
    timezone: config.timezone ?? 'UTC',
    email: config.email ?? {},
    notifications: {
      sendConfirmation: config.notifications?.sendConfirmation ?? true,
      sendReminder: config.notifications?.sendReminder ?? false,
      reminderHours: config.notifications?.reminderHours ?? 24,
      notifyProvider: config.notifications?.notifyProvider ?? false,
      notifyEmail: config.notifications?.notifyEmail ?? '',
    },
    collections: {
      providers: {
        slug: config.collections?.providers?.slug ?? 'qs-providers',
        fields: config.collections?.providers?.fields ?? [],
        hooks: config.collections?.providers?.hooks,
      },
      appointmentTypes: {
        slug: config.collections?.appointmentTypes?.slug ?? 'qs-appointment-types',
        fields: config.collections?.appointmentTypes?.fields ?? [],
        hooks: config.collections?.appointmentTypes?.hooks,
      },
      bookings: {
        slug: config.collections?.bookings?.slug ?? 'qs-bookings',
        fields: config.collections?.bookings?.fields ?? [],
        hooks: config.collections?.bookings?.hooks,
      },
      blockedTimes: {
        slug: config.collections?.blockedTimes?.slug ?? 'qs-blocked-times',
        fields: config.collections?.blockedTimes?.fields ?? [],
        hooks: config.collections?.blockedTimes?.hooks,
      },
    },
    routePrefix: config.routePrefix ?? '/api/quickschedule',
    validation: config.validation ?? {},
  }
}
```

**Step 4: Implement plugin function**

```typescript
// src/plugin.ts
import type { Config, Plugin } from 'payload'
import type { QuickScheduleConfig } from './types/index.js'
import { resolveConfig } from './defaults.js'
import { createCollections } from './collections/index.js'

export const quickschedulePlugin =
  (pluginConfig: QuickScheduleConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig
    }

    const config = resolveConfig(pluginConfig)
    const collections = createCollections(config)

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections || []), ...collections],
    }
  }
```

**Step 5: Update main index.ts**

```typescript
// src/index.ts
export { quickschedulePlugin } from './plugin.js'
export { resolveConfig } from './defaults.js'
export type { QuickScheduleConfig, ResolvedQuickScheduleConfig } from './types/index.js'
```

**Step 6: Run tests**

Run: `pnpm test src/plugin.test.ts`
Expected: PASS

**Step 7: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 8: Commit**

```bash
git add src/plugin.ts src/defaults.ts src/index.ts
git commit -m "feat: add plugin entry point with config resolution"
```

---

## Task 6: API — Availability Logic

**Files:**
- Create: `src/api/available-slots.ts`
- Create: `src/api/index.ts`
- Test: `src/api/available-slots.test.ts`

This is the core business logic. The `getAvailableSlots` function is a pure function that takes provider schedule, appointment type, existing bookings, blocked times, and config — and returns available time slots.

**Step 1: Write failing tests**

```typescript
// src/api/available-slots.test.ts
import { describe, it, expect } from 'vitest'
import { getAvailableSlots } from './available-slots.js'
import type { Provider, AppointmentType, Booking, BlockedTime } from '../types/index.js'

const provider: Provider = {
  id: 'prov-1',
  name: 'Dr. Smith',
  email: 'smith@example.com',
  active: true,
  bufferMinutes: 0,
  schedule: [
    { dayOfWeek: '1', startTime: '09:00', endTime: '17:00' }, // Monday
    { dayOfWeek: '3', startTime: '09:00', endTime: '12:00' }, // Wednesday
  ],
}

const appointmentType: AppointmentType = {
  id: 'apt-1',
  name: 'Consultation',
  slug: 'consultation',
  duration: 30,
  active: true,
  requiresNewPatient: false,
  bufferBefore: 0,
  bufferAfter: 0,
}

describe('getAvailableSlots', () => {
  it('returns slots for a day the provider works', () => {
    // 2026-03-16 is a Monday
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots.length).toBeGreaterThan(0)
    expect(result.availableSlots).toContain('09:00')
    expect(result.availableSlots).toContain('16:30')
    expect(result.availableSlots).not.toContain('17:00')
  })

  it('returns empty for a day the provider does not work', () => {
    // 2026-03-17 is a Tuesday — provider only works Mon, Wed
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-17',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('removes slots that conflict with existing bookings', () => {
    const bookings: Partial<Booking>[] = [
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).not.toContain('10:00')
    expect(result.availableSlots).toContain('09:30')
    expect(result.availableSlots).toContain('10:30')
  })

  it('removes all slots for all-day blocked time', () => {
    const blockedTimes: Partial<BlockedTime>[] = [
      { allDay: true, startDate: '2026-03-16', endDate: '2026-03-16', recurring: 'none' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: blockedTimes as BlockedTime[],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('respects provider buffer minutes', () => {
    const providerWithBuffer = { ...provider, bufferMinutes: 15 }
    const bookings: Partial<Booking>[] = [
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider: providerWithBuffer,
      appointmentType,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    // 10:00 booked for 30 min + 15 min buffer = 10:00-10:45 blocked
    // So 09:30 should also be blocked (09:30-10:00 overlaps with buffer before)
    expect(result.availableSlots).not.toContain('10:00')
  })

  it('respects maxPerDay limit', () => {
    const typeWithMax = { ...appointmentType, maxPerDay: 2 }
    const bookings: Partial<Booking>[] = [
      { time: '09:00', duration: 30, status: 'confirmed' },
      { time: '10:00', duration: 30, status: 'confirmed' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType: typeWithMax,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots).toEqual([])
  })

  it('does not count cancelled bookings against maxPerDay', () => {
    const typeWithMax = { ...appointmentType, maxPerDay: 1 }
    const bookings: Partial<Booking>[] = [
      { time: '09:00', duration: 30, status: 'cancelled' },
    ]
    const result = getAvailableSlots({
      provider,
      appointmentType: typeWithMax,
      date: '2026-03-16',
      bookings: bookings as Booking[],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.availableSlots.length).toBeGreaterThan(0)
  })

  it('returns correct metadata in response', () => {
    const result = getAvailableSlots({
      provider,
      appointmentType,
      date: '2026-03-16',
      bookings: [],
      blockedTimes: [],
      config: { slotInterval: 30, minNotice: 0, timezone: 'UTC' },
    })
    expect(result.date).toBe('2026-03-16')
    expect(result.provider).toEqual({ id: 'prov-1', name: 'Dr. Smith' })
    expect(result.appointmentType).toEqual({
      id: 'apt-1',
      name: 'Consultation',
      duration: 30,
    })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/api/available-slots.test.ts`
Expected: FAIL

**Step 3: Implement getAvailableSlots**

```typescript
// src/api/available-slots.ts
import type {
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
  AvailabilityResponse,
} from '../types/index.js'
import { generateSlots, filterConflicts } from '../utils/slots.js'
import { getDayOfWeek } from '../utils/time.js'

interface GetAvailableSlotsInput {
  provider: Provider
  appointmentType: AppointmentType
  date: string
  bookings: Booking[]
  blockedTimes: BlockedTime[]
  config: {
    slotInterval: number
    minNotice: number
    timezone: string
  }
}

export function getAvailableSlots(input: GetAvailableSlotsInput): AvailabilityResponse {
  const { provider, appointmentType, date, bookings, blockedTimes, config } = input

  const dayOfWeek = getDayOfWeek(date)
  const daySchedule = provider.schedule.filter((s) => s.dayOfWeek === String(dayOfWeek))

  // No schedule for this day
  if (daySchedule.length === 0) {
    return buildResponse(input, [])
  }

  // Check maxPerDay — only count active (non-cancelled) bookings
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  if (appointmentType.maxPerDay && activeBookings.length >= appointmentType.maxPerDay) {
    return buildResponse(input, [])
  }

  // Generate slots for each schedule block
  let allSlots: string[] = []
  for (const schedule of daySchedule) {
    const slots = generateSlots(schedule.startTime, schedule.endTime, config.slotInterval)
    allSlots = [...allSlots, ...slots]
  }

  // Build conflict data from active bookings
  const bookingConflicts = activeBookings.map((b) => ({
    time: b.time,
    duration: b.duration,
  }))

  // Build blocked time conflicts
  const blockedConflicts = blockedTimes.map((bt) => ({
    allDay: bt.allDay,
    startTime: bt.startTime,
    endTime: bt.endTime,
  }))

  // Total buffer = provider buffer + appointment type buffers
  const totalBuffer = provider.bufferMinutes + appointmentType.bufferBefore + appointmentType.bufferAfter

  // Filter conflicts
  const available = filterConflicts(
    allSlots,
    appointmentType.duration,
    bookingConflicts,
    blockedConflicts,
    totalBuffer,
  )

  return buildResponse(input, available)
}

function buildResponse(input: GetAvailableSlotsInput, slots: string[]): AvailabilityResponse {
  return {
    date: input.date,
    provider: {
      id: input.provider.id,
      name: input.provider.name,
    },
    appointmentType: {
      id: input.appointmentType.id,
      name: input.appointmentType.name,
      duration: input.appointmentType.duration,
    },
    availableSlots: slots,
  }
}
```

**Step 4: Create api barrel**

```typescript
// src/api/index.ts
export { getAvailableSlots } from './available-slots.js'
```

**Step 5: Run tests**

Run: `pnpm test src/api/`
Expected: PASS

**Step 6: Commit**

```bash
git add src/api/
git commit -m "feat: add availability slot computation logic"
```

---

## Task 7: API — Booking Creation

**Files:**
- Create: `src/api/create-booking.ts`
- Modify: `src/api/index.ts`
- Test: `src/api/create-booking.test.ts`

**Step 1: Write failing tests**

```typescript
// src/api/create-booking.test.ts
import { describe, it, expect, vi } from 'vitest'
import { processBooking } from './create-booking.js'

describe('processBooking', () => {
  const validInput = {
    appointmentTypeId: 'apt-1',
    providerId: 'prov-1',
    date: '2026-12-15',
    time: '10:00',
    patient: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-123-4567',
    },
  }

  const mockDeps = {
    findProvider: vi.fn().mockResolvedValue({
      id: 'prov-1',
      name: 'Dr. Smith',
      email: 'smith@example.com',
      active: true,
      bufferMinutes: 0,
      schedule: [{ dayOfWeek: '1', startTime: '09:00', endTime: '17:00' }],
    }),
    findAppointmentType: vi.fn().mockResolvedValue({
      id: 'apt-1',
      name: 'Consultation',
      slug: 'consultation',
      duration: 30,
      active: true,
      requiresNewPatient: false,
      bufferBefore: 0,
      bufferAfter: 0,
    }),
    findBookingsForDate: vi.fn().mockResolvedValue([]),
    findBlockedTimesForDate: vi.fn().mockResolvedValue([]),
    createBookingRecord: vi.fn().mockResolvedValue({
      id: 'booking-1',
      confirmationNumber: 'QS-2026-1215-001',
    }),
    countBookingsForDate: vi.fn().mockResolvedValue(0),
    config: {
      slotInterval: 30,
      minNotice: 0,
      timezone: 'UTC',
      validation: {},
    },
  }

  it('creates a booking for a valid request', async () => {
    const result = await processBooking(validInput, mockDeps)
    expect(result.success).toBe(true)
    expect(result.booking).toBeDefined()
    expect(mockDeps.createBookingRecord).toHaveBeenCalled()
  })

  it('rejects when provider not found', async () => {
    const deps = { ...mockDeps, findProvider: vi.fn().mockResolvedValue(null) }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('provider_not_found')
  })

  it('rejects when appointment type not found', async () => {
    const deps = { ...mockDeps, findAppointmentType: vi.fn().mockResolvedValue(null) }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('appointment_type_not_found')
  })

  it('rejects when slot is unavailable', async () => {
    const deps = {
      ...mockDeps,
      findBookingsForDate: vi.fn().mockResolvedValue([
        { time: '10:00', duration: 30, status: 'confirmed' },
      ]),
    }
    const result = await processBooking(validInput, deps)
    expect(result.success).toBe(false)
    expect(result.error).toBe('slot_unavailable')
  })

  it('rejects invalid input', async () => {
    const result = await processBooking(
      { ...validInput, patient: { ...validInput.patient, name: '' } },
      mockDeps,
    )
    expect(result.success).toBe(false)
    expect(result.error).toBe('validation_error')
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/api/create-booking.test.ts`
Expected: FAIL

**Step 3: Implement processBooking**

```typescript
// src/api/create-booking.ts
import type {
  BookingInput,
  BookingResponse,
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
} from '../types/index.js'
import { validateBookingInput } from '../utils/validation.js'
import { getAvailableSlots } from './available-slots.js'
import { generateCancelToken, generateConfirmationNumber } from '../utils/time.js'

interface BookingDeps {
  findProvider: (id: string) => Promise<Provider | null>
  findAppointmentType: (id: string) => Promise<AppointmentType | null>
  findBookingsForDate: (providerId: string, date: string) => Promise<Booking[]>
  findBlockedTimesForDate: (providerId: string, date: string) => Promise<BlockedTime[]>
  createBookingRecord: (data: Record<string, unknown>) => Promise<Booking>
  countBookingsForDate: (providerId: string, date: string) => Promise<number>
  config: {
    slotInterval: number
    minNotice: number
    timezone: string
    validation: {
      requirePhone?: boolean
      requireEmail?: boolean
      customValidation?: (booking: BookingInput) => Promise<{ valid: boolean; message?: string }>
    }
  }
}

export async function processBooking(
  input: BookingInput,
  deps: BookingDeps,
): Promise<BookingResponse> {
  // 1. Validate input
  const validation = validateBookingInput(input, {
    requireEmail: deps.config.validation.requireEmail,
    requirePhone: deps.config.validation.requirePhone,
  })
  if (!validation.valid) {
    return {
      success: false,
      error: 'validation_error',
      message: validation.errors.join(', '),
    }
  }

  // 2. Custom validation
  if (deps.config.validation.customValidation) {
    const custom = await deps.config.validation.customValidation(input)
    if (!custom.valid) {
      return {
        success: false,
        error: 'validation_error',
        message: custom.message || 'Custom validation failed',
      }
    }
  }

  // 3. Find provider
  const provider = await deps.findProvider(input.providerId)
  if (!provider) {
    return {
      success: false,
      error: 'provider_not_found',
      message: 'Provider not found',
    }
  }

  // 4. Find appointment type
  const appointmentType = await deps.findAppointmentType(input.appointmentTypeId)
  if (!appointmentType) {
    return {
      success: false,
      error: 'appointment_type_not_found',
      message: 'Appointment type not found',
    }
  }

  // 5. Check slot availability
  const bookings = await deps.findBookingsForDate(input.providerId, input.date)
  const blockedTimes = await deps.findBlockedTimesForDate(input.providerId, input.date)

  const availability = getAvailableSlots({
    provider,
    appointmentType,
    date: input.date,
    bookings,
    blockedTimes,
    config: deps.config,
  })

  if (!availability.availableSlots.includes(input.time)) {
    return {
      success: false,
      error: 'slot_unavailable',
      message: 'This time slot is no longer available',
    }
  }

  // 6. Create booking
  const sequence = (await deps.countBookingsForDate(input.providerId, input.date)) + 1
  const cancelToken = generateCancelToken()

  const booking = await deps.createBookingRecord({
    appointmentType: input.appointmentTypeId,
    provider: input.providerId,
    date: input.date,
    time: input.time,
    duration: appointmentType.duration,
    endTime: computeEndTime(input.time, appointmentType.duration),
    patientName: input.patient.name,
    patientEmail: input.patient.email,
    patientPhone: input.patient.phone,
    notes: input.patient.notes,
    status: 'confirmed',
    confirmationNumber: generateConfirmationNumber(input.date, sequence),
    cancelToken,
  })

  return {
    success: true,
    booking,
    token: cancelToken,
  }
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMinutes / 60)
  const endM = totalMinutes % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}
```

**Step 4: Update api barrel**

```typescript
// src/api/index.ts
export { getAvailableSlots } from './available-slots.js'
export { processBooking } from './create-booking.js'
```

**Step 5: Run tests**

Run: `pnpm test src/api/`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/api/
git commit -m "feat: add booking creation with validation and conflict checking"
```

---

## Task 8: API — Route Handlers

**Files:**
- Create: `src/api/routes.ts`
- Modify: `src/api/index.ts`

This task creates Next.js-compatible route handlers that consumers wire into their `app/api/quickschedule/[...path]/route.ts`.

**Step 1: Implement route handler factory**

```typescript
// src/api/routes.ts
import type { QuickScheduleConfig, ResolvedQuickScheduleConfig } from '../types/index.js'
import { resolveConfig } from '../defaults.js'
import { getAvailableSlots } from './available-slots.js'
import { processBooking } from './create-booking.js'

/**
 * Creates Next.js route handlers for quickschedule API.
 * Usage in app/api/quickschedule/[...path]/route.ts:
 *
 * import { createRouteHandlers } from '@nineteenlabs/quickschedule/api'
 * import { getPayload } from 'payload'
 * import configPromise from '@payload-config'
 *
 * const { GET, POST } = createRouteHandlers(configPromise)
 * export { GET, POST }
 */
export function createRouteHandlers(payloadConfigPromise: unknown) {
  async function getPayloadInstance() {
    const { getPayload } = await import('payload')
    return getPayload({ config: payloadConfigPromise as any })
  }

  async function GET(request: Request) {
    try {
      const url = new URL(request.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const action = pathSegments[pathSegments.length - 1]

      const payload = await getPayloadInstance()
      const pluginConfig = (payload.config as any)._quickschedule as ResolvedQuickScheduleConfig

      if (!pluginConfig) {
        return Response.json({ error: 'QuickSchedule plugin not configured' }, { status: 500 })
      }

      switch (action) {
        case 'providers': {
          const result = await payload.find({
            collection: pluginConfig.collections.providers.slug,
            where: { active: { equals: true } },
            limit: 100,
          })
          return Response.json(result.docs)
        }

        case 'appointment-types': {
          const providerId = url.searchParams.get('providerId')
          const where: Record<string, unknown> = { active: { equals: true } }
          if (providerId) {
            where.or = [
              { provider: { equals: providerId } },
              { providers: { contains: providerId } },
            ]
          }
          const result = await payload.find({
            collection: pluginConfig.collections.appointmentTypes.slug,
            where,
            limit: 100,
          })
          return Response.json(result.docs)
        }

        case 'availability': {
          const providerId = url.searchParams.get('providerId')
          const appointmentTypeId = url.searchParams.get('appointmentTypeId')
          const date = url.searchParams.get('date')

          if (!providerId || !appointmentTypeId || !date) {
            return Response.json(
              { error: 'Missing required params: providerId, appointmentTypeId, date' },
              { status: 400 },
            )
          }

          const [provider, appointmentType, bookingsResult, blockedResult] = await Promise.all([
            payload.findByID({
              collection: pluginConfig.collections.providers.slug,
              id: providerId,
            }),
            payload.findByID({
              collection: pluginConfig.collections.appointmentTypes.slug,
              id: appointmentTypeId,
            }),
            payload.find({
              collection: pluginConfig.collections.bookings.slug,
              where: {
                provider: { equals: providerId },
                date: { equals: date },
                status: { not_equals: 'cancelled' },
              },
              limit: 100,
            }),
            payload.find({
              collection: pluginConfig.collections.blockedTimes.slug,
              where: {
                provider: { equals: providerId },
                startDate: { less_than_equal: date },
                endDate: { greater_than_equal: date },
              },
              limit: 100,
            }),
          ])

          const availability = getAvailableSlots({
            provider: provider as any,
            appointmentType: appointmentType as any,
            date,
            bookings: bookingsResult.docs as any,
            blockedTimes: blockedResult.docs as any,
            config: pluginConfig,
          })

          return Response.json(availability)
        }

        default:
          return Response.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('[quickschedule] GET error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  async function POST(request: Request) {
    try {
      const url = new URL(request.url)
      const pathSegments = url.pathname.split('/').filter(Boolean)
      const action = pathSegments[pathSegments.length - 1]

      const payload = await getPayloadInstance()
      const pluginConfig = (payload.config as any)._quickschedule as ResolvedQuickScheduleConfig

      if (!pluginConfig) {
        return Response.json({ error: 'QuickSchedule plugin not configured' }, { status: 500 })
      }

      switch (action) {
        case 'book': {
          const body = await request.json()

          const result = await processBooking(body, {
            findProvider: async (id) => {
              try {
                return (await payload.findByID({
                  collection: pluginConfig.collections.providers.slug,
                  id,
                })) as any
              } catch {
                return null
              }
            },
            findAppointmentType: async (id) => {
              try {
                return (await payload.findByID({
                  collection: pluginConfig.collections.appointmentTypes.slug,
                  id,
                })) as any
              } catch {
                return null
              }
            },
            findBookingsForDate: async (providerId, date) => {
              const r = await payload.find({
                collection: pluginConfig.collections.bookings.slug,
                where: {
                  provider: { equals: providerId },
                  date: { equals: date },
                },
                limit: 100,
              })
              return r.docs as any
            },
            findBlockedTimesForDate: async (providerId, date) => {
              const r = await payload.find({
                collection: pluginConfig.collections.blockedTimes.slug,
                where: {
                  provider: { equals: providerId },
                  startDate: { less_than_equal: date },
                  endDate: { greater_than_equal: date },
                },
                limit: 100,
              })
              return r.docs as any
            },
            createBookingRecord: async (data) => {
              return (await payload.create({
                collection: pluginConfig.collections.bookings.slug,
                data,
              })) as any
            },
            countBookingsForDate: async (providerId, date) => {
              const r = await payload.count({
                collection: pluginConfig.collections.bookings.slug,
                where: {
                  provider: { equals: providerId },
                  date: { equals: date },
                },
              })
              return r.totalDocs
            },
            config: pluginConfig,
          })

          const status = result.success ? 201 : 400
          return Response.json(result, { status })
        }

        case 'cancel': {
          const body = await request.json()
          const { bookingId, token, reason } = body

          if (!bookingId || !token) {
            return Response.json(
              { error: 'Missing bookingId and token' },
              { status: 400 },
            )
          }

          const booking = await payload.findByID({
            collection: pluginConfig.collections.bookings.slug,
            id: bookingId,
          })

          if ((booking as any).cancelToken !== token) {
            return Response.json({ error: 'Invalid token' }, { status: 403 })
          }

          await payload.update({
            collection: pluginConfig.collections.bookings.slug,
            id: bookingId,
            data: {
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              cancelReason: reason || '',
            },
          })

          return Response.json({ success: true })
        }

        default:
          return Response.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('[quickschedule] POST error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return { GET, POST }
}
```

**Step 2: Update plugin.ts to store resolved config on payload config**

In `src/plugin.ts`, add this line inside the plugin function so route handlers can access the resolved config:

```typescript
// Add to the return object in plugin.ts:
(result as any)._quickschedule = config
```

**Step 3: Update api barrel**

```typescript
// src/api/index.ts
export { getAvailableSlots } from './available-slots.js'
export { processBooking } from './create-booking.js'
export { createRouteHandlers } from './routes.js'
```

**Step 4: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/api/ src/plugin.ts
git commit -m "feat: add Next.js route handlers for availability, booking, and cancellation"
```

---

## Task 9: React — BookingProvider Context & Hooks

**Files:**
- Create: `src/react/BookingProvider.tsx`
- Create: `src/react/hooks/useAvailableSlots.ts`
- Create: `src/react/hooks/useBooking.ts`
- Create: `src/react/hooks/index.ts`
- Create: `src/react/index.ts`
- Test: `src/react/hooks/useAvailableSlots.test.ts`

**Step 1: Create BookingProvider context**

```tsx
// src/react/BookingProvider.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AppointmentType, Provider, BookingResponse } from '../types/index.js'

interface BookingState {
  step: 'type' | 'date' | 'time' | 'form' | 'confirmation'
  selectedType: AppointmentType | null
  selectedProvider: Provider | null
  selectedDate: string | null
  selectedTime: string | null
  booking: BookingResponse | null
}

interface BookingContextValue extends BookingState {
  apiBase: string
  selectType: (type: AppointmentType) => void
  selectProvider: (provider: Provider) => void
  selectDate: (date: string) => void
  selectTime: (time: string) => void
  setBooking: (booking: BookingResponse) => void
  reset: () => void
  goToStep: (step: BookingState['step']) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export interface BookingProviderProps {
  apiBase?: string
  children: ReactNode
  onBookingComplete?: (booking: BookingResponse) => void
  onError?: (error: Error) => void
}

const initialState: BookingState = {
  step: 'type',
  selectedType: null,
  selectedProvider: null,
  selectedDate: null,
  selectedTime: null,
  booking: null,
}

export function BookingProvider({
  apiBase = '/api/quickschedule',
  children,
  onBookingComplete,
  onError,
}: BookingProviderProps) {
  const [state, setState] = useState<BookingState>(initialState)

  const selectType = useCallback((type: AppointmentType) => {
    setState((prev) => ({ ...prev, selectedType: type, step: 'date' }))
  }, [])

  const selectProvider = useCallback((provider: Provider) => {
    setState((prev) => ({ ...prev, selectedProvider: provider }))
  }, [])

  const selectDate = useCallback((date: string) => {
    setState((prev) => ({ ...prev, selectedDate: date, step: 'time' }))
  }, [])

  const selectTime = useCallback((time: string) => {
    setState((prev) => ({ ...prev, selectedTime: time, step: 'form' }))
  }, [])

  const setBooking = useCallback(
    (booking: BookingResponse) => {
      setState((prev) => ({ ...prev, booking, step: 'confirmation' }))
      if (booking.success) {
        onBookingComplete?.(booking)
      }
    },
    [onBookingComplete],
  )

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const goToStep = useCallback((step: BookingState['step']) => {
    setState((prev) => ({ ...prev, step }))
  }, [])

  return (
    <BookingContext.Provider
      value={{
        ...state,
        apiBase,
        selectType,
        selectProvider,
        selectDate,
        selectTime,
        setBooking,
        reset,
        goToStep,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export function useBookingContext(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  return ctx
}
```

**Step 2: Create useAvailableSlots hook**

```typescript
// src/react/hooks/useAvailableSlots.ts
'use client'

import { useState, useEffect } from 'react'
import type { AvailabilityResponse } from '../../types/index.js'
import { useBookingContext } from '../BookingProvider.js'

interface UseAvailableSlotsResult {
  slots: string[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAvailableSlots(): UseAvailableSlotsResult {
  const { apiBase, selectedProvider, selectedType, selectedDate } = useBookingContext()
  const [slots, setSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    if (!selectedProvider?.id || !selectedType?.id || !selectedDate) {
      setSlots([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams({
      providerId: selectedProvider.id,
      appointmentTypeId: selectedType.id,
      date: selectedDate,
    })

    fetch(`${apiBase}/availability?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch availability')
        return res.json() as Promise<AvailabilityResponse>
      })
      .then((data) => {
        if (!cancelled) {
          setSlots(data.availableSlots)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiBase, selectedProvider?.id, selectedType?.id, selectedDate, fetchCount])

  const refetch = () => setFetchCount((c) => c + 1)

  return { slots, isLoading, error, refetch }
}
```

**Step 3: Create useCreateBooking hook**

```typescript
// src/react/hooks/useBooking.ts
'use client'

import { useState, useCallback } from 'react'
import type { BookingInput, BookingResponse } from '../../types/index.js'
import { useBookingContext } from '../BookingProvider.js'

interface UseCreateBookingResult {
  book: (patient: BookingInput['patient']) => Promise<BookingResponse>
  isBooking: boolean
  error: string | null
}

export function useCreateBooking(): UseCreateBookingResult {
  const { apiBase, selectedProvider, selectedType, selectedDate, selectedTime, setBooking } =
    useBookingContext()
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const book = useCallback(
    async (patient: BookingInput['patient']): Promise<BookingResponse> => {
      if (!selectedProvider || !selectedType || !selectedDate || !selectedTime) {
        const errResponse: BookingResponse = {
          success: false,
          error: 'incomplete_selection',
          message: 'Please complete all booking steps first',
        }
        return errResponse
      }

      setIsBooking(true)
      setError(null)

      try {
        const response = await fetch(`${apiBase}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentTypeId: selectedType.id,
            providerId: selectedProvider.id,
            date: selectedDate,
            time: selectedTime,
            patient,
          }),
        })

        const result: BookingResponse = await response.json()

        if (result.success) {
          setBooking(result)
        } else {
          setError(result.message || 'Booking failed')
        }

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error'
        setError(message)
        return { success: false, error: 'network_error', message }
      } finally {
        setIsBooking(false)
      }
    },
    [apiBase, selectedProvider, selectedType, selectedDate, selectedTime, setBooking],
  )

  return { book, isBooking, error }
}
```

**Step 4: Create hooks barrel**

```typescript
// src/react/hooks/index.ts
export { useAvailableSlots } from './useAvailableSlots.js'
export { useCreateBooking } from './useBooking.js'
```

**Step 5: Create react barrel**

```typescript
// src/react/index.ts
export { BookingProvider, useBookingContext } from './BookingProvider.js'
export { useAvailableSlots } from './hooks/useAvailableSlots.js'
export { useCreateBooking } from './hooks/useBooking.js'
```

**Step 6: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/react/
git commit -m "feat: add BookingProvider context and hooks for availability and booking"
```

---

## Task 10: React — Headless Components

**Files:**
- Create: `src/react/AppointmentTypePicker.tsx`
- Create: `src/react/DatePicker.tsx`
- Create: `src/react/TimeSlotPicker.tsx`
- Create: `src/react/BookingForm.tsx`
- Create: `src/react/BookingConfirmation.tsx`
- Modify: `src/react/index.ts`

**Step 1: Implement AppointmentTypePicker**

```tsx
// src/react/AppointmentTypePicker.tsx
'use client'

import React, { useEffect, useState, type ReactNode } from 'react'
import type { AppointmentType } from '../types/index.js'
import { useBookingContext } from './BookingProvider.js'

interface RenderTypeProps {
  type: AppointmentType
  isSelected: boolean
  select: () => void
}

export interface AppointmentTypePickerProps {
  providerId?: string
  renderType?: (props: RenderTypeProps) => ReactNode
  renderLoading?: () => ReactNode
  renderEmpty?: () => ReactNode
}

export function AppointmentTypePicker({
  providerId,
  renderType,
  renderLoading,
  renderEmpty,
}: AppointmentTypePickerProps) {
  const { apiBase, selectedType, selectType, selectProvider } = useBookingContext()
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    if (providerId) params.set('providerId', providerId)

    fetch(`${apiBase}/appointment-types?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTypes(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [apiBase, providerId])

  if (isLoading) return <>{renderLoading?.() ?? null}</>
  if (types.length === 0) return <>{renderEmpty?.() ?? null}</>

  const defaultRender = ({ type, isSelected, select }: RenderTypeProps) => (
    <button key={type.id} onClick={select} data-selected={isSelected}>
      {type.name} ({type.duration} min)
    </button>
  )

  const render = renderType ?? defaultRender

  return (
    <>
      {types.map((type) =>
        render({
          type,
          isSelected: selectedType?.id === type.id,
          select: () => {
            selectType(type)
            // Auto-select provider if appointment type has a single one
            const provider = type.provider
            if (provider && typeof provider === 'object') {
              selectProvider(provider)
            }
          },
        }),
      )}
    </>
  )
}
```

**Step 2: Implement DatePicker**

```tsx
// src/react/DatePicker.tsx
'use client'

import React, { useState, type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'

interface RenderDayProps {
  date: Date
  dateStr: string
  isSelected: boolean
  isToday: boolean
  isPast: boolean
  select: () => void
}

export interface DatePickerProps {
  renderDay?: (props: RenderDayProps) => ReactNode
  renderHeader?: (props: { month: string; year: number; prev: () => void; next: () => void }) => ReactNode
  as?: (props: { value: string | null; onChange: (date: string) => void }) => ReactNode
}

export function DatePicker({ renderDay, renderHeader, as }: DatePickerProps) {
  const { selectedDate, selectDate } = useBookingContext()
  const [viewDate, setViewDate] = useState(() => new Date())

  // Custom date picker passthrough
  if (as) {
    return <>{as({ value: selectedDate, onChange: selectDate })}</>
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: Date[] = []
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long' })

  const prev = () => setViewDate(new Date(year, month - 1, 1))
  const next = () => setViewDate(new Date(year, month + 1, 1))

  const defaultHeader = renderHeader ?? (({ month, year, prev, next }) => (
    <div>
      <button onClick={prev}>&lt;</button>
      <span>{month} {year}</span>
      <button onClick={next}>&gt;</button>
    </div>
  ))

  const defaultRenderDay = renderDay ?? (({ date, dateStr, isSelected, isPast, select }: RenderDayProps) => (
    <button key={dateStr} onClick={select} disabled={isPast} data-selected={isSelected}>
      {date.getDate()}
    </button>
  ))

  return (
    <div>
      {defaultHeader({ month: monthName, year, prev, next })}
      <div>
        {days.map((date) => {
          const dateStr = formatDateStr(date)
          return defaultRenderDay({
            date,
            dateStr,
            isSelected: selectedDate === dateStr,
            isToday: date.getTime() === today.getTime(),
            isPast: date < today,
            select: () => selectDate(dateStr),
          })
        })}
      </div>
    </div>
  )
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

**Step 3: Implement TimeSlotPicker**

```tsx
// src/react/TimeSlotPicker.tsx
'use client'

import React, { type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'
import { useAvailableSlots } from './hooks/useAvailableSlots.js'

interface RenderSlotProps {
  time: string
  isSelected: boolean
  select: () => void
}

export interface TimeSlotPickerProps {
  renderSlot?: (props: RenderSlotProps) => ReactNode
  renderLoading?: () => ReactNode
  renderEmpty?: () => ReactNode
}

export function TimeSlotPicker({
  renderSlot,
  renderLoading,
  renderEmpty,
}: TimeSlotPickerProps) {
  const { selectedTime, selectTime } = useBookingContext()
  const { slots, isLoading } = useAvailableSlots()

  if (isLoading) return <>{renderLoading?.() ?? <div>Loading...</div>}</>
  if (slots.length === 0) return <>{renderEmpty?.() ?? <div>No available times</div>}</>

  const defaultRender = ({ time, isSelected, select }: RenderSlotProps) => (
    <button key={time} onClick={select} data-selected={isSelected}>
      {time}
    </button>
  )

  const render = renderSlot ?? defaultRender

  return (
    <>
      {slots.map((time) =>
        render({
          time,
          isSelected: selectedTime === time,
          select: () => selectTime(time),
        }),
      )}
    </>
  )
}
```

**Step 4: Implement BookingForm**

```tsx
// src/react/BookingForm.tsx
'use client'

import React, { useState, type ReactNode } from 'react'
import { useCreateBooking } from './hooks/useBooking.js'

interface FormField {
  name: string
  label: string
  type?: string
  required?: boolean
}

interface RenderFieldProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  error: string | null
}

interface RenderSubmitProps {
  isSubmitting: boolean
  submit: () => void
}

export interface BookingFormProps {
  fields?: FormField[]
  renderField?: (props: RenderFieldProps) => ReactNode
  renderSubmit?: (props: RenderSubmitProps) => ReactNode
  onSuccess?: () => void
}

const defaultFields: FormField[] = [
  { name: 'name', label: 'Full Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

export function BookingForm({
  fields = defaultFields,
  renderField,
  renderSubmit,
  onSuccess,
}: BookingFormProps) {
  const { book, isBooking } = useCreateBooking()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    // Validate required fields
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.required && !values[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    const result = await book({
      name: values.name || '',
      email: values.email || '',
      phone: values.phone || '',
      notes: values.notes,
    })

    if (result.success) {
      onSuccess?.()
    }
  }

  const defaultRenderField = ({ field, value, onChange, error }: RenderFieldProps) => (
    <div key={field.name}>
      <label>{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {error && <span>{error}</span>}
    </div>
  )

  const defaultRenderSubmit = ({ isSubmitting, submit }: RenderSubmitProps) => (
    <button onClick={submit} disabled={isSubmitting}>
      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
    </button>
  )

  return (
    <div>
      {fields.map((field) =>
        (renderField ?? defaultRenderField)({
          field,
          value: values[field.name] || '',
          onChange: (val) => setValues((prev) => ({ ...prev, [field.name]: val })),
          error: errors[field.name] || null,
        }),
      )}
      {(renderSubmit ?? defaultRenderSubmit)({
        isSubmitting: isBooking,
        submit: handleSubmit,
      })}
    </div>
  )
}
```

**Step 5: Implement BookingConfirmation**

```tsx
// src/react/BookingConfirmation.tsx
'use client'

import React, { type ReactNode } from 'react'
import { useBookingContext } from './BookingProvider.js'
import type { Booking, Provider, AppointmentType } from '../types/index.js'

interface RenderConfirmationProps {
  booking: Booking
  provider: Provider
  appointmentType: AppointmentType
}

export interface BookingConfirmationProps {
  render?: (props: RenderConfirmationProps) => ReactNode
}

export function BookingConfirmation({ render }: BookingConfirmationProps) {
  const { booking, selectedProvider, selectedType } = useBookingContext()

  if (!booking?.success || !booking.booking) return null

  const defaultRender = ({ booking: b }: RenderConfirmationProps) => (
    <div>
      <h2>Booking Confirmed!</h2>
      <p>Confirmation: {b.confirmationNumber}</p>
    </div>
  )

  return (
    <>
      {(render ?? defaultRender)({
        booking: booking.booking,
        provider: selectedProvider!,
        appointmentType: selectedType!,
      })}
    </>
  )
}
```

**Step 6: Update react barrel**

```typescript
// src/react/index.ts
export { BookingProvider, useBookingContext } from './BookingProvider.js'
export { AppointmentTypePicker } from './AppointmentTypePicker.js'
export { DatePicker } from './DatePicker.js'
export { TimeSlotPicker } from './TimeSlotPicker.js'
export { BookingForm } from './BookingForm.js'
export { BookingConfirmation } from './BookingConfirmation.js'
export { useAvailableSlots } from './hooks/useAvailableSlots.js'
export { useCreateBooking } from './hooks/useBooking.js'

export type { BookingProviderProps } from './BookingProvider.js'
export type { AppointmentTypePickerProps } from './AppointmentTypePicker.js'
export type { DatePickerProps } from './DatePicker.js'
export type { TimeSlotPickerProps } from './TimeSlotPicker.js'
export type { BookingFormProps } from './BookingForm.js'
export type { BookingConfirmationProps } from './BookingConfirmation.js'
```

**Step 7: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 8: Commit**

```bash
git add src/react/
git commit -m "feat: add headless React components with render props"
```

---

## Task 11: Email Templates & Sending

**Files:**
- Create: `src/email/templates.ts`
- Create: `src/email/send.ts`
- Create: `src/email/index.ts`
- Test: `src/email/templates.test.ts`

**Step 1: Write failing template tests**

```typescript
// src/email/templates.test.ts
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
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/email/`
Expected: FAIL

**Step 3: Implement templates**

```typescript
// src/email/templates.ts
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
```

**Step 4: Implement email sender**

```typescript
// src/email/send.ts
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
  // Get template (custom override or default)
  const template = emailConfig.templates?.[templateName] ?? defaultTemplates[templateName]
  if (!template) return

  // Merge config variables with template variables
  const allVars = { ...emailConfig.variables, ...variables } as Record<string, string>
  const rendered = renderTemplate(template, allVars)

  const payload = {
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  }

  // Custom sender takes priority
  if (emailConfig.sendFn) {
    await emailConfig.sendFn(payload)
    return
  }

  // Built-in providers
  switch (emailConfig.provider) {
    case 'console':
      console.log('[quickschedule] Email:', JSON.stringify(payload, null, 2))
      break
    case 'resend':
      await sendViaResend(payload, emailConfig)
      break
    default:
      // No provider configured — log in dev
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
```

**Step 5: Create email barrel**

```typescript
// src/email/index.ts
export { sendEmail } from './send.js'
export { renderTemplate, defaultTemplates } from './templates.js'
```

**Step 6: Run tests**

Run: `pnpm test src/email/`
Expected: PASS

**Step 7: Commit**

```bash
git add src/email/
git commit -m "feat: add email templates and pluggable sender"
```

---

## Task 12: Final Wiring, Build & Verify

**Files:**
- Modify: `src/index.ts` (final exports)
- Modify: `src/plugin.ts` (store config reference)

**Step 1: Update src/index.ts with all exports**

```typescript
// src/index.ts
export { quickschedulePlugin } from './plugin.js'
export { resolveConfig } from './defaults.js'

// Re-export commonly used types
export type {
  QuickScheduleConfig,
  ResolvedQuickScheduleConfig,
  Provider,
  AppointmentType,
  Booking,
  BlockedTime,
  BookingInput,
  AvailabilityResponse,
  BookingResponse,
} from './types/index.js'
```

**Step 2: Update plugin.ts to store config and attach email hooks**

The plugin needs to store the resolved config so route handlers can access it, and wire up the afterChange hook on bookings for confirmation emails.

```typescript
// src/plugin.ts — final version
import type { Config, Plugin } from 'payload'
import type { QuickScheduleConfig } from './types/index.js'
import { resolveConfig } from './defaults.js'
import { createCollections } from './collections/index.js'

export const quickschedulePlugin =
  (pluginConfig: QuickScheduleConfig): Plugin =>
  (incomingConfig: Config): Config => {
    if (pluginConfig.enabled === false) {
      return incomingConfig
    }

    const config = resolveConfig(pluginConfig)
    const collections = createCollections(config)

    const result: Config = {
      ...incomingConfig,
      collections: [...(incomingConfig.collections || []), ...collections],
    }

    // Store resolved config so route handlers can access it
    ;(result as any)._quickschedule = config

    return result
  }
```

**Step 3: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Type check**

Run: `pnpm run lint`
Expected: No errors

**Step 5: Build**

Run: `pnpm run build`
Expected: Build succeeds, dist/ created with all entry points

**Step 6: Verify dist structure**

Run: `ls -la dist/`
Expected: index.js, index.d.ts, api/, react/, types/ all present

**Step 7: Commit**

```bash
git add src/ tsup.config.ts
git commit -m "feat: finalize plugin exports and build configuration"
```

---

## Dependency Graph

```
Task 1: Project Init
  └── Task 2: Types
       ├── Task 3: Utils (slots, validation)  ←─ parallel
       ├── Task 4: Collections                ←─ parallel
       │    └── Task 5: Plugin Entry
       │         └── Task 8: Route Handlers
       ├── Task 6: API Availability            ←─ parallel with 4
       │    └── Task 7: API Booking
       │         └── Task 8: Route Handlers
       ├── Task 9: React Context + Hooks       ←─ parallel with 4,6
       │    └── Task 10: React Components
       └── Task 11: Email                      ←─ parallel with 4,6,9
            └── Task 12: Final Wiring
```

**Parallelizable groups after Task 2:**
- **Group A:** Task 3 (Utils) + Task 6 (Availability API)
- **Group B:** Task 4 (Collections) → Task 5 (Plugin Entry)
- **Group C:** Task 9 (React Hooks) → Task 10 (React Components)
- **Group D:** Task 11 (Email)

Tasks 7, 8, and 12 are sequential as they integrate the pieces.
