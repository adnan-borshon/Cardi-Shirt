# CardiShirt — Landing Page Design Brief

---

## Role of This Page

The landing page sits at the exact intersection of three audiences and three intentions. A high-risk patient in Dhaka who received a CardiShirt from their doctor lands here and needs to feel immediately that this product was made for them — that it understands the weight of what they are managing. A family member who received an invitation SMS lands here needing to understand what they are joining and why it matters. A doctor or hospital administrator lands here evaluating whether to recommend CardiShirt to their patients. The landing page must speak to all three without feeling like it is trying to speak to everyone.

It connects directly to the login screen and indirectly to the dashboard — the emotional and visual journey from landing page through login to dashboard must feel like a single continuous experience, not three separate products. By the time a returning patient reaches their dashboard, they should feel they never left the CardiShirt world. By the time a new user completes signup, they should feel that what they just saw on the landing page is being delivered on.

---

## 1. Overall Visual Language

The landing page uses a hybrid light-dark treatment that bridges the fully dark dashboard and the light interior screens. It opens in deep dark — the hero section shares the dashboard's deep navy-charcoal (#0D0F1A) so that patients who return from the dashboard feel continuity. As the page scrolls down, the background gradually lightens through intermediate surfaces until feature sections sit on near-white. This gradient from dark to light is not arbitrary — it mirrors the product's own journey from the intensity of real-time monitoring to the calm of understanding and control.

The ECG waveform is used more expressively on the landing page than anywhere else in the product. It is not just a motif or a data element here — it is the primary visual narrative device. The hero section's background is essentially a large, beautifully rendered ECG trace that scrolls and breathes. Sections are separated by ECG divider lines that draw themselves as the user scrolls past them. The waveform communicates the product's purpose before a single word is read.

Typography follows the same system as the rest of the product — DM Serif Display for hero headlines and emotional statements, Syne for interface-adjacent labels and body text, DM Mono for data callouts and specifications — but the landing page uses type at a larger scale than the app. Display text reaches 64px at desktop. The contrast between the large editorial serif headlines and the precise mono data callouts is the typographic personality of the page.

