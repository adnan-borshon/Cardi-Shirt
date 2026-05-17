# CardiShirt Web Dashboard — Revised Design Brief

## What Changed & Why

The original dashboard was too clinical and sparse — a white canvas works for a report, not for something a patient opens every single day. The revised dashboard has three major additions: a richer visual environment that feels alive and personal rather than empty, an AI cardiac companion chat that gives patients a natural way to ask questions about their own heart data, and a live map showing nearby hospitals and ambulance dispatch points. These three changes together transform the dashboard from a data monitor into a daily health companion that patients will actually want to open.

---

## 1. Dashboard Visual Philosophy — Revised

Abandon pure white as the base. The dashboard should feel like it has a heartbeat. The background shifts to a very deep navy-charcoal (#0D0F1A) for the overall page, creating a medical instrument aesthetic — think an ECG monitor, not a hospital intake form. Data glows against the dark surface. The cardiac red accent intensifies in this context. Green healthy indicators feel genuinely reassuring. The live ECG trace becomes luminous rather than flat.

This dark base applies to the dashboard only. The ECG Records, Diary, Risk, and other screens retain the light mode treatment because those are reading and analysis contexts where white backgrounds aid concentration. The dashboard is a monitoring and communication context — it should feel alert, alive, and immediate.

Within the dark dashboard, cards and panels use a slightly elevated dark surface (#141629) with subtle 0.5px borders in a dim blue-gray. This creates a layered depth that reads as modern and trustworthy without being oppressive. Key data points — the current heart rate, the AI health score, the ECG waveform — are rendered in slightly elevated contrast to draw the eye immediately.

The ECG waveform on the dashboard gets the hero treatment it deserves. It renders as a thin luminous line — cardiac red at normal rhythm, shifting to amber during elevated readings, pulsing with a faint glow in the color of the current status. This is not a gimmick; the color shift is a direct encoding of the AI model's real-time classification, so patients learn to read the color as meaningful information.

The overall dashboard impression should be: you are looking at something that is watching over your heart right now, in this moment, and it is doing so with intelligence and care.

---

## 2. Dashboard Layout — Revised Three-Column Structure

At desktop (1280px and above), the dashboard organizes into three columns rather than two.

**Left column (260px fixed):** The persistent navigation sidebar. CardiShirt wordmark at top with the ECG trace logo. Navigation links with icons and labels. At the bottom: the shirt connection widget (shirt silhouette, battery, signal strength) and the current patient name with their risk tier badge.

**Center column (flexible, approximately 55% of remaining width):** The primary monitoring canvas. This is where the live ECG waveform lives, the current heart rate and status display, the map panel, and the primary alert zone.

**Right column (360px fixed):** The AI cardiac companion chat interface. This column is always visible at desktop — the chat is not hidden behind a button or a tab. It is a persistent presence on the dashboard, reflecting the product's philosophy that AI conversation is a first-class feature, not an add-on.

At tablet (768–1279px), the right column (AI chat) collapses into a floating panel triggered by a persistent chat button in the bottom-right corner. The center column expands to fill the space. At mobile web, the layout is single column with a tab bar at the bottom; the AI chat becomes its own tab.

---

## 3. Center Column — Primary Monitoring Canvas

### Alert Zone (Top, Conditional)

Spanning the full width of the center column at the very top. Invisible on healthy days — the space simply does not exist when there is no alert. When an alert fires, this zone snaps into existence with a red background, the alert summary, the countdown timer if dispatch is active, and the response CTAs. It cannot be scrolled past — it pins to the top of the center column until resolved. This ensures alerts are never missed regardless of where the user has scrolled.

### Shirt Status Bar

Below the alert zone, a slim horizontal bar carries four pieces of information across its width: the shirt connection indicator (animated signal rings when connected), the number of active ECG leads (e.g. "8/12 leads active"), the battery percentage, and the last-sync timestamp. This bar uses the slightly elevated card surface color and a 0.5px bottom border. It is always visible and never scrolls away — it is sticky below the alert zone.

### Live ECG Canvas

The hero element. Full width of the center column, 220px tall at desktop. The waveform scrolls from right to left in real time. Background is the page background color (#0D0F1A) with very faint horizontal grid lines in a dim blue-gray at 0.5px, spaced at standard clinical intervals. The waveform line is 1.5px, smooth, rendered via Canvas API. Its color responds to AI classification:

- Normal sinus rhythm: a warm cardiac red (#E8304A) with a subtle glow
- Mildly elevated or irregular: amber (#F5A623) with a gentle pulse
- Alert state: bright red with a sharp pulse animation every heartbeat
- Disconnected or no data: gray dashed line

Above the canvas, a header row shows the lead currently displayed (Lead II by default, with a dropdown to switch leads), a speed indicator (25mm/s standard, toggle to 50mm/s), and the AI classification label for the current moment — "Normal sinus rhythm" or "Irregular rhythm — monitoring" rendered in the appropriate status color.

Below the canvas, a very short row of secondary waveform indicators: three smaller ECG micro-strips showing Lead I, Lead V1, and Lead V5 at reduced height (40px each) for quick multi-lead awareness without switching.

### Current Vitals Row

A horizontal row of four metric tiles immediately below the ECG canvas. Each tile sits on the elevated card surface with a colored left border indicating status.

**Heart Rate:** The BPM in large DM Mono numerals. A small animated pulse icon synchronized to the current rhythm. The trend arrow (up, down, stable over the last 10 minutes). Status label in the appropriate color.

**AI Health Score:** The 0–100 score with the ring graphic. Today's score compared to yesterday with a delta indicator. Tap to expand the breakdown.

**HRV:** The RMSSD value in DM Mono. A small sparkline of the last 6 hours. A plain-language label: "Good variability" or "Low variability — rest recommended."

**Rhythm Status:** The current AI rhythm classification in text. An icon that changes with the classification. Time since the last anomaly: "No anomalies in 4h 22m" — this counter is psychologically important for patient reassurance.

### Today's AI Summary Card

Below the vitals row. A card with a slightly warmer dark surface (a hint of deep blue rather than pure charcoal) to visually distinguish it from the data cards. Inside: the AI-generated summary for today in DM Serif — two to three sentences, written in the second person, personal and warm. The current time is referenced: "This afternoon your heart has been steady." Below the text: the CardiShirt AI badge with model provenance and the confidence indicator. A "see full diary entry" link takes the patient to the cardiac diary screen with today's date selected.

### Nearby Hospitals & Ambulance Map

Below the summary card. A full-width panel titled "Emergency resources near you" with a small location pin icon and the patient's current neighborhood or area name to confirm the location is correct.

The map renders using a dark map tile theme (consistent with the dashboard's dark visual environment) showing the patient's location as a pulsing dot in cardiac red. Overlaid on the map: two categories of pins.

Hospital pins show as a white cross icon on a deep blue circle. Clicking a hospital pin expands a small information card to the right of the map showing the hospital name, distance, travel time by the fastest available mode, whether they have a cardiac ICU, phone number, and a "navigate" button that opens the native maps app.

Ambulance dispatch points show as a red circle with a white lightning bolt icon. These represent both government emergency dispatch locations and registered private ambulance services. Clicking shows the service name, coverage area, phone number, and whether CardiShirt has an automatic dispatch integration with this service (shown as a green "integrated" badge or a gray "manual call only" badge).

The map has zoom controls and a legend at the bottom-right corner. It defaults to a 3-kilometer radius around the patient's current location. A "expand radius" button increases to 8 kilometers. A filter row above the map lets the patient toggle between showing all facilities, hospitals only, or ambulance services only.

Below the map, in a compact horizontal scroll: a shortlist of the three nearest resources in card format — name, distance, phone number, and a one-tap call button. This shortlist is visible even if the patient has not interacted with the map, ensuring critical information is always accessible without requiring map interaction.

The map panel as a whole is collapsible — a chevron in the header allows it to contract to show only the shortlist cards. Patients who find the map distracting can keep it collapsed while still having the nearest resources at hand.

### Family Circle Widget

At the bottom of the center column. A horizontal row showing the patient's family members as avatar circles with name labels and colored status dots — green dot when the family member has the app open, gray when they haven't checked recently. Below each avatar: the time they last viewed the patient's data. A "+" button on the far right links to the family management screen. This widget gives patients a tangible sense that their network is watching over them, which is deeply reassuring for elderly patients living alone or semi-independently.

---

## 4. Right Column — AI Cardiac Companion Chat

### Philosophy

The AI chat is not a general-purpose chatbot. It is a specialized cardiac health companion that has full access to the patient's ECG history, diary, risk scores, medication logs, and real-time data from the shirt. It can only discuss topics related to the patient's cardiac health, general cardiovascular wellness, understanding their data, and what to do in various situations. It will not discuss unrelated topics. When patients ask clinical questions beyond its confidence level, it explicitly says so and recommends calling their doctor.

The chat speaks in the same voice as the rest of the product — warm, direct, plain language, grade-6 reading level. It speaks Bengali or English based on the patient's language setting. It greets the patient by name when the dashboard opens and opens with a brief status statement about their current heart condition before waiting for input.

This AI is the most important daily touchpoint in the product. Patients who might not understand a risk score chart will ask the AI "is my heart okay today?" and get a real answer. Family members who are worried at 2am will ask the AI "what happened to my mother's heart this afternoon?" and get a contextual explanation. The AI turns the data from something patients must interpret into something that speaks to them.

### Chat Interface Layout

The right column is a dedicated chat surface. At the top: the column header — "CardiShirt AI" with a small animated pulse indicator and the text "Has access to your full cardiac history." A small context badge shows what data the AI currently has access to: "Viewing today's data, 8h of ECG, current vitals."

Below the header: the chat history scrolls vertically. Each message sits in a chat bubble. Patient messages are right-aligned on a dark surface bubble with white text. AI responses are left-aligned on a slightly elevated surface with slightly warmer white text and an AI badge icon at the top-left of the bubble.

AI response bubbles have a special treatment for messages that reference actual data: the relevant data element is shown inline as a small embedded card within the chat bubble. For example, if the patient asks "what was my heart doing at 3pm?" the AI response includes a mini ECG strip from that timestamp embedded directly in the chat bubble, below the text explanation. This is a major UX innovation — the chat becomes a natural interface for exploring the patient's own data without navigating away.

At the bottom of the right column: the message input. A text field with placeholder text in the patient's language: "Ask about your heart today..." A send button and a microphone button for voice input (important for elderly patients who prefer speaking). Above the input field, a row of quick-prompt suggestion chips that update based on the current context. These chips are short questions the AI predicts the patient might want to ask, based on the current cardiac status and time of day.

### Quick Prompt Suggestions

Quick prompts are three to four short chips shown above the chat input at all times. They rotate based on context. Examples:

When the patient's rhythm is normal: "Is my heart okay today?", "How was my sleep last night?", "What should I avoid today?"

When a mild anomaly was detected earlier: "What happened at 3pm?", "Should I call my doctor?", "Is this pattern dangerous?"

When an alert occurred: "Explain my last alert", "Should I go to the hospital?", "What triggered the alert?"

In the morning: "How was my heart overnight?", "Is today a good day for a walk?", "What does my score mean?"

In the evening: "Summary of today's heart health", "How do I compare to last week?", "What should I monitor tonight?"

These suggestions dramatically increase daily engagement. Patients who would not spontaneously type a question will tap a suggestion chip. The chip is removed after selection and a new set appears after the AI responds.

### Proactive AI Messages

The AI does not only respond to questions — it proactively sends messages to the chat when something worth noting happens, without triggering a full alert notification. These proactive messages appear in the chat with a subtle "CardiShirt noticed" header in a small label.

Examples of proactive messages:
"CardiShirt noticed your resting heart rate has been slightly lower than your usual this afternoon — this can sometimes mean you're more relaxed than usual. No action needed."
"CardiShirt noticed it's been 3 hours since you logged any activity. A short walk can be good for your heart rhythm. What does your energy feel like today?"
"CardiShirt noticed your HRV has been improving steadily over the past 4 days. Your heart is responding well."

These messages are non-alarming, conversational, and end with either a reassurance or an open-ended question that invites the patient to engage. They appear at most three times per day to avoid becoming noise.

### What the AI Can and Cannot Do

The AI can explain any piece of data in the patient's record in plain language. It can describe what a normal versus abnormal reading looks like for this specific patient. It can recommend general lifestyle actions — rest, hydration, gentle movement, calling the doctor. It can explain what an alert means and whether past alerts were clinically significant. It can answer questions about how the CardiShirt system works. It can notify the patient if their data suggests they should contact their doctor. It can tell family members what the patient's current status is in plain terms.

The AI cannot prescribe, diagnose, or provide clinical recommendations. It cannot tell a patient to take or stop medication. It cannot assure a patient that an emergency is not serious — in ambiguous situations, it always errs toward recommending they call their doctor or use the emergency feature. When the AI is uncertain about something, it says so plainly: "I don't have enough information to answer that confidently. I'd recommend calling your doctor."

These constraints must be built into the AI model's system prompt and must also be represented in the UI. A persistent small disclaimer at the bottom of the chat column — below the input field — reads: "CardiShirt AI is a monitoring companion, not a doctor. Always consult your physician for medical decisions." This disclaimer is in the smallest permitted text size and never intrudes on the chat experience, but it is always there.

---

## 5. Day-to-Day Usability Improvements

### Daily Check-In Ritual

The dashboard opens with a daily check-in flow for patients who visit in the morning. A card appears at the top of the center column (above the ECG canvas) asking three quick questions: How are you feeling today? Did you sleep well? Have you taken your medication? Each question has two to three tap options, no typing required. The answers take five seconds to complete and feed into the AI model as context for the day's analysis. The check-in card dismisses after completion and does not reappear until the next morning.

This ritual serves two purposes: it gives the AI valuable context it would not have from ECG data alone, and it establishes a daily habit of opening the app — which means patients are more likely to see alerts and updates promptly.

### Contextual Status Communication

The dashboard's status communication adapts to the time of day and the patient's recent patterns, making each visit feel personally relevant rather than generic.

Morning visit (before noon): The AI summary emphasizes overnight cardiac behavior and readiness for the day. The vitals row shows the overnight heart rate range and sleep HRV. The quick prompts are morning-oriented.

Afternoon visit: The summary reflects the morning's data and any midday changes. If the patient completed physical activity, this is acknowledged. The map panel prioritizes showing hospital locations (daytime relevance).

Evening visit: The summary previews overnight monitoring and gives the patient a sense of what CardiShirt will be watching for while they sleep. The quick prompts focus on winding down and reviewing the day.

Late night or very early morning alert: The dashboard enters a focused alert-priority mode — non-alert content de-emphasizes, the alert zone and AI chat take maximum visual prominence.

### Shirt Wear Reminder

When CardiShirt detects that the shirt is disconnected during hours the patient typically wears it, a gentle prompt appears in the chat from the AI: "It looks like CardiShirt isn't connected right now. Are you wearing the shirt? Tap here to reconnect." This prompt appears as a proactive chat message, not as a push notification, keeping the interaction within the app rather than interrupting the patient.

### Medication Log Widget

A small widget tucked at the bottom of the center column, below the family circle. A simple checklist of the patient's registered medications with morning, noon, and evening slots. Tapping a medication marks it as taken. The check-in data feeds into the AI's daily analysis. This widget is minimal — just enough to establish the habit and provide the AI with context. It is not a full medication management system.

### Weekly Progress Card

On Sunday evenings, the AI summary card transforms into the weekly progress card. It shows: the week's average health score compared to last week, the number of alerts versus the previous week, one key positive observation ("Your HRV improved this week"), and one recommendation ("Your afternoon readings tend to be elevated — consider resting after lunch"). Below this: a "Share with family" button that sends the weekly summary to all family members who have notifications enabled.

### Personalized Baseline Visualization

On the ECG canvas, a very faint reference band runs horizontally — showing the patient's established normal heart rate range for the current time of day. When the live rate is within this band, nothing changes. When it drifts above or below, the band subtly intensifies, and the AI proactively notes it in the chat. This baseline band is the visual embodiment of the personalization at the core of CardiShirt's value proposition — the patient can literally see their own normal.

---

## 6. Map Component — Full Specification

The map uses a dark tile theme consistent with the dashboard aesthetic. Recommended tile provider: MapTiler with a dark style, or Mapbox dark-v11 theme. Both support the vector tile rendering quality needed to display hospital and ambulance service locations at high fidelity on mobile web.

**Data layers on the map:**

Patient location layer: A pulsing circle in cardiac red with a white dot at center. The pulse animation radiates outward at approximately one cycle every two seconds — slow enough to be calming, present enough to confirm the location is live. If GPS is unavailable, the location falls back to the registered address and a banner appears: "Using your registered address — GPS unavailable."

Hospital layer: Sourced from a curated database of Dhaka and major Bangladesh city hospitals with cardiac facilities. Each hospital pin is categorized: government hospital (white cross on deep blue), private hospital with cardiac ICU (white cross on teal), clinic or health center (white cross on gray). The database must be manually curated and updated quarterly — this is a critical patient safety feature and cannot rely solely on automated data sources.

Ambulance layer: Sourced from registered ambulance services in the coverage area. CardiShirt integrated services (those with automatic dispatch capability) get a prominent pin style — white lightning bolt on cardiac red circle. Non-integrated services get a subdued style — white phone icon on gray circle. The visual hierarchy communicates which services will be available for automatic dispatch.

**Map interaction at desktop:** The map panel is 380px tall. Clicking any pin opens a side drawer within the panel — approximately 280px wide — that slides in from the right of the map. The drawer contains the full information card for the selected facility. The map zooms and centers slightly toward the selected pin when the drawer opens. Multiple pins can be compared by keeping one drawer open and clicking another pin, which updates the drawer content.

**Map interaction at mobile web:** The map is full width and 260px tall. Tapping a pin opens a bottom sheet with the facility information. The bottom sheet shows one facility at a time. Swiping the sheet down dismisses it and returns to the map.

**Hospital information card:** Name in Syne 16px bold. Distance (e.g. "2.4 km") and estimated travel time by car ("~9 min") in DM Mono. A row of capability badges: "Cardiac ICU", "24h Emergency", "ECG Available" — each as a small pill badge in appropriate colors. Phone number with a one-tap call button. Operating hours. A "Set as emergency hospital" option that saves this facility as the patient's preferred emergency destination — shared with the ambulance dispatch system so the automatic call can direct the ambulance to this facility.

**Ambulance service information card:** Service name and type (government / private). Coverage area. Average response time if known. Integration status badge ("CardiShirt integrated" or "Manual call only"). Phone number with one-tap call. If integrated: a "Test dispatch" button visible only in the settings, not on the dashboard, to prevent accidental testing. If not integrated: a "Register with this service" link that guides the patient through pre-registering their information with the service for faster response in emergencies.

---

## 7. Component States to Design

Every component on the revised dashboard has multiple states that must be designed explicitly.

**ECG canvas states:** Live scrolling with normal rhythm, live scrolling with anomaly highlighted, paused for screenshot, disconnected (gray dashed line with reconnect prompt), low signal quality (visible noise artifacts with a "signal weak" badge), and demo mode (for onboarding).

**AI chat states:** Empty (first open, before any messages), active conversation, AI typing (three-dot animation with the AI badge), proactive message arrival, error state (AI unavailable — shows a plain message: "AI companion is temporarily unavailable. Your monitoring continues normally."), and offline state.

**Map states:** Loading (skeleton tiles with pin placeholders), loaded with location, GPS unavailable (registered address fallback), no facilities found in radius (prompt to expand radius), facility selected, and emergency mode (map zooms to nearest facilities, non-critical pins de-emphasize).

**Vitals row states:** All normal (standard display), one metric elevated (that tile glows amber), alert state (the affected metric tile glows red and pulses), shirt disconnected (all four tiles show last-known values in gray with a "last known" label and timestamp).

**Check-in card states:** Unanswered (full card visible), partially answered (completed questions show a checkmark), completed (card shrinks to a minimal "check-in complete" confirmation strip and then disappears after three seconds).

---

## 8. Dark Dashboard — Specific Color Tokens

Because the dashboard uses a dark theme while other screens use light theme, a specific set of dark dashboard color tokens must be defined separately in the design system.

Page background: #0D0F1A. Card surface: #141629. Elevated card surface: #1A1D35. Card border: rgba(100, 120, 200, 0.15). Primary text: #F0F2FF. Secondary text: #8890B8. Muted text: #4A5070. Cardiac red (same): #E8304A. Cardiac red glow: rgba(232, 48, 74, 0.25). Healthy green: #27C28A. Caution amber: #F5A623. Map overlay background: #0D0F1A at 90% opacity. AI chat surface: #141629. AI chat input surface: #1A1D35. Patient message bubble: #2A2E50. AI message bubble: #1E2140.

These tokens apply exclusively to the dashboard page. All other pages use the light theme tokens defined in the original brief. The transition between pages — navigating from the dark dashboard to the light ECG records screen — must feel intentional, not jarring. A brief cross-fade transition (200ms) softens this shift.

---

## 9. Revised Figma File Additions

Add a seventh page to the Figma file specifically for the dark dashboard: all three responsive variants of the revised dashboard (desktop, tablet, mobile), all component states listed above in section 7, the AI chat thread design with all message variant types, and the map panel with all its states. This page should also contain the dark dashboard color token reference sheet for developers.

The AI chat component requires its own component page section. Design the following chat bubble variants: patient message (standard), AI response (text only), AI response with embedded ECG mini-strip, AI response with embedded risk gauge, AI response with embedded facility card (for when the patient asks about nearby hospitals), proactive AI message, AI error message, and the typing indicator. Each variant must exist in both a normal state and a state where the content is in Bengali.

---

This revised brief supersedes the dashboard section of the original brief in full. All other sections of the original brief remain as specified. The priority order for the first design sprint is: dark dashboard desktop, AI chat component library, map panel component, and then responsive variants of the dashboard at tablet and mobile web breakpoints.