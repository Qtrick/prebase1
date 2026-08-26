# Codebase Navigator

# PREBASE LAUNCH WEBSITE — FULL LOVABLE IMPLEMENTATION PROMPT

I want you to **design and fully implement a polished launch website for PreBase**.

Do not only make a mockup or explain what you would build. Actually build the complete responsive website, implement the interactions and animations, implement the waitlist frontend, create the Google Apps Script integration materials, test the result, visually review it, and fix anything that feels unfinished.

The end result should feel like a serious modern developer-tool launch page, not a generic AI-generated startup template.

The attached prebasecode zip archive should be used as the resource that helps set in stone what some parts of the application look like and thus help the developement of this website.

---

# 1. PRODUCT CONTEXT

## What PreBase is

**PreBase is the codebase mapping IDE.**

It is an AI-assisted desktop development environment built on the Code-OSS workbench that is designed around understanding a codebase as a system rather than only editing individual files.

The most important PreBase product concepts to communicate are:

### 1. Codebase mapping

PreBase turns a repository into an interactive visual map.

Its active **Network Graph** helps developers understand:

* files
* dependencies
* relationships
* repository structure
* architectural organization
* how different parts of a codebase connect

The purpose is to let developers understand a repository spatially instead of mentally reconstructing everything by opening files one at a time.

Think:

> Google Maps for your codebase.

Do not literally use that phrase everywhere, but that mental model should influence the product presentation.

---

### 2. Temporal Graph

PreBase can also show how the codebase changes through Git history.

Its **Temporal Graph** is a commit-aware visual system where developers can:

* move through Git history
* inspect previous repository states
* compare commits
* see structural changes
* identify files or graph entities that were added
* identify removed elements
* identify modified elements
* follow renamed elements
* understand how repository structure evolved over time

This is not just a traditional Git commit list.

The key idea is:

> See how the structure of the codebase itself changes over time.

This should be one of the strongest visual moments of the website.

---

### 3. Agents with codebase context

PreBase includes built-in **Agents** integrated into the IDE.

The product supports the normal concepts of:

* Ask
* Edit
* Agent

However, the important differentiator is that PreBase's Agents can interact with information from the Code Graph.

That means the AI does not have to think only about whichever file happens to be open.

It can use structural context such as:

* codebase relationships
* dependencies
* graph nodes
* repository structure
* relevant connected files

The website should communicate this simply.

Do NOT turn the entire website into an "AI product" website.

PreBase is primarily a **codebase understanding and development environment**.

AI is an important extension of that foundation.

---

### 4. A real IDE

PreBase is built on the Code-OSS workbench.

It includes the normal development environment expected from a desktop IDE, including things such as:

* code editing
* source control
* terminal
* project navigation
* extensions
* settings
* development workflows

It also has **Runtime Preview**, allowing developers to preview local development applications inside the IDE.

This should be presented as supporting context rather than becoming a fourth giant marketing section.

The central message should remain:

**PreBase helps you understand the entire codebase.**

---

# 2. POSITIONING

The core positioning for the website is:

# The codebase mapping IDE.

Use this as the primary hero headline unless there is an extremely strong visual reason to format it slightly differently.

Suggested hero copy:

### Eyebrow

`PREBASE · EARLY ACCESS`

### Headline

**The codebase mapping IDE.**

### Supporting copy

**See how your codebase fits together, how it changes over time, and give agents the context to work across it.**

Keep this concise.

Do not replace it with a giant paragraph.

---

# 3. PRIMARY OBJECTIVE OF THE WEBSITE

This is a **launch / early-access website**, not a full corporate website.

Its job is to:

1. Immediately explain what PreBase is.
2. Visually communicate the Code Graph.
3. Introduce the Temporal Graph.
4. Explain why graph context matters for AI agents.
5. Establish that PreBase is a complete development environment.
6. Get interested users onto the waitlist.

Do NOT create a huge landing page.

## Hard constraint

The page should contain approximately:

1. Navigation
2. Hero
3. Main product / graph experience
4. Compact feature explanation
5. Final waitlist
6. Minimal footer

