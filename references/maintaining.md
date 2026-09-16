# Maintaining this skill

Nothing here is needed to draw a diagram. Read it only when changing the renderer, the share codec,
or the skill's brand style.

---

## Rebranding

All colors and brand-specific styles live in `color-palette.md`. Edit that one file and every
diagram follows. Everything else in this skill is universal design methodology and Excalidraw best
practices.

---

## The pinned excalidraw import — do not "simplify" it back

`render_template.html` pins its import:

```js
import { exportToSvg } from "https://esm.sh/@excalidraw/excalidraw@0.18.0?bundle&deps=react@19.0.0,react-dom@19.0.0";
```

The unpinned `@excalidraw/excalidraw?bundle` returns 200, which is what makes this expensive to
diagnose. But a transitive dependency, `@braintree/sanitize-url@6.0.2/es2022/dist/constants.mjs`,
returns 404. The ES module never finishes loading, `window.__moduleReady` never fires, and every
render dies at `Page.wait_for_function: Timeout 30000ms exceeded`. The symptom accuses Playwright;
the cause is a 404 three levels down the import graph.

Diagnose a recurrence the same way rather than guessing at the top-level URL: load the template in
Playwright with `page.on("requestfailed", ...)` and `page.on("console", ...)` attached, and read the
actual network failure.

---

## The share wire format

`excalidraw_share.mjs` implements this. It is easy to get subtly wrong, and the failure mode is
opaque — `unable to authenticate data`, with nothing saying which layer is at fault.

```
outer:  [u32 version=1][u32 len][fileInfo json][u32 12][iv][u32 len][ciphertext]
cipher: AES-128-GCM; key = the 16 bytes base64url-encoded as the second field of "#json=<id>,<key>"
plain:  zlib-deflated ("pako@1")
inner:  [u32 version=1][u32 len][metadata json][u32 len][scene json]
```

It is **not** a bare `[iv][ciphertext]`, and the frame nests twice. The fragment never reaches the
server, so `curl` on an `excalidraw.com/#json=...` page URL returns nothing useful: the blob lives at
`https://json.excalidraw.com/api/v2/<id>`, and the key only ever exists client-side.

### Verifying a change to the codec

Round-tripping through your own encoder and decoder proves nothing — a matched pair of bugs passes
it. Test against ground truth, in this order:

1. **Decode a link you did not create.** If `fetch` reads an existing share link from elsewhere, the
   framing is right.
2. **Publish, then open the result in a real browser** and screenshot it. This is the only check that
   covers the whole path the human actually walks.
