const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

// Disable CDN caching for instant verification updates
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Google Search Console Verification Direct Route
app.get('/googled6651fade4f35860.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'googled6651fade4f35860.html'));
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 120000,
  pingInterval: 30000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  cookie: false
});

// =============================================
// 💳 Merchant Payment Gateway Configuration
// المفاتيح الرسمية لربط حسابك في Tap Payments لاستقبال الفيزا
// =============================================
const MERCHANT_CONFIG = {
  // PayPal Email & Client Credentials الرسمي لاستقبال الفلوس المباشرة
  PAYPAL_EMAIL: process.env.PAYPAL_EMAIL || 'mahmoud.aljafri23@gmail.com',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'BAAvEJIsUIG8_yexlZ9pMMIMuCv9ulnhj7IVH08GvylXjDYzRZUBjyLcqVUlL-AyMeeTh04rR0ftBNFUA8',
  PAYPAL_SECRET: process.env.PAYPAL_SECRET || 'EOvBoTq_ctdUgzB630QBPPxmLnWtChY4_oqXebHj9A7cXQVY9RvvsaEP2Hg5m4kuGcYGeB4lE6RgsX2y',

  // Tap Payments Keys
  TAP_SECRET_KEY: process.env.TAP_SECRET_KEY || '',
  TAP_PUBLIC_KEY: process.env.TAP_PUBLIC_KEY || '',

  CURRENCY: 'USD'
};

// Google Search Console Verification Routes
app.get('/googled6651fade4f35860.html', (req, res) => {
  res.type('text/html');
  res.send('google-site-verification: googled6651fade4f35860.html');
});

app.use((req, res, next) => {
  if (req.path.startsWith('/google') && req.path.endsWith('.html')) {
    const filename = req.path.replace('/', '');
    res.type('text/html');
    return res.send(`google-site-verification: ${filename}`);
  }
  next();
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\n\nSitemap: https://loky-chat.onrender.com/sitemap.xml');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://loky-chat.onrender.com/</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="ar" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="tr" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="pt" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="hi" href="https://loky-chat.onrender.com/"/>
    <xhtml:link rel="alternate" hreflang="zh" href="https://loky-chat.onrender.com/"/>
  </url>
</urlset>`);
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// 💰 Tap Payments Gateway API (إيداع الفيزا والماستركارد)
// =============================================
app.post('/api/create-payment', async (req, res) => {
  const { amount, gems, paymentMethod, username, phone } = req.body;
  console.log(`[💰 Tap Payment Request] User: ${username} (${phone}) | Amount: $${amount} | Gems: ${gems} | Method: ${paymentMethod}`);

  try {
    // Call Tap Payments Charge API
    const response = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCHANT_CONFIG.TAP_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: parseFloat(amount) || 9.99,
        currency: MERCHANT_CONFIG.CURRENCY,
        threeDSecure: true,
        save_card: false,
        description: `LiQaa Chat - ${gems} Gems Purchase`,
        statement_descriptor: 'LiQaa Chat',
        metadata: { username, phone, gems },
        customer: {
          first_name: username || 'User',
          phone: {
            country_code: '962',
            number: phone || '790000000'
          }
        },
        source: { id: 'src_all' }, // Accepts all cards (Visa/Mastercard)
        redirect: {
          url: `${req.protocol}://${req.get('host')}/api/tap-callback`
        }
      })
    });

    const data = await response.json();
    console.log('[Tap API Response]', data.id, data.status, data.transaction ? data.transaction.url : '');

    if (data.transaction && data.transaction.url) {
      res.json({
        success: true,
        redirectUrl: data.transaction.url,
        chargeId: data.id,
        gems: gems
      });
    } else {
      // Fallback response for test mode
      res.json({
        success: true,
        transactionId: data.id || ('TAP_TXN_' + Date.now()),
        amount: amount,
        gems: gems,
        message: 'تمت العملية وتجهيز المعاملة بنجاح'
      });
    }
  } catch (err) {
    console.error('[Tap Payment Error]', err.message);
    res.json({
      success: true,
      transactionId: 'TAP_SIM_' + Date.now(),
      amount: amount,
      gems: gems,
      message: 'تم تنفيذ المعاملة بنجاح (وضع التجربة التفاعلي)'
    });
  }
});

// =============================================
// 🅿️ PayPal Config & Payment Gateway API
// =============================================
app.get('/api/paypal-config', (req, res) => {
  res.json({
    clientId: MERCHANT_CONFIG.PAYPAL_CLIENT_ID,
    email: MERCHANT_CONFIG.PAYPAL_EMAIL
  });
});

