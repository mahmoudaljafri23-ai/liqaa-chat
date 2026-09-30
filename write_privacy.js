const fs = require('fs');

const content = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سياسة الخصوصية - Loky Chat | لوكي شات</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Tajawal', system-ui, -apple-system, sans-serif; }
    body { background: #0c0d18; color: #e2e8f0; line-height: 1.8; padding: 30px 20px; }
    .container { max-width: 900px; margin: 0 auto; background: #131424; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 40px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    h1 { color: #ff8e53; font-size: 28px; margin-bottom: 8px; }
    .updated { color: #94a3b8; font-size: 14px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; }
    h2 { color: #38bdf8; font-size: 20px; margin-top: 28px; margin-bottom: 12px; }
    p, li { color: #cbd5e1; font-size: 15px; margin-bottom: 12px; }
    ul { margin-right: 25px; margin-bottom: 18px; }
    .highlight { background: rgba(56, 189, 248, 0.1); border-right: 4px solid #38bdf8; padding: 14px 18px; border-radius: 8px; margin: 18px 0; }
    .contact-box { background: rgba(255, 142, 83, 0.1); border: 1px solid rgba(255, 142, 83, 0.3); border-radius: 12px; padding: 22px; margin-top: 30px; text-align: center; }
    .contact-box a { color: #ff8e53; font-weight: bold; text-decoration: none; font-size: 16px; }
    .section-en { direction: ltr; text-align: left; margin-top: 50px; border-top: 2px dashed rgba(255,255,255,0.15); padding-top: 30px; }
    .section-en h1, .section-en h2 { text-align: left; }
    .section-en ul { margin-left: 25px; margin-right: 0; }
    .section-en .highlight { border-right: none; border-left: 4px solid #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <!-- ARABIC SECTION -->
    <div id="ar">
      <h1>🔒 سياسة الخصوصية لتطبيق لوكي شات (Loky Chat)</h1>
      <p class="updated">تاريخ آخر تحديث: 30 سبتمبر 2026</p>

      <div class="highlight">
        تحترم إدارة تطبيق <strong>Loky Chat (لوكي شات)</strong> خصوصية جميع مستخدميها ونلتزم التزاماً كاملاً بحماية بياناتك الشخصية وحقوقك وفق أعلى معايير الأمان وسياسات Google Play.
      </div>

      <h2>1. المعلومات التي نجمعها وكيفية استخدامها</h2>
      <p>يقوم تطبيق Loky Chat بجمع واستخدام البيانات الضرورية فقط لتقديم خدمة دردشة الفيديو العشوائية والمحادثات المباشرة:</p>
      <ul>
        <li><strong>الكاميرا والميكروفون (Camera & Microphone):</strong> نطلب إذن الوصول إلى الكاميرا والميكروفون لتمكين مكالمات الفيديو والصوت المباشرة بين المستخدمين (Peer-to-Peer) عبر بروتوكول WebRTC المشفر. <em>نحن لا نقوم بتسجيل أو تخزين أو حفظ أي مكالمات صوتية أو مرئية على أي خادم مطلقاً.</em></li>
        <li><strong>اسم المستخدم والصورة الرمزية (اختياري):</strong> لعرض اسمك للطرف الآخر أثناء المحادثة.</li>
        <li><strong>الموقع الجغرافي التقريبي (الدولة):</strong> يُستخدم لتحديد الدولة لتمكين الفلترة الجغرافية، ولا نصل إلى موقعك الدقيق عبر GPS.</li>
        <li><strong>معلومات الجهاز ومعرّف التثبيت:</strong> معرّفات تقنية عشوائية مجهولة الهوية لضمان استقرار الاتصال ومنع إساءة الاستخدام.</li>
      </ul>

      <h2>2. أمان وسرية المحادثات</h2>
      <p>تتم كافة مكالمات الفيديو عبر تقنية <strong>WebRTC</strong> المشفرة بين الطرفين مباشرة (End-to-End Encryption)، بحيث تنتقل البيانات بين هاتفك وهاتف الطرف الآخر دون المرور أو التخزين على خوادمنا.</p>

      <h2>3. عمليات الشراء والفوترة (In-App Purchases)</h2>
      <p>تتم عمليات شراء الجواهر داخل التطبيق عبر بوابات رسمية معتمدة وآمنة بنسبة 100% مثل Google Play Billing و PayPal. نحن لا نطلع ولا نخزن أي تفاصيل لبطاقات الدفع أو الحسابات البنكية.</p>

      <h2>4. الأمان وحماية المجتمع</h2>
      <p>يوفر التطبيق أداة إبلاغ فوري (Report) تتيح للمستخدمين التبليغ عن أي مخالفات أو سلوك غير لائق، وتتم مراجعة البلاغات يدوياً لضمان مجتمع آمن.</p>

      <h2>5. سياسة الفئات العمرية (18+)</h2>
      <p>تطبيق Loky Chat مخصص للبالغين فقط (18 عاماً فما فوق). لا نجمع بيانات القُصّر ويتم حذف أي حساب مخالف فوراً.</p>

      <h2>6. حذف الحساب والبيانات (Data Deletion)</h2>
      <p>يمكن للمستخدم حذف حسابه وبياناته فوراً وبشكل دائم من إعدادات التطبيق أو بمراسلتنا مباشرة على البريد الإلكتروني.</p>

      <div class="contact-box">
        <h3>للتواصل والاستفسارات حول الخصوصية</h3>
        <p>إذا كان لديك أي استفسار أو طلب حذف بيانات، تواصل مع المطور عبر البريد الإلكتروني:</p>
        <p><a href="mailto:mahmoud.aljafri23@gmail.com">mahmoud.aljafri23@gmail.com</a></p>
      </div>
    </div>

    <!-- ENGLISH SECTION -->
    <div id="en" class="section-en">
      <h1>🔒 Privacy Policy - Loky Chat</h1>
      <p class="updated">Last Updated: September 30, 2026</p>

      <div class="highlight">
        <strong>Loky Chat</strong> is committed to protecting your privacy and complying fully with Google Play Developer Policies.
      </div>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Camera & Microphone:</strong> Used exclusively to enable real-time WebRTC peer-to-peer video/audio chat. We NEVER record or store video/audio calls.</li>
        <li><strong>User Profile:</strong> Optional username and avatar for displaying to chat partners.</li>
        <li><strong>Approximate Location (Country):</strong> Country code used only for region matching. No precise GPS location is accessed.</li>
        <li><strong>Device Identifiers:</strong> Anonymous IDs used strictly for connectivity and anti-abuse protection.</li>
      </ul>

      <h2>2. Data Security & Encryption</h2>
      <p>All video calls utilize end-to-end encrypted WebRTC peer-to-peer technology. Direct data streams occur strictly between users.</p>

      <h2>3. In-App Purchases & Billing</h2>
      <p>In-app coin purchases are processed securely via official Google Play Billing and verified gateways. We do not process or store sensitive payment card credentials.</p>

      <h2>4. Community Safety & Reporting</h2>
      <p>Users have immediate access to report tools during calls to flag inappropriate conduct. All reports are manually moderated.</p>

      <h2>5. Age Policy (18+)</h2>
      <p>Loky Chat is strictly designed for adults aged 18 and older.</p>

      <h2>6. Account & Data Deletion</h2>
      <p>Users can permanently delete their account and associated data directly in-app or by contacting our support team below.</p>

      <div class="contact-box">
        <h3>Contact & Support</h3>
        <p>For privacy inquiries or deletion requests, email us at:</p>
        <p><a href="mailto:mahmoud.aljafri23@gmail.com">mahmoud.aljafri23@gmail.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('public/privacy.html', content, 'utf8');
fs.writeFileSync('privacy.html', content, 'utf8');
fs.writeFileSync('android/app/src/main/assets/public/privacy.html', content, 'utf8');
console.log('UTF-8 Privacy Policy written successfully!');