That is enough.

Aim for roughly **4–5 desktop viewport heights of meaningful content**, not a 12-section SaaS landing page.

Keep visible marketing copy to roughly **450–600 words maximum**.

---

# 4. DO NOT ADD THESE SECTIONS

Do NOT create filler.

Specifically, do not add:

* fake testimonials
* fake user quotes
* fake company logos
* "trusted by thousands"
* fake usage statistics
* fake GitHub star counts
* fake customer numbers
* pricing
* giant FAQ
* blog section
* careers section
* comparison tables
* meaningless "Our mission" section
* generic AI statistics
* investor logos
* fake press logos
* giant newsletter section separate from the waitlist
* ten feature cards saying the same thing

If information has not been provided, do not invent it.

The page should feel confident enough that it does not need filler.

---

# 5. VISUAL DIRECTION

The website should feel like a premium developer tool.

Think in the general quality range of modern products such as:

* Linear
* Raycast
* Vercel
* Resend
* Arc-era product marketing
* modern developer infrastructure sites

But do not clone any of them.

For animation/component inspiration, think about the best parts of:

* Magic UI
* React Bits
* Aceternity UI
* 21st.dev-style interaction patterns
* modern Motion / Framer Motion launch pages

Again:

**take inspiration from the interaction quality, not their tendency to overdecorate pages.**

---

# 6. AVOID THE GENERIC "AI WEBSITE" LOOK

This is extremely important.

I do NOT want the result to look like it came from an AI website generator.

Avoid:

* giant purple gradients
* blue-purple-pink gradient blobs
* excessive glassmorphism
* floating glowing orbs everywhere
* random dot decorations
* meaningless floating geometric shapes
* excessive rounded cards
* every section being inside a card
* constant rainbow borders
* "AI sparkles"
* excessive star icons
* random pill labels
* huge amounts of empty vertical space
* generic stock illustrations
* stock photos of programmers
* giant gradients behind every heading
* endless marquees
* fake dashboards
* cursor-following gimmicks that become distracting
* typing animations for normal body text
* excessive text-gradient headings

The page should feel **designed**, not generated.

---

# 7. BRAND DIRECTION

PreBase's current visual identity is strongly black and white.

If the actual PreBase repository/assets are available, look for and reuse the real assets rather than recreating them.

Relevant assets may include paths similar to:

`resources/prebase/prebase-icon-1024.png`

and:

`src/vs/workbench/contrib/prebase/browser/media/prebase-logo.png`

The PreBase icon is a white geometric PB-style mark on black.

Do not redesign the logo.

Do not create a new logo.

If the real asset is unavailable, use a simple temporary text wordmark reading:

**PreBase**

rather than inventing a new symbol.

---

# 8. COLOR SYSTEM

Use a restrained dark theme.

Suggested system:

### Background

Near-black:

`#050505`

or similar.

### Raised surfaces

Use subtle charcoal shades such as:

`#0A0A0B`

`#0F0F10`

`#141416`

### Main text

Off-white rather than pure white everywhere.

Approximately:

`#F5F5F5`

### Secondary text

Muted neutral gray.

Approximately:

`#A1A1AA`

### Borders

Very subtle:

`rgba(255,255,255,0.08)`

to:

`rgba(255,255,255,0.12)`

### Accent

PreBase should remain fundamentally monochrome.

You may use a **cool cyan / teal accent** very sparingly for:

* selected graph nodes
* timeline state
* focus rings
* successful form submission
* tiny interactive highlights

Do NOT turn the entire brand cyan.

Do NOT introduce purple as the primary accent.

---

# 9. TYPOGRAPHY

Use a clean modern developer-oriented sans serif.

Prefer something in the style of:

* Geist
* Inter
* similar neutral modern sans-serif

Monospace text may be used selectively for:

* commit identifiers
* graph labels
* file names
* tiny UI details

Do not use monospace for large amounts of marketing copy.

Headings should have slightly tight tracking.

Avoid huge 100px+ headings simply for visual spectacle.