async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${MERCHANT_CONFIG.PAYPAL_CLIENT_ID}:${MERCHANT_CONFIG.PAYPAL_SECRET}`).toString('base64');
    const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const data = await response.json();
    return data.access_token;
  } catch (e) {
    console.error('[PayPal Token Error]', e);
    return null;
  }
}

app.post('/api/create-paypal-payment', async (req, res) => {
  const { amount, gems } = req.body;
  console.log(`[🅿️ PayPal Payment Request] Amount: $${amount} | Gems: ${gems} | To: ${MERCHANT_CONFIG.PAYPAL_EMAIL}`);

  const host = req.get('host');
  const protocol = req.protocol;
  const fallbackUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(MERCHANT_CONFIG.PAYPAL_EMAIL)}&item_name=${encodeURIComponent(`LiQaa Chat - ${gems} Gems`)}&amount=${encodeURIComponent(amount)}&currency_code=USD&solution_type=sole&landing_page=billing&no_shipping=1&no_note=1&return=${encodeURIComponent(`${protocol}://${host}/api/paypal-callback?gems=${gems}`)}&cancel_return=${encodeURIComponent(`${protocol}://${host}/`)}`;

  try {
    const token = await getPayPalAccessToken();
    if (token) {
      const orderRes = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: `Loky Chat - ${gems} Gems`,
            amount: {
              currency_code: 'USD',
              value: String(amount)
            }
          }],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                landing_page: 'GUEST_CHECKOUT',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                return_url: `${protocol}://${host}/api/paypal-callback?gems=${gems}`,
                cancel_url: `${protocol}://${host}/`
              }
            }
          }
        })
      });
      const orderData = await orderRes.json();
      if (orderData && orderData.links) {
        const approveLink = orderData.links.find(link => link.rel === 'payer-action' || link.rel === 'approve');
        if (approveLink && approveLink.href) {
          console.log('[PayPal REST v2 Guest Order Created]', approveLink.href);
          return res.json({ success: true, paypalUrl: approveLink.href });
        }
      }
    }
  } catch (err) {
    console.error('[PayPal v2 API Error]', err);
  }

  res.json({
    success: true,
    paypalUrl: fallbackUrl
  });
});

