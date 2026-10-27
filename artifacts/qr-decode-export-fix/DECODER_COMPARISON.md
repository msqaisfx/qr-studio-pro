# Decoder comparison

Readers:

- jsQR 1.4.0
- ZXing browser 0.2.1 / ZXing library 0.21.3

Policy:

| Evidence | Result |
| --- | --- |
| Either reader returns the expected UTF-8 payload | PASS |
| Any reader returns a different payload | FAIL |
| Both independent readers complete and neither decodes | FAIL |
| Only one reader completes, or decoder infrastructure is unavailable | UNKNOWN |

Regression tests cover second-reader recovery, payload mismatch, confirmed dual-reader failure, and decoder infrastructure failure. The 32-case real-logo matrix recorded 13 confirmed dual-reader failures, 11 readable cases with warnings, and 8 clean valid cases.
