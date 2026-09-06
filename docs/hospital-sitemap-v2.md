# ABC Hospital — sitemap and confirmed first-release scope

Date: 6 September 2026. This is a new plan based on the latest answers. The original `hospital-website-modules.md` remains unchanged.

## 1. Scope based on your answers

- **One branch:** one hospital location/contact page; no branch directory or branch selector.
- **Appointment contact requests:** the patient submits a request, sees a receipt confirmation, and the request appears in the dashboard. Staff receive an email notification.
- **Dashboard is the booking system:** staff manage online requests and manually register walk-ins. A manual phone-booking entry is also proposed to keep appointments together.
- **Operators:** call-center users and admins handle requests and appointments.
- **Fees:** undecided. Omit public prices from the first release until the hospital decides; no payment flow.
- **التعاقدات:** a reference directory of insurance/corporate partners only. No eligibility checking, approval workflow, or contract uploads.
- **Content:** both medical articles and hospital news, with simple moderated public comments.
- **Content ownership:** the marketer manages Arabic/English content, publishing, and comment moderation. No separate reviewer account/workflow is required.
- **Patient flow:** submit a request and receive an on-screen confirmation message. No patient accounts, payments, or live slot reservations.
- **Migration:** hospital staff supply and enter existing content. Development provides the editing tools and redirect support if staff supply old URLs.

The routes below are proposed names. The same public structure exists in Arabic and English.

## 2. Public website sitemap

```text
ABC Hospital
├── /                                  → language entry / redirect
├── /ar/                               → Arabic website (RTL)
└── /en/                               → English website (LTR)
    │
    ├── Home                           /{lang}
    │   ├── Hospital introduction
    │   ├── Featured departments and doctors
    │   ├── Selected services
    │   ├── Latest articles and news
    │   └── Request appointment / call hospital actions
    │
    ├── About the hospital             /{lang}/about
    │   ├── Hospital overview
    │   └── Facilities and verified credentials
    │
    ├── Departments                    /{lang}/departments
    │   └── Department details         /{lang}/departments/{slug}
    │       ├── Overview and services
    │       ├── Related doctors
    │       └── Request appointment action
    │
    ├── Medical services               /{lang}/services
    │   └── Service details            /{lang}/services/{slug}
    │       ├── Description and patient information
    │       └── Related department / contact action
    │
    ├── Doctors                        /{lang}/doctors
    │   ├── Search by name / filter by department
    │   └── Doctor profile             /{lang}/doctors/{slug}
    │       ├── Biography and qualifications
    │       ├── Department and clinic schedule
    │       └── Request appointment action
    │
    ├── Request an appointment         /{lang}/appointment-request
    │   ├── Patient contact details
    │   ├── Department / optional doctor
    │   ├── Preferred date or clinic session
    │   └── Request received           → success state after submission
    │
    ├── Medical articles               /{lang}/blog
    │   ├── Category filter
    │   └── Article                    /{lang}/blog/{slug}
    │       ├── Article content and related content
    │       ├── Approved comments
    │       └── Submit comment          → awaiting moderation message
    │
    ├── Hospital news                  /{lang}/news
    │   └── News post                  /{lang}/news/{slug}
    │       ├── News content
    │       ├── Approved comments
    │       └── Submit comment          → awaiting moderation message
    │
    ├── Agreements — التعاقدات         /{lang}/insurance
    │   └── Partner names and logos     → directory, no partner detail required
    │
    ├── Frequently asked questions     /{lang}/faq
    ├── Contact and location           /{lang}/contact
    │   ├── Address and map link
    │   ├── Phone and approved contact channels
    │   └── Hospital / clinic hours
    │
    ├── Privacy policy                 /{lang}/privacy
    ├── Appointment request policy      /{lang}/appointment-policy
    └── Not found                      → localized 404 state
```

`{lang}` means `ar` or `en`; `{slug}` identifies a doctor, department, service, or post. Indented items without a route are page sections, filters, or interaction states, not additional pages. Services, FAQs, and policy pages are proposed supporting pages carried over from the original plan.

**Suggested main navigation:** Home · About · Departments · Doctors · Articles & News · التعاقدات · Contact. Keep “Request an appointment” as a prominent button and the language switch available throughout. Services can sit under Departments; FAQs and policy links can sit in the footer.

## 3. Staff dashboard sitemap

Routes are relative to the staff dashboard application, separate from public website routes. Arabic/English content is edited within each record; it does not require two dashboards.