Color is restrained. The cardiac red (#E8304A) appears on exactly three elements above the fold: the pulsing dot in the hero, the primary CTA button, and the ECG trace color. Every other element is charcoal, off-white, or muted gray. This restraint makes the red carry enormous weight when it appears.

---

## 2. Page Structure — Section by Section

The landing page has eight sections. They are designed to be experienced in sequence on a first visit and to accommodate re-entry at any point for a returning visitor. The final section flows directly into the login interface — they share the same page, with the login appearing as the natural conclusion of the scroll rather than as a separate destination.

---

## Section 1 — Hero

### Emotional Goal

The first ten seconds must communicate three things: what CardiShirt does, who it is for, and that it can be trusted with something as important as a heart. It must not feel like a consumer gadget launch or a cold medical device pitch. It should feel like a letter from someone who understands.

### Layout

Full viewport height at desktop. The background is #0D0F1A. The entire background is a slowly scrolling ECG trace — a single continuous waveform rendered in extremely low opacity (approximately 6%) in cardiac red, tiling horizontally across the full viewport width and repeating vertically at offset positions to create a field of waveforms rather than a single line. This background moves at a very slow parallax rate as the user scrolls — barely perceptible, but alive.

In the center of the viewport, vertically and horizontally: the CardiShirt wordmark at the very top in Syne 14px uppercase with wide letter spacing, in low-opacity white. Below it, a single animated ECG trace — this one is full opacity, cardiac red, thin and precise, approximately 480px wide at desktop. It draws itself from left to right over 2.4 seconds on page load. When the draw animation completes, it begins a slow continuous scroll — as if live data is coming in, very slowly. Above the trace, a faint baseline grid in very dark blue appears as the trace draws, reinforcing the clinical ECG aesthetic.

Below the animated trace, the hero headline in DM Serif Display at 64px desktop, 48px tablet, 36px mobile:

*Your heart, watched over. All day. Every day.*

Below the headline, a subheadline in Syne 18px, line height 1.6, max-width 540px, centered, in rgba(255,255,255,0.65):

*CardiShirt is a smart undershirt that monitors your heart around the clock and explains what it finds — in plain language, without a hospital visit.*

Below the subheadline, two CTA buttons. The primary button: "Get started" in Syne 15px medium, solid cardiac red background, white text, 48px height, 180px width, border radius 8px. The secondary button: "Learn how it works" in Syne 15px, transparent background, 0.5px white border at 40% opacity, white text, same dimensions. At mobile web, both buttons stack vertically and expand to full width.

Between the headline and the subheadline, a single line in DM Mono 12px in cardiac red — centered: `● LIVE MONITORING ACTIVE` — with the dot pulsing at a slow heartbeat rate. This line reads as a status indicator pulled from the product itself, not marketing copy. It communicates that the product is real and running right now.

At the very bottom of the hero viewport, a scroll indicator: a thin vertical line, 40px tall, in low-opacity white, with a downward-moving white dot animating along it — the classic scroll affordance but rendered in the product's precise visual language. Below the line: "Scroll to learn more" in DM Mono 11px, very low opacity white.

### Trust Indicators Below CTA

Immediately below the two CTA buttons, a single horizontal row of three trust signals in Syne 12px, separated by thin vertical dividers, all in low-opacity white:

`Clinically validated sensors` · `AI-powered early warning` · `Designed for Bangladesh`

These are not badges or icons — just clean text with dividers. Minimalist credibility rather than noisy social proof.

---

## Section 2 — The Problem

### Emotional Goal

Make the patient and family member feel seen. Name the fear they live with. Do not sensationalize it, but do not soften it either. This section is the landing page's emotional anchor — everything after it is the relief.

### Layout

This section transitions from the dark hero. The background shifts from #0D0F1A to #141629 — a slight lightening that signals a new section without breaking the dark environment. Full-width section, generous vertical padding (120px top and bottom at desktop).

A narrow content column centered at 680px max-width. No grid, no columns. Just text, commanding the center.

The section opens with a small label in DM Mono 11px uppercase, cardiac red, letter-spacing wide: `THE PROBLEM`

Below it, the headline in DM Serif Display 44px desktop, 34px mobile, in white:

*Heart disease does not announce itself.*

Below the headline, three paragraphs in Syne 17px, line height 1.75, color rgba(255,255,255,0.72), each separated by 24px of space:

*Cardiovascular disease is the leading cause of death in Bangladesh. For most high-risk patients, the gap between early warning signs and a cardiac emergency is measured in hours — sometimes minutes. The warning signs are often there. They just go unnoticed.*

*Hospital visits happen once a month, if at all. Between appointments, the heart is unobserved. An irregular rhythm at 3am. An elevated rate during a stressful afternoon. A subtle pattern that a trained eye would flag immediately — but no trained eye is watching.*

*CardiShirt was designed for this gap. The hours and days between clinical care when a heart still needs to be listened to.*

No imagery in this section. No illustrations. The restraint of pure text makes this section feel serious and honest. The words carry the weight without decoration.

At the bottom of this section, a thin full-width ECG divider draws itself as the user scrolls into view — the animation triggers via Intersection Observer when the divider enters the viewport. The ECG line draws from left to right over 1.2 seconds. This divider marks the transition from problem to solution.

---

## Section 3 — The Product

### Emotional Goal

Show what CardiShirt actually is. Bridge from the emotional problem statement to the physical product. This is where the wearable and the app are introduced together as a system.

### Layout

Background shifts to #1A1D35 — continuing the gradual lightening. Two-column layout at desktop. Left column: product visual. Right column: product description and feature list.

**Left column — product visual.** A clean, high-quality render or illustration of the CardiShirt undershirt — the smart undershirt with the snap-on ECG sensor module visible at the chest. The illustration uses a flat, technical style consistent with the product's precision aesthetic rather than lifestyle photography. The shirt is white or light gray against the dark section background. Subtle annotations point to key elements: the sensor module, the electrode contact points woven into the fabric, the wireless indicator. Annotations are thin lines with DM Mono labels at 11px — the same style as technical drawings.

Below the shirt illustration: a smaller render of the phone showing the live dashboard — the dark ECG canvas with the luminous waveform scrolling. The phone appears at a slight angle, slightly overlapping the bottom of the shirt illustration, positioned as if the phone and shirt are connected. A thin animated line (a signal wave) runs between the sensor module on the shirt and the phone screen, illustrating the wireless connection.

**Right column — product description.** A small label in DM Mono 11px uppercase, cardiac red: `THE SOLUTION`

Headline in DM Serif Display 40px desktop, 30px mobile, white:

*A shirt that listens. An AI that understands.*

Subtext in Syne 16px, rgba(255,255,255,0.70), margin-bottom 32px:

*CardiShirt combines medical-grade ECG sensors woven directly into a lightweight undershirt with an AI system that learns your heart's unique patterns and tells you — in plain language — when something needs attention.*

Below the subtext: three feature callouts, each in a compact card on the elevated surface (#1E2140) with a 0.5px border. Each card has a small icon, a feature name in Syne 14px medium white, and a one-sentence description in Syne 13px rgba(255,255,255,0.60).

Card 1 — Continuous monitoring: "Sensors woven into the fabric capture ECG data throughout the day and night, without interrupting your routine."

Card 2 — On-device AI: "An AI model on the sensor chip analyzes your heart rhythm in real time. No internet required for immediate anomaly detection."

Card 3 — Cloud intelligence: "A second AI model in the cloud studies your long-term patterns to estimate cardiac risk and generate your daily health summary."

At mobile web, the two columns stack vertically — product visual first, description below.

---

## Section 4 — The Three Hero Features

### Emotional Goal

Communicate the three features that make CardiShirt more than a monitoring device: the AI companion that explains everything, the family network that extends care beyond the patient, and the automatic emergency response that acts when the patient cannot. Each feature gets a moment.

### Layout

Background continues lightening to #F5F5F8 — the first light section of the page. This shift from dark to light is a visual turning point, mirroring the product's promise: from the dark problem to the illuminated solution. The transition is handled with a gradient blend zone of approximately 80px between this section and the previous one.

Three feature panels arranged horizontally at desktop in a grid with generous gutters. At tablet, two columns with the third centered below. At mobile web, single column stacked.

Each feature panel is a tall card on a white surface with a 0.5px border in rgba(232,48,74,0.15) and border-radius 16px. At the top of each card: a feature illustration — not an icon, but a small scene rendered in SVG that captures the emotional essence of the feature. Below the illustration: the feature name, description, and a key detail callout.

**Feature Panel 1 — AI Cardiac Companion**

Illustration: a stylized chat interface — two chat bubbles on a dark background, one asking "Is my heart okay today?" in Bengali, the AI response below it saying "Yes — your rhythm has been steady since this morning. Your afternoon score is your best this week." The bubbles are minimal, the ECG trace runs subtly behind them.

Feature name in DM Serif Display 28px, charcoal: *A companion who knows your heart*

Description in Syne 14px, #4A4A6A, line-height 1.65: "The CardiShirt AI companion has full access to your cardiac history. Ask it anything — what your reading meant, whether you should rest, why an alert fired — and receive a plain-language answer in Bengali or English. It speaks to you, not at you."

Key detail callout in DM Mono 12px, cardiac red, with a small left border in cardiac red: `Available in Bengali and English`

**Feature Panel 2 — Family Network**

Illustration: three avatar circles connected by thin lines to a central heart icon. One avatar has a notification badge. The scene communicates a network of care around a patient without needing any text.

Feature name in DM Serif Display 28px, charcoal: *Your family stays close, wherever they are*

Description in Syne 14px, #4A4A6A, line-height 1.65: "Add family members to your CardiShirt circle. They receive a daily morning summary — 'Your mother had a calm night' — and immediate notification if an alert fires. They can view your cardiac diary from anywhere, giving them peace of mind and giving you the security of knowing someone is always watching."

Key detail callout in DM Mono 12px, cardiac red, with a small left border: `Customizable access and notification levels`

**Feature Panel 3 — Automatic Emergency Dispatch**

Illustration: a map — dark tiles, a pulsing red location dot, two hospital pins and an ambulance pin nearby, a thin route line from the location dot to the nearest hospital. Simple, clear, immediately understandable.

Feature name in DM Serif Display 28px, charcoal: *Help dispatched before you can ask for it*

Description in Syne 14px, #4A4A6A, line-height 1.65: "When CardiShirt's AI detects a high-severity cardiac event and you do not respond within 60 seconds, an ambulance is automatically dispatched to your location. Your family is notified simultaneously. If you are unable to act, CardiShirt acts for you."

Key detail callout in DM Mono 12px, cardiac red, with a small left border: `60-second response window, configurable`

---

## Section 5 — How It Works

### Emotional Goal

Demystify the product for patients who might feel intimidated by medical technology. Show the daily experience in concrete, relatable terms. Make wearing CardiShirt feel easy and natural, not clinical or burdensome.

### Layout

White background. Centered content column, max-width 800px. Section label at top: `HOW IT WORKS` in DM Mono 11px uppercase, cardiac red, letter-spacing wide.

Headline in DM Serif Display 40px, charcoal: *Three steps, all day, every day.*

Below the headline: a horizontal three-step flow at desktop, vertical stack at mobile. Each step is connected to the next by a thin dashed line with an arrow. The dashes animate — drawing from step to step as the section enters the viewport.

**Step 1 — Wear it.** A simple illustration of the shirt snap-on process — the sensor module clicking into the chest position of the undershirt. Step number in DM Mono cardiac red. Step title in Syne 16px medium charcoal: "Snap on the sensor and put on CardiShirt like any undershirt." Step description in Syne 14px #4A4A6A: "The ECG sensors are woven into the fabric. There are no patches, no gel, no preparation. Wear it comfortably through your day."

**Step 2 — Live your day.** An illustration of a person doing ordinary daily activities — walking, sitting, sleeping — with a faint ECG trace following them like a shadow. Step title: "CardiShirt monitors your heart continuously while you go about your day." Step description: "The on-device AI analyzes your rhythm in real time. If something unusual happens, you and your family are notified immediately."

**Step 3 — Understand your heart.** An illustration of the phone showing the AI chat interface with a warm message. Step title: "Open the app to see your daily summary, ask your AI companion, and review your cardiac diary." Step description: "Every day builds a fuller picture of your heart. The AI learns what is normal for you and becomes more accurate over time."

Below the three steps: a single centered pull-quote in DM Serif Display italic 24px, charcoal, max-width 520px, centered:

*"You do not need to understand ECG data. CardiShirt understands it for you."*

No attribution. The quote stands as a product philosophy statement.

---

## Section 6 — For Patients and Families

### Emotional Goal

Explicitly address the two primary audiences so each feels directly invited. A family member who has been reading thinking "is this for me?" gets a clear answer here. A patient who has been wondering "will my family know what to do?" gets reassurance.

### Layout

Background: #F5F5F8. Two columns side by side, each a tall card at desktop. Single column stack at mobile.

**Left card — For patients.** Header area with a warm illustration of a patient wearing the shirt, going about a domestic routine — reading, having tea — with a subtle ECG trace in the background. Card background white with the cardiac red left border accent at 4px. Card padding 40px.

Label: `FOR PATIENTS` in DM Mono 11px, cardiac red.

Headline in DM Serif Display 28px, charcoal: *Know your heart is being listened to.*

Body in Syne 14px, #4A4A6A, line-height 1.7: "CardiShirt gives high-risk cardiac patients the continuous monitoring that used to require a hospital stay. Wear it at home, at work, during sleep. Get plain-language explanations of your readings. Ask the AI companion anything about your heart. And know that if something serious happens, help is on the way — automatically."

Below the body: three small benefit pills in a horizontal row, each a white rounded rectangle with a 0.5px border: "Continuous monitoring", "Explainable alerts", "Bengali language support."

**Right card — For families.** Same structure. Illustration of a family member at a laptop, the CardiShirt family dashboard visible on screen, with a green "Stable" status badge visible. Card background white with a teal left border accent at 4px.

Label: `FOR FAMILIES` in DM Mono 11px, teal.

Headline in DM Serif Display 28px, charcoal: *Stay close, wherever you are.*

Body in Syne 14px, #4A4A6A, line-height 1.7: "Being added to a CardiShirt circle means your family member's heart health is no longer invisible to you. See their daily cardiac summary. Receive a morning message when they have a calm night. Be notified immediately if an alert fires. Know where they are in an emergency. CardiShirt gives families the information they need without overwhelming them with data they cannot interpret."

Three benefit pills: "Daily morning summary", "Instant alert notifications", "Live location in emergencies."

Below both cards, centered: a single CTA — "Add CardiShirt to your family" in Syne 15px, cardiac red with a right-pointing arrow. This CTA links to the family member signup flow, distinct from the patient signup flow.

---

## Section 7 — Trust and Credibility

### Emotional Goal

For a medical device worn by high-risk patients, trust is not optional. This section addresses the implicit questions every patient and family member has: is this validated, is it safe, will it actually work, and who stands behind it.

### Layout

White background. Centered max-width 900px. Section label: `WHY TRUST CARDISHIRE` in DM Mono.

Two sub-sections within this section, separated by a thin divider.

**Sub-section A — Clinical validation.** Three metric callouts in a horizontal row, each in a compact centered column. Each callout has a large DM Mono number in cardiac red, a label in Syne 14px charcoal, and a brief source note in DM Mono 11px gray.

Callout 1: `12-lead` — "Medical-grade ECG standard" — "Same as clinical ECG equipment"
Callout 2: `98.2%` — "Algorithm sensitivity for arrhythmia detection" — "Internal validation study"
Callout 3: `<30s` — "Average alert response time" — "From detection to patient notification"

These numbers are placeholders — they must be replaced with actual validated figures before launch. The design accommodates up to four callouts in this row.

**Sub-section B — Key reassurances.** A four-item horizontal grid of reassurance cards. Each card is minimal — a small icon, a title in Syne 14px medium, a one-sentence note in Syne 13px gray.

Card 1 — Data privacy: "Your cardiac data is yours. Stored securely, never sold, never shared without your explicit permission."

Card 2 — Bangladesh-built: "Designed specifically for patients and families in Bangladesh. Bengali language throughout. Integrated with local emergency services."

Card 3 — Low-cost hardware: "CardiShirt uses accessible hardware to keep costs within reach. Cardiac monitoring should not be a luxury."

Card 4 — Doctor compatible: "All recordings export in standard ECG format. Share your data directly with any cardiologist without a subscription or vendor lock-in."

---

## Section 8 — Login and Signup (The Connection Point)

### Emotional Goal

This final section is the bridge. It must feel like an invitation, not a form. The transition from reading about CardiShirt to entering your account should feel natural and earned — not like arriving at a checkout counter after an emotional journey.

### Layout

Background returns to dark — #0D0F1A — mirroring the hero section. This closing dark section creates a visual bracket with the hero: the page opens and closes in the same environment, and the dashboard that follows after login shares this environment. The continuity is intentional and carefully engineered.

A centered ECG trace — the same animation as the hero — draws itself across the section before the login form appears. This is a loading ritual: 1.2 seconds of the ECG drawing, then the login form fades in beneath it. On a subsequent visit, the ECG draw animation is skipped if a session cookie indicates the user has visited before — the form appears immediately.

**Login form — returning user.** At the center of the section, a white card at 480px max-width with border-radius 16px, card background #141629 (consistent with the dashboard card surface), and a 0.5px border in rgba(232,48,74,0.2). Inside the card:

The CardiShirt wordmark centered at the top of the card. Below it, in DM Serif Display 24px white: *Welcome back.* Below that, in Syne 13px rgba(255,255,255,0.55): *Your heart has been monitored while you were away.*

This subtext is dynamic. For a returning patient, it shows actual data: *Your heart rate has been stable since you last checked in.* Or: *CardiShirt logged one new recording since your last visit.* This requires a brief unauthenticated API call using a remembered patient identifier — a single data point, not sensitive health data, but enough to make the login experience feel alive rather than generic. If the API call fails or no identifier exists, the fallback subtext is the static phrase above.

Below the dynamic subtext: the email input and password input in standard Syne 15px fields, 52px height, dark surface fill (#1A1D35), 0.5px border in rgba(255,255,255,0.15), white text, with a cardiac red focus ring on interaction. Placeholder text in very low opacity white. Both fields have clear labels above them — never placeholder-only labels.

Below the password field: a "Forgot password?" link in DM Mono 12px, rgba(255,255,255,0.45), right-aligned.

The primary login button: "Sign in" in Syne 15px medium, full width, 52px height, solid cardiac red, white text, border-radius 8px. On hover: slightly darker red. On press: scale(0.98). On loading: the button text is replaced with a small animated ECG pulse — three dots that pulse in the rhythm of a heartbeat. This loading animation is unique to CardiShirt and reinforces the brand personality at the moment of authentication.

Below the login button: a divider with "or" centered in low-opacity white text.

Below the divider: "Create a new account" in Syne 14px white — a full-width outlined button matching the secondary CTA from the hero. This opens the signup flow, which begins by asking whether the user is a patient or a family member — the two flows diverge from this choice.

**Signup flow — patient.** Three steps inline below the login card, revealed sequentially as each is completed. Step 1: Name, date of birth, city (dropdown of major Bangladesh cities), and phone number. Step 2: Cardiac risk profile — a short questionnaire: existing conditions (checkboxes), current medications (free text), primary doctor name and contact (optional). Step 3: Create password and agree to data terms. On completion, the signup flow transitions directly to the onboarding flow — device pairing and baseline calibration — which opens at the same URL without a page reload.

**Signup flow — family member.** A simplified two-step flow. Step 1: Name, relationship to patient (dropdown: Spouse, Child, Parent, Sibling, Caregiver, Other), phone number, and email. Step 2: Enter the invitation code from the SMS the patient sent them, or enter the patient's registered email to request connection. On completion, the family member sees a waiting state — "Your request has been sent to [patient name]. You will receive access once they confirm." — before transitioning to the family dashboard once the patient approves.

**Below the login card.** Two small trust indicators in DM Mono 11px, very low opacity white, centered below the card: `256-bit encrypted` · `Your data never leaves Bangladesh servers without consent`

### Visual Transition from Login to Dashboard

After a successful login, the page does not navigate in the traditional sense. Instead: the login card fades out (200ms opacity transition). The CardiShirt wordmark at the top of the card scales up and moves to the top-left of the viewport — it transforms into the sidebar wordmark of the dashboard. The ECG trace from the background of the login section extends and transforms into the live ECG canvas of the dashboard. This is an animated transition that makes the login feel like a door opening into the dashboard rather than a redirect to a separate page. It requires a JavaScript-orchestrated animation sequence using the Web Animations API — approximately 600ms total with staggered element entries.

If the animation is technically infeasible for a given device (low-end Android on mobile web), a graceful fallback cross-fade (300ms) is used instead. The transition quality degrades gracefully without breaking the experience.

---

## 3. Navigation Bar

The landing page has a fixed top navigation bar that appears on scroll — not on initial load. On the hero section, no navigation bar is visible. When the user scrolls past 80px, the navigation bar fades in from the top: a slim 60px bar in #0D0F1A at 95% opacity with a subtle backdrop blur on supporting browsers.

Left side of the nav: the CardiShirt wordmark in Syne 15px white with the animated ECG trace logo mark.

Center of the nav (desktop only): four anchor links — "How it works", "Features", "For families", "About" — in Syne 13px rgba(255,255,255,0.65), spacing 32px between them. Hovering any link underlines it in cardiac red.

Right side of the nav: two elements. A language toggle — "EN" and "বাং" as two text options, the active one in white, the inactive in rgba(255,255,255,0.4). And a "Sign in" button in the secondary button style — transparent with a 0.5px white border, Syne 14px, 40px height, 100px width. Clicking "Sign in" smoothly scrolls the page to Section 8 (the login section) rather than navigating away. On mobile web, the center navigation links collapse — only the wordmark, language toggle, and sign in button remain.

---

## 4. Footer

Below Section 8, a compact footer in #0D0F1A. Three columns at desktop, stacked at mobile.

Left column: the CardiShirt wordmark and a one-sentence description in Syne 13px rgba(255,255,255,0.45): "Continuous cardiac monitoring for high-risk patients in Bangladesh." Below it: the social links if applicable.

Center column: quick links in Syne 13px rgba(255,255,255,0.55) — Privacy Policy, Terms of Use, Data Security, Contact, Careers. Each in its own row.

Right column: contact information — a support email in DM Mono 12px cardiac red, a phone number in DM Mono 12px white, and an address or city indicator for the Bangladesh office.

Below the three columns: a full-width 0.5px divider line in rgba(255,255,255,0.1). Below the divider: a single line in DM Mono 11px rgba(255,255,255,0.3), centered: `© 2025 CardiShirt. Cardiac monitoring data is not a substitute for clinical medical advice.`

This disclaimer is mandatory and must be present in this exact position on every version of the landing page.

---

## 5. Responsive Behavior Summary

At 1280px and above the full three-column feature section, two-column product section, and side-by-side audience cards render as specified. At 768–1279px the layout shifts to two columns where three were specified, and single column where two were specified. All illustrations scale proportionally. The hero headline reduces to 48px. At below 768px the layout is fully single column. The hero headline reduces to 36px. The subheadline reduces to 16px. CTA buttons expand to full width. The feature panels stack vertically. The metric callouts in the trust section arrange as two rows of two rather than four in a row. The login card expands to full width with 24px horizontal padding.

---

## 6. Performance Requirements

The landing page carries a performance constraint that directly impacts the target audience. Low-end Android devices with slow connections are common in Bangladesh. The page must achieve a Largest Contentful Paint under 2.5 seconds on a 3G connection with a mid-range Android device.

The animated ECG trace in the hero is rendered on a Canvas element rather than SVG to minimize DOM complexity. The background ECG field is a single tiled Canvas rather than multiple SVG elements. All illustrations are SVG with optimized path counts — no raster images above the fold. The dark background means no large image files are needed to establish the visual environment. Fonts are subset to Latin and Bengali character ranges only, reducing font file size significantly. The login card and Section 8 are loaded lazily — they do not block the initial render of the hero.

---

## 7. Figma File Additions

Add a page to the Figma file called "Landing Page" with the following frames: desktop (1440px canvas), tablet (768px), and mobile web (390px) versions of the full landing page. A separate frame for the login card in all states — default, loading, error (incorrect credentials), and success transition. A frame for the signup flow — patient path and family member path, all steps. The nav bar in all scroll states — hidden, visible, and the mobile version. The footer. An animation specification document — a Figma frame with annotated notes on the transition from login to dashboard, the ECG draw animations, and the scroll-triggered drawing of ECG dividers between sections.

---

## 8. Priority Order for Design Sprint

Begin with the hero section in all three responsive variants — the ECG animation and headline treatment sets the visual language for everything below. Then the login card and its states, because this is the most functionally critical element on the page. Then the three hero feature panels, because they communicate the product's core value. Then the How It Works section, the audience cards, and the trust section. The footer and navigation bar are last — they are straightforward once the visual language of the page is established.

The landing page brief supersedes no prior sections — it is additive to the full brief. The visual language decisions made here (the dark-to-light scroll, the ECG animation timing, the login card treatment) should be reviewed for consistency with the dashboard brief and adjusted if any conflicts arise.