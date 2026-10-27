# Decoder Results

- تسلسلات A–J: jsQR الخارجي PASS في كل سيناريو، ودليل التطبيق سجل `readers:jsqr+zxing` مع Payload match.
- مصفوفة الشعارات: 28/28 ملف PNG فعلي نجح بعد محاولات raster بالحجم الأصلي و1024 و768 و512.
- مصفوفة الصيغ Online: 5/5 PASS.
- مصفوفة الصيغ Offline: 5/5 PASS.
- سياسة التطبيق لم تتغير: نجاح قارئ واحد مع تطابق Payload يمر؛ فشل قارئين مكتملين يؤكد FAIL؛ تعذر تقني غير حاسم يبقى UNKNOWN.
- أضيف Regression يثبت أن مطابقة ZXing تتغلب على mismatch أولي من jsQR، بدل إيقاف التحقق مبكرًا.