```text
Staff dashboard
├── Login                              /login
└── Dashboard                          /
    ├── Overview
    │   ├── New requests awaiting action
    │   ├── Today's appointments
    │   └── Pending comments (marketer/admin only)
    │
    ├── Requests and appointments      /bookings
    │   ├── Online requests            → filtered list
    │   ├── Calendar / daily list      → appointment view
    │   ├── Add manual entry           /bookings/new
    │   │   └── Walk-in / phone source
    │   └── Booking details            /bookings/{id}
    │       ├── Patient contact and requested visit
    │       ├── Assign / contact / confirm
    │       ├── Reschedule / decline / cancel
    │       ├── Complete / mark no-show
    │       └── Internal notes and change history
    │
    ├── Clinic schedules               /schedules
    │   ├── Doctor attendance sessions
    │   └── Leave / canceled / extra sessions
    │
    ├── Doctors                        /doctors
    │   ├── Add doctor                 /doctors/new
    │   └── Edit / publish / archive    /doctors/{id}
    │
    ├── Departments                    /departments
    │   ├── Add department             /departments/new
    │   └── Edit / publish / archive    /departments/{id}
    │
    ├── Services                       /services
    │   ├── Add service                /services/new
    │   └── Edit / publish / archive    /services/{id}
    │
    ├── Content                        /content
    │   ├── All posts                  /content/posts
    │   │   ├── Medical articles       → type filter
    │   │   ├── Hospital news          → type filter
    │   │   ├── Add post               /content/posts/new
    │   │   └── Edit / preview / publish /content/posts/{id}
    │   ├── Comments                   /content/comments
    │   │   └── Pending / approved / rejected
    │   ├── Categories                 /content/categories
    │   └── Website pages              /content/pages
    │       └── Home / about / contact / FAQ / policies
    │
    ├── Agreements directory           /insurance
    │   ├── Add partner                /insurance/new
    │   └── Edit / activate / archive   /insurance/{id}
    │
    ├── Media library                  /media
    ├── My profile                     /profile
    │
    └── Administration
        ├── Staff users and roles      /users
        ├── Site settings              /settings
        │   ├── Hospital contact details
        │   └── Staff notification email recipients
        ├── Notification delivery      /notifications
        │   └── Email failures / retry status
        └── Audit logs                 /audit-logs
```

**Access proposal:** call center handles bookings and clinic schedules; marketer handles public content, doctor biographies, directories, media, and comments; admin has access to all areas and staff settings. Enforce these permissions in the API. Marketers should not receive patient request details just because they can edit doctor profiles.

## 4. Request and appointment workflow

```text
Patient submits appointment contact request
└── Backend validates and saves request
    ├── Website shows “Request received” + reference
    ├── Dashboard shows a new request
    └── Staff email notification is queued
        └── Call center opens dashboard and contacts patient
            ├── Confirm → enter agreed appointment date/time or session
            │   ├── Completed
            │   ├── No-show
            │   └── Rescheduled / canceled
            └── Decline or cancel → record reason internally

Walk-in arrives / patient calls
└── Call center or admin creates manual entry
    ├── Set source: walk_in / phone
    ├── Record doctor, contact details, and actual visit/session
    └── Track through the same appointment workflow
```

**Receipt confirmation is not appointment confirmation.** Proposed on-screen copy:

> Your request has been received. Our call-center team will contact you to confirm the appointment. Reference: ABC-…

> تم استلام طلبك. سيتواصل معك فريق مركز الاتصال لتأكيد الموعد. رقم الطلب: ABC-…

The dashboard is the authoritative record for all online and manually entered appointments. Public clinic schedules describe attendance; patients are not reserving live slots. Staff review existing appointments before confirming another visit. The fixed-time versus session-queue rule remains an operational detail to agree before implementation.

**Minimum request fields:** patient name, mobile number, department, optional doctor, and preferred date/session. Add an optional short note only if useful; do not require an account, patient email, payment, or document upload.

**Proposed statuses:** requested, confirmed, declined, cancelled, completed, no-show. Record attempts to contact the patient and rescheduling as history events. Manual entries can start as confirmed when the visit is already agreed; do not invent a phone number for a walk-in if none is supplied.

### Email behavior

- Send staff an email for each new online request, containing its reference and a secure dashboard link. Keep patient details in the protected dashboard.
- Save the request before attempting email delivery. If email fails, the request remains visible, and the system retries delivery and records failures for admin attention.
- Protect duplicate submissions so a retry does not create duplicate requests or duplicate notification jobs.
- The exact recipient mailbox is still needed for configuration.
- Patient email, SMS, and WhatsApp automation are not included now. A dashboard count/list of new requests and staff email are sufficient for this release.

## 5. Simple public comments

Use the same comment feature for articles and news, with a per-post enable/disable setting.

```text
Reader enters display name and comment
└── Submit
    └── Pending moderation (not publicly visible)
        └── Marketer reviews
            ├── Approve → publish under the post
            └── Reject / remove → keep off the public page
```

Keep comments flat: no accounts, nested replies, likes, ratings, or attachments in the first release. Include spam protection, safe text rendering, and the ability to remove an approved comment. Explain that comments are public and are not an appointment or medical-emergency channel. Marketer can publish content directly; internal medical accuracy checks are the hospital’s responsibility, without a separate application approval role.

## 6. Implementation boundaries and remaining details

Build this within the existing Next.js website, Hono/PostgreSQL backend, and React dashboard. The routes above describe planned features; they do not imply those features already exist.

**Included:** bilingual public content, single-location information, doctor directory and clinic schedules, request submission, staff-managed appointments and manual walk-ins, staff email notification, articles/news with moderated comments, reference-only agreements, and staff content entry tools.

**Deferred:** public fees until decided; patient accounts; online payments; live slot inventory; automatic patient reminders; insurance eligibility/claims; medical records; multi-branch management.

**Still needed during setup:** staff notification email address, call-center response hours, session/appointment scheduling rules, hospital-supplied content and policies, and any old URLs requiring redirects. None of these changes the sitemap structure above.