Desktop hero headline should probably fall somewhere around 64–80px depending on viewport.

Mobile should scale naturally.

---

# 10. NAVIGATION

Create an extremely simple sticky navigation bar.

Left:

PreBase logo + `PreBase`

Right:

* Product
* Why PreBase
* Join Waitlist

Primary button:

**Join Waitlist**

The button scrolls smoothly to the final waitlist form.

The navbar should begin relatively transparent.

After scrolling slightly:

* apply a subtle dark translucent background
* subtle backdrop blur
* subtle bottom border

Do not make the navigation enormous.

---

# 11. HERO SECTION

The hero needs to explain the product within seconds.

Suggested structure:

### Small eyebrow

`PREBASE · EARLY ACCESS`

### H1

**The codebase mapping IDE.**

### Subheading

**See how your codebase fits together, how it changes over time, and give agents the context to work across it.**

### CTAs

Primary:

**Join the Waitlist**

Secondary:

**Explore PreBase**

The second button scrolls to the main product visualization.

Do not use "Learn More."

---

# 12. HERO VISUAL

Under the hero copy, create a high-quality stylized representation of PreBase.

Do NOT use some generic SaaS dashboard.

Create something that resembles an IDE window.

The mock application window should include small hints of:

* a file explorer on the left
* editor/workbench chrome
* a central graph workspace
* a subtle Agents panel or contextual UI
* a segmented control with:

  * Network
  * Temporal

The graph should be the hero.

The interface does not need to reproduce the actual PreBase UI pixel-for-pixel, but it should be clearly inspired by a serious desktop IDE.

If actual product screenshots are provided in the project, use them where appropriate instead of creating fake screenshots.

---

# 13. HERO GRAPH ANIMATION

This should be one of the signature animations.

Build the graph using something lightweight such as:

* SVG
* positioned DOM elements
* Canvas if genuinely useful

Avoid introducing Three.js/WebGL just for decoration.

On initial page load:

1. IDE frame fades upward slightly.
2. Graph nodes appear in a controlled stagger.
3. Connections draw outward between them.
4. One or two important nodes subtly illuminate.
5. File labels fade into place.
6. The entire graph settles into a slow almost-imperceptible idle motion.

Think polished, not chaotic.

The animation should communicate:

> a repository becoming understandable.

---

# 14. POINTER INTERACTION

On desktop only, allow the graph/product visual to react subtly to pointer movement.

Examples:

* extremely slight perspective/parallax
* nearby node emphasis
* subtle glow response
* a restrained spotlight on the IDE surface

Do not rotate the entire mockup aggressively.

Maximum movement should only be a few pixels/degrees.

Disable unnecessary pointer effects on touch devices.

---

# 15. MAIN PRODUCT STORY

After the hero, create one visually connected section that tells the core product story.

Do not make three completely disconnected generic SaaS cards.

The three ideas are:

## Map the system

Suggested copy:

**Turn a repository into an interactive map of files, dependencies, and the relationships that hold the codebase together.**

## See change over time

Suggested copy:

**Move through Git history and see the structure itself change. Compare commits, follow renames, and understand what was added, removed, or modified.**

## Work with context

Suggested copy:

**PreBase Agents can query codebase structure so Ask, Edit, and Agent modes can reason beyond the file currently open.**

These three concepts should visually flow into one another.

---

# 16. SCROLL-DRIVEN PRODUCT ANIMATION

This is another important part of the website.

I want a polished scroll interaction similar in spirit to the better motion-heavy developer sites and modern component/prompt libraries.

As the visitor scrolls through the product section, use the same graph/product visual and transform it through several states.

## State 1 — Network

Start with the normal repository network.

Show multiple clusters connected together.

One node may be labeled something like:

`app.tsx`

Other subtle labels can resemble:

`auth.ts`

`graphService.ts`

`api.ts`

`runtime.ts`

These are illustrative only.

---

## State 2 — Temporal

As the user reaches the Temporal explanation:

* smoothly reposition some graph nodes
* fade removed nodes toward muted red
* animate new nodes into the graph
* highlight modified nodes with the cyan/teal accent
* show a thin timeline underneath
* show several simple commit points

