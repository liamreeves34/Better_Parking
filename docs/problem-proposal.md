# Problem Proposal: UTRGV Parking Services Page

Oct 18, 2026 · Liam Reeves

## Cover Page (APA)

**Improving the Live Parking Occupancy Section of the UTRGV Parking Services Website**

[Student name(s)]\
[Department], The University of Texas Rio Grande Valley\
[Course number and name]\
[Instructor name]\
[Due date]

## Problem Statement

The live parking occupancy section of the UTRGV Parking Services website shows confusing and incomplete information to drivers who need to find a space quickly. The section stacks seven tall lot cards in the page's narrow left sidebar. Every occupancy bar is green, even when a lot is 100% full. The cards also give no directions or map link, and they cover only 7 lots (about 3,600 of the university's almost 11,000 spaces). During peak arrival times before morning classes, these design flaws lead to wasted laps around full lots, late arrivals, and frustration for commuters who check the page on their phones. The section also pushes the page's core content (permits, citations, and policies) far down the page.

## Target Audience & User Persona

- **Primary Users:** Students who drive to the Edinburg, Brownsville, and Harlingen campuses. This includes commuters with back-to-back classes, student workers, and people who use screen readers, screen magnification, or high-contrast settings. Faculty, staff, and visitors parking for evening events are secondary users.
- **Key Stakeholders:** UTRGV Parking & Transportation Services, which owns the page, the permit zones, and the lot information. Also the UTRGV web and IT teams who maintain the site and the live occupancy feed.
- **User Persona Summary:** "Daniel" is a sophomore who commutes from Pharr for a 9:00 AM class and has red-green color blindness. Daniel checks the page on a phone just before leaving home and needs to tell at a glance which nearby Zone 2 lot still has spaces and how to get there.

## Operational Impact & Usability Friction Points

- **Misleading Status Signals:** Every occupancy bar renders green, even for lots at 100%, because the meter's "high" threshold is set above its maximum. Stale counts are not flagged either: in one capture, Lot E26 read "Updated as of 7:50 AM" while the other lots read 12:37 PM. If the live feed fails, the script stops with an error and shows no message.
- **Buried, Hard-to-Scan Layout:** The seven cards add roughly 1,400 pixels of scrolling to the sidebar and push Contact Us to the bottom. On a phone the cards load before the page's main content, so Overview, permits, and citations start about 2,900 pixels down.
- **No Path to the Lot:** Each lot is described only in text (for example, "Across UREC"), with no directions or map link. Lots without live counts are not listed at all, and the parking-zone maps sit in a separate list further down the page.

## Proposed Research & Methodology

To gather evidence for the recommendation report, the following user research methods will be conducted during Weeks 1–2.

1. **Observational Usability Audits:** Conduct timed task-completion audits with 5 commuter students on their own phones, attempting 3 key tasks: finding a Zone 2 lot with open spaces, getting directions to that lot, and judging whether its count is current.
2. **User Interviews:** Interview 3–4 students and staff who drive to campus regularly to document how they choose a lot, the workarounds they use (circling lots, asking friends, navigation apps), and their accessibility needs.
3. **Heuristic & Accessibility Evaluation:** Audit the section against the Nielsen Norman Group's 10 usability heuristics and WCAG 2.2 AA. Use an automated checker (axe-core) plus manual keyboard, screen-reader, and Windows High Contrast testing.
