# Real-device QR testing guide

Run this checklist before distributing or printing a production QR code. These tests are intentionally manual and were not claimed as executed by the automated Phase 08 suite.

## Device coverage

- Recent iPhone using the Camera app and at least one independent scanner.
- Recent Android phone using the Camera app or Google Lens and an independent scanner.
- One older or lower-spec device when the audience may use it.
- Test the actual final display or printed artifact, not a screenshot of the editor.

## Screen procedure

1. Show the final image at its intended physical size and brightness.
2. Test normal indoor light, bright light or glare, and dim light.
3. Scan straight on, then at moderate angles and distances.
4. Verify the decoded content character-for-character, including Arabic, punctuation, Wi-Fi credentials, and long URLs.
5. Repeat on both light and dark surrounding surfaces when transparency is used.

## Print procedure

1. Print from the exported file without crop, stretch, compression, or “fit to edge”.
2. Preserve the four-module quiet zone and measure the final physical QR size.
3. Test the intended paper, printer, ink, finish, and lamination. Gloss and folds can create glare or distortion.
4. Scan from the expected user distance under several lighting conditions.
5. Repeat after realistic handling, scaling, or copying if the code will be reproduced.

## Record

For every test, record: export format and dimensions, payload type, design preset, logo size, error-correction level, device/model, operating system, scanner app, medium, physical size, lighting, distance, angle, result, decoded value, and notes. Any mismatch is a release blocker; intermittent or slow scans require design simplification and another complete test cycle.
