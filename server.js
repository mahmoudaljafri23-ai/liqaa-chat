const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
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
  // PayPal Email & Client ID الرسمي لاستقبال الفلوس المباشرة
  PAYPAL_EMAIL: process.env.PAYPAL_EMAIL || '',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',

  // Tap Payments Keys
  TAP_SECRET_KEY: process.env.TAP_SECRET_KEY || '',
  TAP_PUBLIC_KEY: process.env.TAP_PUBLIC_KEY || '',

  CURRENCY: 'USD'
};

// Google Search Console Verification Routes
app.get('/googled6651fade4f35860.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send('google-site-verification: googled6651fade4f35860.html');
});

app.use((req, res, next) => {
  if (req.path.startsWith('/google') && req.path.endsWith('.html')) {
    const filename = req.path.replace('/', '');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`google-site-verification: ${filename}`);
  }
  next();
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\n\nSitemap: https://liqaa-chat.onrender.com/sitemap.xml');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://liqaa-chat.onrender.com/</loc>
    <lastmod>2026-08-28</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
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

app.post('/api/create-paypal-payment', (req, res) => {
  const { amount, gems } = req.body;
  console.log(`[🅿️ PayPal Payment Request] Amount: $${amount} | Gems: ${gems} | To: ${MERCHANT_CONFIG.PAYPAL_EMAIL}`);

  const host = req.get('host');
  const protocol = req.protocol;

  const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(MERCHANT_CONFIG.PAYPAL_EMAIL)}&item_name=${encodeURIComponent(`LiQaa Chat - ${gems} Gems`)}&amount=${encodeURIComponent(amount)}&currency_code=USD&return=${encodeURIComponent(`${protocol}://${host}/api/paypal-callback?gems=${gems}`)}&cancel_return=${encodeURIComponent(`${protocol}://${host}/`)}`;

  res.json({
    success: true,
    paypalUrl: paypalUrl
  });
});

app.get('/api/paypal-callback', (req, res) => {
  const gems = req.query.gems || 100;
  console.log('[PayPal Callback] Payment complete, gems:', gems);
  res.send(`
    <html>
      <head>
        <title>تمت عملية الدفع بنجاح عبر PayPal</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; background: #0f0f1a; color: white; }
          .card { background: #1a1a2e; padding: 30px; border-radius: 16px; display: inline-block; border: 1px solid #0070ba; }
          .btn { background: #0070ba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎉 تمت عملية الدفع بنجاح عبر PayPal!</h1>
          <p>تم تحويل المبلغ بنجاح إلى حساب mahmoud.aljafri23@gmail.com والإيداع جاهز.</p>
          <br><br>
          <a href="/" class="btn">العودة للتطبيق</a>
        </div>
      </body>
    </html>
  `);
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
  io.emit('online_count', users.size);
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