For example:

`a83fc2`

`c192af`

`HEAD`

The transition should make the visitor visually understand:

**this is the same codebase at another point in time.**

Do not completely replace the visual with a different illustration.

That continuity is the point.

---

## State 3 — Agent context

As the visitor reaches the Agents explanation:

* highlight a selected graph node
* highlight several connected dependencies
* animate subtle lines from those relevant graph nodes toward a compact Agents panel
* show a tiny query such as:

`What depends on this service?`

Then show a short stylized response such as:

`4 connected modules`

Do not create a full fake AI conversation.

The visual should communicate:

> the agent understands relationships in the graph.

---

# 17. SCROLL ANIMATION IMPLEMENTATION

Use Motion / Framer Motion if already appropriate for the Lovable stack.

Otherwise use performant browser-native techniques.

Good patterns include:

* `whileInView`
* `useScroll`
* `useTransform`
* Intersection Observer
* CSS transforms
* opacity
* clip-path where appropriate
* SVG stroke animation

Prioritize transform and opacity animations.

Avoid constantly modifying expensive layout properties.

Animations should feel approximately:

* 300–700ms for normal transitions
* smooth spring movement for graph nodes
* controlled stagger timing
* no bouncy cartoon easing

Use professional easing curves.

---

# 18. TEXT REVEALS

Use subtle text reveals when sections enter the viewport.

Good:

* slight upward translation
* blur from 6–10px toward 0
* opacity fade
* stagger headline → copy → visual

Bad:

* every individual letter flying around
* dramatic word rotation
* constant typing effects
* every heading using a different animation

The motion language should be consistent.

---

# 19. BACKGROUND MOTION

The dark background may contain an extremely subtle technical texture.

Possible techniques:

* faint grid
* faint dot field
* low-opacity graph lines
* subtle radial illumination behind the product visual

Animate it slowly enough that it is barely noticeable.

Do NOT use large moving gradient blobs.

A faint grid can shift by a few pixels with scroll or pointer movement.

This should create depth without calling attention to itself.

---

# 20. MICRO-INTERACTIONS

Use high-quality micro-interactions throughout.

Examples:

### Buttons

On hover:

* very small translateY movement
* slight background change
* optional extremely subtle edge shine
* arrow moves approximately 2–3px

No giant pulsing glow.

### Feature labels

On hover:

* selected graph relationship can react
* border brightens slightly
* text changes from muted → bright

### Product window

Tiny highlight response when pointer enters.

### Nav

Links should have a minimal animated underline or opacity transition.

### Form

Input border should respond smoothly to focus.

---

# 21. OPTIONAL BORDER EFFECTS

A few elements may use something inspired by Magic UI-style border beams or shine effects.

Use this only on high-value elements such as:

* primary CTA
* product preview
* waitlist form

Do NOT put animated borders on every card.

Keep the effect extremely restrained and mostly monochrome.

---

# 22. SMALL CODE / DEVELOPMENT STRIP

After the main graph story, include a compact section reinforcing that PreBase is still a full development environment.

Do not make this a large section.

Suggested headline:

## Still an IDE.

Suggested copy:

**Edit code, use source control, run commands, work with extensions, and preview local applications without leaving the same Code-OSS-based workspace.**

Show a small horizontal collection of understated labels:

`Editor`

`Terminal`

`Source Control`

`Runtime Preview`

`Extensions`

No giant cards are necessary.

The purpose is simply to clarify:

PreBase is not a standalone graph viewer.

It is the development environment itself.

---

# 23. WAITLIST SECTION

The page should end with a strong but simple waitlist section.

Suggested heading:

# Get early access to PreBase.

Suggested text:

**Join the waitlist for beta access and occasional product updates.**

Then the form.

---

# 24. WAITLIST FORM

Email must be the primary field.

Use:

### Required

`Email address`

Placeholder:

`you@domain.com`

### Optional

A small role selector:

`I'm a...`

Options:

* Developer
* Student
* Founder / Team
* Other

