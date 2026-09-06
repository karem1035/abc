# ABC Hospital website — modules and implementation plan

Prepared: 6 September 2026. This is a proposed scope for discussion, not a list of approved hospital requirements or completed features.

## 1. Recommended scope

The website should help a patient understand the hospital, find the right specialty and doctor, check practical information, and request an appointment. Staff need a dashboard to keep that information accurate and handle requests.

**Main modules for the first release:**

1. Arabic / English content and navigation.
2. Hospital pages, contact details, and location.
3. Departments / specialties and medical services.
4. Doctor directory and doctor management.
5. Clinic schedules and appointment requests.
6. Reception / call-center booking management.
7. Consultation fee management, with public display configurable.
8. Blog / medical articles and hospital news.
9. Insurance and corporate agreements — التعاقدات.
10. Staff dashboard, permissions, media library, and publishing controls.
11. Search visibility, accessibility, performance, and operational safeguards.

**Optional modules:** live slot reservations, public comments, patient accounts, online payments, automated reminders, offers and packages, reviews, careers, advanced reporting, and integrations with hospital systems.

“Main” means recommended for this project. Some items, especially insurance and fee display, depend on what ABC actually offers. A public hospital website does not automatically require medical records, inpatient management, pharmacy inventory, or a full hospital management system.

## 2. What the references show

