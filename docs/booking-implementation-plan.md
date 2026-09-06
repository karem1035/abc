# ABC Hospital — doctor directory and booking implementation plan

This focused plan supplements the original module guide and sitemap without replacing either. It specifies the first release; it does not implement application code.

## 1. Goal

Let a visitor submit an appointment request directly in the homepage hero in a few fields. Call-center staff then contact the patient and arrange the actual appointment using our dashboard. The same dashboard records walk-ins manually.

Scope: one hospital branch, Arabic/English, departments, doctors, clinic schedules, requests, staff follow-up, and staff email notifications. Public prices remain undecided. No patient accounts, payments, or public live-slot reservations.

## 2. Data hierarchy

```text
Hospital — one branch, stored in site settings
│
├── Departments
│   └── Department ↔ Doctors (linked, not duplicated)
│
├── Doctors
│   ├── Profile and department links
│   ├── Weekly clinic schedule
│   │   └── Effective dates and attendance hours
│   └── Schedule exceptions
│       └── Leave / canceled session / extra session
│
└── Bookings
    ├── Patient contact details
    ├── Source: website / walk-in / phone
    ├── Original request
    │   └── Optional department / doctor / preferred date or session
    ├── Agreed appointment
    │   └── Assigned department / doctor / actual date and time or session
    ├── Status and assigned staff member
    └── Follow-up history
```

A department groups doctors. A doctor may belong to several departments. A schedule describes attendance, not remaining capacity. A booking starts as a request and gains confirmed appointment details after staff arrange the visit.

Keep one booking record throughout this journey so staff do not have to copy requests into another system.

## 3. Proposed records

### Departments

- Stable ID, Arabic/English name and description, locale slugs.
- Optional image, display order, draft/published/archived state.
- Create/edit/publish/archive from the dashboard.

### Doctors

- Stable ID, Arabic/English name, professional title, biography, and locale slugs.
- Photo linked to the existing media library.
- Draft/published/archived state and a separate `acceptsRequests` setting.
- Department links stored in `doctor_departments`, unique per doctor/department pair.

Archive records with booking history rather than deleting them. Publishing a doctor and allowing requests are separate decisions: a profile can remain visible during a temporary booking pause.

### Clinic schedule rules

- Doctor ID and department ID, with the pair checked against doctor-department membership.
- Day of week, local start/end time, effective start/end dates.
- More than one session per day is allowed; overlapping sessions for the same doctor are rejected.
- Hospital timezone: `Africa/Cairo`.

### Schedule exceptions

- Doctor, local date, affected rule/session where applicable.
- Type: cancel, replace, or add session; replacement/addition hours as needed.
- Internal reason and optional approved public notice.

Exceptions override recurring rules. Store dated confirmed appointment timestamps with timezone information. Do not hard-code Cairo’s UTC offset. Editing a rule must flag affected confirmed bookings for staff review rather than move them automatically.

### Bookings

- ID, public reference, creation/update timestamps, submission language.
- Patient name, mobile number, source: `website`, `walk_in`, or `phone`.
- Requested department, doctor, preferred date/session: nullable.
- Confirmed department, doctor, date, and appointment time or session window: separate from requested fields.
- Status, assigned staff user, and optional quoted fee later if approved.
- Duplicate-submission key for safe client retries.

Website requests require a name and valid mobile number. For manual walk-ins, allow an explicitly missing phone instead of a fabricated number. Do not create patient accounts or attempt to merge different people solely because they share a phone number.

### Booking events

- Booking ID, actor, timestamp, event type, and relevant old/new values.
- Events include creation, staff assignment, contact attempt, confirmation, rescheduling, cancellation, completion, and internal notes.
- Restrict patient notes and details to call center/admin. Avoid copying them into general audit logs.

### Notification jobs

- Booking ID, notification type, delivery status, attempt count, next retry time, and provider result.
- Create the new-request notification job in the same database transaction as the booking.
- A worker sends staff email and retries temporary failures. Email failure must not lose or roll back a saved request.

## 4. Homepage hero form

```text
Request an appointment

Department                   Doctor
[Help me choose          ▾]  [Any suitable doctor     ▾]

Your name*                   Mobile number*
[                         ]  [                         ]

[ Request an appointment ]
Our team will call you to confirm your appointment.
```

### Behavior

1. Load published departments; load eligible doctors when a department is selected.
2. Department is optional; “Help me choose” submits no department preference.
3. Doctor is optional. In the hero, enable doctor selection after a department is chosen.
4. Changing department clears an incompatible doctor selection.
5. Submit name, mobile, optional department/doctor, and locale.
6. Save the request and notification job, then return the reference.
7. Replace the form with an inline success message. Keep the patient on the homepage.

Do not add date/time fields to the hero in the initial release. Retain optional preference fields in the data model for a later detailed request form or staff entry. A doctor-profile booking action can preselect the doctor; if they have several departments, select the page context or let staff resolve the department rather than guessing.

**English success:** “Your request has been received. Our call-center team will contact you to confirm your appointment. Reference: …”

**Arabic success:** “تم استلام طلبك. سيتواصل معك فريق مركز الاتصال لتأكيد الموعد. رقم الطلب: …”

Keep entered values on submission errors, show localized field feedback, and prevent repeat clicks during submission. Server validation must recheck doctor eligibility and department membership. If a selected doctor becomes unavailable, ask the patient to choose again or submit without a doctor; do not silently change the preference.

