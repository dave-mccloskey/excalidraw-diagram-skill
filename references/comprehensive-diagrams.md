# Comprehensive / technical diagrams

Read this when Step 0 says the diagram is technical rather than conceptual.

---

## Research Mandate (For Technical Diagrams)

**Before drawing anything technical, research the actual specifications.**

If you're diagramming a protocol, API, or framework:
1. Look up the actual JSON/data formats
2. Find the real event names, method names, or API endpoints
3. Understand how the pieces actually connect
4. Use real terminology, not generic placeholders

Bad: "Protocol" → "Frontend"
Good: "AG-UI streams events (RUN_STARTED, STATE_DELTA, A2UI_UPDATE)" → "CopilotKit renders via createA2UIMessageRenderer()"

**Research makes diagrams accurate AND educational.**

---

---

## Evidence Artifacts

Evidence artifacts are concrete examples that prove your diagram is accurate and help viewers learn. Include them in technical diagrams.

**Types of evidence artifacts** (choose what's relevant to your diagram):

| Artifact Type | When to Use | How to Render |
|---------------|-------------|---------------|
| **Code snippets** | APIs, integrations, implementation details | Dark rectangle + syntax-colored text (see color palette for evidence artifact colors) |
| **Data/JSON examples** | Data formats, schemas, payloads | Dark rectangle + colored text (see color palette) |
| **Event/step sequences** | Protocols, workflows, lifecycles | Timeline pattern (line + dots + labels) |
| **UI mockups** | Showing actual output/results | Nested rectangles mimicking real UI |
| **Real input content** | Showing what goes IN to a system | Rectangle with sample content visible |
| **API/method names** | Real function calls, endpoints | Use actual names from docs, not placeholders |

**Example**: For a diagram about a streaming protocol, you might show:
- The actual event names from the spec (not just "Event 1", "Event 2")
- A code snippet showing how to connect
- What the streamed data actually looks like

**Example**: For a diagram about a data transformation pipeline:
- Show sample input data (actual format, not "Input")
- Show sample output data (actual format, not "Output")
- Show intermediate states if relevant

The key principle: **show what things actually look like**, not just what they're called.

---

---

## Multi-Zoom Architecture

Comprehensive diagrams operate at multiple zoom levels simultaneously. Think of it like a map that shows both the country borders AND the street names.

### Level 1: Summary Flow
A simplified overview showing the full pipeline or process at a glance. Often placed at the top or bottom of the diagram.

*Example*: `Input → Processing → Output` or `Client → Server → Database`

### Level 2: Section Boundaries
Labeled regions that group related components. These create visual "rooms" that help viewers understand what belongs together.

*Example*: Grouping by responsibility (Backend / Frontend), by phase (Setup / Execution / Cleanup), or by team (User / System / External)

### Level 3: Detail Inside Sections
Evidence artifacts, code snippets, and concrete examples within each section. This is where the educational value lives.

*Example*: Inside a "Backend" section, you might show the actual API response format, not just a box labeled "API Response"

**For comprehensive diagrams, aim to include all three levels.** The summary gives context, the sections organize, and the details teach.

### Bad vs Good

| Bad (Displaying) | Good (Arguing) |
|------------------|----------------|
| 5 equal boxes with labels | Each concept has a shape that mirrors its behavior |
| Card grid layout | Visual structure matches conceptual structure |
| Icons decorating text | Shapes that ARE the meaning |
| Same container for everything | Distinct visual vocabulary per concept |
| Everything in a box | Free-floating text with selective containers |

### Simple vs Comprehensive (Know Which You Need)

| Simple Diagram | Comprehensive Diagram |
|----------------|----------------------|
| Generic labels: "Input" → "Process" → "Output" | Specific: shows what the input/output actually looks like |
| Named boxes: "API", "Database", "Client" | Named boxes + examples of actual requests/responses |
| "Events" or "Messages" label | Timeline with real event/message names from the spec |
| "UI" or "Dashboard" rectangle | Mockup showing actual UI elements and content |
| ~30 seconds to explain | ~2-3 minutes of teaching content |
| Viewer learns the structure | Viewer learns the structure AND the details |

**Simple diagrams** are fine for abstract concepts, quick overviews, or when the audience already knows the details. **Comprehensive diagrams** are needed for technical architectures, tutorials, educational content, or when you want the diagram itself to teach.
