const fs = require('fs');

const childSafetyContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>معايير سلامة الأطفال ومكافحة الاستغلال - Loky Chat | لوكي شات</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Tajawal', system-ui, -apple-system, sans-serif; }
    body { background: #0c0d18; color: #e2e8f0; line-height: 1.8; padding: 30px 20px; }
    .container { max-width: 900px; margin: 0 auto; background: #131424; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 40px 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    h1 { color: #f87171; font-size: 26px; margin-bottom: 8px; }
    .updated { color: #94a3b8; font-size: 14px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; }
    h2 { color: #38bdf8; font-size: 20px; margin-top: 28px; margin-bottom: 12px; }
    p, li { color: #cbd5e1; font-size: 15px; margin-bottom: 12px; }
    ul { margin-right: 25px; margin-bottom: 18px; }
    .danger-box { background: rgba(239, 68, 68, 0.12); border-right: 4px solid #ef4444; padding: 16px 20px; border-radius: 8px; margin: 20px 0; }
    .contact-box { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 22px; margin-top: 30px; text-align: center; }
    .contact-box a { color: #38bdf8; font-weight: bold; text-decoration: none; font-size: 16px; }
    .section-en { direction: ltr; text-align: left; margin-top: 50px; border-top: 2px dashed rgba(255,255,255,0.15); padding-top: 30px; }
    .section-en h1, .section-en h2 { text-align: left; }
    .section-en ul { margin-left: 25px; margin-right: 0; }
    .section-en .danger-box { border-right: none; border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <!-- ARABIC VERSION -->
    <div id="ar">
      <h1>🛡️ معايير سلامة الأطفال ومكافحة الاستغلال - Loky Chat (لوكي شات)</h1>
      <p class="updated">المطور: <strong>Mahmoud Aljafri</strong> | تاريخ آخر تحديث: 6 أكتوبر 2026</p>

      <div class="danger-box">
        <strong>سياسة عدم التسامح المطلق (Zero Tolerance Policy):</strong><br>
        يحظر تطبيق <strong>Loky Chat (لوكي شات)</strong> والمطور <strong>Mahmoud Aljafri</strong> حظراً باتاً وقاطعاً أي شكل من أشكال <strong>الاعتداء الجنسي على الأطفال واستغلالهم (CSAE - Child Sexual Abuse and Exploitation)</strong> أو تداول أي مواد أو محتوى مرتبط بالاعتداء على الأطفال (CSAM). نلتزم التزاماً صارماً بتطبيق معايير سلامة الأطفال وحماية القُصّر وفق سياسات Google Play والقوانين الدولية.
      </div>

      <h2>1. حظر الاعتداء الجنسي على الأطفال واستغلالهم (CSAE / CSAM)</h2>
      <ul>
        <li>يُمنع منعاً باتاً نشر أو بث أو تبادل أو الترويج لأي مواد أو رسائل أو محادثات فيديو تتضمن أي إيحاء أو نشاط أو استغلال جنسي للأطفال والقُصّر بأي شكل من الأشكال.</li>
        <li>يُحظر تماماً محاولة استدراج الأطفال أو التحرش بهم (Child Grooming) أو استغلالهم عبر التطبيق.</li>
      </ul>

      <h2>2. الإجراءات الصارمة والتعامل الفوري مع الانتهاكات</h2>
      <ul>
        <li><strong>الحظر الفوري والدائم:</strong> يتم حظر أي مستخدم ينتهك هذه المعايير حظراً نهائياً وشاملاً لجهازه ورقمه دون أي إنذار مسبق.</li>
        <li><strong>الإبلاغ للسلطات والمنظمات الدولية:</strong> نقوم فوراً بإبلاغ المركز الوطني للأطفال المفقودين والمستغلين (NCMEC) والسلطات القانونية والأمنية المختصة عن أي انتهاك يتعلق بسلامة الأطفال.</li>
      </ul>

      <h2>3. آليات الإبلاغ والرقابة المباشرة</h2>
      <p>يحتوي تطبيق Loky Chat على أداة إبلاغ فوري (Report 🚩) متاحة داخل كل مكالمة ومحادثة لتمكين المستخدمين من الإبلاغ الفوري عن أي انتهاك، وتتم مراجعة البلاغات ذات الصلة بسلامة الأطفال بأعلى درجات الأولوية القصوى.</p>

      <h2>4. تحديد الفئة العمرية (18+)</h2>
      <p>تطبيق Loky Chat مخصص حصرياً للبالغين بعمر 18 عاماً فما فوق. ويُمنع القُصّر دون السن القانوني من استخدام التطبيق.</p>

      <h2>5. مسؤول وبيانات الاتصال الخاصة بسلامة الأطفال (Child Safety Point of Contact)</h2>
      <div class="contact-box">
        <h3>مسؤول سلامة الأطفال والامتثال: Mahmoud Aljafri</h3>
        <p>للإبلاغ العاجل عن أي انتهاك يخص سلامة الأطفال أو الاستفسار عن السياسة، يرجى التواصل مباشرة مع الفريق المسؤول:</p>
        <p>البريد الإلكتروني المخصص: <a href="mailto:mahmoud.aljafri23@gmail.com?subject=Child%20Safety%20Report%20-%20Loky%20Chat">mahmoud.aljafri23@gmail.com</a></p>
        <p>الهاتف / الدعم: +962790181802</p>
      </div>
    </div>

    <!-- ENGLISH VERSION -->
    <div id="en" class="section-en">
      <h1>🛡️ Child Safety Standards & Anti-Exploitation Policy - Loky Chat</h1>
      <p class="updated">Developer: <strong>Mahmoud Aljafri</strong> | Last Updated: October 6, 2026</p>

      <div class="danger-box">
        <strong>Strict Zero-Tolerance Policy:</strong><br>
        <strong>Loky Chat</strong> and developer <strong>Mahmoud Aljafri</strong> strictly prohibit all forms of <strong>Child Sexual Abuse and Exploitation (CSAE)</strong> and Child Sexual Abuse Material (CSAM). We are fully dedicated to enforcing robust child safety standards in full compliance with Google Play Developer Policies and applicable international laws.
      </div>

      <h2>1. Prohibition of Child Sexual Abuse & Exploitation (CSAE / CSAM)</h2>
      <ul>
        <li>Any transmission, depiction, solicitation, or promotion of Child Sexual Abuse Material (CSAM) or any form of sexual exploitation of minors is strictly prohibited.</li>
        <li>Child grooming, predatory behavior, or any attempt to endanger minors is strictly banned.</li>
      </ul>

      <h2>2. Enforcement & Reporting to Authorities</h2>
      <ul>
        <li><strong>Immediate Permanent Ban:</strong> Any account or device found attempting to violate child safety standards will be permanently terminated immediately.</li>
        <li><strong>Law Enforcement & NCMEC Escalation:</strong> We promptly report verified CSAE incidents to the National Center for Missing & Exploited Children (NCMEC) and relevant law enforcement agencies.</li>
      </ul>

      <h2>3. Rapid Reporting Mechanisms</h2>
      <p>Loky Chat integrates prominent real-time in-app reporting tools (🚩 Report) within every video call and chat session. Child safety reports are triaged with highest priority.</p>

      <h2>4. Age Requirements (18+)</h2>
      <p>Loky Chat is strictly restricted to adults aged 18 and older. Minors are prohibited from registering or using the platform.</p>

      <h2>5. Designated Child Safety Point of Contact</h2>
      <div class="contact-box">
        <h3>Child Safety & Compliance Officer: Mahmoud Aljafri</h3>
        <p>For urgent child safety concerns, violations, or legal inquiries, contact our designated safety officer:</p>
        <p>Dedicated Email: <a href="mailto:mahmoud.aljafri23@gmail.com?subject=Child%20Safety%20Report%20-%20Loky%20Chat">mahmoud.aljafri23@gmail.com</a></p>
        <p>Phone / Direct Support: +962790181802</p>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('public/child-safety.html', childSafetyContent, 'utf8');
fs.writeFileSync('child-safety.html', childSafetyContent, 'utf8');
fs.writeFileSync('android/app/src/main/assets/public/child-safety.html', childSafetyContent, 'utf8');

console.log('child-safety.html created successfully in all locations!');
