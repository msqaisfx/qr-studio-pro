# QR Decode & Export Validation — Root Cause

Date: 2026-10-27

## Confirmed causes

1. The validation path depended on one decoder (`jsQR`) and one bounded raster. A decoder miss was reported as a design failure even when the verification evidence was inconclusive.
2. `QRPreview`, Scan Guard and export validation used separate decoding implementations and therefore could disagree.
3. Technical verification errors were displayed as `FAIL`, making a transient decoder/rendering problem look like a defect in the user's design.
4. Some reported failures are genuine. With the supplied MSQAISFX logo, the tested URL, 512 px PNG and ECC M, 25%, 30% and 35% failed both jsQR and ZXing in every tested fusion style. These exports must remain blocked.

## Fix

- One shared multi-reader verification path now serves preview, Scan Guard and export.
- It tests the original image and several correctly resampled white-matted rasters.
- A matching payload from either reader is PASS; any decoded mismatch is FAIL; two completed independent readers with no decode is FAIL; incomplete/inconclusive verification is UNKNOWN.
- UNKNOWN is no longer displayed as a user design failure.
- A confirmed unsafe logo export remains blocked and offers an explicit, user-triggered safer action: logo 20% plus ECC H. Settings are never changed silently.

Automated decode success remains evidence for the tested raster, not a guarantee for every camera or device.
