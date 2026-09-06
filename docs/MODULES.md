# ABC Hospital Website — Modules Breakdown

Bilingual (AR/EN, RTL-aware) hospital website built with Next.js (App Router). This document defines every module: what it is, how it serves the hospital and its patients, and how we will build it.

Reference sites studied: [andalusiaegypt.com](https://andalusiaegypt.com/), [seashellhospital.com](https://www.seashellhospital.com/), [elitehospital.org](https://elitehospital.org/), plus the current abchospital.com.

> **Note on "التعقادات":** this is almost certainly **التعاقدات (Contracts)** — the insurance companies & corporate agreements module. Covered in Module 7.

---

## Core Modules (MVP — must ship)

### 1. Home Page
**What:** The landing experience: hero, quick actions (Book / Find a Doctor / Hotline call), featured departments, featured doctors, latest news/offers, about strip, branches/locations, footer with contact & social links.

**Serves:** First impression and route-to-task. Most visitors arrive here and need one of three things: book, find a doctor, or call. Every section links deeper into a module.

**How we build it:** A composable page of section components (the old Astro project's `components/sections` pattern ports directly to React server components). Most blocks are CMS-driven (featured entities selected in the dashboard) with static fallbacks. Hotline/WhatsApp floating buttons site-wide.

### 2. Departments / Specialties
**What:** A directory of medical departments (Cardiology, Orthopedics, Pediatrics, … — the references list 25–30). Each has a detail page: description, subspecialties, featured doctors in that department, related services, and a "Book in this department" CTA.

**Serves:** The primary organizational axis of the hospital. Patients browsing "what do you treat?" and search engines indexing specialty keywords. Feeds filters in doctor search and booking.

**How we build it:** `departments` collection (AR/EN fields, slug, image, icon, SEO fields, sort order, active flag). Public pages at `/departments` and `/departments/[slug]`, rendered per-locale. Dashboard CRUD. Department ↔ doctor many-to-one relation powers filtering everywhere.

### 3. Doctors Directory (CRUD)
**What:** Full doctor profiles: name (AR/EN), photo, title/degree, department, subspecialty tags, bio, languages, and per-doctor booking. Searchable and filterable by department and name.

**Serves:** The #1 researched page on hospital sites. Patients choose a doctor before choosing a hospital. Elite's doctor-search-by-specialty is their strongest feature — we match it.

**How we build it:** `doctors` collection in the dashboard with full CRUD (media upload for photos, department relation, tags). Public: `/doctors` with search + filters (server-side filtering via search params), and `/doctors/[slug]` profile pages. Featured-doctors carousel on home. Doctor profile links directly into the booking flow with the doctor preselected.

### 4. Appointments / Booking (with availability, slots & costs)
**What:** The end-to-end booking flow:
1. Pick department → doctor (or doctor directly).
2. Pick a day — only days the doctor works are selectable.
3. Pick a time slot — only actually-free slots are shown.
4. Patient details (name, phone with country code, notes) → confirmation.

**Serves:** Converts website traffic into clinic visits without a call-center round-trip. This is the module with real operational complexity: doctor schedules, time slots, and optionally consultation fees.

**How we build it:**
- **Availability:** each doctor has weekly schedule rules in the dashboard (e.g. Sun/Tue/Wed 10:00–14:00) plus date overrides (vacation days, extra days). A slot generator expands rules into concrete slots (e.g. 30-min) for the next N days.
- **Slots & contention:** booked slots are hidden/disabled; a unique constraint on (doctor, date, time) prevents double-booking at submission time.
- **Costs:** optional per-doctor or per-department consultation fee shown in the flow ("consultation: 400 EGP"). Fees are display-only on the website (no online payment at MVP) — the patient pays at the hospital.
- **Delivery:** confirmation screen + WhatsApp/SMS message to the patient, and a notification (dashboard + optionally email/WhatsApp) to the hospital. Booking status can be managed in the dashboard (pending / confirmed / cancelled / completed).
- **No-login:** guest booking with phone-number identity. Optional patient accounts later (see Optional Modules).

### 5. News / Blog (AR/EN)
**What:** Articles and hospital news: medical articles, announcements, events, new services. Bilingual — each article exists as an AR version and an EN version (linked, not auto-translated).

**Serves:** SEO (the biggest organic-traffic driver for hospitals), authority/credibility, and keeping the site alive. The references all run "Media Center" / "Health Hub" style sections.

**How we build it:** `posts` collection: AR/EN title, slug, body (rich text / MDX), cover image, tags, publish date, status (draft/published), featured flag. Public listing with pagination and tag filter, detail pages at `/news/[slug]`, per-locale. Sitemap + structured data (`Article`) for SEO. Latest items feed the home page.

### 6. Branches / Locations & Contact
**What:** One page per branch (if multi-branch) with address, map, phone, working hours, and a main contact page (form → dashboard inbox, hotline, WhatsApp, social links).

**Serves:** "Where are you and how do I reach you" — heavy local-SEO value (Google Maps embeds, LocalBusiness structured data).

**How we build it:** `branches` collection (name, address AR/EN, coordinates, phones, hours). Contact form submissions stored in the dashboard (spam-protected with simple rate limiting / honeypot). Footer aggregates hotline + social everywhere.

### 7. التعاقدات — Contracts & Insurance
**What:** The insurance companies and corporate entities the hospital has agreements with: logo wall on the home/about pages plus a dedicated page listing contracted insurers, discount offers for corporate employees, and what each agreement covers if the hospital wants to publish that.

**Serves:** Patients' #1 practical question after "which doctor": *"Do you accept my insurance?"* Both Seashell and Elite feature this prominently. Also feeds B2B credibility (company contracts).

**How we build it:** `insurance-providers` collection (name AR/EN, logo, website, category: insurance/company/authority). Dashboard CRUD. Public: logos slider + `/insurance` page. Optionally each contract can carry a note (e.g. "20% off radiology for X employees"). Corporate contract requests can reuse the contact form with a "contract request" category.

### 8. About / Static Pages & Legal
**What:** About the hospital, vision/mission, chairman's message, accreditations (e.g. GAHAR), facilities/tour, FAQs, privacy policy, terms.

**Serves:** Trust and accreditation proof — hospitals sell confidence.

**How we build it:** CMS-editable generic pages (`pages` collection with AR/EN title + rich-text body, slug) so content editors manage these without deploys. Fixed nav placement.

### 9. Dashboard / Admin (already in progress)
**What:** The authenticated back-office managing everything above: doctors, departments, schedules, bookings, posts, contracts, pages, contact inbox, media library.

**Serves:** The hospital's marketing/operations team runs the whole site from here — the entire point of a CMS-backed site instead of hardcoded pages.

**How we build it:** The Next.js dashboard already started in this repo (dark sidebar, scroll areas, RTL). One resource section per collection, shared CRUD table/form patterns, roles later (see Optional).

---

## Optional / Phase-2 Modules (nice to have, scoped out of MVP)

### A. Offers & Packages
Discounted checkup packages, seasonal offers, surgery packages. **Build:** `offers` collection with validity dates; cards + detail pages; countdown/expiry handling. (Andalusia runs this; monetizes directly.)

### B. Patient Accounts / Portal
Login (phone OTP or email) so patients see their booking history and rebook in one tap; later: lab results, medical file. **Build:** auth layer on top of the phone-number identity bookings already use — the booking module's data model anticipates this. (Only Andalusia has a portal among the references.)

### C. Online Payment
Pay consultation fees online at booking (card/wallet). **Build:** integrate an Egyptian gateway (Paymob/Kashier); booking status becomes payment-gated. Defer until the hospital confirms acquiring.

### D. Careers / Recruitment
Job listings + application form (CV upload). **Build:** `jobs` collection, application records in dashboard with file attachments and status pipeline. (Seashel & Elite both have it.)

### E. Doctors' Schedules Public Display
Showing each doctor's clinic days/times on their profile even before booking. **Build:** read-only view of the availability engine from Module 4 — cheap to add once schedules exist.

### F. Medical Tourism
Dedicated funnel for international patients: packages, airport transfer, coordination form. **Build:** landing page + a specialized contact/booking form category. (Both references feature it.)

### G. Home Care / Visiting Doctors
Request a home-visit doctor or visiting-consultant announcements. **Build:** service landing page + request form into the dashboard inbox.

### H. Services / Centers Model
Beyond departments: specialized centers (Elite's "ENT Center", "Obesity Center") grouping departments, doctors, and pages under one brand. **Build:** a `centers` collection referencing departments/doctors — only if the hospital actually markets this way.

### I. Testimonials & Doctor Reviews
Patient reviews, video testimonials, before/after (cosmetic). **Build:** moderated `testimonials` collection with dashboard approval workflow. (Watch medical-advertising regulations in Egypt.)

### J. FAQ & Chatbot/WhatsApp Bot
Automated answers + WhatsApp-based booking bot. **Build:** FAQ is part of Module 8; the bot is an integration project on top of the booking API — separate phase.

### K. Multi-role Dashboard & Audit Log
Editor vs. reviewer vs. admin roles, publish approvals, change history. **Build:** RBAC in the dashboard once more than a couple of staff use it.

### L. Newsletter / Subscriptions
Email/WhatsApp list for offers and health tips. **Build:** simple subscriber collection + export; real campaigns go through a provider (Mailchimp/Brevo).

---

## Module Map (who uses what)

| Module | Patient-facing | Dashboard-managed | Feeds |
|---|---|---|---|
| Home | ✅ | featured content | all modules |
| Departments | ✅ | CRUD | doctors, booking, SEO |
| Doctors | ✅ | CRUD + schedules | booking, departments |
| Booking | ✅ | availability, fees, statuses | contact/notifications |
| News/Blog | ✅ | CRUD AR/EN | home, SEO |
| Branches/Contact | ✅ | CRUD + inbox | local SEO |
| Contracts (التعاقدات) | ✅ | CRUD | home, trust |
| Static pages | ✅ | generic pages | legal/SEO |
| Dashboard | — | ✅ | everything |

## Suggested build order
1. Foundation: i18n routing, layout, dashboard shell (done) → generic pages + branches/contact (get real content in early).
2. Departments → Doctors (directory first, no booking).
3. Booking: schedules → slot engine → booking flow → notifications.
4. News/Blog + Contracts + home page assembly (needs content from modules 2–3).
5. Phase-2 optionals in priority order: Offers → Careers → Doctor schedules on profile → Portal/Payment.