Do not require the role field.

Do not ask for:

* company size
* phone number
* full company profile
* multiple unnecessary questions

The form should feel extremely low-friction.

---

# 25. FORM BUTTON

Button:

**Join the Waitlist**

While submitting:

**Joining...**

Disable repeated submissions while the request is active.

---

# 26. FORM SUCCESS STATE

After a successful request, keep the user on the same page.

Animate in a small success message directly beneath the form.

Use a simple green checkmark.

Text:

**You're on the list. We'll keep you posted.**

Do not open a modal.

Do not redirect the user to another page.

---

# 27. FORM ERROR STATE

If submission actually fails, show a small red X and:

**Something went wrong. Please try again.**

For invalid email:

**Enter a valid email address.**

Do not use browser alerts.

Do not show raw server errors.

---

# 28. ACCESSIBILITY FOR FORM STATUS

Use an appropriate `aria-live` region for:

* success
* validation errors
* submission errors

Ensure the form can be fully operated with a keyboard.

---

# 29. GOOGLE SHEETS + GOOGLE APPS SCRIPT INTEGRATION

This is important.

I specifically want the waitlist designed so I can connect it to a **Google Sheet using Google Apps Script** without needing Supabase or another database.

Do NOT add Supabase.

Do NOT add Firebase.

Do NOT add an unnecessary backend platform.

The default waitlist architecture is:

**PreBase website → Google Apps Script Web App → Google Sheet**

---

# 30. CONFIGURABLE ENDPOINT

Create an environment variable such as:

`VITE_WAITLIST_ENDPOINT`

Do not hardcode my Apps Script deployment URL into a component.

Create:

`.env.example`

containing something similar to:

