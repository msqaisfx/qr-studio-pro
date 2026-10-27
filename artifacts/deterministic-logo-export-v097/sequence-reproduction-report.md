# تقرير تسلسلات القبول A–J

Payload: `https://msqaisfx.github.io/qr-studio-pro/v097-deterministic`

- A: 35% مباشرة — WARNING، تنزيل وفك ناجح.
- B: 20% ثم تصدير ثم 35% — WARNING، تنزيل وفك ناجح.
- C: 25% ثم 35% — WARNING، تنزيل وفك ناجح.
- D: 35% ثم 20% ثم 35% — WARNING، تنزيل وفك ناجح.
- E: Reload ثم 35% — WARNING، تنزيل وفك ناجح.
- F: تغيير القسم والعودة — WARNING، تنزيل وفك ناجح.
- G: ECC M ثم H — WARNING، تنزيل وفك ناجح.
- H: تغيير Fusion والعودة — WARNING، تنزيل وفك ناجح.
- I: تغيير اللغة والثيم — WARNING، تنزيل وفك ناجح.
- J: Offline ثم Export — WARNING، تنزيل وفك ناجح.

كل الحالات النهائية المتكافئة أعطت:

- Configuration Hash: `daaec44fd8ab6fef`
- PNG SHA-256: `7f74f8bc5503b5411283643ce1ef913d42f8e0f6e73f09b670fbd03fccd1872a`
- الأبعاد: 512×512
- Quiet Zone: 9.50 modules
- Preview nodes: 1
- jsQR الخارجي: PASS
- دليل التطبيق: `decode:pass:payload-match:jsqr;readers:jsqr+zxing`

الحالة WARNING مقصودة بسبب تحذيرات المخاطر الهندسية لحجم شعار 35%، وليست نتيجة قديمة أو تجاوزًا للحماية. التفاصيل الخام في `sequence-verification.json`.
