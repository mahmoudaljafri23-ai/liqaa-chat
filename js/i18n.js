/* =============================================
   Loky Chat - i18n (auto language from phone) + 18+ age gate
   Arabic is the source language in the HTML. Every visible Arabic string
   found in this dictionary is replaced, including text added later
   (toasts, modals) via a MutationObserver.
   Order of translations: en, es, fr, de, tr, ru, pt, hi, id, ur, fa
   ============================================= */
(function () {
  const LANGS = ['en', 'es', 'fr', 'de', 'tr', 'ru', 'pt', 'hi', 'id', 'ur', 'fa'];
  const RTL = ['ar', 'ur', 'fa'];

  function detectLang() {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const raw of list) {
      let code = String(raw || '').toLowerCase().split(/[-_]/)[0];
      if (code === 'in') code = 'id'; // legacy Android code for Indonesian
      if (code === 'ar' || LANGS.includes(code)) return code;
    }
    return 'en';
  }

  const LANG = detectLang();
  const IDX = LANGS.indexOf(LANG);

  // Named keys used from JS
  const KEYS = {
    age_title: ['هل عمرك 18 سنة أو أكثر؟', 'Are you 18 or older?', '¿Tienes 18 años o más?', 'Avez-vous 18 ans ou plus ?', 'Bist du 18 Jahre oder älter?', '18 yaşında veya daha büyük müsün?', 'Вам уже есть 18 лет?', 'Você tem 18 anos ou mais?', 'क्या आपकी उम्र 18 वर्ष या उससे अधिक है?', 'Apakah usiamu 18 tahun ke atas?', 'کیا آپ کی عمر 18 سال یا اس سے زیادہ ہے؟', 'آیا ۱۸ سال یا بیشتر دارید؟'],
    age_text: ['لوكي شات مخصص للبالغين فقط (18+). يجب أن يكون عمرك 18 سنة أو أكثر لاستخدام التطبيق.', 'Loky Chat is for adults only (18+). You must be at least 18 years old to use this app.', 'Loky Chat es solo para adultos (18+). Debes tener al menos 18 años para usar esta app.', 'Loky Chat est réservé aux adultes (18+). Vous devez avoir au moins 18 ans pour utiliser cette application.', 'Loky Chat ist nur für Erwachsene (18+). Du musst mindestens 18 Jahre alt sein, um diese App zu nutzen.', 'Loky Chat yalnızca yetişkinler içindir (18+). Bu uygulamayı kullanmak için en az 18 yaşında olmalısın.', 'Loky Chat только для взрослых (18+). Чтобы пользоваться приложением, вам должно быть не меньше 18 лет.', 'O Loky Chat é apenas para adultos (18+). Você precisa ter pelo menos 18 anos para usar este app.', 'Loky Chat केवल वयस्कों (18+) के लिए है। इस ऐप का उपयोग करने के लिए आपकी उम्र कम से कम 18 वर्ष होनी चाहिए।', 'Loky Chat hanya untuk dewasa (18+). Kamu harus berusia minimal 18 tahun untuk menggunakan aplikasi ini.', 'Loky Chat صرف بالغوں (18+) کے لیے ہے۔ اس ایپ کو استعمال کرنے کے لیے آپ کی عمر کم از کم 18 سال ہونی چاہیے۔', 'Loky Chat فقط برای بزرگسالان (۱۸+) است. برای استفاده باید حداقل ۱۸ سال داشته باشید.'],
    age_yes: ['نعم، عمري 18 أو أكثر', 'Yes, I am 18 or older', 'Sí, tengo 18 o más', 'Oui, j\'ai 18 ans ou plus', 'Ja, ich bin 18 oder älter', 'Evet, 18 yaşında veya büyüğüm', 'Да, мне есть 18', 'Sim, tenho 18 anos ou mais', 'हाँ, मेरी उम्र 18 या अधिक है', 'Ya, saya 18 tahun ke atas', 'جی ہاں، میری عمر 18 یا زیادہ ہے', 'بله، ۱۸ سال یا بیشتر دارم'],
    age_no: ['لا، عمري أقل من 18', 'No, I am under 18', 'No, tengo menos de 18', 'Non, j\'ai moins de 18 ans', 'Nein, ich bin unter 18', 'Hayır, 18 yaşından küçüğüm', 'Нет, мне меньше 18', 'Não, tenho menos de 18', 'नहीं, मेरी उम्र 18 से कम है', 'Tidak, saya di bawah 18 tahun', 'نہیں، میری عمر 18 سے کم ہے', 'خیر، کمتر از ۱۸ سال دارم'],
    age_blocked: ['عذراً، لا يمكنك استخدام لوكي شات. التطبيق مخصص لمن هم 18 سنة فما فوق.', 'Sorry, you cannot use Loky Chat. This app is only for people aged 18 and over.', 'Lo sentimos, no puedes usar Loky Chat. Esta app es solo para mayores de 18 años.', 'Désolé, vous ne pouvez pas utiliser Loky Chat. Cette application est réservée aux 18 ans et plus.', 'Leider kannst du Loky Chat nicht nutzen. Diese App ist nur für Personen ab 18 Jahren.', 'Üzgünüz, Loky Chat\'i kullanamazsın. Bu uygulama yalnızca 18 yaş ve üzeri içindir.', 'К сожалению, вы не можете пользоваться Loky Chat. Приложение только для лиц старше 18 лет.', 'Desculpe, você não pode usar o Loky Chat. Este app é apenas para maiores de 18 anos.', 'क्षमा करें, आप Loky Chat का उपयोग नहीं कर सकते। यह ऐप केवल 18 वर्ष और उससे अधिक उम्र के लोगों के लिए है।', 'Maaf, kamu tidak dapat menggunakan Loky Chat. Aplikasi ini hanya untuk usia 18 tahun ke atas.', 'معذرت، آپ Loky Chat استعمال نہیں کر سکتے۔ یہ ایپ صرف 18 سال اور اس سے زیادہ عمر کے افراد کے لیے ہے۔', 'متأسفیم، نمی‌توانید از Loky Chat استفاده کنید. این برنامه فقط برای افراد ۱۸ سال به بالا است.'],
    age_back: ['رجوع', 'Back', 'Atrás', 'Retour', 'Zurück', 'Geri', 'Назад', 'Voltar', 'वापस', 'Kembali', 'واپس', 'بازگشت'],
    store_play: ['دفع آمن عبر Google Play', 'Secure payment via Google Play', 'Pago seguro con Google Play', 'Paiement sécurisé via Google Play', 'Sichere Zahlung über Google Play', 'Google Play ile güvenli ödeme', 'Безопасная оплата через Google Play', 'Pagamento seguro pelo Google Play', 'Google Play के ज़रिए सुरक्षित भुगतान', 'Pembayaran aman melalui Google Play', 'Google Play کے ذریعے محفوظ ادائیگی', 'پرداخت امن از طریق Google Play'],
    purchase_pending: ['⏳ الدفع قيد المعالجة، ستُضاف الجواهر تلقائياً عند اكتماله', '⏳ Payment is processing. Gems will be added automatically when it completes', '⏳ Pago en proceso. Las gemas se añadirán al completarse', '⏳ Paiement en cours. Les gemmes seront ajoutées automatiquement', '⏳ Zahlung wird verarbeitet. Edelsteine werden danach automatisch hinzugefügt', '⏳ Ödeme işleniyor. Tamamlanınca mücevherler otomatik eklenecek', '⏳ Платёж обрабатывается. Кристаллы будут начислены автоматически', '⏳ Pagamento em processamento. As gemas serão adicionadas automaticamente', '⏳ भुगतान प्रोसेस हो रहा है। पूरा होने पर जेम्स अपने आप जुड़ जाएँगे', '⏳ Pembayaran diproses. Permata akan ditambahkan otomatis', '⏳ ادائیگی جاری ہے۔ مکمل ہونے پر جواہرات خود بخود شامل ہو جائیں گے', '⏳ پرداخت در حال پردازش است. جواهر پس از تکمیل خودکار اضافه می‌شود'],
    purchase_failed: ['❌ لم تكتمل عملية الشراء، حاول مرة أخرى', '❌ Purchase was not completed. Please try again', '❌ La compra no se completó. Inténtalo de nuevo', '❌ L\'achat n\'a pas abouti. Réessayez', '❌ Kauf nicht abgeschlossen. Bitte erneut versuchen', '❌ Satın alma tamamlanmadı. Tekrar dene', '❌ Покупка не завершена. Попробуйте ещё раз', '❌ A compra não foi concluída. Tente novamente', '❌ खरीदारी पूरी नहीं हुई। फिर कोशिश करें', '❌ Pembelian tidak selesai. Coba lagi', '❌ خریداری مکمل نہیں ہوئی۔ دوبارہ کوشش کریں', '❌ خرید انجام نشد. دوباره تلاش کنید']
  };

  // Arabic source text -> [en, es, fr, de, tr, ru, pt, hi, id, ur, fa]
  const D = {
    'مستخدم جديد': ['New user', 'Usuario nuevo', 'Nouvel utilisateur', 'Neuer Nutzer', 'Yeni kullanıcı', 'Новый пользователь', 'Novo usuário', 'नया उपयोगकर्ता', 'Pengguna baru', 'نیا صارف', 'کاربر جدید'],
    'الأصدقاء': ['Friends', 'Amigos', 'Amis', 'Freunde', 'Arkadaşlar', 'Друзья', 'Amigos', 'दोस्त', 'Teman', 'دوست', 'دوستان'],
    'دعوة (+50💎)': ['Invite (+50💎)', 'Invitar (+50💎)', 'Inviter (+50💎)', 'Einladen (+50💎)', 'Davet et (+50💎)', 'Пригласить (+50💎)', 'Convidar (+50💎)', 'आमंत्रित करें (+50💎)', 'Undang (+50💎)', 'دعوت دیں (+50💎)', 'دعوت (+50💎)'],
    'لوكي شات - دردشة فيديو عشوائية ومباشرة مع أشخاص من كل العالم': ['Loky Chat - Random live video chat with people from all over the world', 'Loky Chat - Videochat aleatorio en vivo con personas de todo el mundo', 'Loky Chat - Chat vidéo aléatoire en direct avec des gens du monde entier', 'Loky Chat - Zufälliger Live-Videochat mit Menschen aus aller Welt', 'Loky Chat - Dünyanın her yerinden insanlarla rastgele canlı görüntülü sohbet', 'Loky Chat - Случайный видеочат с людьми со всего мира', 'Loky Chat - Chat de vídeo aleatório ao vivo com pessoas do mundo todo', 'Loky Chat - दुनिया भर के लोगों के साथ रैंडम लाइव वीडियो चैट', 'Loky Chat - Video chat acak langsung dengan orang dari seluruh dunia', 'Loky Chat - دنیا بھر کے لوگوں کے ساتھ رینڈم لائیو ویڈیو چیٹ', 'Loky Chat - چت تصویری تصادفی و زنده با مردم سراسر جهان'],
    'معلومات الحساب': ['Account info', 'Información de la cuenta', 'Informations du compte', 'Kontoinformationen', 'Hesap bilgileri', 'Данные аккаунта', 'Informações da conta', 'खाता जानकारी', 'Info akun', 'اکاؤنٹ کی معلومات', 'اطلاعات حساب'],
    'الاسم / اسم المستخدم': ['Name / Username', 'Nombre / Usuario', 'Nom / Pseudo', 'Name / Benutzername', 'Ad / Kullanıcı adı', 'Имя / Ник', 'Nome / Usuário', 'नाम / यूज़रनेम', 'Nama / Nama pengguna', 'نام / یوزر نیم', 'نام / نام کاربری'],
    'رقم الهاتف': ['Phone number', 'Número de teléfono', 'Numéro de téléphone', 'Telefonnummer', 'Telefon numarası', 'Номер телефона', 'Número de telefone', 'फ़ोन नंबर', 'Nomor telepon', 'فون نمبر', 'شماره تلفن'],
    'اختر جنسك': ['Select your gender', 'Elige tu género', 'Choisissez votre genre', 'Wähle dein Geschlecht', 'Cinsiyetini seç', 'Выберите пол', 'Escolha seu gênero', 'अपना लिंग चुनें', 'Pilih jenis kelamin', 'اپنی جنس منتخب کریں', 'جنسیت خود را انتخاب کنید'],
    'ذكر': ['Male', 'Hombre', 'Homme', 'Männlich', 'Erkek', 'Мужчина', 'Masculino', 'पुरुष', 'Laki-laki', 'مرد', 'مرد'],
    'أنثى': ['Female', 'Mujer', 'Femme', 'Weiblich', 'Kadın', 'Женщина', 'Feminino', 'महिला', 'Perempuan', 'عورت', 'زن'],
    '👨 ذكر': ['👨 Male', '👨 Hombre', '👨 Homme', '👨 Männlich', '👨 Erkek', '👨 Мужчина', '👨 Masculino', '👨 पुरुष', '👨 Laki-laki', '👨 مرد', '👨 مرد'],
    '👩 أنثى': ['👩 Female', '👩 Mujer', '👩 Femme', '👩 Weiblich', '👩 Kadın', '👩 Женщина', '👩 Feminino', '👩 महिला', '👩 Perempuan', '👩 عورت', '👩 زن'],
    'أريد التحدث مع': ['I want to talk with', 'Quiero hablar con', 'Je veux parler avec', 'Ich möchte sprechen mit', 'Konuşmak istediğim', 'Хочу общаться с', 'Quero conversar com', 'मैं बात करना चाहता हूँ', 'Saya ingin bicara dengan', 'میں بات کرنا چاہتا ہوں', 'می‌خواهم صحبت کنم با'],
    'الكل': ['Everyone', 'Todos', 'Tout le monde', 'Alle', 'Herkes', 'Все', 'Todos', 'सभी', 'Semua', 'سب', 'همه'],
    'مجانى ✨': ['Free ✨', 'Gratis ✨', 'Gratuit ✨', 'Kostenlos ✨', 'Ücretsiz ✨', 'Бесплатно ✨', 'Grátis ✨', 'मुफ़्त ✨', 'Gratis ✨', 'مفت ✨', 'رایگان ✨'],
    'ذكور': ['Males', 'Hombres', 'Hommes', 'Männer', 'Erkekler', 'Мужчины', 'Homens', 'पुरुष', 'Pria', 'مرد', 'مردان'],
    '10 💎 / اتصال': ['10 💎 / call', '10 💎 / llamada', '10 💎 / appel', '10 💎 / Anruf', '10 💎 / arama', '10 💎 / звонок', '10 💎 / chamada', '10 💎 / कॉल', '10 💎 / panggilan', '10 💎 / کال', '10 💎 / تماس'],
    'إناث': ['Females', 'Mujeres', 'Femmes', 'Frauen', 'Kadınlar', 'Женщины', 'Mulheres', 'महिलाएँ', 'Wanita', 'خواتین', 'زنان'],
    '💎 متجر شحن الجواهر': ['💎 Gem Store', '💎 Tienda de gemas', '💎 Boutique de gemmes', '💎 Edelstein-Shop', '💎 Mücevher Mağazası', '💎 Магазин кристаллов', '💎 Loja de gemas', '💎 जेम स्टोर', '💎 Toko Permata', '💎 جواہرات اسٹور', '💎 فروشگاه جواهر'],
    'بلدك': ['Your country', 'Tu país', 'Votre pays', 'Dein Land', 'Ülken', 'Ваша страна', 'Seu país', 'आपका देश', 'Negaramu', 'آپ کا ملک', 'کشور شما'],
    'جاري تحديد موقعك...': ['Detecting your location...', 'Detectando tu ubicación...', 'Détection de votre position...', 'Standort wird ermittelt...', 'Konumun belirleniyor...', 'Определяем местоположение...', 'Detectando sua localização...', 'आपकी लोकेशन पता की जा रही है...', 'Mendeteksi lokasi...', 'آپ کا مقام معلوم کیا جا رہا ہے...', 'در حال تشخیص موقعیت...'],
    'تغيير': ['Change', 'Cambiar', 'Changer', 'Ändern', 'Değiştir', 'Изменить', 'Alterar', 'बदलें', 'Ubah', 'تبدیل کریں', 'تغییر'],
    '🌍 كل العالم / جميع الدول - Global (All Countries)': ['🌍 Worldwide (All countries)', '🌍 Todo el mundo', '🌍 Monde entier', '🌍 Weltweit', '🌍 Tüm dünya', '🌍 Весь мир', '🌍 Mundo todo', '🌍 पूरी दुनिया', '🌍 Seluruh dunia', '🌍 پوری دنیا', '🌍 سراسر جهان'],
    'كل العالم': ['Worldwide', 'Todo el mundo', 'Monde entier', 'Weltweit', 'Tüm dünya', 'Весь мир', 'Mundo todo', 'पूरी दुनिया', 'Seluruh dunia', 'پوری دنیا', 'سراسر جهان'],
    'ابدأ الدردشة': ['Start chatting', 'Empezar chat', 'Commencer', 'Chat starten', 'Sohbete başla', 'Начать чат', 'Começar chat', 'चैट शुरू करें', 'Mulai chat', 'چیٹ شروع کریں', 'شروع گفتگو'],
    'متصل الآن': ['Online now', 'En línea ahora', 'En ligne', 'Jetzt online', 'Şu an çevrimiçi', 'Сейчас онлайн', 'Online agora', 'अभी ऑनलाइन', 'Online sekarang', 'ابھی آن لائن', 'آنلاین'],
    'متصل': ['Online', 'En línea', 'En ligne', 'Online', 'Çevrimiçi', 'Онлайн', 'Online', 'ऑनलाइन', 'Online', 'آن لائن', 'آنلاین'],
    '🔙 الرئيسية': ['🔙 Home', '🔙 Inicio', '🔙 Accueil', '🔙 Start', '🔙 Ana sayfa', '🔙 Главная', '🔙 Início', '🔙 होम', '🔙 Beranda', '🔙 ہوم', '🔙 خانه'],
    'أوسمة:': ['Badges:', 'Insignias:', 'Badges :', 'Abzeichen:', 'Rozetler:', 'Значки:', 'Emblemas:', 'बैज:', 'Lencana:', 'بیجز:', 'نشان‌ها:'],
    '⭐ رائع': ['⭐ Awesome', '⭐ Genial', '⭐ Génial', '⭐ Super', '⭐ Harika', '⭐ Супер', '⭐ Incrível', '⭐ शानदार', '⭐ Keren', '⭐ زبردست', '⭐ عالی'],
    '✨ وسيم': ['✨ Handsome', '✨ Guapo', '✨ Beau', '✨ Hübsch', '✨ Yakışıklı', '✨ Красивый', '✨ Bonito', '✨ हैंडसम', '✨ Tampan', '✨ خوبصورت', '✨ خوش‌تیپ'],
    '🎩 أنيق': ['🎩 Elegant', '🎩 Elegante', '🎩 Élégant', '🎩 Elegant', '🎩 Şık', '🎩 Элегантный', '🎩 Elegante', '🎩 स्टाइलिश', '🎩 Elegan', '🎩 نفیس', '🎩 شیک'],
    'مستخدم': ['User', 'Usuario', 'Utilisateur', 'Nutzer', 'Kullanıcı', 'Пользователь', 'Usuário', 'उपयोगकर्ता', 'Pengguna', 'صارف', 'کاربر'],
    'صديق': ['Friend', 'Amigo', 'Ami', 'Freund', 'Arkadaş', 'Друг', 'Amigo', 'दोस्त', 'Teman', 'دوست', 'دوست'],
    'صديق جديد': ['New friend', 'Nuevo amigo', 'Nouvel ami', 'Neuer Freund', 'Yeni arkadaş', 'Новый друг', 'Novo amigo', 'नया दोस्त', 'Teman baru', 'نیا دوست', 'دوست جدید'],
    '➕ إضافة صديق': ['➕ Add friend', '➕ Añadir amigo', '➕ Ajouter un ami', '➕ Freund hinzufügen', '➕ Arkadaş ekle', '➕ Добавить в друзья', '➕ Adicionar amigo', '➕ दोस्त जोड़ें', '➕ Tambah teman', '➕ دوست شامل کریں', '➕ افزودن دوست'],
    '🚩 إبلاغ': ['🚩 Report', '🚩 Denunciar', '🚩 Signaler', '🚩 Melden', '🚩 Bildir', '🚩 Пожаловаться', '🚩 Denunciar', '🚩 रिपोर्ट', '🚩 Laporkan', '🚩 رپورٹ', '🚩 گزارش'],
    'جاري البحث عن شخص...': ['Looking for someone...', 'Buscando a alguien...', 'Recherche de quelqu\'un...', 'Suche nach jemandem...', 'Birisi aranıyor...', 'Ищем собеседника...', 'Procurando alguém...', 'किसी को ढूंढ रहे हैं...', 'Mencari seseorang...', 'کسی کو تلاش کیا جا رہا ہے...', 'در حال جستجوی فرد...'],
    '🔙 إلغاء البحث والعودة': ['🔙 Cancel search', '🔙 Cancelar búsqueda', '🔙 Annuler la recherche', '🔙 Suche abbrechen', '🔙 Aramayı iptal et', '🔙 Отменить поиск', '🔙 Cancelar busca', '🔙 खोज रद्द करें', '🔙 Batalkan pencarian', '🔙 تلاش منسوخ کریں', '🔙 لغو جستجو'],
    'انتهت المحادثة': ['Chat ended', 'Chat terminado', 'Discussion terminée', 'Chat beendet', 'Sohbet bitti', 'Чат завершён', 'Chat encerrado', 'चैट समाप्त', 'Chat berakhir', 'چیٹ ختم ہو گئی', 'گفتگو تمام شد'],
    'الشخص الآخر غادر': ['The other person left', 'La otra persona se fue', 'L\'autre personne est partie', 'Die andere Person ist gegangen', 'Karşı taraf ayrıldı', 'Собеседник вышел', 'A outra pessoa saiu', 'दूसरा व्यक्ति चला गया', 'Orang lain telah pergi', 'دوسرا شخص چلا گیا', 'طرف مقابل خارج شد'],
    'ابحث عن شخص جديد': ['Find someone new', 'Buscar a alguien nuevo', 'Trouver quelqu\'un d\'autre', 'Neue Person suchen', 'Yeni birini bul', 'Найти нового', 'Encontrar outra pessoa', 'किसी नए को खोजें', 'Cari orang baru', 'کسی نئے کو تلاش کریں', 'جستجوی فرد جدید'],
    'التالي': ['Next', 'Siguiente', 'Suivant', 'Weiter', 'Sonraki', 'Далее', 'Próximo', 'अगला', 'Berikutnya', 'اگلا', 'بعدی'],
    'التالي / Next': ['Next', 'Siguiente', 'Suivant', 'Weiter', 'Sonraki', 'Далее', 'Próximo', 'अगला', 'Berikutnya', 'اگلا', 'بعدی'],
    'نحتاج إذن الكاميرا والميكروفون': ['We need camera and microphone permission', 'Necesitamos permiso de cámara y micrófono', 'Nous avons besoin de l\'accès à la caméra et au micro', 'Wir brauchen Kamera- und Mikrofonzugriff', 'Kamera ve mikrofon izni gerekiyor', 'Нужен доступ к камере и микрофону', 'Precisamos de permissão da câmera e do microfone', 'हमें कैमरा और माइक्रोफ़ोन की अनुमति चाहिए', 'Kami butuh izin kamera dan mikrofon', 'ہمیں کیمرہ اور مائیکروفون کی اجازت درکار ہے', 'به دسترسی دوربین و میکروفون نیاز داریم'],
    'يرجى السماح بالوصول للكاميرا والميكروفون لاستخدام دردشة الفيديو': ['Please allow camera and microphone access to use video chat', 'Permite el acceso a la cámara y al micrófono para usar el videochat', 'Veuillez autoriser la caméra et le micro pour utiliser le chat vidéo', 'Bitte erlaube Kamera und Mikrofon für den Videochat', 'Görüntülü sohbet için kamera ve mikrofona izin verin', 'Разрешите доступ к камере и микрофону для видеочата', 'Permita o acesso à câmera e ao microfone para usar o chat de vídeo', 'वीडियो चैट के लिए कैमरा और माइक्रोफ़ोन की अनुमति दें', 'Izinkan akses kamera dan mikrofon untuk video chat', 'ویڈیو چیٹ کے لیے کیمرہ اور مائیکروفون کی اجازت دیں', 'لطفاً برای چت تصویری به دوربین و میکروفون اجازه دهید'],
    'كيف تسمح بالكاميرا؟': ['How to allow the camera?', '¿Cómo permitir la cámara?', 'Comment autoriser la caméra ?', 'Wie erlaube ich die Kamera?', 'Kameraya nasıl izin verilir?', 'Как разрешить камеру?', 'Como permitir a câmera?', 'कैमरा की अनुमति कैसे दें?', 'Cara mengizinkan kamera?', 'کیمرہ کی اجازت کیسے دیں؟', 'چگونه به دوربین اجازه دهیم؟'],
    'اضغط على أيقونة 🔒 أو 📷 في شريط العنوان أعلى المتصفح': ['Tap the 🔒 or 📷 icon in the address bar', 'Toca el icono 🔒 o 📷 en la barra de direcciones', 'Touchez l\'icône 🔒 ou 📷 dans la barre d\'adresse', 'Tippe auf 🔒 oder 📷 in der Adressleiste', 'Adres çubuğundaki 🔒 veya 📷 simgesine dokunun', 'Нажмите 🔒 или 📷 в адресной строке', 'Toque no ícone 🔒 ou 📷 na barra de endereço', 'एड्रेस बार में 🔒 या 📷 आइकन पर टैप करें', 'Ketuk ikon 🔒 atau 📷 di bilah alamat', 'ایڈریس بار میں 🔒 یا 📷 آئیکن پر ٹیپ کریں', 'روی نماد 🔒 یا 📷 در نوار آدرس بزنید'],
    'اختر "السماح" أو "Allow" للكاميرا والميكروفون': ['Choose "Allow" for camera and microphone', 'Elige "Permitir" para cámara y micrófono', 'Choisissez « Autoriser » pour la caméra et le micro', 'Wähle „Zulassen“ für Kamera und Mikrofon', 'Kamera ve mikrofon için "İzin ver"i seçin', 'Выберите «Разрешить» для камеры и микрофона', 'Escolha "Permitir" para câmera e microfone', 'कैमरा और माइक्रोफ़ोन के लिए "Allow" चुनें', 'Pilih "Izinkan" untuk kamera dan mikrofon', 'کیمرہ اور مائیکروفون کے لیے "Allow" منتخب کریں', 'برای دوربین و میکروفون «اجازه» را انتخاب کنید'],
    'أعد تحميل الصفحة ثم اضغط "ابدأ الدردشة" مرة أخرى': ['Reload, then tap "Start chatting" again', 'Recarga y vuelve a tocar "Empezar chat"', 'Rechargez puis touchez à nouveau « Commencer »', 'Neu laden und erneut „Chat starten“ tippen', 'Yenileyin ve tekrar "Sohbete başla"ya dokunun', 'Перезагрузите и снова нажмите «Начать чат»', 'Recarregue e toque em "Começar chat" novamente', 'रीलोड करें और फिर "चैट शुरू करें" दबाएँ', 'Muat ulang lalu ketuk "Mulai chat" lagi', 'ری لوڈ کریں پھر "چیٹ شروع کریں" دبائیں', 'صفحه را دوباره بارگذاری و «شروع گفتگو» را بزنید'],
    '🔄 حاول مرة أخرى': ['🔄 Try again', '🔄 Reintentar', '🔄 Réessayer', '🔄 Erneut versuchen', '🔄 Tekrar dene', '🔄 Повторить', '🔄 Tentar novamente', '🔄 फिर कोशिश करें', '🔄 Coba lagi', '🔄 دوبارہ کوشش کریں', '🔄 تلاش دوباره'],
    'رجوع': ['Back', 'Atrás', 'Retour', 'Zurück', 'Geri', 'Назад', 'Voltar', 'वापस', 'Kembali', 'واپس', 'بازگشت'],
    'متجر الجواهر / الشحن الرسمي': ['Gem Store', 'Tienda de gemas', 'Boutique de gemmes', 'Edelstein-Shop', 'Mücevher Mağazası', 'Магазин кристаллов', 'Loja de gemas', 'जेम स्टोर', 'Toko Permata', 'جواہرات اسٹور', 'فروشگاه جواهر'],
    'ادفع بالفيزا أو ماستركارد أو Apple Pay أو PayPal': ['Pay with Visa, Mastercard, Apple Pay or PayPal', 'Paga con Visa, Mastercard, Apple Pay o PayPal', 'Payez par Visa, Mastercard, Apple Pay ou PayPal', 'Bezahle mit Visa, Mastercard, Apple Pay oder PayPal', 'Visa, Mastercard, Apple Pay veya PayPal ile öde', 'Оплата Visa, Mastercard, Apple Pay или PayPal', 'Pague com Visa, Mastercard, Apple Pay ou PayPal', 'Visa, Mastercard, Apple Pay या PayPal से भुगतान करें', 'Bayar dengan Visa, Mastercard, Apple Pay atau PayPal', 'Visa، Mastercard، Apple Pay یا PayPal سے ادائیگی کریں', 'پرداخت با Visa، Mastercard، Apple Pay یا PayPal'],
    'دفع آمن عبر Google Play': KEYS.store_play.slice(1),
    '1,000 جوهرة': ['1,000 gems', '1.000 gemas', '1 000 gemmes', '1.000 Edelsteine', '1.000 mücevher', '1 000 кристаллов', '1.000 gemas', '1,000 जेम्स', '1.000 permata', '1,000 جواہرات', '1,000 جواهر'],
    '3,000 جوهرة': ['3,000 gems', '3.000 gemas', '3 000 gemmes', '3.000 Edelsteine', '3.000 mücevher', '3 000 кристаллов', '3.000 gemas', '3,000 जेम्स', '3.000 permata', '3,000 جواہرات', '3,000 جواهر'],
    '7,000 جوهرة': ['7,000 gems', '7.000 gemas', '7 000 gemmes', '7.000 Edelsteine', '7.000 mücevher', '7 000 кристаллов', '7.000 gemas', '7,000 जेम्स', '7.000 permata', '7,000 جواہرات', '7,000 جواهر'],
    '15,000 جوهرة': ['15,000 gems', '15.000 gemas', '15 000 gemmes', '15.000 Edelsteine', '15.000 mücevher', '15 000 кристаллов', '15.000 gemas', '15,000 जेम्स', '15.000 permata', '15,000 جواہرات', '15,000 جواهر'],
    '💳 شراء الآن': ['💳 Buy now', '💳 Comprar', '💳 Acheter', '💳 Jetzt kaufen', '💳 Satın al', '💳 Купить', '💳 Comprar', '💳 अभी खरीदें', '💳 Beli sekarang', '💳 ابھی خریدیں', '💳 خرید'],
    '🔥 الأكثر مبيعاً - وفّر 33%': ['🔥 Best seller - Save 33%', '🔥 Más vendido - Ahorra 33%', '🔥 Meilleure vente - -33%', '🔥 Bestseller - 33% sparen', '🔥 En çok satan - %33 indirim', '🔥 Хит продаж - скидка 33%', '🔥 Mais vendido - Economize 33%', '🔥 बेस्ट सेलर - 33% बचत', '🔥 Terlaris - Hemat 33%', '🔥 سب سے زیادہ فروخت - 33% بچت', '🔥 پرفروش - ۳۳٪ تخفیف'],
    '⭐ وفّر 43%': ['⭐ Save 43%', '⭐ Ahorra 43%', '⭐ -43%', '⭐ 43% sparen', '⭐ %43 indirim', '⭐ Скидка 43%', '⭐ Economize 43%', '⭐ 43% बचत', '⭐ Hemat 43%', '⭐ 43% بچت', '⭐ ۴۳٪ تخفیف'],
    '👑 وفّر 47%': ['👑 Save 47%', '👑 Ahorra 47%', '👑 -47%', '👑 47% sparen', '👑 %47 indirim', '👑 Скидка 47%', '👑 Economize 47%', '👑 47% बचत', '👑 Hemat 47%', '👑 47% بچت', '👑 ۴۷٪ تخفیف'],
    'مدعوم من PayPal - ادفع بالفيزا أو ماستركارد أو Apple Pay': ['Powered by PayPal - pay with Visa, Mastercard or Apple Pay', 'Con PayPal - paga con Visa, Mastercard o Apple Pay', 'Via PayPal - payez par Visa, Mastercard ou Apple Pay', 'Über PayPal - zahle mit Visa, Mastercard oder Apple Pay', 'PayPal altyapısı - Visa, Mastercard veya Apple Pay ile öde', 'Через PayPal - Visa, Mastercard или Apple Pay', 'Via PayPal - pague com Visa, Mastercard ou Apple Pay', 'PayPal द्वारा - Visa, Mastercard या Apple Pay से भुगतान', 'Didukung PayPal - bayar dengan Visa, Mastercard atau Apple Pay', 'PayPal کے ذریعے - Visa، Mastercard یا Apple Pay سے ادائیگی', 'با PayPal - پرداخت با Visa، Mastercard یا Apple Pay'],
    'إغلاق المتجر': ['Close store', 'Cerrar tienda', 'Fermer la boutique', 'Shop schließen', 'Mağazayı kapat', 'Закрыть магазин', 'Fechar loja', 'स्टोर बंद करें', 'Tutup toko', 'اسٹور بند کریں', 'بستن فروشگاه'],
    'إتمام عملية الدفع والشحن': ['Complete payment', 'Completar pago', 'Finaliser le paiement', 'Zahlung abschließen', 'Ödemeyi tamamla', 'Завершить оплату', 'Concluir pagamento', 'भुगतान पूरा करें', 'Selesaikan pembayaran', 'ادائیگی مکمل کریں', 'تکمیل پرداخت'],
    'الباقة المختارة:': ['Selected package:', 'Paquete elegido:', 'Pack choisi :', 'Gewähltes Paket:', 'Seçilen paket:', 'Выбранный пакет:', 'Pacote escolhido:', 'चुना गया पैकेज:', 'Paket dipilih:', 'منتخب پیکج:', 'بسته انتخابی:'],
    '💳 الدفع ببطاقة الفيزا أو الماستركارد (Visa / Card)': ['💳 Pay by card (Visa / Mastercard)', '💳 Pagar con tarjeta (Visa / Mastercard)', '💳 Payer par carte (Visa / Mastercard)', '💳 Mit Karte zahlen (Visa / Mastercard)', '💳 Kartla öde (Visa / Mastercard)', '💳 Оплатить картой (Visa / Mastercard)', '💳 Pagar com cartão (Visa / Mastercard)', '💳 कार्ड से भुगतान (Visa / Mastercard)', '💳 Bayar dengan kartu (Visa / Mastercard)', '💳 کارڈ سے ادائیگی (Visa / Mastercard)', '💳 پرداخت با کارت (Visa / Mastercard)'],
    '🅿️ الدفع عبر حساب PayPal': ['🅿️ Pay with PayPal', '🅿️ Pagar con PayPal', '🅿️ Payer avec PayPal', '🅿️ Mit PayPal zahlen', '🅿️ PayPal ile öde', '🅿️ Оплатить через PayPal', '🅿️ Pagar com PayPal', '🅿️ PayPal से भुगतान', '🅿️ Bayar dengan PayPal', '🅿️ PayPal سے ادائیگی', '🅿️ پرداخت با PayPal'],
    'ادفع ببطاقة الفيزا أو الماستركارد كـ مستخدم زائر بدون حساب بايبال 🔒': ['Pay by card as a guest, no PayPal account needed 🔒', 'Paga con tarjeta como invitado, sin cuenta PayPal 🔒', 'Payez par carte sans compte PayPal 🔒', 'Als Gast per Karte zahlen, kein PayPal-Konto nötig 🔒', 'PayPal hesabı olmadan kartla öde 🔒', 'Оплата картой без аккаунта PayPal 🔒', 'Pague com cartão como convidado, sem conta PayPal 🔒', 'बिना PayPal खाते के कार्ड से भुगतान करें 🔒', 'Bayar dengan kartu tanpa akun PayPal 🔒', 'PayPal اکاؤنٹ کے بغیر کارڈ سے ادائیگی کریں 🔒', 'پرداخت با کارت بدون حساب PayPal 🔒'],
    'إلغاء العملية والعودة للمتجر': ['Cancel and return to store', 'Cancelar y volver a la tienda', 'Annuler et revenir', 'Abbrechen und zurück zum Shop', 'İptal et ve mağazaya dön', 'Отмена и назад в магазин', 'Cancelar e voltar à loja', 'रद्द करें और स्टोर पर लौटें', 'Batal dan kembali ke toko', 'منسوخ کریں اور اسٹور پر واپس جائیں', 'لغو و بازگشت به فروشگاه'],
    'تسجيل الدخول': ['Sign in', 'Iniciar sesión', 'Connexion', 'Anmelden', 'Giriş yap', 'Войти', 'Entrar', 'साइन इन', 'Masuk', 'سائن ان', 'ورود'],
    'سجل دخولك ليتم ربط رصيدك وجواهرك باسمك وحسابك دائماً 💎': ['Sign in to keep your gems linked to your account 💎', 'Inicia sesión para vincular tus gemas a tu cuenta 💎', 'Connectez-vous pour lier vos gemmes à votre compte 💎', 'Melde dich an, um deine Edelsteine mit deinem Konto zu verknüpfen 💎', 'Mücevherlerini hesabına bağlamak için giriş yap 💎', 'Войдите, чтобы привязать кристаллы к аккаунту 💎', 'Entre para vincular suas gemas à sua conta 💎', 'अपने जेम्स को खाते से जोड़ने के लिए साइन इन करें 💎', 'Masuk untuk menautkan permata ke akunmu 💎', 'اپنے جواہرات کو اکاؤنٹ سے منسلک کرنے کے لیے سائن ان کریں 💎', 'برای اتصال جواهرات به حسابتان وارد شوید 💎'],
    'تسجيل الدخول السريع بـ Google': ['Continue with Google', 'Continuar con Google', 'Continuer avec Google', 'Weiter mit Google', 'Google ile devam et', 'Продолжить с Google', 'Continuar com Google', 'Google के साथ जारी रखें', 'Lanjutkan dengan Google', 'Google کے ساتھ جاری رکھیں', 'ادامه با Google'],
    'أدخل حساب Google الخاص بك للتأكيد والربط:': ['Enter your Google email to link:', 'Introduce tu correo de Google para vincular:', 'Saisissez votre e-mail Google pour lier :', 'Gib deine Google-E-Mail zum Verknüpfen ein:', 'Bağlamak için Google e-postanı gir:', 'Введите почту Google для привязки:', 'Digite seu e-mail do Google para vincular:', 'लिंक करने के लिए अपना Google ईमेल दर्ज करें:', 'Masukkan email Google untuk menautkan:', 'لنک کرنے کے لیے اپنا Google ای میل درج کریں:', 'ایمیل Google خود را برای اتصال وارد کنید:'],
    'تأكيد الربط': ['Confirm', 'Confirmar', 'Confirmer', 'Bestätigen', 'Onayla', 'Подтвердить', 'Confirmar', 'पुष्टि करें', 'Konfirmasi', 'تصدیق کریں', 'تأیید'],
    'من خلال النقر على الخيار أعلاه، فإنك تقر بأن عمرك لا يقل عن 18 عاماً وتوافق على شروط الاستخدام.': ['By continuing, you confirm you are at least 18 years old and agree to the Terms of Use.', 'Al continuar, confirmas que tienes al menos 18 años y aceptas los Términos de uso.', 'En continuant, vous confirmez avoir au moins 18 ans et accepter les conditions d\'utilisation.', 'Mit dem Fortfahren bestätigst du, mindestens 18 Jahre alt zu sein, und stimmst den Nutzungsbedingungen zu.', 'Devam ederek en az 18 yaşında olduğunu ve Kullanım Koşullarını kabul ettiğini onaylarsın.', 'Продолжая, вы подтверждаете, что вам есть 18 лет, и принимаете Условия использования.', 'Ao continuar, você confirma ter pelo menos 18 anos e aceita os Termos de Uso.', 'जारी रखकर आप पुष्टि करते हैं कि आपकी आयु कम से कम 18 वर्ष है और आप उपयोग की शर्तों से सहमत हैं।', 'Dengan melanjutkan, kamu menyatakan berusia minimal 18 tahun dan menyetujui Ketentuan Penggunaan.', 'جاری رکھ کر آپ تصدیق کرتے ہیں کہ آپ کی عمر کم از کم 18 سال ہے اور آپ شرائط استعمال سے متفق ہیں۔', 'با ادامه، تأیید می‌کنید که حداقل ۱۸ سال دارید و با شرایط استفاده موافقید.'],
    'إعدادات الملف الشخصي': ['Profile settings', 'Ajustes del perfil', 'Paramètres du profil', 'Profileinstellungen', 'Profil ayarları', 'Настройки профиля', 'Configurações do perfil', 'प्रोफ़ाइल सेटिंग्स', 'Pengaturan profil', 'پروفائل کی ترتیبات', 'تنظیمات پروفایل'],
    'يمكنك تعديل بياناتك الشخصية في أي وقت': ['You can edit your details at any time', 'Puedes editar tus datos en cualquier momento', 'Vous pouvez modifier vos informations à tout moment', 'Du kannst deine Daten jederzeit ändern', 'Bilgilerini istediğin zaman düzenleyebilirsin', 'Вы можете изменить данные в любое время', 'Você pode editar seus dados a qualquer momento', 'आप कभी भी अपनी जानकारी बदल सकते हैं', 'Kamu bisa mengubah datamu kapan saja', 'آپ کسی بھی وقت اپنی معلومات تبدیل کر سکتے ہیں', 'می‌توانید اطلاعات خود را هر زمان ویرایش کنید'],
    '🔑 تسجيل الدخول بـ جوجل': ['🔑 Sign in with Google', '🔑 Entrar con Google', '🔑 Connexion avec Google', '🔑 Mit Google anmelden', '🔑 Google ile giriş', '🔑 Войти через Google', '🔑 Entrar com Google', '🔑 Google से साइन इन', '🔑 Masuk dengan Google', '🔑 Google سے سائن ان', '🔑 ورود با Google'],
    'الجنس:': ['Gender:', 'Género:', 'Genre :', 'Geschlecht:', 'Cinsiyet:', 'Пол:', 'Gênero:', 'लिंग:', 'Jenis kelamin:', 'جنس:', 'جنسیت:'],
    '🛡️ معايير سلامة الأطفال ومكافحة الاستغلال (CSAE)': ['🛡️ Child Safety Standards (CSAE)', '🛡️ Normas de seguridad infantil (CSAE)', '🛡️ Normes de sécurité des enfants (CSAE)', '🛡️ Kinderschutzstandards (CSAE)', '🛡️ Çocuk Güvenliği Standartları (CSAE)', '🛡️ Стандарты безопасности детей (CSAE)', '🛡️ Padrões de segurança infantil (CSAE)', '🛡️ बाल सुरक्षा मानक (CSAE)', '🛡️ Standar Keselamatan Anak (CSAE)', '🛡️ بچوں کی حفاظت کے معیارات (CSAE)', '🛡️ استانداردهای ایمنی کودکان (CSAE)'],
    '🔒 سياسة الخصوصية (Privacy Policy)': ['🔒 Privacy Policy', '🔒 Política de privacidad', '🔒 Politique de confidentialité', '🔒 Datenschutzerklärung', '🔒 Gizlilik Politikası', '🔒 Политика конфиденциальности', '🔒 Política de Privacidade', '🔒 गोपनीयता नीति', '🔒 Kebijakan Privasi', '🔒 رازداری کی پالیسی', '🔒 سیاست حفظ حریم خصوصی'],
    '🗑️ حذف الحساب والبيانات': ['🗑️ Delete account & data', '🗑️ Eliminar cuenta y datos', '🗑️ Supprimer le compte et les données', '🗑️ Konto & Daten löschen', '🗑️ Hesabı ve verileri sil', '🗑️ Удалить аккаунт и данные', '🗑️ Excluir conta e dados', '🗑️ खाता और डेटा हटाएँ', '🗑️ Hapus akun & data', '🗑️ اکاؤنٹ اور ڈیٹا حذف کریں', '🗑️ حذف حساب و داده‌ها'],
    '💾 حفظ التغيرات': ['💾 Save changes', '💾 Guardar cambios', '💾 Enregistrer', '💾 Änderungen speichern', '💾 Değişiklikleri kaydet', '💾 Сохранить', '💾 Salvar alterações', '💾 बदलाव सहेजें', '💾 Simpan perubahan', '💾 تبدیلیاں محفوظ کریں', '💾 ذخیره تغییرات'],
    'إلغاء': ['Cancel', 'Cancelar', 'Annuler', 'Abbrechen', 'İptal', 'Отмена', 'Cancelar', 'रद्द करें', 'Batal', 'منسوخ کریں', 'لغو'],
    'تم حظر حسابك مؤقتاً!': ['Your account is temporarily banned!', '¡Tu cuenta está suspendida temporalmente!', 'Votre compte est temporairement suspendu !', 'Dein Konto ist vorübergehend gesperrt!', 'Hesabın geçici olarak engellendi!', 'Ваш аккаунт временно заблокирован!', 'Sua conta foi suspensa temporariamente!', 'आपका खाता अस्थायी रूप से प्रतिबंधित है!', 'Akunmu diblokir sementara!', 'آپ کا اکاؤنٹ عارضی طور پر بند ہے!', 'حساب شما موقتاً مسدود شده است!'],
    'تم حظر حسابك وجهازك تلقائياً لمدة': ['Your account and device have been banned for', 'Tu cuenta y dispositivo han sido bloqueados durante', 'Votre compte et appareil sont bloqués pendant', 'Dein Konto und Gerät wurden gesperrt für', 'Hesabın ve cihazın şu süreyle engellendi:', 'Аккаунт и устройство заблокированы на', 'Sua conta e dispositivo foram bloqueados por', 'आपका खाता और डिवाइस प्रतिबंधित है:', 'Akun dan perangkatmu diblokir selama', 'آپ کا اکاؤنٹ اور ڈیوائس بند کر دیا گیا ہے:', 'حساب و دستگاه شما مسدود شده است به مدت'],
    '24 ساعة': ['24 hours', '24 horas', '24 heures', '24 Stunden', '24 saat', '24 часа', '24 horas', '24 घंटे', '24 jam', '24 گھنٹے', '۲۴ ساعت'],
    'بسبب مخالفة شروط الاستخدام (ظهور محتوى عاري / غير لائق).': ['for violating the Terms of Use (inappropriate content).', 'por infringir los Términos de uso (contenido inapropiado).', 'pour violation des conditions d\'utilisation (contenu inapproprié).', 'wegen Verstoßes gegen die Nutzungsbedingungen (unangemessene Inhalte).', 'Kullanım Koşullarını ihlal ettiğin için (uygunsuz içerik).', 'за нарушение Условий использования (неприемлемый контент).', 'por violar os Termos de Uso (conteúdo impróprio).', 'उपयोग की शर्तों के उल्लंघन (अनुचित सामग्री) के कारण।', 'karena melanggar Ketentuan Penggunaan (konten tidak pantas).', 'شرائط استعمال کی خلاف ورزی (نامناسب مواد) کی وجہ سے۔', 'به دلیل نقض شرایط استفاده (محتوای نامناسب).'],
    'الوقت المتبقي لفك الحظر تلقائياً:': ['Time remaining until unban:', 'Tiempo restante para el desbloqueo:', 'Temps restant avant déblocage :', 'Verbleibende Zeit bis zur Entsperrung:', 'Engelin kalkmasına kalan süre:', 'До разблокировки осталось:', 'Tempo restante para desbloqueio:', 'प्रतिबंध हटने में शेष समय:', 'Sisa waktu hingga blokir dibuka:', 'پابندی ختم ہونے میں باقی وقت:', 'زمان باقی‌مانده تا رفع مسدودی:'],
    'سيتم فك الحظر عن حسابك وتجهيز التطبيق تلقائياً بمجرد انتهاء العداد.': ['Your account will be unbanned automatically when the timer ends.', 'Tu cuenta se desbloqueará automáticamente al terminar el contador.', 'Votre compte sera débloqué automatiquement à la fin du compte à rebours.', 'Dein Konto wird nach Ablauf automatisch entsperrt.', 'Sayaç bittiğinde hesabının engeli otomatik kalkacak.', 'Аккаунт будет разблокирован автоматически по окончании таймера.', 'Sua conta será desbloqueada automaticamente quando o contador terminar.', 'टाइमर खत्म होने पर आपका खाता अपने आप अनब्लॉक हो जाएगा।', 'Akunmu akan dibuka otomatis saat penghitung selesai.', 'ٹائمر ختم ہوتے ہی آپ کا اکاؤنٹ خود بخود بحال ہو جائے گا۔', 'با پایان شمارنده، حساب شما به‌طور خودکار رفع مسدودی می‌شود.'],
    'محادثات المتصلين والأصدقاء': ['Online users & friends', 'Usuarios en línea y amigos', 'Utilisateurs en ligne et amis', 'Online-Nutzer & Freunde', 'Çevrimiçi kullanıcılar ve arkadaşlar', 'Онлайн и друзья', 'Usuários online e amigos', 'ऑनलाइन उपयोगकर्ता और दोस्त', 'Pengguna online & teman', 'آن لائن صارفین اور دوست', 'کاربران آنلاین و دوستان'],
    '🌐 جميع المستخدمين المتصلين الآن بالعالم': ['🌐 All users online worldwide', '🌐 Todos los usuarios en línea', '🌐 Tous les utilisateurs en ligne', '🌐 Alle Nutzer weltweit online', '🌐 Dünyada çevrimiçi tüm kullanıcılar', '🌐 Все пользователи онлайн', '🌐 Todos os usuários online', '🌐 दुनिया भर के सभी ऑनलाइन उपयोगकर्ता', '🌐 Semua pengguna online di dunia', '🌐 دنیا بھر کے تمام آن لائن صارفین', '🌐 همه کاربران آنلاین جهان'],
    '← القائمة': ['← List', '← Lista', '← Liste', '← Liste', '← Liste', '← Список', '← Lista', '← सूची', '← Daftar', '← فہرست', '← فهرست'],
    '🟢 متصل الآن بالدردشة الخاصة': ['🟢 Online in private chat', '🟢 En línea en chat privado', '🟢 En ligne en discussion privée', '🟢 Online im Privatchat', '🟢 Özel sohbette çevrimiçi', '🟢 Онлайн в личном чате', '🟢 Online no chat privado', '🟢 प्राइवेट चैट में ऑनलाइन', '🟢 Online di chat pribadi', '🟢 نجی چیٹ میں آن لائن', '🟢 آنلاین در گفتگوی خصوصی'],
    'إرسال 🚀': ['Send 🚀', 'Enviar 🚀', 'Envoyer 🚀', 'Senden 🚀', 'Gönder 🚀', 'Отправить 🚀', 'Enviar 🚀', 'भेजें 🚀', 'Kirim 🚀', 'بھیجیں 🚀', 'ارسال 🚀'],
    'ادعُ أصدقائك واكسب جواهر مجانية!': ['Invite friends and earn free gems!', '¡Invita amigos y gana gemas gratis!', 'Invitez vos amis et gagnez des gemmes !', 'Lade Freunde ein und verdiene Edelsteine!', 'Arkadaşlarını davet et, ücretsiz mücevher kazan!', 'Приглашайте друзей и получайте кристаллы!', 'Convide amigos e ganhe gemas grátis!', 'दोस्तों को आमंत्रित करें और मुफ़्त जेम्स कमाएँ!', 'Undang teman dan dapatkan permata gratis!', 'دوستوں کو مدعو کریں اور مفت جواہرات کمائیں!', 'دوستان را دعوت کنید و جواهر رایگان بگیرید!'],
    'احصل على': ['Get', 'Obtén', 'Obtenez', 'Erhalte', 'Kazan', 'Получите', 'Ganhe', 'पाएँ', 'Dapatkan', 'حاصل کریں', 'دریافت کنید'],
    '50 مجوهرة 💎': ['50 gems 💎', '50 gemas 💎', '50 gemmes 💎', '50 Edelsteine 💎', '50 mücevher 💎', '50 кристаллов 💎', '50 gemas 💎', '50 जेम्स 💎', '50 permata 💎', '50 جواہرات 💎', '۵۰ جواهر 💎'],
    'عن كل صديق يدخل عبر رابطك ويقوم بالشرطين المفروضين:': ['for every friend who joins via your link and completes both steps:', 'por cada amigo que se una con tu enlace y complete los dos pasos:', 'pour chaque ami qui rejoint via votre lien et complète les deux étapes :', 'für jeden Freund, der über deinen Link beitritt und beide Schritte erledigt:', 'bağlantınla katılıp iki adımı tamamlayan her arkadaş için:', 'за каждого друга, который перейдёт по ссылке и выполнит оба шага:', 'por cada amigo que entrar pelo seu link e concluir as duas etapas:', 'हर उस दोस्त के लिए जो आपके लिंक से जुड़े और दोनों कदम पूरे करे:', 'untuk setiap teman yang bergabung lewat tautanmu dan menyelesaikan kedua langkah:', 'ہر اس دوست کے لیے جو آپ کے لنک سے شامل ہو اور دونوں مراحل مکمل کرے:', 'برای هر دوستی که با لینک شما وارد شود و هر دو مرحله را انجام دهد:'],
    '1️⃣ إدخال اسمه وجنسه': ['1️⃣ Enter name and gender', '1️⃣ Introducir nombre y género', '1️⃣ Saisir nom et genre', '1️⃣ Name und Geschlecht eingeben', '1️⃣ Ad ve cinsiyet girme', '1️⃣ Указать имя и пол', '1️⃣ Informar nome e gênero', '1️⃣ नाम और लिंग दर्ज करें', '1️⃣ Isi nama dan jenis kelamin', '1️⃣ نام اور جنس درج کرنا', '1️⃣ وارد کردن نام و جنسیت'],
    '2️⃣ السماح بالإشعارات 🔔': ['2️⃣ Allow notifications 🔔', '2️⃣ Permitir notificaciones 🔔', '2️⃣ Autoriser les notifications 🔔', '2️⃣ Benachrichtigungen erlauben 🔔', '2️⃣ Bildirimlere izin verme 🔔', '2️⃣ Разрешить уведомления 🔔', '2️⃣ Permitir notificações 🔔', '2️⃣ सूचनाओं की अनुमति दें 🔔', '2️⃣ Izinkan notifikasi 🔔', '2️⃣ اطلاعات کی اجازت دینا 🔔', '2️⃣ اجازه اعلان‌ها 🔔'],
    'رابط الدعوة الخاص بك:': ['Your invite link:', 'Tu enlace de invitación:', 'Votre lien d\'invitation :', 'Dein Einladungslink:', 'Davet bağlantın:', 'Ваша ссылка-приглашение:', 'Seu link de convite:', 'आपका आमंत्रण लिंक:', 'Tautan undanganmu:', 'آپ کا دعوتی لنک:', 'لینک دعوت شما:'],
    '📋 نسخ الرابط': ['📋 Copy link', '📋 Copiar enlace', '📋 Copier le lien', '📋 Link kopieren', '📋 Bağlantıyı kopyala', '📋 Копировать', '📋 Copiar link', '📋 लिंक कॉपी करें', '📋 Salin tautan', '📋 لنک کاپی کریں', '📋 کپی لینک'],
    '📲 مشاركة واتساب': ['📲 Share on WhatsApp', '📲 Compartir en WhatsApp', '📲 Partager sur WhatsApp', '📲 Über WhatsApp teilen', '📲 WhatsApp\'ta paylaş', '📲 Поделиться в WhatsApp', '📲 Compartilhar no WhatsApp', '📲 WhatsApp पर शेयर करें', '📲 Bagikan ke WhatsApp', '📲 واٹس ایپ پر شیئر کریں', '📲 اشتراک در واتساپ'],
    'إغلاق': ['Close', 'Cerrar', 'Fermer', 'Schließen', 'Kapat', 'Закрыть', 'Fechar', 'बंद करें', 'Tutup', 'بند کریں', 'بستن'],
    '🚩 إبلاغ عن مخالفة': ['🚩 Report a violation', '🚩 Denunciar una infracción', '🚩 Signaler une infraction', '🚩 Verstoß melden', '🚩 İhlal bildir', '🚩 Сообщить о нарушении', '🚩 Denunciar uma violação', '🚩 उल्लंघन की रिपोर्ट करें', '🚩 Laporkan pelanggaran', '🚩 خلاف ورزی کی رپورٹ کریں', '🚩 گزارش تخلف'],
    'سيتم مراجعة البلاغ شخصياً وفورياً من قِبل إدارة التطبيق (المشرف) للتحقق واتخاذ الإجراء اللازم:': ['Your report will be reviewed by a moderator, who will take the appropriate action:', 'Un moderador revisará tu denuncia y tomará las medidas adecuadas:', 'Un modérateur examinera votre signalement et prendra les mesures nécessaires :', 'Ein Moderator prüft deine Meldung und ergreift die nötigen Maßnahmen:', 'Bildirimin bir moderatör tarafından incelenip gerekli işlem yapılacak:', 'Модератор проверит жалобу и примет меры:', 'Um moderador analisará sua denúncia e tomará as medidas necessárias:', 'आपकी रिपोर्ट की समीक्षा एक मॉडरेटर करेगा और उचित कार्रवाई करेगा:', 'Laporanmu akan ditinjau moderator dan ditindaklanjuti:', 'آپ کی رپورٹ کا جائزہ ایک ماڈریٹر لے گا اور مناسب کارروائی کرے گا:', 'گزارش شما توسط ناظر بررسی و اقدام لازم انجام می‌شود:'],
    '⚠️ جنس غير صحيح (ذكر يدعي أنثى أو العكس)': ['⚠️ Wrong gender (male posing as female or vice versa)', '⚠️ Género falso (hombre que dice ser mujer o al revés)', '⚠️ Faux genre (homme se disant femme ou inversement)', '⚠️ Falsches Geschlecht (Mann gibt sich als Frau aus oder umgekehrt)', '⚠️ Yanlış cinsiyet (kadın gibi davranan erkek veya tersi)', '⚠️ Неверный пол (мужчина выдаёт себя за женщину или наоборот)', '⚠️ Gênero falso (homem se passando por mulher ou vice-versa)', '⚠️ गलत लिंग (पुरुष खुद को महिला बताए या उल्टा)', '⚠️ Jenis kelamin palsu (pria mengaku wanita atau sebaliknya)', '⚠️ غلط جنس (مرد خود کو عورت ظاہر کرے یا اس کے برعکس)', '⚠️ جنسیت نادرست (مردی که خود را زن معرفی کند یا برعکس)'],
    '🔞 محتوى غير لائق أو تصرفات خادشة': ['🔞 Inappropriate content or behavior', '🔞 Contenido o conducta inapropiada', '🔞 Contenu ou comportement inapproprié', '🔞 Unangemessene Inhalte oder Verhalten', '🔞 Uygunsuz içerik veya davranış', '🔞 Неприемлемый контент или поведение', '🔞 Conteúdo ou comportamento impróprio', '🔞 अनुचित सामग्री या व्यवहार', '🔞 Konten atau perilaku tidak pantas', '🔞 نامناسب مواد یا رویہ', '🔞 محتوا یا رفتار نامناسب'],
    '🤬 سب أو إساءة ومضايقة': ['🤬 Insults, abuse or harassment', '🤬 Insultos, abuso o acoso', '🤬 Insultes, abus ou harcèlement', '🤬 Beleidigung, Missbrauch oder Belästigung', '🤬 Hakaret, taciz veya rahatsız etme', '🤬 Оскорбления или домогательства', '🤬 Insultos, abuso ou assédio', '🤬 गाली, दुर्व्यवहार या उत्पीड़न', '🤬 Hinaan, pelecehan atau gangguan', '🤬 گالی، بدسلوکی یا ہراسانی', '🤬 فحاشی، توهین یا آزار'],
    '📌 مخالفة أخرى': ['📌 Other violation', '📌 Otra infracción', '📌 Autre infraction', '📌 Sonstiger Verstoß', '📌 Diğer ihlal', '📌 Другое нарушение', '📌 Outra violação', '📌 अन्य उल्लंघन', '📌 Pelanggaran lain', '📌 دیگر خلاف ورزی', '📌 تخلف دیگر'],
    '🚨 إرسال البلاغ للمشرف': ['🚨 Send report', '🚨 Enviar denuncia', '🚨 Envoyer le signalement', '🚨 Meldung senden', '🚨 Bildirimi gönder', '🚨 Отправить жалобу', '🚨 Enviar denúncia', '🚨 रिपोर्ट भेजें', '🚨 Kirim laporan', '🚨 رپورٹ بھیجیں', '🚨 ارسال گزارش'],
    'تعديل إعدادات الحساب': ['Account settings', 'Ajustes de la cuenta', 'Paramètres du compte', 'Kontoeinstellungen', 'Hesap ayarları', 'Настройки аккаунта', 'Configurações da conta', 'खाता सेटिंग्स', 'Pengaturan akun', 'اکاؤنٹ کی ترتیبات', 'تنظیمات حساب'],
    'قائمة الأصدقاء والدردشة الخاصة': ['Friends & private chat', 'Amigos y chat privado', 'Amis et discussion privée', 'Freunde & Privatchat', 'Arkadaşlar ve özel sohbet', 'Друзья и личный чат', 'Amigos e chat privado', 'दोस्त और प्राइवेट चैट', 'Teman & chat pribadi', 'دوست اور نجی چیٹ', 'دوستان و گفتگوی خصوصی'],
    'دعوة أصدقاء وكسب جواهر': ['Invite friends & earn gems', 'Invitar amigos y ganar gemas', 'Inviter des amis et gagner des gemmes', 'Freunde einladen & Edelsteine verdienen', 'Arkadaş davet et, mücevher kazan', 'Пригласить друзей и получить кристаллы', 'Convidar amigos e ganhar gemas', 'दोस्तों को बुलाएँ और जेम्स कमाएँ', 'Undang teman & dapatkan permata', 'دوستوں کو مدعو کریں اور جواہرات کمائیں', 'دعوت دوستان و کسب جواهر'],
    'أدخل اسمك...': ['Enter your name...', 'Escribe tu nombre...', 'Entrez votre nom...', 'Gib deinen Namen ein...', 'Adını gir...', 'Введите имя...', 'Digite seu nome...', 'अपना नाम दर्ज करें...', 'Masukkan namamu...', 'اپنا نام درج کریں...', 'نام خود را وارد کنید...'],
    'إنهاء المكالمة': ['End call', 'Finalizar llamada', 'Raccrocher', 'Anruf beenden', 'Aramayı bitir', 'Завершить звонок', 'Encerrar chamada', 'कॉल समाप्त करें', 'Akhiri panggilan', 'کال ختم کریں', 'پایان تماس'],
    'كتم/تشغيل الميكروفون': ['Mute/unmute microphone', 'Silenciar/activar micrófono', 'Couper/activer le micro', 'Mikrofon stumm/an', 'Mikrofonu kapat/aç', 'Вкл/выкл микрофон', 'Silenciar/ativar microfone', 'माइक म्यूट/अनम्यूट', 'Bisukan/aktifkan mikrofon', 'مائیک بند/چالو', 'قطع/وصل میکروفون'],
    'إيقاف/تشغيل الكاميرا': ['Camera on/off', 'Cámara on/off', 'Caméra on/off', 'Kamera an/aus', 'Kamera aç/kapat', 'Вкл/выкл камеру', 'Câmera liga/desliga', 'कैमरा चालू/बंद', 'Kamera nyala/mati', 'کیمرہ بند/چالو', 'روشن/خاموش دوربین'],
    'تبديل الكاميرا (أمامية/خلفية)': ['Switch camera (front/back)', 'Cambiar cámara', 'Changer de caméra', 'Kamera wechseln', 'Kamerayı değiştir', 'Сменить камеру', 'Trocar câmera', 'कैमरा बदलें', 'Ganti kamera', 'کیمرہ تبدیل کریں', 'تغییر دوربین'],
    '🔍 ابحث عن اسم أي شخص متصل بالدردشة...': ['🔍 Search online users...', '🔍 Buscar usuarios en línea...', '🔍 Rechercher des utilisateurs...', '🔍 Online-Nutzer suchen...', '🔍 Çevrimiçi kullanıcı ara...', '🔍 Поиск пользователей...', '🔍 Buscar usuários online...', '🔍 ऑनलाइन उपयोगकर्ता खोजें...', '🔍 Cari pengguna online...', '🔍 آن لائن صارفین تلاش کریں...', '🔍 جستجوی کاربران آنلاین...'],
    'اكتب رسالتك الخاصة هنا...': ['Type your message...', 'Escribe tu mensaje...', 'Écrivez votre message...', 'Nachricht eingeben...', 'Mesajını yaz...', 'Введите сообщение...', 'Digite sua mensagem...', 'अपना संदेश लिखें...', 'Tulis pesanmu...', 'اپنا پیغام لکھیں...', 'پیام خود را بنویسید...'],
    'اكتب تفاصيل إضافية إن وُجدت (اختياري)...': ['Add details (optional)...', 'Añade detalles (opcional)...', 'Ajoutez des détails (facultatif)...', 'Details hinzufügen (optional)...', 'Ayrıntı ekle (isteğe bağlı)...', 'Подробности (необязательно)...', 'Adicione detalhes (opcional)...', 'विवरण जोड़ें (वैकल्पिक)...', 'Tambahkan detail (opsional)...', 'تفصیلات شامل کریں (اختیاری)...', 'جزئیات (اختیاری)...'],
    // ---- messages shown from app.js ----
    '🔔 تم تفعيل إشعارات لقاء بنجاح!': ['🔔 Notifications enabled!', '🔔 ¡Notificaciones activadas!', '🔔 Notifications activées !', '🔔 Benachrichtigungen aktiviert!', '🔔 Bildirimler açıldı!', '🔔 Уведомления включены!', '🔔 Notificações ativadas!', '🔔 सूचनाएँ चालू हो गईं!', '🔔 Notifikasi aktif!', '🔔 اطلاعات فعال ہو گئیں!', '🔔 اعلان‌ها فعال شد!'],
    '🎉 شكراً لانضمامك وتفعيل الإشعارات! تم منح صديقك 50 مجوهرة!': ['🎉 Thanks for joining! Your friend received 50 gems!', '🎉 ¡Gracias por unirte! Tu amigo recibió 50 gemas', '🎉 Merci ! Votre ami a reçu 50 gemmes !', '🎉 Danke fürs Mitmachen! Dein Freund hat 50 Edelsteine erhalten!', '🎉 Katıldığın için teşekkürler! Arkadaşın 50 mücevher kazandı!', '🎉 Спасибо! Ваш друг получил 50 кристаллов!', '🎉 Obrigado! Seu amigo ganhou 50 gemas!', '🎉 जुड़ने के लिए धन्यवाद! आपके दोस्त को 50 जेम्स मिले!', '🎉 Terima kasih! Temanmu mendapat 50 permata!', '🎉 شامل ہونے کا شکریہ! آپ کے دوست کو 50 جواہرات ملے!', '🎉 ممنون! دوست شما ۵۰ جواهر دریافت کرد!'],
    '📋 تم نسخ رابط الدعوة بنجاح!': ['📋 Invite link copied!', '📋 ¡Enlace copiado!', '📋 Lien copié !', '📋 Link kopiert!', '📋 Bağlantı kopyalandı!', '📋 Ссылка скопирована!', '📋 Link copiado!', '📋 लिंक कॉपी हो गया!', '📋 Tautan disalin!', '📋 لنک کاپی ہو گیا!', '📋 لینک کپی شد!'],
    '⚠️ لا يوجد شخص متصل معك حالياً لتقديم بلاغ ضده': ['⚠️ No one is connected with you to report', '⚠️ No hay nadie conectado para denunciar', '⚠️ Personne n\'est connecté à signaler', '⚠️ Niemand verbunden, den du melden kannst', '⚠️ Bildirilecek bağlı kimse yok', '⚠️ Нет собеседника для жалобы', '⚠️ Ninguém conectado para denunciar', '⚠️ रिपोर्ट करने के लिए कोई जुड़ा नहीं है', '⚠️ Tidak ada yang terhubung untuk dilaporkan', '⚠️ رپورٹ کرنے کے لیے کوئی منسلک نہیں', '⚠️ کسی برای گزارش متصل نیست'],
    '⚠️ لا يوجد شريك محدد للإبلاغ عنه': ['⚠️ No partner selected to report', '⚠️ No hay compañero seleccionado', '⚠️ Aucun partenaire sélectionné', '⚠️ Kein Partner ausgewählt', '⚠️ Bildirilecek kişi seçilmedi', '⚠️ Собеседник не выбран', '⚠️ Nenhum parceiro selecionado', '⚠️ कोई पार्टनर चुना नहीं गया', '⚠️ Tidak ada partner dipilih', '⚠️ کوئی پارٹنر منتخب نہیں', '⚠️ طرفی انتخاب نشده'],
    '🚨 تم إرسال البلاغ بنجاح! ستتم مراجعته يدوياً من قِبل المشرف.': ['🚨 Report sent! A moderator will review it.', '🚨 ¡Denuncia enviada! Un moderador la revisará.', '🚨 Signalement envoyé ! Un modérateur l\'examinera.', '🚨 Meldung gesendet! Ein Moderator prüft sie.', '🚨 Bildirim gönderildi! Moderatör inceleyecek.', '🚨 Жалоба отправлена! Модератор её проверит.', '🚨 Denúncia enviada! Um moderador vai analisar.', '🚨 रिपोर्ट भेज दी गई! मॉडरेटर समीक्षा करेगा।', '🚨 Laporan terkirim! Moderator akan meninjaunya.', '🚨 رپورٹ بھیج دی گئی! ماڈریٹر جائزہ لے گا۔', '🚨 گزارش ارسال شد! ناظر آن را بررسی می‌کند.'],
    '✅ تم تسجيل بلاغك وسيقوم المشرف بمراجعته فوراً': ['✅ Report received. A moderator will review it', '✅ Denuncia recibida. Un moderador la revisará', '✅ Signalement reçu. Un modérateur l\'examinera', '✅ Meldung erhalten. Ein Moderator prüft sie', '✅ Bildirim alındı. Moderatör inceleyecek', '✅ Жалоба получена. Модератор проверит', '✅ Denúncia recebida. Um moderador vai analisar', '✅ रिपोर्ट मिल गई। मॉडरेटर समीक्षा करेगा', '✅ Laporan diterima. Moderator akan meninjau', '✅ رپورٹ موصول ہو گئی۔ ماڈریٹر جائزہ لے گا', '✅ گزارش دریافت شد. ناظر بررسی می‌کند'],
    '🚨 تم إرسال البلاغ وسيقوم المشرف بمراجعته فوراً': ['🚨 Report sent. A moderator will review it', '🚨 Denuncia enviada. Un moderador la revisará', '🚨 Signalement envoyé. Un modérateur l\'examinera', '🚨 Meldung gesendet. Ein Moderator prüft sie', '🚨 Bildirim gönderildi. Moderatör inceleyecek', '🚨 Жалоба отправлена. Модератор проверит', '🚨 Denúncia enviada. Um moderador vai analisar', '🚨 रिपोर्ट भेज दी गई। मॉडरेटर समीक्षा करेगा', '🚨 Laporan terkirim. Moderator akan meninjau', '🚨 رپورٹ بھیج دی گئی۔ ماڈریٹر جائزہ لے گا', '🚨 گزارش ارسال شد. ناظر بررسی می‌کند'],
    '❌ يرجى إدخال عنوان بريد Google صحيح': ['❌ Please enter a valid email', '❌ Introduce un correo válido', '❌ Saisissez un e-mail valide', '❌ Bitte gültige E-Mail eingeben', '❌ Geçerli bir e-posta girin', '❌ Введите корректный e-mail', '❌ Digite um e-mail válido', '❌ मान्य ईमेल दर्ज करें', '❌ Masukkan email yang valid', '❌ درست ای میل درج کریں', '❌ ایمیل معتبر وارد کنید'],
    '❌ يرجى إدخال عنوان بريد إلكتروني صحيح': ['❌ Please enter a valid email', '❌ Introduce un correo válido', '❌ Saisissez un e-mail valide', '❌ Bitte gültige E-Mail eingeben', '❌ Geçerli bir e-posta girin', '❌ Введите корректный e-mail', '❌ Digite um e-mail válido', '❌ मान्य ईमेल दर्ज करें', '❌ Masukkan email yang valid', '❌ درست ای میل درج کریں', '❌ ایمیل معتبر وارد کنید'],
    '❌ لا يوجد شريك متصل الآن': ['❌ No partner connected', '❌ No hay compañero conectado', '❌ Aucun partenaire connecté', '❌ Kein Partner verbunden', '❌ Bağlı kimse yok', '❌ Нет собеседника', '❌ Nenhum parceiro conectado', '❌ कोई पार्टनर जुड़ा नहीं', '❌ Tidak ada partner terhubung', '❌ کوئی پارٹنر منسلک نہیں', '❌ طرفی متصل نیست'],
    '✨ هذا الشخص موجود في قائمة أصدقائك بالفعل': ['✨ Already in your friends list', '✨ Ya está en tu lista de amigos', '✨ Déjà dans vos amis', '✨ Bereits in deiner Freundesliste', '✨ Zaten arkadaş listende', '✨ Уже в списке друзей', '✨ Já está na sua lista de amigos', '✨ पहले से आपकी दोस्त सूची में है', '✨ Sudah ada di daftar temanmu', '✨ پہلے سے آپ کی دوستوں کی فہرست میں ہے', '✨ از قبل در فهرست دوستان شماست'],
    '✨ تم تحديث بيانات الحساب بنجاح': ['✨ Account updated', '✨ Cuenta actualizada', '✨ Compte mis à jour', '✨ Konto aktualisiert', '✨ Hesap güncellendi', '✨ Аккаунт обновлён', '✨ Conta atualizada', '✨ खाता अपडेट हो गया', '✨ Akun diperbarui', '✨ اکاؤنٹ اپ ڈیٹ ہو گیا', '✨ حساب به‌روزرسانی شد'],
    'متصفحك لا يدعم الكاميرا': ['Your device does not support the camera', 'Tu dispositivo no admite la cámara', 'Votre appareil ne prend pas en charge la caméra', 'Dein Gerät unterstützt die Kamera nicht', 'Cihazın kamerayı desteklemiyor', 'Устройство не поддерживает камеру', 'Seu dispositivo não suporta a câmera', 'आपका डिवाइस कैमरा सपोर्ट नहीं करता', 'Perangkatmu tidak mendukung kamera', 'آپ کا ڈیوائس کیمرہ سپورٹ نہیں کرتا', 'دستگاه شما از دوربین پشتیبانی نمی‌کند'],
    'يرجى استخدام متصفح Chrome أو Firefox أو Edge حديث. تأكد من أنك تستخدم HTTPS.': ['Please use an up-to-date Chrome, Firefox or Edge over HTTPS.', 'Usa Chrome, Firefox o Edge actualizados con HTTPS.', 'Utilisez Chrome, Firefox ou Edge à jour en HTTPS.', 'Bitte nutze aktuelles Chrome, Firefox oder Edge mit HTTPS.', 'Güncel Chrome, Firefox veya Edge (HTTPS) kullanın.', 'Используйте актуальный Chrome, Firefox или Edge по HTTPS.', 'Use Chrome, Firefox ou Edge atualizados com HTTPS.', 'कृपया HTTPS के साथ नया Chrome, Firefox या Edge इस्तेमाल करें।', 'Gunakan Chrome, Firefox atau Edge terbaru dengan HTTPS.', 'براہ کرم HTTPS کے ساتھ تازہ Chrome، Firefox یا Edge استعمال کریں۔', 'لطفاً از Chrome، Firefox یا Edge به‌روز با HTTPS استفاده کنید.'],
    '🚫 تم رفض إذن الكاميرا': ['🚫 Camera permission denied', '🚫 Permiso de cámara denegado', '🚫 Accès à la caméra refusé', '🚫 Kamerazugriff verweigert', '🚫 Kamera izni reddedildi', '🚫 Доступ к камере запрещён', '🚫 Permissão da câmera negada', '🚫 कैमरा अनुमति अस्वीकार', '🚫 Izin kamera ditolak', '🚫 کیمرہ کی اجازت مسترد', '🚫 دسترسی دوربین رد شد'],
    'يرجى السماح بالوصول للكاميرا والميكروفون من إعدادات المتصفح.': ['Please allow camera and microphone access in settings.', 'Permite la cámara y el micrófono en los ajustes.', 'Autorisez la caméra et le micro dans les paramètres.', 'Bitte erlaube Kamera und Mikrofon in den Einstellungen.', 'Ayarlardan kamera ve mikrofona izin verin.', 'Разрешите камеру и микрофон в настройках.', 'Permita câmera e microfone nas configurações.', 'कृपया सेटिंग्स में कैमरा और माइक्रोफ़ोन की अनुमति दें।', 'Izinkan kamera dan mikrofon di pengaturan.', 'براہ کرم سیٹنگز میں کیمرہ اور مائیکروفون کی اجازت دیں۔', 'لطفاً در تنظیمات به دوربین و میکروفون اجازه دهید.'],
    '❌ مشكلة الكاميرا': ['❌ Camera problem', '❌ Problema de cámara', '❌ Problème de caméra', '❌ Kameraproblem', '❌ Kamera sorunu', '❌ Проблема с камерой', '❌ Problema na câmera', '❌ कैमरा समस्या', '❌ Masalah kamera', '❌ کیمرہ کا مسئلہ', '❌ مشکل دوربین'],
    'تعذر الحصول على صورة الكاميرا.': ['Could not access the camera.', 'No se pudo acceder a la cámara.', 'Impossible d\'accéder à la caméra.', 'Kein Zugriff auf die Kamera.', 'Kameraya erişilemedi.', 'Не удалось получить доступ к камере.', 'Não foi possível acessar a câmera.', 'कैमरा एक्सेस नहीं हो सका।', 'Tidak dapat mengakses kamera.', 'کیمرہ تک رسائی نہیں ہو سکی۔', 'دسترسی به دوربین ممکن نشد.']
  };

  function t(key) {
    const row = KEYS[key];
    if (!row) return key;
    if (LANG === 'ar') return row[0];
    return row[IDX + 1] || row[1];
  }

  function translateString(s) {
    if (LANG === 'ar' || !s) return null;
    const norm = s.replace(/\s+/g, ' ').trim();
    const row = D[norm];
    if (!row) return null;
    const tr = row[IDX];
    if (!tr) return null;
    const lead = s.match(/^\s*/)[0];
    const trail = s.match(/\s*$/)[0];
    return lead + tr + trail;
  }

  const AR_RE = /[\u0600-\u06FF]/;
  function translateNode(root) {
    if (LANG === 'ar' || !root) return;
    if (root.nodeType === 3) {
      if (AR_RE.test(root.nodeValue)) {
        const tr = translateString(root.nodeValue);
        if (tr !== null) root.nodeValue = tr;
      }
      return;
    }
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE' || root.tagName === 'OPTION' && root.parentNode && root.parentNode.id === 'country-select' && root.value !== 'ALL') return;
    ['placeholder', 'title'].forEach(attr => {
      const v = root.getAttribute && root.getAttribute(attr);
      if (v && AR_RE.test(v)) {
        const tr = translateString(v);
        if (tr !== null) root.setAttribute(attr, tr);
      }
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) {
        if (AR_RE.test(n.nodeValue)) {
          const tr = translateString(n.nodeValue);
          if (tr !== null) n.nodeValue = tr;
        }
      } else {
        ['placeholder', 'title'].forEach(attr => {
          const v = n.getAttribute(attr);
          if (v && AR_RE.test(v)) {
            const tr = translateString(v);
            if (tr !== null) n.setAttribute(attr, tr);
          }
        });
      }
      n = walker.nextNode();
    }
  }

  // Expose for app.js
  window.LOKY_LANG = LANG;
  window.t = t;
  window.translateUI = translateNode;

  // Language + direction on <html> as early as possible
  document.documentElement.lang = LANG;
  document.documentElement.dir = RTL.includes(LANG) ? 'rtl' : 'ltr';

  // Android app marker (hides web-only payment UI and APK download)
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('native-app');
  }

  // ---------- 18+ age gate ----------
  function showAgeGate() {
    if (localStorage.getItem('liqaa_age_confirmed') === '1') return;
    const overlay = document.createElement('div');
    overlay.id = 'age-gate';
    overlay.setAttribute('dir', RTL.includes(LANG) ? 'rtl' : 'ltr');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(8,9,20,0.97);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;';
    overlay.innerHTML =
      '<div style="max-width:380px;width:100%;background:#131424;border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:26px 20px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.6);">' +
        '<div style="font-size:54px;line-height:1;margin-bottom:10px;">🔞</div>' +
        '<h2 id="age-gate-title" style="color:#fff;font-size:20px;font-weight:800;margin:0 0 10px;"></h2>' +
        '<p id="age-gate-text" style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0 0 18px;"></p>' +
        '<div id="age-gate-buttons" style="display:flex;flex-direction:column;gap:10px;">' +
          '<button id="age-gate-yes" style="padding:13px;border:none;border-radius:12px;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(135deg,#10b981,#059669);cursor:pointer;"></button>' +
          '<button id="age-gate-no" style="padding:12px;border:1px solid rgba(255,255,255,0.25);border-radius:12px;font-size:14px;font-weight:700;color:#fff;background:rgba(255,255,255,0.06);cursor:pointer;"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    const title = overlay.querySelector('#age-gate-title');
    const text = overlay.querySelector('#age-gate-text');
    const yes = overlay.querySelector('#age-gate-yes');
    const no = overlay.querySelector('#age-gate-no');

    function renderQuestion() {
      title.textContent = t('age_title');
      text.textContent = t('age_text');
      yes.textContent = t('age_yes');
      yes.style.display = '';
      no.textContent = t('age_no');
      no.onclick = renderBlocked;
    }
    function renderBlocked() {
      title.textContent = '🚫';
      text.textContent = t('age_blocked');
      yes.style.display = 'none';
      no.textContent = t('age_back');
      no.onclick = renderQuestion;
    }
    yes.onclick = () => {
      localStorage.setItem('liqaa_age_confirmed', '1');
      overlay.remove();
    };
    renderQuestion();
  }

  document.addEventListener('DOMContentLoaded', () => {
    translateNode(document.body);
    if (LANG !== 'ar') {
      const titleTr = translateString(document.title);
      if (titleTr) document.title = titleTr;
      let busy = false;
      new MutationObserver(muts => {
        if (busy) return;
        busy = true;
        try {
          for (const m of muts) {
            if (m.type === 'characterData') translateNode(m.target);
            else m.addedNodes.forEach(translateNode);
          }
        } finally {
          busy = false;
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    showAgeGate();
  });
})();
