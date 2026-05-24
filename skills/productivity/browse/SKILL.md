---
name: browse
description: "Real browser-based exploration using available browser automation. Navigate JS-rendered pages, extract rendered content, take screenshots, interact with forms. Tool-agnostic: Playwright MCP, Puppeteer, or Chrome DevTools Protocol."
---

## When To Use

- When content is JavaScript-rendered and `curl` or `fetch` returns an empty shell.
- When pages require authentication, cookies, or session state to access.
- When the user needs a screenshot of a page at a specific state or viewport size.
- When testing interactive flows: form submission, modal behavior, multi-step wizards.
- When debugging client-side rendering issues that don't appear in server responses.
- When the user says "open this page" or "show me what it looks like."

Related: `/qa-report` for structured browser QA with findings; `/design-review` for visual audit of rendered UI; `/canary` for post-deploy production page checks; `/benchmark` for Lighthouse performance measurement.

Do not use this skill for API requests or server-rendered content (use `curl`, `fetch`, or `gh api`). Do not use when no browser automation tool is available — report the gap and fall back to HTTP tools. Do not leave browser sessions open after the task completes.

## Core Stance

- Some answers only exist in rendered state — JavaScript-executed DOM, CSS-computed layouts, cookie-walled content, WebSocket-driven updates. The server response is not the page.
- Use the most lightweight browser tool available. Playwright MCP if the agent has it. Puppeteer if installed. CDP (Chrome DevTools Protocol) if Chrome is running with `--remote-debugging-port`. Command-line browsers only as last resort.
- Browser sessions are expensive — open, execute the task, extract evidence, close immediately. Never leave a browser session open between turns.
- Extract what's needed and close. Screenshot for visual evidence. `innerText` or `document.querySelector` for content. Network log for API debugging. Don't scrape more than needed.

## Research Backing

- **Playwright Documentation (Microsoft, 2024)** — cross-browser automation with auto-wait, network interception, and screenshot capabilities; designed for reliable end-to-end testing and exploration.
- **W3C WebDriver Specification** — standardized browser automation protocol; foundation for Selenium, Playwright, and Puppeteer compatibility.
- **Chrome DevTools Protocol** — low-level protocol for browser instrumentation; enables CDP-based tools to inspect DOM, capture screenshots, and monitor network activity without full WebDriver overhead.
- **Puppeteer Documentation (Google, 2024)** — headless Chrome automation; lighter-weight than Playwright for single-browser tasks.

## Process

1. **Detect available browser tool**
   - Check for Playwright MCP: attempt browser tool invocation; if available, prefer it.
   - Check for Puppeteer: `npx puppeteer --version` or check `node_modules/puppeteer`.
   - Check for CDP: `curl -s http://localhost:9222/json/version` — if Chrome is running with remote debugging.
   - If none available: report "No browser automation tool detected. Available: [list]. Falling back to HTTP-only." Use `curl` with `-H "User-Agent: Mozilla..."` as fallback, but flag all findings `[NO BROWSER — server response only]`.

2. **Open the URL**
   - Launch browser with appropriate viewport (desktop: 1280×720 or mobile: 375×812 per task).
   - Navigate to URL.
   - Wait for `networkidle` or equivalent signal that the page has finished loading.
   - If authentication is needed and credentials are available: fill login form and submit. If credentials are not available and the page is behind auth: report and stop.

3. **Perform the task**
   - **Extract text:** `document.body.innerText` or specific element `textContent`. Quote verbatim.
   - **Screenshot:** full page or specific element. Save to a path the user can access.
   - **Interact:** click buttons, fill forms, navigate — document each action so the result is reproducible.
   - **Network capture:** if debugging API calls, capture network requests and responses for the relevant XHR/fetch calls.

4. **Extract evidence**
   - Screenshots saved with descriptive names: `/tmp/browse-<page>-<timestamp>.png`.
   - Text content quoted in full (truncate only if >lines; note truncation).
   - Interactive results documented: "Clicked 'Submit' → page redirected to /dashboard. New title: 'Dashboard'."
   - Network requests: URL, method, status, response excerpt (first 200 chars of body).

5. **Close browser immediately**
   - Kill the browser process. Do not leave it running.
   - Confirm closure: no residual `chromium`, `chrome`, or `playwright` processes.

6. **Report** with the evidence collected, the tool used, and any limitations encountered.

## Operating Rules

- Always close the browser after extracting evidence. Never leave a session open — it consumes memory and can block ports.
- Do not browse to URLs the user didn't provide or approve. No link-following beyond the explicit task scope.
- Do not submit forms with real data (payments, PII, production user accounts) unless the user explicitly requests it for testing purposes.
- Screenshots are evidence, not decoration. Save to a known path and reference it in the output.
- If a page requires authentication and no credentials are provided, stop and report — do not try common passwords or attempt to bypass.
- If the page is behind a paywall, cookie wall, or legal wall, stop and report the barrier — do not attempt to bypass it.
- For pages that auto-play video or audio: mute the browser or use `--mute-audio` flag.
- If 3 navigation attempts fail (timeout, crash, 5xx): stop and report. Do not retry indefinitely.

## Output Format

Return a markdown report with these exact sections:

- Browser Tool Used (name + version)
- URL(s) Accessed
- Evidence Collected (screenshots, text quotes, interaction log)
- Network Activity (if captured: relevant XHR/fetch calls)
- Limitations (tool not available, auth required, render issues)
- Screenshot Paths (absolute paths)
- Recommended Next Step

## Example

### Browser Tool Used

Playwright MCP (Chromium 126)

### URL(s) Accessed

`https://example.com/pricing` — desktop viewport 1280×720

### Evidence Collected

**Screenshot:** `/tmp/browse-pricing-20260524-143000.png`
**Text extracted:** "Plans starting at $29/month. Enterprise: contact sales."
**Interaction:** Clicked "Compare plans" → table expanded with 3 tiers. New screenshot: `/tmp/browse-pricing-compare-20260524-143005.png`.

### Network Activity

- `GET /api/plans` — 200 — `{"plans": [{"name": "Starter", "price": 29}, ...]}`
- `POST /api/track?event=page_view` — 204

### Limitations

None — all content loaded, no auth required.

### Screenshot Paths

- `/tmp/browse-pricing-20260524-143000.png`
- `/tmp/browse-pricing-compare-20260524-143005.png`

### Recommended Next Step

Pricing page renders correctly. If visual audit needed: `/design-review`.