`VITE_WAITLIST_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

The application should read the endpoint from environment configuration.

Centralize this logic rather than reading environment variables throughout unrelated components.

---

# 31. WAITLIST SUBMISSION MODULE

Create a small reusable helper for waitlist submission.

For example:

`src/lib/waitlist.ts`

or whatever location best fits the existing project structure.

It should:

1. validate the fields
2. construct the payload
3. submit to the Apps Script URL
4. manage timeout/error handling
5. return a typed result
6. never expose implementation details to the user

Keep the implementation small.

---

# 32. DATA SENT TO GOOGLE SHEETS

Send only simple useful information.

Suggested fields:

* `email`
* `role`
* `source`
* `utm_source`
* `utm_medium`
* `utm_campaign`
* `utm_content`
* `utm_term`
* `page_url`
* `referrer`

Set:

`source = prebase-launch-site`

The server-side Apps Script should generate the authoritative submission timestamp.

Do not collect invasive tracking information.

Do not collect fingerprinting data.

Do not collect precise location.

Do not require analytics software.

---

# 33. UTM TRACKING

On page load or form submission, read UTM parameters from the current URL when present.

Support:

* `utm_source`
* `utm_medium`
* `utm_campaign`
* `utm_content`
* `utm_term`

Send empty strings when they are unavailable.

This allows me to see where waitlist signups originated directly in Google Sheets.

---

# 34. REFERRER

Capture:

`document.referrer`

when available.

Also include the current page URL.

Keep this basic.

---

# 35. SPAM PROTECTION

Add a hidden honeypot field.

For example:

`website`

or another innocuous field.

Real users should never interact with it.

If it contains a value, reject the submission silently.

Do not add CAPTCHA at this stage.

---

# 36. GOOGLE APPS SCRIPT FILE

Inside the project, create a documentation/example file such as:

`docs/google-apps-script.gs`

This should contain the complete Google Apps Script I can copy into Google Apps Script.

It should implement:

`doPost(e)`

and write submissions into the Google Sheet.

The script should be production-conscious but simple.

---

# 37. GOOGLE APPS SCRIPT REQUIREMENTS

The generated Apps Script should:

### Accept the request

Read the incoming submitted parameters.

Support the form payload sent by the website.

Prefer a request format that avoids unnecessary browser preflight complexity.

A standard form-encoded POST is acceptable.

---

### Validate email

Reject malformed email addresses.

Normalize email to lowercase before deduplication.

Trim whitespace.

Enforce reasonable length limits.

---

### Reject honeypot submissions

If the hidden honeypot is populated:

do not save the entry.

---

### Prevent spreadsheet formula injection

Sanitize user-provided values before adding them to Google Sheets.

If a submitted string begins with spreadsheet formula characters such as:

`=`

`+`

`-`

`@`

ensure it cannot execute as a spreadsheet formula.

---

### Prevent obvious duplicates

Check whether the normalized email address already exists.

If it does, return a successful-style response indicating that the user is already registered rather than inserting another identical row.

Do not create dozens of duplicate entries for someone pressing the button repeatedly.

---

### Handle concurrent requests

Use Apps Script locking where appropriate so two simultaneous submissions do not corrupt or duplicate rows unnecessarily.

Keep the locking implementation simple.

---

# 38. GOOGLE SHEET STRUCTURE

The Apps Script should create or expect a sheet called:

`Waitlist`

Suggested columns:

1. Timestamp
2. Email
3. Role
4. Source
5. UTM Source
6. UTM Medium
7. UTM Campaign
8. UTM Content
9. UTM Term
10. Referrer
11. Page URL

The script may create the header row if it does not already exist.

Use the Google Apps Script server timestamp rather than trusting the visitor's local clock.

---

# 39. APPS SCRIPT RESPONSE

Return a small JSON response with values such as:

Success:

`{ "ok": true, "status": "created" }`

Duplicate:

`{ "ok": true, "status": "already_registered" }`

Failure:

`{ "ok": false, "status": "error" }`

Do not return sensitive spreadsheet information.

Do not return sheet IDs.

---

# 40. WAITLIST SETUP DOCUMENTATION

Create:

`docs/WAITLIST_SETUP.md`

Make the instructions extremely simple.

It should tell me exactly how to:

1. Create a Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste the generated `google-apps-script.gs` code.
4. Configure the sheet if necessary.
5. Choose **Deploy → New deployment**.
6. Select **Web app**.
7. Configure it to execute under the script owner as appropriate.
8. Allow the intended public website requests.
9. Copy the resulting `/exec` deployment URL.
10. Put that URL in:
    `VITE_WAITLIST_ENDPOINT`
11. Redeploy the website.
12. Test a signup.
13. Confirm that the row appears in the Sheet.

Also explain how to redeploy the Apps Script if its source code is changed later.

Assume I want this setup to take only a few minutes.

---

# 41. DO NOT PRETEND SUBMISSION WORKED

If no waitlist endpoint has been configured, do not silently discard emails while showing a production success state.

For development only, an optional explicitly enabled mock mode is acceptable.

Example:

`VITE_WAITLIST_MOCK=true`

But production should default to real submission behavior.

---

# 42. FOOTER

Keep the footer minimal.

Left:

PreBase logo / wordmark.

Possible line:

**Built for developers and the agents that work with them.**

Right:

* Product
* Waitlist

Optional:

`© PreBase`

Do not create a giant sitemap.

---

# 43. MOTION SYSTEM

Create a shared motion system rather than inventing different transitions for every component.

Use several reusable concepts:

### Reveal

Opacity:

`0 → 1`

Y translation:

approximately `16–24px → 0`

Optional blur:

approximately `8px → 0`

### Stagger

Approximately:

`60–120ms`

between related elements.

### Hover

Approximately:

`150–250ms`

### Major visual transition

Approximately:

`500–900ms`

Use polished easing or restrained spring physics.

---

# 44. REDUCED MOTION

Respect:

`prefers-reduced-motion: reduce`

When enabled:

* remove parallax
* remove long graph transitions
* remove continuously moving backgrounds
* replace dramatic reveals with simple opacity transitions
* preserve all information and usability

This is required.

---

# 45. PERFORMANCE

Animations should not make the website slow.

Prefer:

* transform
* opacity
* SVG
* Intersection Observer
* Motion values

Avoid:

* excessive blur over huge surfaces
* giant canvases
* dozens of requestAnimationFrame loops
* unnecessary WebGL
* huge particle systems
* expensive mouse listeners updating React state on every pointer event

If pointer position must animate something, use performant motion values or requestAnimationFrame rather than causing full component rerenders.

---

# 46. MOBILE EXPERIENCE

The mobile site must feel intentionally designed, not merely stacked.

On mobile:

* reduce hero text size appropriately
* place buttons in a comfortable layout
* simplify pointer-only motion
* retain scroll reveals
* simplify the graph while preserving the concept
* make the Temporal timeline readable
* stack form fields
* ensure the email field and button are easy to tap
* keep text comfortably readable
* prevent horizontal overflow

Do not completely remove the core graph experience on mobile.

Simplify it.

---

# 47. RESPONSIVE BREAKPOINT REVIEW

Explicitly review at approximately:

* 375px
* 430px
* 768px
* 1024px
* 1440px
* 1728px

Fix layout issues instead of simply relying on default Tailwind breakpoints.

---

# 48. ACCESSIBILITY

Implement:

* semantic HTML
* correct heading order
* keyboard-accessible navigation
* visible focus styles
* sufficient color contrast
* form labels
* `aria-live` for form status
* reduced-motion support
* no important information conveyed only through color

Decorative graph elements should not create a terrible screen-reader experience.

Hide purely decorative SVG/canvas content from assistive technologies where appropriate.

Provide nearby textual descriptions containing the important information.

---

# 49. SEO / PAGE METADATA

Configure appropriate metadata.

Suggested title:

**PreBase — The Codebase Mapping IDE**

Suggested description:

**PreBase is a codebase mapping IDE that helps developers visualize repository structure, explore changes through Git history, and give AI agents deeper codebase context.**

Configure:

* title
* meta description
* Open Graph title
* Open Graph description
* favicon using the real PreBase asset if available

Do not keyword-stuff the page.

---

# 50. CODE QUALITY

Stay within the existing Lovable project stack.

If the project already uses React + TypeScript + Tailwind, keep using it.

Do not migrate frameworks unnecessarily.

Use reusable components, but do not overengineer.

Possible structure:

`components/Navbar`

`components/Hero`

`components/ProductGraph`

`components/ProductStory`

`components/IdeStrip`

`components/Waitlist`

`components/Footer`

That is enough.

Do not create an enormous component hierarchy for a one-page website.

---

# 51. DEPENDENCIES

Before installing a library, check whether the project already has something capable of doing the job.

If Motion / Framer Motion is already available, use it.

If not, adding a single reputable animation library is acceptable if it materially simplifies the implementation.

Do not install five different UI animation libraries.

Do not install an entire component library just to use one shine effect.

Recreate small effects locally when doing so is simpler.

---

# 52. PRODUCT VISUALS SHOULD BE CUSTOM

Do not solve the design by importing 15 prebuilt animated components and assembling them.

The motion libraries are inspiration.

The visual identity should specifically communicate:

* repositories
* dependencies
* Git history
* graph relationships
* development
* agent context

The site should look like **PreBase**.

Not like a Magic UI demo.

Not like an Aceternity demo.

Not like a generic Lovable template.

---

# 53. ONE SIGNATURE INTERACTION

If time is spent polishing one thing beyond everything else, spend it on the transition:

**Network Graph → Temporal Graph → Agent Context**

That should become the memorable visual idea of the website.

Someone should be able to scroll through that area and understand the PreBase thesis without reading five paragraphs.

---

# 54. COPY STYLE

All copy should feel written by a real developer-product company.

Use:

* concise sentences
* simple language
* specific product terminology
* confident but restrained claims

Avoid phrases such as:

* "revolutionize your workflow"
* "supercharge your productivity"
* "unlock the power of AI"
* "seamlessly revolutionize"
* "the future of coding is here"
* "next-generation"
* "game-changing"
* "cutting-edge"
* "empower developers"
* "effortlessly transform"
* "where innovation meets..."
* "unleash your potential"

Avoid em-dash-heavy AI-generated marketing prose.

Do not sound like ChatGPT.

---

# 55. TARGET PAGE FLOW

The final experience should approximately feel like this:

## Screen 1

PreBase navbar

`PREBASE · EARLY ACCESS`

# The codebase mapping IDE.

Short explanation.

Join Waitlist

Explore PreBase

Animated IDE / Network Graph underneath.

---

## Screen 2

Graph becomes the main visual.

Copy:

### Map the system.

Repository structure and dependencies become visible.

---

## Screen 3

Same graph begins changing.

Timeline appears.

Copy:

### See change over time.

Temporal Graph explanation.

---

## Screen 4

Relevant graph nodes highlight and flow toward Agents.

Copy:

### Work with context.

Agent-context explanation.

Then compact:

### Still an IDE.

Editor / Terminal / Source Control / Runtime Preview / Extensions.

---

## Final Screen

# Get early access to PreBase.

Short copy.

Email.

Optional role.

Join the Waitlist.

Success/error state.

Minimal footer.

That is the complete website.

Do not pad it beyond this unless a small addition materially improves the design.

---

# 56. VISUAL REVIEW PASS

After implementing the initial version, perform a visual review yourself.

Look specifically for:

* sections that are too tall
* generic-looking cards
* awkward empty space
* inconsistent border radii
* text that is too long
* weak hierarchy
* motion that is too aggressive
* motion that feels cheap
* excessive gradients
* repetitive animation
* desktop layouts that collapse poorly
* mobile graph problems
* low-contrast text
* buttons that feel generic
* anything that screams "AI-generated landing page"

Then fix those issues.

Do not simply finish the first implementation and stop.

---

# 57. FUNCTIONAL REVIEW PASS

Verify:

* all navigation links work
* smooth-scroll destinations are correct
* waitlist CTA goes to the form
* Explore PreBase goes to the product section
* email validation works
* role remains optional
* honeypot works
* submit loading state works
* duplicate clicking is prevented
* success state works
* failure state works
* UTM data is captured
* referrer is captured
* endpoint comes from configuration
* no endpoint is hardcoded
* Apps Script documentation exists
* Apps Script source exists
* no Supabase dependency was added
* there are no console errors
* there is no horizontal overflow
* reduced-motion mode works
* mobile navigation works

---

# 58. PERFORMANCE REVIEW

Keep the page light.

Aim for excellent perceived performance and strong Lighthouse scores.

Do not sacrifice responsiveness just to include a fancy effect.

Pause or stop decorative animations when:

* offscreen
* page is hidden
* reduced motion is enabled

Lazy-load large media if actual screenshots/videos are added.

---

# 59. FINAL QUALITY BAR

The website should leave the visitor with three very clear ideas:

### 1.

**PreBase maps my codebase.**

### 2.

**PreBase can show how that map changes through Git history.**

### 3.

**PreBase gives AI agents that structural context inside an actual IDE.**

If those three ideas are not obvious after viewing the page for approximately 30 seconds, revise the page.

---

# 60. MOST IMPORTANT PRIORITIES

When making tradeoffs, use this order:

1. Clear explanation of PreBase
2. Strong visual graph storytelling
3. Premium restrained design
4. Smooth scroll-driven motion
5. Working waitlist
6. Easy Google Sheets integration
7. Mobile responsiveness
8. Accessibility
9. Performance
10. Extra decoration

Extra decoration is the lowest priority.

---

# 61. FINAL INSTRUCTION

Do not respond with only a plan.

Inspect the existing Lovable project and assets, make the necessary implementation decisions, and **build the complete website now**.

Work through:

**inspect → plan → implement → run → visually review → test → fix → polish**

Continue iterating on repository-controlled problems until the launch page is genuinely finished.

The final product should feel:

**minimal, technical, confident, interactive, and unmistakably built for developers.**

It should look impressive when someone first opens it, but the reason it looks impressive should be **clarity, motion, typography, and the PreBase product visualization**, not decorative excess.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://prebase1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/afe7ce45-6f76-4184-a222-f7dbf1e42d52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
