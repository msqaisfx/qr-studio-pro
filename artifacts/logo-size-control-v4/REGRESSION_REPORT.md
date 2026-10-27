# Logo Size Control V4 — Regression Report

التاريخ: 2026-10-27

## النتيجة

PASS محليًا للإصلاح المطلوب. لا يشمل ذلك ادعاء ضمان المسح على جميع الأجهزة الحقيقية.

## بوابات الشيفرة

- TypeScript: PASS
- ESLint: PASS
- Vitest: 90/90 PASS عبر 13 ملفًا
- Production Build: PASS، 238 modules transformed
- Runtime exceptions في اختبار المتصفح: 0
- `git diff --check`: PASS

## القبول البصري وفك القراءة

راجع `verification.json`. أنتجت الأحجام 10/15/20/25/30/35 ستة SHA-256 مختلفة. زادت حدود الشعار المرئي بصورة متدرجة، وحافظت نسبة أبعاده المقاسة على نطاق 1.088–1.118. نجح Decoder المستقل في 6/6.

## التصدير

PNG وSVG وWebP وJPEG وPDF: 5/5 PASS بعد فتح الملفات الفعلية؛ حُوّلت WebP/JPEG إلى pixels، صُيّر SVG، وصُيّرت صفحة PDF، ثم فُك QR من الناتج.

## PWA / Offline / Persistence

- Offline navigation وQR generation وعمليات المشاريع في IndexedDB والتصدير بخمس صيغ: PASS.
- بقاء المشروع بعد دورة Service Worker: PASS.
- لا أخطاء Runtime ولا تسريب للقيم الحساسة في Console.
- تقرير Phase 10 التشخيصي سجّل Scan Guard = FAIL لحالة الضغط التجريبية الخاصة به؛ لم يُحوّل إلى PASS. هذه الحالة منفصلة عن عينات الشعار الست المعتمدة، التي نجحت 6/6.

## Responsive

375px و768px و1280px و1920px: PASS دون overflow أفقي.

## قيود

- لقطة QR المرجعية المنشورة غير متاحة في المهمة الحالية.
- نجاح Decoder آلي واحد لا يضمن كل كاميرا أو إضاءة أو مادة طباعة.
- عند الأحجام الكبيرة تبقى منطقة مركزية خالية من وحدات QR لحماية الشعار؛ تعرض الواجهة تحذيرًا محافظًا ولا تغيّر الحجم اليدوي.
