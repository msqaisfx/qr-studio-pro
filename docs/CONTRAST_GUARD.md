# Contrast Guard methodology

Phase 04 uses the sRGB relative-luminance formula to estimate the contrast ratio between every QR foreground color stop and the selected background. The displayed value is the lowest ratio found across the body, corner-square, and corner-dot colors.

For gradients, every configured stop participates in the calculation. A transparent background is reported as unknown because the destination surface is outside QR Studio Pro's control.

The thresholds are intentionally advisory: `4.0:1` is shown as strong, `2.5:1` to `3.99:1` as moderate, and lower values as a warning. They are not presented as WCAG certification or as proof that a QR code will scan. Actual exported-image decode tests remain a separate quality gate.