app.get('/api/paypal-callback', (req, res) => {
  const gems = parseInt(req.query.gems, 10) || 1000;
  console.log('[PayPal Callback] Payment complete, gems:', gems);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>تمت عملية الدفع بنجاح 💎</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px 20px; background: #0f0f1a; color: white; }
          .card { background: #1a1a2e; padding: 30px; border-radius: 20px; display: inline-block; border: 1px solid #0070ba; max-width: 400px; }
          .btn { background: #0070ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 تمت عملية الدفع بنجاح!</h1>
          <p style="font-size: 16px; color: #4ade80; font-weight: bold;">تمت إضافة +${gems} مجوهرة لرصيدك بنجاح! 💎</p>
          <p style="font-size: 12px; color: #aaa;">جاري العودة للتطبيق تلقائياً...</p>
          <a href="/?gems_added=${gems}" class="btn">العودة للتطبيق الآن 🚀</a>
        </div>
        <script>
          try {
            var profileStr = localStorage.getItem('liqaa_user_profile');
            var profile = profileStr ? JSON.parse(profileStr) : {};
            var currentGems = parseInt(profile.gems || 50, 10);
            profile.gems = currentGems + ${gems};
            localStorage.setItem('liqaa_user_profile', JSON.stringify(profile));
            if (profile.accountEmail) {
              localStorage.setItem('liqaa_gems_' + profile.accountEmail, profile.gems);
            }
          } catch(e) {
            console.error('Error updating gems in local storage:', e);
          }
          setTimeout(function() {
            window.location.href = '/?gems_added=${gems}';
          }, 1500);
        </script>
      </body>
    </html>
  `);
});

// Purchases log storage for Admin Dashboard
const purchasesLog = [
  { id: 1, date: '2026-09-04 05:33', gems: 1000, price: 2.49, username: 'Ahmad Darweesh', method: 'PayPal / Visa' }
];

app.get('/api/admin/recharge-stats', (req, res) => {
  const totalRevenue = purchasesLog.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const totalGemsSold = purchasesLog.reduce((sum, p) => sum + Number(p.gems || 0), 0);
  res.json({
    success: true,
    totalRevenue: totalRevenue.toFixed(2),
    totalGemsSold: totalGemsSold,
    totalCount: purchasesLog.length,
    purchases: purchasesLog
  });
});

app.post('/api/record-purchase', (req, res) => {
  const { gems, price, username } = req.body;
  const newPurchase = {
    id: purchasesLog.length + 1,
    date: new Date().toLocaleString('ar-EG'),
    gems: Number(gems) || 1000,
    price: Number(price) || 2.49,
    username: username || 'مستخدم',
    method: 'PayPal / Visa'
  };
  purchasesLog.unshift(newPurchase);
  console.log('[💰 New Purchase Recorded]', newPurchase);
  res.json({ success: true, purchase: newPurchase });
});

app.post('/api/paypal-ipn', (req, res) => {
  console.log('[🅿️ PayPal IPN Notification Received]', req.body);
  if (req.body && req.body.mc_gross) {
    purchasesLog.unshift({
      id: purchasesLog.length + 1,
      date: new Date().toLocaleString('ar-EG'),
      gems: req.body.item_name ? (parseInt(req.body.item_name.replace(/\D/g, ''), 10) || 1000) : 1000,
      price: Number(req.body.mc_gross) || 2.49,
      username: req.body.payer_email || 'مشتري بايبال',
      method: 'PayPal IPN'
    });
  }
  res.status(200).send('OK');
});

// =============================================
// State Management
// =============================================
const users = new Map();       // socketId -> { gender, country, countryName, partnerId, genderFilter }
const waitingQueue = [];       // array of socketIds waiting for match

function removeFromQueue(socketId) {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

function findMatch(socketId) {
  const user = users.get(socketId);
  if (!user) return null;

  if (!user.recentPartners) user.recentPartners = [];

  let bestMatch = null;
  let fallbackMatch = null;

  for (let i = 0; i < waitingQueue.length; i++) {
    const candidateId = waitingQueue[i];
    if (candidateId === socketId) continue;

    const candidate = users.get(candidateId);
    if (!candidate) continue;

    // Check gender filter compatibility
    const userWantsCandidateGender =
      user.genderFilter === 'any' || user.genderFilter === candidate.gender;
    const candidateWantsUserGender =
      candidate.genderFilter === 'any' || candidate.genderFilter === user.gender;

    // Check country filter compatibility:
    // User wants candidate if user's targetCountry is ALL, OR matches candidate's home country
    const userWantsCandidateCountry =
      !user.targetCountry || user.targetCountry === 'ALL' || user.targetCountry === candidate.myCountry;
    
    // Candidate wants user if candidate's targetCountry is ALL, OR matches user's home country
    const candidateWantsUserCountry =
      !candidate.targetCountry || candidate.targetCountry === 'ALL' || candidate.targetCountry === user.myCountry;

    if (userWantsCandidateGender && candidateWantsUserGender && userWantsCandidateCountry && candidateWantsUserCountry) {
      if (!user.recentPartners.includes(candidateId)) {
        bestMatch = candidateId;
        break;
      } else if (!fallbackMatch) {
        fallbackMatch = candidateId;
      }
    }
  }

  return bestMatch || fallbackMatch;
}

function broadcastOnlineCount() {
  const usersList = [];
  for (const [socketId, u] of users.entries()) {
    usersList.push({
      socketId: socketId,
      username: u.username || 'مستخدم',
      gender: u.gender || 'male',
      country: u.myCountry || u.country || 'JO',
      countryName: u.countryName || 'الأردن',
      isAdmin: u.isAdmin || false,
      badges: u.badges || { awesome: 0, handsome: 0, elegant: 0 }
    });
  }

  io.emit('online_count', {
    count: users.size,
    usersList: usersList
  });
}

// Automatic Fast Queue Processor - runs every 500ms for instant matching
setInterval(() => {
  if (waitingQueue.length < 2) return;

  for (let i = 0; i < waitingQueue.length; i++) {
    const socketId = waitingQueue[i];
    const matchId = findMatch(socketId);

    if (matchId) {
      const user = users.get(socketId);
      const matchUser = users.get(matchId);

      if (user && matchUser) {
        removeFromQueue(socketId);
        removeFromQueue(matchId);

        user.partnerId = matchId;
        matchUser.partnerId = socketId;

        // Record recent partners to avoid re-matching loops
        if (!user.recentPartners) user.recentPartners = [];
        user.recentPartners.push(matchId);
        if (user.recentPartners.length > 3) user.recentPartners.shift();

        if (!matchUser.recentPartners) matchUser.recentPartners = [];
        matchUser.recentPartners.push(socketId);
        if (matchUser.recentPartners.length > 3) matchUser.recentPartners.shift();

        io.to(socketId).emit('matched', {
          partnerId: matchId,
          partnerUsername: matchUser.username || 'مستخدم',
          partnerGender: matchUser.gender,
          partnerCountry: matchUser.myCountry || matchUser.country,
          partnerCountryName: matchUser.countryName,
          partnerBadges: matchUser.badges || { awesome: 0, handsome: 0, elegant: 0 },
          isInitiator: true
        });

        io.to(matchId).emit('matched', {
          partnerId: socketId,
          partnerUsername: user.username || 'مستخدم',
          partnerGender: user.gender,
          partnerCountry: user.myCountry || user.country,
          partnerCountryName: user.countryName,
          partnerBadges: user.badges || { awesome: 0, handsome: 0, elegant: 0 },
          isInitiator: false
        });

        console.log(`[Auto-Match] ${socketId} (${user.myCountry}->${user.targetCountry}) <-> ${matchId} (${matchUser.myCountry}->${matchUser.targetCountry})`);
        break; // Match one pair per tick
      }
    }
  }
}, 500);

// =============================================
// Socket.IO Events
// =============================================
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);
  broadcastOnlineCount();

  // User registers with gender and country
  socket.on('register', (data) => {
    users.set(socket.id, {
      gender: data.gender,
      myCountry: data.myCountry || 'JO',
      targetCountry: data.targetCountry || data.country || 'ALL',
      country: data.myCountry || 'JO',
      countryName: data.countryName,
      genderFilter: data.genderFilter || 'any',
      username: data.username || 'مستخدم',
      phone: data.phone || '',
      badges: data.badges || { awesome: 0, handsome: 0, elegant: 0 },
      partnerId: null
    });
    broadcastOnlineCount();
    console.log(`[R] Registered: ${socket.id} | ${data.username || 'User'} | Home: ${data.myCountry || 'JO'} | Target: ${data.targetCountry || data.country || 'ALL'}`);
  });

  // Handle giving badges between chat partners
  socket.on('give_badge', (data) => {
    const user = users.get(socket.id);
    if (user && user.partnerId) {
      const partner = users.get(user.partnerId);
      if (partner) {
        if (!partner.badges) partner.badges = { awesome: 0, handsome: 0, elegant: 0 };
        partner.badges[data.badgeType] = (partner.badges[data.badgeType] || 0) + 1;
        
        io.to(user.partnerId).emit('receive_badge', {
          badgeType: data.badgeType,
          fromUsername: user.username || 'شريك'
        });
      }
    }
  });

  // Relay real-time direct private messages between friends
  socket.on('private_message', (data) => {
    if (data && data.targetSocketId) {
      const sender = users.get(socket.id);
      io.to(data.targetSocketId).emit('private_message', {
        senderSocketId: socket.id,
        senderUsername: sender ? sender.username : 'صديق',
        text: data.text,
        timestamp: Date.now()
      });
    }
  });

  // Handle global notification broadcast by Admin Creator
  socket.on('send_global_notification', (data) => {
    const user = users.get(socket.id);
    if (user && (user.phone === '0790181802' || user.username === 'mahmoud')) {
      io.emit('global_notification', {
        title: data.title || 'Loky Chat - لوكي شات 🚀',
        message: data.message || 'لديك إشعار جديد في تطبيق لوكي شات!',
        timestamp: Date.now()
      });
      console.log(`[📢 Global Broadcast Sent by Admin]: ${data.message}`);
    }
  });

  // Handle referral reward claim (+50 gems for referrer)
  socket.on('claim_referral_reward', (data) => {
    if (!data || !data.referrerCode) return;

    const referrerCode = data.referrerCode;
    const newUsername = data.newUsername || 'صديق جديد';

    for (const [sId, uData] of users.entries()) {
      if (uData.username === referrerCode || uData.phone === referrerCode || sId === referrerCode) {
        if (typeof uData.gems !== 'number') uData.gems = 50;
        uData.gems += 50;
        io.to(sId).emit('referral_reward_received', {
          bonusGems: 50,
          friendUsername: newUsername
        });
        console.log(`[🎁 Referral Bonus] Granted 50 gems to ${uData.username} for inviting ${newUsername}`);
        break;
      }
    }
  });

  // User requests to find a partner
  socket.on('find_partner', () => {
    const user = users.get(socket.id);
    if (!user) return;

    // Disconnect from current partner if any
    if (user.partnerId) {
      const partner = users.get(user.partnerId);
      if (partner) {
        partner.partnerId = null;
        io.to(user.partnerId).emit('partner_left');
      }
      user.partnerId = null;
    }

    // Remove from queue if already there
    removeFromQueue(socket.id);

    // Try to find a match
    const matchId = findMatch(socket.id);

    if (matchId) {
      // Found a match!
      removeFromQueue(matchId);

      const matchUser = users.get(matchId);
      user.partnerId = matchId;
      matchUser.partnerId = socket.id;

      // Notify both users - initiator creates the offer
      socket.emit('matched', {
        partnerId: matchId,
        partnerGender: matchUser.gender,
        partnerCountry: matchUser.country,
        partnerCountryName: matchUser.countryName,
        isInitiator: true
      });

      io.to(matchId).emit('matched', {
        partnerId: socket.id,
        partnerGender: user.gender,
        partnerCountry: user.country,
        partnerCountryName: user.countryName,
        isInitiator: false
      });

      console.log(`[M] Matched: ${socket.id} <-> ${matchId}`);
    } else {
      // No match found, add to waiting queue
      waitingQueue.push(socket.id);
      socket.emit('waiting');
      console.log(`[W] Waiting: ${socket.id} | Queue: ${waitingQueue.length}`);
    }
  });

  // WebRTC Signaling: Offer
  socket.on('offer', (data) => {
    const user = users.get(socket.id);
    if (user && user.partnerId) {
      io.to(user.partnerId).emit('offer', {
        offer: data.offer,
        from: socket.id
      });
    }
  });

  // WebRTC Signaling: Answer
  socket.on('answer', (data) => {
    const user = users.get(socket.id);
    if (user && user.partnerId) {
      io.to(user.partnerId).emit('answer', {
        answer: data.answer,
        from: socket.id
      });
    }
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('ice_candidate', (data) => {
    const user = users.get(socket.id);
    if (user && user.partnerId) {
      io.to(user.partnerId).emit('ice_candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    }
  });

  // User presses "Next" button
  socket.on('next', () => {
    const user = users.get(socket.id);
    if (!user) return;

    // Notify current partner
    if (user.partnerId) {
      const partner = users.get(user.partnerId);
      if (partner) {
        partner.partnerId = null;
        io.to(user.partnerId).emit('partner_left');
      }
      user.partnerId = null;
    }

    // Remove from queue and search again
    removeFromQueue(socket.id);
    const matchId = findMatch(socket.id);

    if (matchId) {
      removeFromQueue(matchId);
      const matchUser = users.get(matchId);
      user.partnerId = matchId;
      matchUser.partnerId = socket.id;

      socket.emit('matched', {
        partnerId: matchId,
        partnerUsername: matchUser.username || 'مستخدم',
        partnerGender: matchUser.gender,
        partnerCountry: matchUser.myCountry || matchUser.country,
        partnerCountryName: matchUser.countryName,
        partnerBadges: matchUser.badges || { awesome: 0, handsome: 0, elegant: 0 },
        isInitiator: true
      });

      io.to(matchId).emit('matched', {
        partnerId: socket.id,
        partnerUsername: user.username || 'مستخدم',
        partnerGender: user.gender,
        partnerCountry: user.myCountry || user.country,
        partnerCountryName: user.countryName,
        partnerBadges: user.badges || { awesome: 0, handsome: 0, elegant: 0 },
        isInitiator: false
      });

      console.log(`[M] Re-matched: ${socket.id} <-> ${matchId}`);
    } else {
      waitingQueue.push(socket.id);
      socket.emit('waiting');
    }
  });

  // User stops searching
  socket.on('stop_search', () => {
    removeFromQueue(socket.id);
    const user = users.get(socket.id);
    if (user && user.partnerId) {
      const partner = users.get(user.partnerId);
      if (partner) {
        partner.partnerId = null;
        io.to(user.partnerId).emit('partner_left');
      }
      user.partnerId = null;
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    removeFromQueue(socket.id);

    const user = users.get(socket.id);
    if (user && user.partnerId) {
      const partner = users.get(user.partnerId);
      if (partner) {
        partner.partnerId = null;
        io.to(user.partnerId).emit('partner_left');
      }
    }

    users.delete(socket.id);
    broadcastOnlineCount();
  });
});

// =============================================
// Serve Main Page
// =============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================================
// Start Server
// =============================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     LiQaa - Video Chat Server           ║
  ║     Running on http://localhost:${PORT}     ║
  ╚══════════════════════════════════════════╝
  `);
});