- **Andalusia:** navigation includes branches, doctors, services, offers, a blog, news, home care, contact information, and FAQs. This supports a content structure connecting doctors, services, and patient information. [Andalusia website](https://andalusiaegypt.com/)
- **Seashell:** presents specialties, medical articles, news, insurance companies, facilities, and reservations. Its booking form includes department, doctor, date/time, and insurance fields. The visible form does not establish whether appointments are reserved live or confirmed by staff. [Seashell website](https://www.seashellhospital.com/), [reservation form](https://www.seashellhospital.com/Reservations/Create)
- **Elite:** emphasizes specialized centers, doctor search, bookings, programs, and تعاقدات. Its insurance page offers an inquiry about agreements or approval. [Elite website](https://www.elitehospital.org/), [insurance / agreements page](https://www.elitehospital.org/Insurance?culture=ar)
- **ABC current website:** the supplied address could not be retrieved through the research tool, and the search returned no results. Its current content and features are therefore unverified. Migration needs a separate content inventory once access is available. [Supplied ABC address](https://abchospital.com/)

These observations describe visible pages, not the references’ internal software or booking logic. The implementation below is a proposal for ABC.

## 3. Current project and what we can reuse

The current repository has three applications:

- `apps/website`: Next.js App Router public website; the inspected homepage is currently a scaffold.
- `apps/backend`: Bun + Hono API, Zod validation, Drizzle, and PostgreSQL. The inspected schema contains users, audit logs, and media.
- `apps/dashboard`: React + Vite staff dashboard. User management, profiles, and audit-log routes exist; bookings and content currently point to placeholders.

Existing staff roles are `admin`, `call_center`, and `marketer`. We should extend this structure instead of introducing another CMS by default. Existing scaffolding is a starting point, not evidence that the proposed hospital modules are implemented or production-ready.

The older Astro project contains localized homepage, doctor listing/detail, and blog listing/detail page files. Review their design, assets, and content for reuse. Astro page templates need conversion to Next.js; React components may be reusable after checking their dependencies. Do not assume the old project’s data or integrations are complete.

## 4. Main modules

### 4.1 Arabic / English — العربية والإنجليزية

**What it serves:** lets patients use the entire journey in their preferred language, including doctor information, forms, validation messages, and booking updates.

**How it works:** visitors switch between matching Arabic and English pages. Arabic uses right-to-left layout; English uses left-to-right. Names, descriptions, article bodies, metadata, and image descriptions have separate translations. Doctor identity, schedule, price, and booking capacity remain shared across languages.

**Dashboard:** editors can see which translations are missing and publish each language deliberately. Machine-generated medical content should not be published without hospital review.

**How we build it:** locale routes such as `/ar/doctors` and `/en/doctors`, translated interface dictionaries, and database translation records keyed by entity and locale. Use a stable entity ID to connect translated URLs. Store language-specific publishing status; if a translation is unavailable, show a clear unavailable state or route to its language’s listing instead of silently presenting mixed-language content.

**Done when:** a patient can browse and submit a booking in either language, and changing languages preserves the corresponding page where a translation exists.

### 4.2 Hospital information, homepage, and contact

**What it serves:** establishes trust and answers “Where is the hospital, what does it offer, and how do I reach it?”

**Public pages:** homepage, about, facilities/accreditations where verified, contact/location, FAQs, and hospital-approved privacy and booking policies. Include visitor information and opening hours. Display emergency contact information only as supplied by the hospital; appointment requests should clearly state they are not an emergency channel.

**Dashboard:** staff edit structured sections, phone numbers, addresses, map links, banners, featured departments, and featured doctors. Avoid a fully general page builder in the first release.

**How we build it:** reusable Next.js page sections backed by page content and site settings. Model at least one location; expose a branch selector only if ABC actually has multiple branches. Keep clinic opening hours separate from hospital or emergency opening hours.

**Done when:** staff can update contact information once and it updates everywhere it is displayed.

### 4.3 Departments, specialties, and services — الأقسام والتخصصات والخدمات

**What it serves:** helps a patient who knows their need but does not know a doctor’s name.

**The distinction:** a department/specialty describes an area of care, such as cardiology. A service describes something offered, such as an echocardiogram. A specialized center can group several specialties, but should only be added if it reflects ABC’s actual organization.

**Patient flow:** choose a department → read its overview and services → view related doctors → request an appointment. Services without a specific doctor can lead to an inquiry form instead.

**Dashboard:** create, edit, reorder, publish, and archive departments and services; manage translations, images, and relationships to doctors.

**How we build it:** separate department and service records, translation records, and doctor-to-department relationships. Start with one department taxonomy unless the hospital needs separate organizational departments and searchable specialties.

**Done when:** doctor and service listings stay consistent after a department changes, and archived departments cannot receive new requests accidentally.

### 4.4 Doctors — directory and CRUD

**What it serves:** helps patients choose a suitable doctor and gives staff one place to maintain accurate profiles. CRUD means create, read, update, and delete; for doctors with appointment history, use archive/deactivate instead of permanent deletion.

**Public profile:** name, photograph, professional title, specialty, biography, qualifications approved by the hospital, languages spoken, clinic location, schedule, optional consultation fee, and booking button. Search by Arabic/English name and filter by specialty; add branch filters if needed.

**Dashboard:** staff create and edit profiles, connect departments and clinic locations, manage publication, assign schedules and fees, and deactivate doctors who leave.

**How we build it:** doctor records plus translations and relationships to departments and clinic assignments. Separate a public doctor profile from a staff login: a doctor does not need a website account just to be listed.

**Done when:** a profile change appears on its detail page and related listings, while deactivating a doctor preserves previous booking records and prevents new requests.

### 4.5 Availability, schedules, and time slots

**What it serves:** tells patients when a doctor normally attends and, if supported operationally, which appointments remain available.

These are different concepts:

- **Schedule:** recurring attendance, such as Sunday and Tuesday, 6–9 PM.
- **Exception:** leave, holidays, a canceled session, or an extra clinic session.
- **Slot:** an individual appointment, such as 6:00–6:20 PM.
- **Availability:** whether that slot still has capacity after reservations and exceptions.

**Dashboard:** authorized staff manage weekly schedules, effective dates, exceptions, visit duration, breaks, and booking limits. A schedule belongs to a doctor at a particular clinic/location and may depend on appointment type.

**Recommended first release:** display maintained clinic sessions and let patients request a preferred date/session. Do not label these as guaranteed available slots. Reception confirms the actual appointment.

**How we build it:** recurring schedule rules and dated exceptions. Use `Africa/Cairo` for clinic scheduling and timezone-aware appointment timestamps; do not hard-code a UTC offset. Schedule changes affecting existing bookings must surface a staff action list rather than silently moving patients.

**Done when:** leave overrides the recurring schedule, past sessions cannot be requested, and existing appointments remain visible after a schedule edit.

### 4.6 Booking requests and reception management

**What it serves:** converts interest into an appointment and gives reception a reliable work queue.

**Recommended patient flow:**

1. Select department, doctor if applicable, and preferred date/session.
2. Enter patient name and mobile number; email is optional unless a chosen communication method requires it.
3. Optionally select insurer and visit type. Collect additional personal information only when the hospital needs it.
4. Submit and receive a reference number with a clear “request received, awaiting confirmation” message.
5. Reception checks the actual clinic calendar, contacts the patient, and confirms or proposes an alternative.

**Dashboard:** filter by date, doctor, and status; assign requests to staff; add internal notes; confirm, decline, cancel, reschedule, or mark completed/no-show. Log who changed what and when. Allow reception to record phone bookings too.

**Proposed statuses:** `requested`, `confirmed`, `declined`, `cancelled`, `completed`, and `no_show`. Record rescheduling as a history event with old and new appointment details.

**How we build it:** a validated public API creates requests; protected staff APIs manage the queue and transitions. Store booking events and a stable reference. Protect submissions against spam and duplicate retries. Public confirmation pages must not expose another patient’s booking through a predictable reference alone.

**Operational dependency:** agree who owns the queue, response hours, expected response time, and the authoritative clinic calendar. If reception confirms appointments using a separate hospital system, the website must not claim to know live availability.

**Done when:** a submitted request appears in the dashboard, staff can follow it through to an outcome, and the patient sees truthful status wording.

### 4.7 Consultation fees — costs

**What it serves:** sets patient expectations and gives reception consistent price information.

**Recommendation:** include fee management, but make public display a hospital decision. Support a fixed fee, an approved “from” price, or “contact us.” Do not treat a consultation fee as the price of tests, procedures, or treatment.

**Dashboard:** maintain amount in EGP, appointment type such as first visit/follow-up, doctor/clinic, effective dates, and public visibility. Insurance-covered amounts may differ and need verification.

**How we build it:** fee records attached to a doctor’s clinic/visit type rather than one permanent price on the doctor. Use integer minor units or precise decimals for money. Save the quoted amount and currency on a booking so later price changes do not rewrite its history.

**Done when:** the website distinguishes the displayed consultation fee from insurance eligibility and any additional services. If no price is approved, it displays contact guidance rather than an invented amount.

### 4.8 Blog, medical articles, and hospital posts

**What it serves:** provides patient education and publishes hospital updates.

**Terminology:** a blog is a collection; a post is an individual entry. We do not need two unrelated systems for “blogs” and “posts.” Use one publishing module with types such as `medical_article`, `news`, and `event`, and separate public listings where useful.

**Public content:** title, introduction, body, cover image, category, author, publication/update date, and related department or doctor. Medical articles can show a hospital-approved reviewer and review date.

**Dashboard:** Arabic/English editing, preview, drafts, review, publication, archiving, categories, and search metadata. Scheduled publishing is optional. The hospital identifies who is qualified to approve medical copy.

**How we build it:** posts, translations, categories, and relationships to doctors/departments. Sanitize rich text, reuse the media library, and refresh public content after publication. Keep article comments separate from internal editor notes and booking notes.

**Done when:** unpublished drafts are not publicly accessible and each published language version has its own URL and metadata.

### 4.9 Insurance and corporate agreements — التعاقدات

**Meaning:** in this hospital context, the likely intended word is **التعاقدات**: agreements with insurance companies, employers, unions, or other organizations whose members may receive services under agreed conditions. Elite’s reference connects this section to insurance and approval inquiries. Confirm which kinds of agreements ABC means. [Elite insurance page](https://www.elitehospital.org/Insurance?culture=ar)

**What it serves:** answers “Does this hospital deal with my insurer or organization, and whom do I contact to check?”

**Public experience:** searchable partner names/logos, category, applicable branch if needed, approved explanatory text, and an inquiry contact. Appearing in the directory does not guarantee that every plan, doctor, or procedure is covered.

**Dashboard:** manage partners, active dates, public descriptions, branch relationships, logos, and inquiry routing. Keep confidential contract terms and negotiated rates out of public content.

**How we build it:** partner records and translations, with optional inquiry records. Start with a directory and inquiry channel. Uploading membership documents, automated eligibility checks, approvals, and claims processing are separate scope additions.

**Done when:** expired/inactive partners are removed from public listings and visitors are directed to verify their specific coverage with the responsible team.

### 4.10 Staff dashboard, permissions, and media

**What it serves:** allows hospital staff to operate the website without code changes.

**Proposed responsibilities using existing roles:**

- `admin`: staff accounts, permissions, site settings, and audit history; oversight of content and booking configuration.
- `marketer`: pages, doctor biographies, departments, posts, partner listings, and public media. No patient booking details by default.
- `call_center`: appointment requests, confirmations, internal booking notes, and approved schedule operations. Fee changes and content publishing need explicit assignment.

**How we build it:** extend the existing dashboard and API permissions. Enforce access on the backend, not only through hidden navigation. Add resource-level permissions if three broad roles become insufficient. Public doctor images belong in the public media library; any future patient documents need separate private storage and access controls.

**Publishing:** use draft/published/archived states for public entities, previews, validation, and audit events. Prevent deletion of media still in use or show the affected content before replacement.

**Done when:** staff can perform their assigned tasks and cannot access unrelated private data by calling the API directly.

### 4.11 Search visibility, usability, and operation

**What it serves:** helps patients discover the hospital and successfully use it on mobile devices.

**First-release requirements:** localized page titles and descriptions, canonical URLs, language alternates, sitemaps, accurate structured data where appropriate, optimized images, accessible labels, keyboard navigation, clear error states, and responsive Arabic/English layouts. Doctor search is core; full-site search is optional.

**How we build it:** reusable page metadata and form components; public content caching with refresh after edits; uncached authoritative checks for any future live reservations. Create redirects for old URLs after completing an inventory of the existing site.

**Operational baseline:** HTTPS, server validation, restricted staff access, rate limits, protected secrets, database backups with a restore check, error monitoring, and a defined retention process for booking data. Keep patient information out of public analytics and unnecessary application logs. Have the hospital approve public policies and data collection choices before launch.

**Done when:** key patient journeys work on mobile and keyboard in both languages, search engines can reach published content, and staff have a recovery process if data is lost.

## 5. Optional modules

### 5.1 Live slot booking

**Serves:** immediate reservation of an actual appointment rather than a callback request.

**Workflow:** choose doctor → fetch current availability → select slot → submit → reserve atomically → show confirmed appointment. Add temporary holds with expiry only if needed, such as during payment.

**Build:** slot inventory or capacity-aware reservation records, transactional reservation, duplicate-request protection, cancellation rules, and an authoritative calendar shared with phone and desk bookings. For capacity one, enforce one active reservation per slot; for group/session capacity, enforce the configured count atomically. Test two patients attempting the final slot at the same time.

**Add when:** the hospital can maintain reliable capacity across every booking channel. Define whether visits use fixed times or a session queue before implementing.

### 5.2 Public post comments

**Serves:** discussion underneath articles; this is distinct from a private inquiry or a review of a doctor.

**Workflow:** visitor submits → comment enters moderation → staff approve/reject → only approved text is published. Provide reporting/removal controls and explain that comments are public.

**Build:** comment records linked to posts, moderation status, spam controls, sanitized text, and a moderator queue. Keep contact details private. Discourage posting medical records or urgent medical questions.

**Recommendation:** leave disabled at launch unless ABC assigns someone to moderate. If comments are explicitly required, budget the moderation workflow as part of the module.

### 5.3 Patient accounts and self-service

**Serves:** viewing appointments and requesting cancellation/rescheduling without calling reception.

**Build:** verified patient authentication, strict ownership checks, appointment history, session management, and recovery flows. A secure expiring management link can provide limited self-service before building full accounts.

**Dependency:** decide how a parent or caregiver books for another person. An appointment account does not automatically include medical records or test results.

### 5.4 Online payments and deposits

**Serves:** collecting approved consultation deposits or package payments.

**Build:** a chosen payment provider, payment records separate from booking status, signed and idempotent webhook processing, reconciliation, receipts, and cancellation/refund handling. Confirm payment from the backend/provider, not the browser redirect.

**Dependency:** approved prices, refund rules, and a defined response when payment succeeds but an appointment can no longer be fulfilled.

### 5.5 Automated SMS, WhatsApp, or email

**Serves:** confirmation, reminders, cancellations, and rescheduling updates.

**Build:** a provider integration, bilingual templates, a background delivery queue, retry controls, delivery history, and permitted contact preferences. Provider setup and message charges are additional operating costs.

**Dependency:** correct booking statuses and contact information. A failed notification must not silently undo a confirmed booking; surface failures to staff.

### 5.6 Offers, packages, and special programs

**Serves:** promotes check-up bundles, seasonal offers, home care, or medical tourism if ABC provides them.

**Build:** a content type with inclusions, exclusions, eligibility, approved price, valid dates, related services, and an inquiry/booking action. Automatically stop promoting expired offers.

**Dependency:** an owner who keeps terms and availability accurate. Do not advertise reference hospitals’ programs as ABC services without confirmation.

### 5.7 Reviews and testimonials

**Serves:** publishes patient feedback with permission.

**Build:** initially use hospital-approved testimonials with consent records and moderation. Open star ratings require additional verification, abuse handling, and publication rules.

**Dependency:** a defined approval/removal process. This is separate from article comments.

### 5.8 Careers

**Serves:** advertises open roles and routes applicants to HR.

**Build:** job listings, closing dates, and applications or a link to the hospital’s recruitment system. If CV uploads are included, use private storage, restricted HR access, and retention rules.

**Dependency:** an HR owner and permissions beyond the current content/booking responsibilities.

### 5.9 Advanced analytics and reporting

**Serves:** shows which departments attract interest and how requests turn into completed appointments.

**Build:** aggregate dashboard counts, booking outcome reports, and privacy-conscious conversion events. Define “request,” “confirmed booking,” and “completed visit” separately so reports are meaningful.

**Dependency:** consistent staff status updates. Restrict exports containing patient information.

### 5.10 Hospital-system integration and patient portal

**Serves:** synchronizes doctor schedules and appointments with an existing hospital information system; a later patient portal may expose approved results or documents.

**Build:** only after inspecting the actual vendor API, access arrangements, source-of-truth rules, identity matching, and failure/reconciliation handling. Medical records and result delivery require a separately scoped access and privacy design.

**Dependency:** vendor cooperation and a test environment. This can be substantially larger than the public website itself.

### 5.11 Other additions if justified

- **Full-site search:** index published localized doctors, services, and articles; provide grouped results. Add when navigation and doctor filters are insufficient.
- **Virtual tour / gallery:** curated media with captions and optimized loading; useful when facilities are a major differentiator.
- **Waitlist:** capture interest when a clinic is full, then let reception offer released appointments; add automated offers only after reservation rules exist.
- **Live chat:** route visitors to staffed support with response hours and transcript access rules; do not imply around-the-clock support unless provided.

## 6. Proposed data relationships

This is a conceptual model, not a migration specification.

- A **location** has clinic assignments, contact details, and opening hours.
- A **department** has related services and doctors.
- A **doctor** can belong to several departments and practice at several clinics.
- A **doctor clinic assignment** has schedules, exceptions, visit types, and fees.
- A **booking request** records the requested department/doctor/session and patient contact details; a confirmed appointment also records its agreed time and location.
- A **booking event** records status changes, assignment, and rescheduling history.
- A **post** has translations, a type, categories, authors/reviewers, and optional related doctors/departments.
- An **insurance/corporate partner** has public information and optional location relationships.
- A **media item** is referenced by public content; patient uploads, if introduced, are separate private assets.
- A **staff user** has permissions and produces audit events.

Keep schedules and appointment inventory shared between Arabic and English. Translate presentation, not the underlying appointment.

## 7. How we will implement it in this repository

### Stage 1 — confirm operations and prepare content

Collect the approved hospital name, branding, locations, doctors, specialties, clinic schedules, fee policy, insurance partners, and Arabic/English copy. Identify content reviewers and the booking team. Inventory the old website’s URLs and assets when available.

Decide whether the first release uses appointment requests or live reservations. **Recommended assumption: reception-confirmed requests.** This makes the first release useful without promising availability the hospital cannot keep synchronized.

### Stage 2 — content foundation

Extend the backend schema/API and dashboard for locations, departments, services, doctors, partners, posts, settings, and translations. Reuse existing authentication, audit, and media foundations after checking them. Add publication controls and backend permissions.

Build the Next.js bilingual layout, navigation, homepage, directory pages, detail pages, contact pages, and articles. Reuse suitable visual assets/components from the Astro attempt after review.

### Stage 3 — operational booking flow

Add schedules and exceptions, fee configuration, the request form, reception queue, assignment, status changes, and booking history. Test the entire Arabic and English journey with the people who will handle real requests.

### Stage 4 — launch verification

Review medical copy and translations, confirm current schedules and partner lists, test permissions and submission abuse controls, check mobile/keyboard use, configure metadata and redirects, and verify backups and monitoring. Train staff and agree who handles requests during absences.

### Stage 5 — optional expansion

Add live slots only after defining the authoritative calendar and capacity rules. Add reminders, payments, patient self-service, or integrations according to hospital priorities. Public comments can be enabled independently once moderation is staffed.

## 8. Decisions to get from the hospital before estimating

1. Is there one branch or several? What are the actual departments, clinics, and specialized centers?
2. Does booking mean a callback request, a guaranteed fixed-time appointment, or a place in a clinic session queue?
3. Is there an existing booking system? Who updates schedules, and how are phone/walk-in bookings recorded?
4. Who confirms requests, during what hours, and within what expected response time?
5. Should consultation prices be public? Do first visits, follow-ups, branches, and insurance arrangements have different fees?
6. Does التعاقدات mean an insurer/company directory only, or also eligibility inquiries, approval documents, and claims?
7. Are “posts” medical articles, hospital news, or both? Are public comments actually required?
8. Who supplies and approves Arabic/English content and medically reviews articles?
9. Are patient accounts, online deposits, and automated notifications required for launch or later?
10. What content and URLs must move from the current website, and who can provide access?

Until answered, the proposed first release is a bilingual hospital website with managed content, doctor schedules, optional public fee display, an agreements directory, and reception-confirmed booking requests. Exact-time reservations and the other optional modules are separate scope choices.