## 5. Dashboard operation

### Navigation

```text
Dashboard
├── Overview — new requests and today's appointments
├── Bookings
│   ├── Incoming requests
│   ├── All bookings / daily appointment list
│   ├── Add walk-in or phone entry
│   └── Booking detail and follow-up history
├── Departments — list / add / edit
├── Doctors — list / add / edit / department links
├── Clinic schedules — weekly rules and dated exceptions
└── Administration — notification recipients and delivery failures
```

### Online request flow

`requested → confirmed → completed or no_show`

Call center/admin may decline a requested booking, or cancel a requested/confirmed booking. Rescheduling updates the agreed appointment and appends an event; it is not a terminal status. Record unanswered calls as follow-up events while the request remains requested.

To confirm, staff select the actual doctor, department, and agreed date/time or clinic session. The dashboard checks schedule exceptions and displays existing appointments for the same doctor. Require an explicit recorded override for appointments outside the published schedule. Use version checks to prevent one operator overwriting another operator’s edits.

The dashboard is the authoritative appointment list across all channels. Whether staff assign an exact time or a place in a session queue still needs an operational decision. Do not describe a session as having unlimited or guaranteed capacity; define the clinic’s capacity rule before accepting confirmed appointments in production.

### Manual walk-ins

Staff select source `walk_in`, enter patient details and the actual doctor/session, and save as confirmed when the visit is already accepted. They can then mark completed or no-show as appropriate. Phone entries use the same form with source `phone` and can begin as requested or confirmed.

### Permissions

- **Marketer:** manages bilingual department/doctor content and publication. No patient data access.
- **Call center:** manages schedules, exceptions, requests, manual appointments, assignments, and follow-up.
- **Admin:** all of the above, plus staff access and notification configuration.

Enforce permissions on backend endpoints as well as dashboard navigation. Keep doctor biography editing and schedule operations distinct even if both are reachable from a doctor detail screen.

## 6. API outline

Use the existing `/v1` backend convention. The following are proposed contracts, not existing endpoints.

- Public department listing and detail, returning only published content.
- Public doctor listing/detail, with department filter and localized content.
- Public schedule summary for a doctor, including applicable exceptions; no live availability claim.
- `POST /v1/booking-requests`: minimal validated request; returns reference and receipt message, no patient record lookup.
- Protected `/v1/bookings`: list/filter and create manual entries.
- Protected `/v1/bookings/:id`: details and controlled updates, including expected record version.
- Protected booking-event actions for contact notes, assignment, and status changes.
- Protected department/doctor content management and schedule/exception management.
- Admin notification delivery status/retry endpoints.

Use pagination, phone normalization, server-side length limits, abuse controls, and idempotent submission. A public reference is not authentication: do not expose patient details through reference-only lookup.

## 7. Fit with the current project

The inspected repository already has users, audit logs, media, contact submissions, and FAQs. Bookings still point to a dashboard placeholder. Preserve the ongoing contact and localized website work while adding these modules.

- **Backend:** add Drizzle records/migrations, Zod schemas, Hono routes, access checks, booking events, and an email delivery worker.
- **Dashboard:** replace the booking placeholder; add doctor, department, schedule, and notification screens using existing application patterns.
- **Next.js website:** connect the bilingual hero form to real department/doctor data and the request endpoint; reuse the form from doctor/department entry points.
- **Contact submissions:** retain general inquiries as contact submissions. For appointment-specific contact entries, provide an explicit staff conversion action linking to one booking, or direct new appointment inquiries to the hero form. Do not leave appointment operations split across unrelated queues or silently reinterpret old messages.

## 8. Build order and completion checks

### Phase 1 — departments and doctors

Implement database records, protected management APIs, dashboard editors, publication states, and public listings. Staff enter approved Arabic/English information.

**Complete when:** one doctor can appear in two departments without duplication; archived/unpublished records are excluded from request choices; marketer APIs cannot read patient data.

### Phase 2 — booking request and hero

Implement booking records/events, minimal submission endpoint, dependent hero selectors, inline receipt, incoming-request list, and staff email jobs. Configure the staff mailbox and provider credentials during setup.

**Complete when:** Arabic and English submissions appear once in the dashboard; repeated submission retries do not duplicate the booking; staff email failure leaves a saved request and a retryable job.

### Phase 3 — schedules and staff appointment handling

Add recurring rules, exceptions, confirmation, assignment, contact history, rescheduling, manual walk-ins/phone entries, and daily appointment views. Agree fixed-time versus session-queue handling and capacity rules with the call center.

**Complete when:** staff can turn a request into a confirmed visit, manually register a walk-in, see conflicts/exceptions, and review the full history. Concurrent edits must not silently overwrite each other.

### Phase 4 — launch checks

Check mobile hero usability, Arabic RTL, keyboard access, field errors, rate limiting, backend role enforcement, notification recovery, and backup/restore procedures. Run an end-to-end rehearsal with marketer and call-center staff using sample patient details.

**Complete when:** both public submission and staff completion work end to end, and the call center knows how to handle unanswered requests and email failures.

## 9. Decisions that remain

- Staff notification mailbox and email provider configuration.
- Call-center response hours and expected callback time for public copy.
- Exact-time appointments versus session queues, and capacity/override rules.
- Public fee display, deferred without blocking the request form.

Start with departments and doctors, then connect the hero to a working request queue. Schedules support staff confirmation; they do not need to add steps to the homepage form.
