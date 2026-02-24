# RTL Support Assessment (Week 6.8)

Date: 2026-02-24

## Scope

- Current language system (`zh-CN`, `en`) and i18n setup
- Layout and spacing patterns in React/Tailwind components
- Third-party UI primitives and date-picker behavior

## Findings

1. Direction switching is not implemented at document level.
   - Current app does not set `document.documentElement.dir`.
   - Result: even if an RTL locale is added later, layout remains LTR.

2. Several components use directional utilities that are not RTL-safe.
   - Common patterns include `left/right` positioning and `ml/mr` spacing.
   - Result: visual alignment and spacing would break in RTL mode.

3. Iconography and motion direction are LTR-biased.
   - Some navigation and transition directions assume left-to-right flow.
   - Result: back/forward semantics can feel reversed in RTL locales.

4. No RTL regression coverage exists.
   - Playwright scenarios currently cover only existing `zh-CN/en` LTR behavior.
   - Result: future RTL rollout has no safety net.

## Recommendation

- Phase 1 (low risk): introduce document-level `dir` toggle and audit `left/right`, `ml/mr`, `pl/pr` usages.
- Phase 2 (medium): replace directional styles with logical alternatives (`start/end` or RTL variants).
- Phase 3 (high confidence): add one RTL locale (for example `ar`) in staging and run visual + E2E checks.
- Phase 4 (release gate): add RTL smoke tests for navigation, sidebar, task detail drawer, and settings.

## Conclusion

- RTL support is **not production-ready** yet.
- Estimated effort: ~2 to 4 development days plus 0.5 to 1 day for E2E/visual validation.
