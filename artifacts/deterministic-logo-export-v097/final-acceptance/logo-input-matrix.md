# Logo Input Matrix — Final Acceptance

تم اشتقاق العينات من أصل شعار MSQAISFX المعالج محليًا، دون تعديل الأصل. كل عينة رُفعت كملف حقيقي، ثم صُدّرت عند 512 و1024 و2048 و4096 بكسل.

| الإدخال | النوع الفعلي | 512 | 1024 | 2048 | 4096 | Aspect ratio range | Preview nodes |
|---|---|---|---|---|---|---|---:|
| Transparent PNG | image/png | PASS | PASS | PASS | PASS | 1.097–1.102 | 1 |
| JPEG | image/jpeg | PASS | PASS | PASS | PASS | 1.096–1.099 | 1 |
| WebP upload | image/webp | PASS | PASS | PASS | PASS | 1.097–1.102 | 1 |
| Low resolution 96×96 | image/png | PASS | PASS | PASS | PASS | 1.095–1.102 | 1 |
| Fine detail 1536×1536 | image/png | PASS | PASS | PASS | PASS | 1.093–1.100 | 1 |
| White background | image/png | PASS | PASS | PASS | PASS | 1.096–1.099 | 1 |
| Rectangular 1200×600 | image/png | PASS | PASS | PASS | PASS | 1.093–1.101 | 1 |

جميع الحالات الـ28 أعادت الأبعاد المطلوبة فعلًا، وفك jsQR متعدد الأحجام الـPayload المطابق. لم تظهر أخطاء Runtime أو overflow عند 375/768/1280/1920.

الشفافية بقيت مدعومة في PNG وWebP. القياس العالي يبدأ من أصل الإدخال، ولا يعيد تكبير preview سابقة. الشعار منخفض الدقة بقي قابلًا للفك لكنه لا يستعيد تفاصيل غير موجودة في مصدر 96px.

النتائج الخام وSHA-256 لكل ملف موجودة في مجلد `logo-matrix/<input>/verification.json`.
