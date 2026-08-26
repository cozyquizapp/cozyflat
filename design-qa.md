# CozyFlat Pflanzenzimmer – Design QA

- Source visual truth: `C:\Users\hornu\.codex\visualizations\2026\08\25\01a03820-aa79-7c40-aade-e4df34b3e522\cozyflat-plant-cabinet-preview.html`
- Source screenshot: `C:\Users\hornu\.codex\.chatgpt-projects\g-p-6a5e249cacd88191ac9dd9b9ee51490e\giessrunde\design-source-prototype.png`
- Implementation screenshot: `C:\Users\hornu\.codex\.chatgpt-projects\g-p-6a5e249cacd88191ac9dd9b9ee51490e\giessrunde\design-implementation-iphone.png`
- Combined comparison: `C:\Users\hornu\.codex\.chatgpt-projects\g-p-6a5e249cacd88191ac9dd9b9ee51490e\giessrunde\design-qa-css-garden-comparison.png`
- Viewport: 393 × 852 CSS px, iPhone portrait breakpoint
- Source pixels: 393 × 852
- Implementation pixels: 393 × 852
- Density normalization: equal CSS viewport and equal screenshot pixel dimensions; no resampling
- State: Wohnzimmer, one collected plant, zero waiting light motes, two preview plants, Flauschi idle

## Full-view comparison evidence

The combined comparison shows the selected warm cream/wood cabinet direction in both the prototype and real app. The implementation preserves the arched room, four niches, green caption, serif display hierarchy, fixed plant anchors, round Flauschi, and cream/forest/gold palette while retaining the real app's level badge, room count, bottom navigation, and live reward data.

## Focused comparison evidence

The Kalle Kaktus niche is large enough in the combined comparison to verify its base. Runtime inspection confirms the intended fixed stack: pot body z-index 2, soil 3, plant 4, front rim 5. The cactus rises from the soil and only its lowest edge is covered by the front rim. Flauschi's face contains only eyes and mouth; the earlier bright facial dots are gone.

## Required fidelity surfaces

- Fonts and typography: Georgia display headings and compact rounded sans-serif UI text preserve the prototype hierarchy. The production heading wraps one line earlier because the app also reserves room for live level data; this is intentional and readable.
- Spacing and layout rhythm: the mobile garden was widened from 290 px to 322 px inside the existing 393 px app shell. Niche spacing, rounded corners, caption placement, and bottom navigation clearances are consistent and do not overflow.
- Colors and visual tokens: warm cream, amber wood, forest green, muted sage, and gold match the selected prototype. Locked Pilea remains muted; Kalle stays full-color so its silhouette and pot relationship remain readable.
- Image quality and asset fidelity: the implementation uses the same code-native visual system as the approved runnable prototype, so there are no raster crop, sprite-sheet, white-box, or perspective mismatches.
- Copy and content: all visible garden copy uses “Aufgaben” and “Flauschi”. Light motes explicitly originate from completed tasks rather than passive hourly regeneration.

## Comparison history

### Pass 1 – blocked

- P2: the real app scene was only 290 px wide on a 393 px viewport, making the cabinet noticeably denser than the selected prototype.
- P2: the cactus preview was overly desaturated, reducing readability of its plant-to-pot anchor.

Fixes applied:

- Removed the redundant inner mobile margin so the garden scene renders at 322 px.
- Kept the preview label but restored Kalle's full color.
- Replaced the shared stacking context with four explicit layers: body, soil, plant, front rim.

### Pass 2 – passed

- Revised screenshot confirms the wider cabinet and readable cactus.
- No actionable P0, P1, or P2 mismatch remains.

## Interaction and runtime checks

- Garden mobile navigation opened the real section successfully.
- Flauschi button returned the expected feedback toast.
- Fresh-browser console error check: no errors.
- Production-data task completion was intentionally not triggered during visual QA.
- `npm run build`: passed.
- `npx tsc --noEmit`: passed.

## Follow-up polish

- P3: add more plant silhouettes only after each new species uses the same measured soil anchor and explicit four-layer pot structure.

final result: passed
