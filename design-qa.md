# CozyFlat Garden Design QA

- Source visual truth: `C:/Users/hornu/.codex/codex-remote-attachments/01a03820-aa79-7c40-aade-e4df34b3e522/59E71798-824A-4FC1-9276-050CF82BAC09/1-Eingefügtes-Bild-1.jpg`
- Implementation screenshot: `C:/Users/hornu/.codex/.chatgpt-projects/g-p-6a5e249cacd88191ac9dd9b9ee51490e/giessrunde/implementation-mobile-garden.png`
- Combined comparison: `C:/Users/hornu/.codex/.chatgpt-projects/g-p-6a5e249cacd88191ac9dd9b9ee51490e/giessrunde/design-qa-comparison.png`
- Viewport: 393 × 852 CSS px, device scale factor 1
- Source pixels: 588 × 1280, normalized to 393 × 852 for comparison
- Implementation pixels: 393 × 852
- State: Wohnzimmer, one stage-1 orchid, Staubi with login streak

## Full-view comparison evidence

The room keeps the source composition, crop, palette, spacing rhythm, typography and fixed bottom navigation. The corrected implementation uses the room image's exact 1009:1559 ratio, so shelf and bed coordinates no longer drift across phone widths.

## Focused region comparison evidence

The plant base now lands on the top shelf surface. Staubi's body is centered inside the green bed and no longer overlaps the foreground chair. The focused room region was required because these object-to-surface relationships were the reported failure.

## Comparison history

- Earlier P1: Staubi was positioned in front of the chair instead of inside the bed. Fixed by replacing cascading breakpoint offsets with a single bottom-center anchor at the bed.
- Earlier P1: Several duplicate mobile rules overrode each other, making placement unpredictable. Fixed by removing the conflicting rules and using one room-coordinate system.
- Earlier P2: Plant sizing and placement mixed canvas scaling with stage scaling. Fixed by using normalized transparent stage canvases and one shelf anchor per slot.
- Post-fix evidence: `design-qa-comparison.png` shows the orchid on the shelf and Staubi inside the bed at the 393 × 852 viewport.

## Required fidelity surfaces

- Fonts and typography: unchanged from the existing CozyFlat design; hierarchy and wrapping remain consistent.
- Spacing and layout rhythm: room aspect ratio is exact; scene objects are stable relative to the raster background.
- Colors and visual tokens: existing cream, sage and dark-green system preserved.
- Image quality and asset fidelity: original room art and transparent raster sprites retained without stretching or visible boxes.
- Copy and content: unchanged; local preview uses a fresh test state, so the displayed streak differs from production data by design.

## Primary interactions tested

- Opened the Garten navigation item.
- Selected Olli Orchidee in the local weekly choice.
- Confirmed the resulting collection card and in-room sprite.
- Checked browser console errors: none.

## Findings

No actionable P0, P1 or P2 findings remain for the tested Wohnzimmer state.

## Follow-up polish

- P3: Regenerate the remaining plant families in the same potted visual standard as Orchid and Monstera before they first appear in newly unlocked rooms.

final result: passed
