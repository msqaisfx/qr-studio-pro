# QR Studio Pro

مصمم رموز QR احترافي ومفتوح المصدر، يركز على الخصوصية وتجربة استخدام نظيفة.

[![الجودة](https://github.com/msqaisfx/qr-studio-pro/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/msqaisfx/qr-studio-pro/actions/workflows/quality.yml)
[![ترخيص MIT](https://img.shields.io/github/license/msqaisfx/qr-studio-pro)](LICENSE)
[![أحدث إصدار](https://img.shields.io/github/v/release/msqaisfx/qr-studio-pro?include_prereleases)](https://github.com/msqaisfx/qr-studio-pro/releases)
[![PWA](https://img.shields.io/badge/PWA-installable-0b8f63)](https://msqaisfx.github.io/qr-studio-pro/)

> نسخة تجريبية عامة — الإصدار المستهدف 0.9.1-beta.1

[التطبيق](https://msqaisfx.github.io/qr-studio-pro/) · [المستودع](https://github.com/msqaisfx/qr-studio-pro) · [الإبلاغ عن مشكلة](https://github.com/msqaisfx/qr-studio-pro/issues)

![QR Studio Pro مع استوديو الشعار الذكي 2.0](artifacts/smart-logo-v2/readme-hero.jpg)

English documentation: [README.md](README.md)

## استوديو الشعار الذكي 2.0

- تحكم مستقل في حاوية الشعار وحجم الرسم المرئي والحشوة
- نمطا احتواء وتغطية يحافظان على النسبة دون تمديد أو تشويه
- قص الحواف الشفافة وإزالة الخلفية الموحدة المتصلة بالحواف محليًا
- أنماط نظيف ومتناغم وشارة مع الشكل والاستدارة واللون والشفافية
- مقارنة الأصل بالنتيجة والتراجع وإعادة الضبط وتحذير الدقة وفحص فك القراءة
- ترحيل بإصدار واضح يحافظ على الشعارات المضمنة في المشاريع القديمة

## المزايا

- إنشاء رموز QR فعلية للروابط والنصوص العربية والإنجليزية
- معاينة فورية وتصدير متحقق منه بصيغ PNG وSVG وWebP وJPEG وPDF
- العربية افتراضيًا مع RTL، والإنجليزية مع LTR
- الوضعان الداكن والفاتح
- واجهة استوديو احترافية ومتجاوبة تضم الأدوات والمعاينة ولوحة المعلومات
- ستة أنماط لوحدات QR وأشكال الزوايا وأحجام التصدير ومستويات L/M/Q/H
- منطقة هادئة محسوبة من أربع وحدات ودعم UTF-8 متحقق منه
- ألوان موحدة أو متدرجة ومستقلة للوحدات والزوايا، مع خلفية موحدة أو شفافة
- تسعة تصاميم لونية فعلية ومراقب استرشادي لتباين جميع نقاط التدرج
- معالجة محلية لشعارات PNG/JPEG/WebP مع القص وإزالة الخلفية والتحجيم الآمن وأنماط الدمج وحارس فك قراءة مستقل
- أحد عشر نوع محتوى بترميز محلي: موقع ونص وWi-Fi وvCard وواتساب وبريد وهاتف وSMS وموقع جغرافي وحدث وعملات رقمية
- استوديو تصدير موحد بأسماء آمنة ودقات 256–4096 بكسل وSVG وتحكم بالجودة والشفافية وإعدادات صفحات الطباعة
- حارس قراءة محلي بفك ترميز مستقل وفحص فعلي للمنطقة الهادئة والكثافة والتباين والشعار وأنماط الباحث وصيغة التصدير
- حالات صريحة PASS وWARNING وFAIL وUNKNOWN مع توصيات استرشادية ومنع التصدير عند الفشل أو تعذر التحقق
- مشاريع محلية بإصدارات داخل IndexedDB مع CRUD وبحث وترتيب وحفظ تلقائي اختياري وملفات JSON متحققة
- اثنا عشر قالبًا احترافيًا فعليًا وقابلًا للتعديل يحافظ على محتوى QR والشعار الحاليين
- تطبيق PWA قابل للتثبيت مع مسارات آمنة للاستضافة الفرعية وأيقونات أصلية وعمل دون اتصال وتحديث يتحكم به المستخدم
- توليد وتصميم وفحص وحفظ محلي وتصدير PNG/SVG/WebP/JPEG/PDF دون اتصال بعد التحميل الأول
- تحميل كسول لأدوات الاستوديو يقلل حزمة JavaScript الأولية
- خطا Inter وNoto Sans Arabic مضمنان محليًا
- خصوصية محلية: تتم معالجة الإدخال داخل المتصفح فقط
- فحص TypeScript وESLint واختبارات وحدات وبناء إنتاجي

## التشغيل المحلي

المتطلبات: Node.js 24 LTS وpnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

ثم افتح العنوان الذي يطبعه Vite. أوامر التحقق:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
# أثناء تشغيل خادم التطوير:
pnpm verify:phase04
pnpm verify:phase05
pnpm verify:phase06
pnpm verify:phase07
pnpm verify:phase08
pnpm verify:phase09
pnpm verify:phase10
pnpm verify:phase11
```

## لقطات فعلية

| قبل وبعد | النمط المتناغم | إزالة الخلفية |
| --- | --- | --- |
| ![قبل وبعد](artifacts/smart-logo-v2/before-after.jpg) | ![الشعار المتناغم](artifacts/smart-logo-v2/seamless-style.jpg) | ![الخلفية بعد الإزالة](artifacts/smart-logo-v2/background-removed.jpg) |

## PWA والخصوصية

يمكن تثبيت التطبيق من قائمة المتصفح بعد فتح [النسخة الحية](https://msqaisfx.github.io/qr-studio-pro/). بعد التخزين المؤقت تعمل الواجهة والمشاريع المحلية والتوليد وحارس القراءة والتصدير دون اتصال. تبقى بيانات QR والمشاريع والشعارات داخل المتصفح دون Analytics أو Tracking. يؤدي مسح بيانات الموقع إلى حذف مشاريع IndexedDB المحلية، ولا تنتقل المشاريع تلقائيًا بين النطاقات.

## خارطة الطريق والقيود المعروفة

توجد المراحل المنجزة وخارطة النسخة التجريبية في [docs/PHASES.md](docs/PHASES.md). نجاح فك القراءة الآلي دليل وليس ضمانًا لكل كاميرا أو سطح طباعة أو إضاءة. يتعامل مزيل الخلفية عمدًا مع الخلفيات شبه الموحدة المتصلة بالحواف؛ أما الخلفيات الفوتوغرافية المعقدة فتحتاج محررًا متخصصًا.

## نطاق المرحلة

لا يتضمن هذا الإصدار Backend أو قاعدة بيانات خادمية أو حسابات أو إحصائيات أو دفعًا أو QR ديناميكيًا أو إطارات. راجع [docs/PHASES.md](docs/PHASES.md) و[docs/PWA_AND_OFFLINE.md](docs/PWA_AND_OFFLINE.md) و[docs/LOCAL_PROJECTS.md](docs/LOCAL_PROJECTS.md) و[docs/SCAN_GUARD.md](docs/SCAN_GUARD.md).

## المساهمة والأمان

راجع [CONTRIBUTING.md](CONTRIBUTING.md) و[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) و[SECURITY.md](SECURITY.md) و[PRIVACY.md](PRIVACY.md) و[CHANGELOG.md](CHANGELOG.md) و[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) و[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md). توجد تعليمات إعداد GitHub والاستضافة في [GITHUB_SETUP.md](GITHUB_SETUP.md) و[DEPLOYMENT.md](DEPLOYMENT.md) و[CUSTOM_DOMAIN.md](CUSTOM_DOMAIN.md).

## الترخيص

MIT © 2026 Mohammed Qais Abdulghani — محمد قيس عبد الغني. راجع [LICENSE](LICENSE).
