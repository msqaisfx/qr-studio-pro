# Final Export Matrix

Payload: `https://msqaisfx.github.io/qr-studio-pro/`

| Format | Online decode | Offline decode | Online/Offline bytes identical | Online/Offline SHA identical |
|---|---|---|---|---|
| PNG | PASS | PASS | Yes | Yes |
| SVG | PASS | PASS | Yes | Yes |
| WebP | PASS | PASS | Yes | Yes |
| JPEG | PASS | PASS | Yes | Yes |
| PDF | PASS | PASS | Yes | No* |

تم فتح الملفات الفعلية: PNG مباشرة؛ WebP/JPEG بعد raster conversion؛ SVG عبر browser rendering؛ PDF بعد rasterizing الصفحة الأولى. كل صيغة أعادت Payload مطابقًا.

\* اختلاف SHA في PDF متوقع لأن مولد PDF يضم metadata متغيرة، بينما الحجم والمحتوى المرئي وفك الـPayload متطابقة. لا يوجد اختلاف في PNG/SVG/WebP/JPEG.

التفاصيل وSHA موجودة في `export-matrix/online/verification.json` و`export-matrix/offline/verification.json`.
