/* =============================================
   LiQaa - Video Chat Application
   Main Client-Side JavaScript
   ============================================= */

// =============================================
// Configuration
// =============================================
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' }
  ]
};

// Geolocation APIs (fallback chain)
const GEO_APIS = [
  'https://ipapi.co/json/',
  'https://ipwho.is/',
  'https://freeipapi.com/api/json'
];

// =============================================
// State
// =============================================
let socket = null;
let localStream = null;
let peerConnection = null;
let currentState = 'idle'; // idle | searching | connected
let isMicOn = true;
let isCameraOn = true;
let selectedGender = '';
let selectedGenderFilter = 'any';
let selectedCountry = '';
let selectedCountryName = '';
let callTimerInterval = null;
let callSeconds = 0;
let isInitiator = false;
let controlsSetup = false;

// Profile & Gems State
let userProfile = {
  username: '',
  phone: '',
  gems: 50
};
const FILTER_COST = 10; // cost in gems for gender filter

// =============================================
// DOM Elements
// =============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Screens
const welcomeScreen = $('#welcome-screen');
const chatScreen = $('#chat-screen');

// User profile & Gems elements
const userDisplayName = $('#user-display-name');
const gemsBalanceCount = $('#gems-balance-count');
const usernameInput = $('#username-input');
const phoneInput = $('#phone-input');
const openRechargeModalBtn = $('#open-recharge-modal');

// Welcome elements
const genderCards = $$('.gender-card');
const filterCards = $$('.filter-card');
const countrySelect = $('#country-select');
const startBtn = $('#start-btn');

// Country auto-detect elements
const countryDetecting = $('#country-detecting');
const countryDetected = $('#country-detected');
const countryManual = $('#country-manual');
const detectedFlag = $('#detected-flag');
const detectedName = $('#detected-name');
const changeCountryBtn = $('#change-country-btn');

// Modals
const permissionModal = $('#permission-modal');
const retryPermissionBtn = $('#retry-permission-btn');
const closePermissionBtn = $('#close-permission-btn');

const rechargeModal = $('#recharge-modal');
const demoRechargeBtn = $('#demo-recharge-btn');
const closeRechargeBtn = $('#close-recharge-btn');

const insufficientGemsModal = $('#insufficient-gems-modal');
const goToRechargeBtn = $('#go-to-recharge-btn');
const switchToAnyBtn = $('#switch-to-any-btn');

// Online counts
const welcomeOnlineCount = $('#welcome-online-count');
const searchOnlineCount = $('#search-online-count');

// Video elements
const localVideo = $('#local-video');
const remoteVideo = $('#remote-video');

// Chat overlays
const searchingOverlay = $('#searching-overlay');
const partnerLeftOverlay = $('#partner-left-overlay');
const partnerInfo = $('#partner-info');
const partnerFlag = $('#partner-flag');
const partnerCountryName = $('#partner-country-name');
const partnerGenderIcon = $('#partner-gender-icon');
const callTimer = $('#call-timer');
const timerDisplay = $('#timer-display');

// Control buttons
const nextBtn = $('#next-btn');
const micBtn = $('#mic-btn');
const cameraBtn = $('#camera-btn');
const endBtn = $('#end-btn');
const findNewBtn = $('#find-new-btn');

// =============================================
// Country code to flag emoji
// =============================================
function countryCodeToFlag(code) {
  if (!code) return '🌍';
  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
    .join('');
}

// =============================================
// Auto-detect Country from IP
// =============================================
async function detectCountry() {
  for (const apiUrl of GEO_APIS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();

      // Different APIs return data in different formats
      const countryCode = data.country_code || data.country || data.countryCode || '';
      const countryNameEn = data.country_name || data.country || data.countryName || '';

      if (countryCode) {
        return { code: countryCode.toUpperCase(), name: countryNameEn };
      }
    } catch (e) {
      console.warn(`[Geo] Failed with ${apiUrl}:`, e.message);
      continue;
    }
  }
  return null;
}

async function autoDetectCountry() {
  try {
    const result = await detectCountry();

    if (result && result.code) {
      // Try to find matching option in the select
      const option = countrySelect.querySelector(`option[value="${result.code}"]`);

      if (option) {
        // Found in our list - use Arabic name
        selectedCountry = result.code;
        selectedCountryName = option.dataset.name || option.textContent;
        detectedFlag.textContent = countryCodeToFlag(result.code);
        detectedName.textContent = selectedCountryName;
      } else {
        // Not in list - use English name from API
        selectedCountry = result.code;
        selectedCountryName = result.name;
        detectedFlag.textContent = countryCodeToFlag(result.code);
        detectedName.textContent = result.name;
      }

      // Show detected, hide detecting spinner
      countryDetecting.classList.add('hidden');
      countryDetected.classList.remove('hidden');
      countryManual.classList.add('hidden');

      validateForm();
      return;
    }
  } catch (e) {
    console.warn('[Geo] Auto-detect failed:', e);
  }

  // Fallback: show manual selection
  countryDetecting.classList.add('hidden');
  countryDetected.classList.add('hidden');
  countryManual.classList.remove('hidden');
}

// =============================================
// User Profile & Gem Management
// =============================================
function loadUserProfile() {
  const saved = localStorage.getItem('liqaa_user_profile');
  if (saved) {
    try {
      userProfile = JSON.parse(saved);
    } catch (e) {
      console.warn('[Profile] Failed to parse saved profile');
    }
  }

  if (!userProfile.username) {
    userProfile.username = 'مستخدم ' + Math.floor(100 + Math.random() * 900);
  }
  if (userProfile.gems === undefined || userProfile.gems === null) {
    userProfile.gems = 50;
  }

  saveUserProfile();
  updateProfileUI();
}

function saveUserProfile() {
  localStorage.setItem('liqaa_user_profile', JSON.stringify(userProfile));
}

function updateProfileUI() {
  if (usernameInput) usernameInput.value = userProfile.username;
  if (phoneInput) phoneInput.value = userProfile.phone || '';
  if (userDisplayName) userDisplayName.textContent = userProfile.username;
  if (gemsBalanceCount) gemsBalanceCount.textContent = userProfile.gems;
}

function deductGemsForFilter() {
  if (selectedGenderFilter === 'any') return true;

  if (userProfile.gems < FILTER_COST) {
    insufficientGemsModal.classList.remove('hidden');
    return false;
  }

  userProfile.gems -= FILTER_COST;
  saveUserProfile();
  updateProfileUI();
  return true;
}

// =============================================
// Initialize Application
// =============================================
function init() {
  loadUserProfile();
  setupWelcomeUI();
  connectSocket();
  autoDetectCountry();
}

// =============================================
// Welcome Screen UI
// =============================================
function setupWelcomeUI() {
  // Username & Phone inputs
  if (usernameInput) {
    usernameInput.addEventListener('input', (e) => {
      userProfile.username = e.target.value.trim() || 'مستخدم جديد';
      saveUserProfile();
      updateProfileUI();
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      userProfile.phone = e.target.value.trim();
      saveUserProfile();
    });
  }

  // Open Recharge Modal - delegated click handler
  document.addEventListener('click', (e) => {
    if (e.target.closest('#open-recharge-modal, .gems-balance-badge, .add-gems-btn')) {
      const modal = $('#recharge-modal');
      if (modal) modal.classList.remove('hidden');
    }
  });

  // Close Recharge Modal
  if (closeRechargeBtn) {
    closeRechargeBtn.addEventListener('click', () => {
      rechargeModal.classList.add('hidden');
    });
  }

  // Demo Recharge button
  if (demoRechargeBtn) {
    demoRechargeBtn.addEventListener('click', () => {
      userProfile.gems += 100;
      saveUserProfile();
      updateProfileUI();
      rechargeModal.classList.add('hidden');
      alert('✨ تم شحن 100 جوهرة بنجاح!');
    });
  }

  let selectedPackage = { gems: 200, price: 9.99 };

  // Gem packages -> open Checkout Modal
  $$('.gem-package-card').forEach(card => {
    card.addEventListener('click', () => {
      const gems = parseInt(card.dataset.gems) || 50;
      const price = parseFloat(card.dataset.price) || 4.99;
      selectedPackage = { gems, price };

      const packageTitle = $('#checkout-package-title');
      if (packageTitle) packageTitle.textContent = `${gems} جوهرة (${price} $)`;

      rechargeModal.classList.add('hidden');
      const checkoutModal = $('#checkout-modal');
      if (checkoutModal) checkoutModal.classList.remove('hidden');
    });
  });

  // Close Checkout Modal
  const closeCheckoutBtn = $('#close-checkout-btn');
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
      const checkoutModal = $('#checkout-modal');
      if (checkoutModal) checkoutModal.classList.add('hidden');
    });
  }

  // Payment Tabs Switcher
  $$('.payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.payment-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const method = tab.dataset.method;

      const cardForm = $('#payment-card-form');
      const paypalContainer = $('#payment-paypal-container');
      const walletContainer = $('#payment-wallet-container');

      if (cardForm) cardForm.classList.toggle('hidden', method !== 'card');
      if (paypalContainer) paypalContainer.classList.toggle('hidden', method !== 'paypal');
      if (walletContainer) walletContainer.classList.toggle('hidden', method !== 'wallet');
    });
  });

  // Handle Card Payment Submit
  const paymentCardForm = $('#payment-card-form');
  if (paymentCardForm) {
    paymentCardForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processSuccessfulPayment('بطاقة بنكية (Visa/Mastercard)');
    });
  }

  // Handle PayPal Payment Submit
  const paypalPayBtn = $('#paypal-pay-btn');
  if (paypalPayBtn) {
    paypalPayBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/create-paypal-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: selectedPackage.price,
            gems: selectedPackage.gems
          })
        });
        const data = await res.json();
        if (data.paypalUrl) {
          window.location.href = data.paypalUrl;
          return;
        }
      } catch (e) {
        console.warn('[PayPal error]', e);
      }
      processSuccessfulPayment('PayPal');
    });
  }

  // Handle Wallet Payment Submit
  const walletPayBtn = $('#wallet-pay-btn');
  if (walletPayBtn) {
    walletPayBtn.addEventListener('click', () => {
      processSuccessfulPayment('المحفظة الإلكترونية (Zain Cash / Paymob)');
    });
  }

  async function processSuccessfulPayment(methodName) {
    const checkoutModal = $('#checkout-modal');
    if (checkoutModal) checkoutModal.classList.add('hidden');

    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPackage.price,
          gems: selectedPackage.gems,
          paymentMethod: methodName,
          username: userProfile.username,
          phone: userProfile.phone
        })
      });
      const data = await res.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
    } catch (e) {
      console.warn('[Payment API error]', e);
    }

    userProfile.gems += selectedPackage.gems;
    saveUserProfile();
    updateProfileUI();

    alert(`🎉 تم نجاح عملية الدفع بـ ${selectedPackage.price}$ عبر (${methodName})!\n\nتمت إضافة ${selectedPackage.gems} جوهرة لحسابك.`);
  }

  // Insufficient Gems modal buttons
  if (goToRechargeBtn) {
    goToRechargeBtn.addEventListener('click', () => {
      insufficientGemsModal.classList.add('hidden');
      rechargeModal.classList.remove('hidden');
    });
  }

  if (switchToAnyBtn) {
    switchToAnyBtn.addEventListener('click', () => {
      insufficientGemsModal.classList.add('hidden');
      filterCards.forEach(c => c.classList.remove('active'));
      const anyCard = $('#filter-any');
      if (anyCard) anyCard.classList.add('active');
      selectedGenderFilter = 'any';
    });
  }

  // Gender selection
  genderCards.forEach(card => {
    card.addEventListener('click', () => {
      genderCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedGender = card.dataset.gender;
      validateForm();
    });
  });

  // Gender filter selection
  filterCards.forEach(card => {
    card.addEventListener('click', () => {
      filterCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedGenderFilter = card.dataset.filter;
    });
  });

  // Country manual selection (fallback)
  countrySelect.addEventListener('change', () => {
    selectedCountry = countrySelect.value;
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    selectedCountryName = selectedOption.dataset.name || selectedOption.text;
    validateForm();
  });

  // Change country button (switch to manual)
  if (changeCountryBtn) {
    changeCountryBtn.addEventListener('click', () => {
      countryDetected.classList.add('hidden');
      countryManual.classList.remove('hidden');
      selectedCountry = '';
      selectedCountryName = '';
      validateForm();
    });
  }

  // Start button
  startBtn.addEventListener('click', startChat);

  // Retry permission
  retryPermissionBtn.addEventListener('click', async () => {
    permissionModal.classList.add('hidden');
    await startChat();
  });

  // Close permission modal
  if (closePermissionBtn) {
    closePermissionBtn.addEventListener('click', () => {
      permissionModal.classList.add('hidden');
    });
  }
}

function validateForm() {
  const isValid = selectedGender && selectedCountry;
  startBtn.disabled = !isValid;
}

// =============================================
// Socket.IO Connection - Tunnel-friendly
// =============================================
function connectSocket() {
  socket = io({
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['polling', 'websocket'],
    upgrade: true,
    forceNew: false,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    
    // If we were already in a chat session, re-register
    if (currentState !== 'idle' && selectedGender && selectedCountry) {
      console.log('[Socket] Re-registering after reconnect...');
      socket.emit('register', {
        gender: selectedGender,
        country: selectedCountry,
        countryName: selectedCountryName,
        genderFilter: selectedGenderFilter
      });
      
      // If we were searching, search again
      if (currentState === 'searching') {
        console.log('[Socket] Re-searching after reconnect...');
        socket.emit('find_partner');
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] Connection error:', err.message);
  });

  socket.on('online_count', (count) => {
    if (welcomeOnlineCount) welcomeOnlineCount.textContent = count;
    if (searchOnlineCount) searchOnlineCount.textContent = count;
  });

  socket.on('waiting', () => {
    console.log('[Socket] Waiting for match...');
    setState('searching');
  });

  socket.on('matched', async (data) => {
    console.log('[Socket] Matched with:', data.partnerId);
    isInitiator = data.isInitiator;

    // Show partner info
    showPartnerInfo(data);

    // Create peer connection
    await createPeerConnection();

    if (isInitiator) {
      await createAndSendOffer();
    }

    setState('connected');
  });

  socket.on('offer', async (data) => {
    console.log('[Socket] Received offer');
    if (!peerConnection) {
      await createPeerConnection();
    }
    await handleOffer(data.offer);
  });

  socket.on('answer', async (data) => {
    console.log('[Socket] Received answer');
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
      }
    }
  });

  socket.on('ice_candidate', async (data) => {
    if (peerConnection && data.candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('[ICE] Error adding candidate:', err);
      }
    }
  });

  socket.on('partner_left', () => {
    console.log('[Socket] Partner left');
    cleanupPeerConnection();
    setState('partner_left');
  });
}

// Helper: ensure socket is connected before emitting
function emitWhenReady(event, data) {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.log(`[Socket] Not connected, waiting to emit '${event}'...`);
    socket.once('connect', () => {
      socket.emit(event, data);
    });
  }
}

// =============================================
// Media Stream - Improved Permission Handling
// =============================================
async function requestMediaPermission() {
  // First check if mediaDevices is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showPermissionError(
      'متصفحك لا يدعم الكاميرا',
      'يرجى استخدام متصفح Chrome أو Firefox أو Edge حديث. تأكد من أنك تستخدم localhost أو HTTPS.',
      false
    );
    return false;
  }

  try {
    // Request both video and audio
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    localVideo.srcObject = localStream;
    console.log('[Media] Got local stream successfully');
    return true;

  } catch (err) {
    console.error('[Media] Permission error:', err.name, err.message);

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showPermissionError(
        '🚫 تم رفض إذن الكاميرا',
        'لقد تم حظر الكاميرا. يرجى السماح بالوصول للكاميرا والميكروفون من إعدادات المتصفح.',
        true
      );
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      showPermissionError(
        '❌ لا توجد كاميرا',
        'لم يتم العثور على كاميرا متصلة بالجهاز. يرجى توصيل كاميرا والمحاولة مرة أخرى.',
        false
      );
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      showPermissionError(
        '⚠️ الكاميرا مستخدمة',
        'الكاميرا قيد الاستخدام من قبل تطبيق آخر. أغلق أي برنامج يستخدم الكاميرا وحاول مرة أخرى.',
        false
      );
    } else if (err.name === 'OverconstrainedError') {
      // Try again with simpler constraints
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localVideo.srcObject = localStream;
        return true;
      } catch (err2) {
        showPermissionError(
          '❌ مشكلة في الكاميرا',
          'حدث خطأ أثناء الوصول للكاميرا. حاول مرة أخرى.',
          true
        );
      }
    } else {
      showPermissionError(
        '❌ خطأ غير متوقع',
        `حدث خطأ: ${err.message}. تأكد من أنك تستخدم المتصفح على localhost أو HTTPS.`,
        true
      );
    }

    return false;
  }
}

function showPermissionError(title, message, showSteps) {
  const titleEl = $('#permission-title');
  const messageEl = $('#permission-message');
  const stepsEl = $('#permission-steps');

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (stepsEl) stepsEl.style.display = showSteps ? 'block' : 'none';

  permissionModal.classList.remove('hidden');
}

// =============================================
// Start Chat
// =============================================
async function startChat() {
  // Check gems if using paid filter
  if (!deductGemsForFilter()) return;

  // Get media permission first
  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return;

  // Register with server
  emitWhenReady('register', {
    gender: selectedGender,
    country: selectedCountry,
    countryName: selectedCountryName,
    genderFilter: selectedGenderFilter,
    username: userProfile.username,
    phone: userProfile.phone
  });

  // Switch to chat screen
  welcomeScreen.classList.remove('active');
  chatScreen.classList.add('active');

  // Setup control buttons (only once)
  if (!controlsSetup) {
    setupControls();
    controlsSetup = true;
  }

  // Start searching
  emitWhenReady('find_partner');
  setState('searching');
}

// =============================================
// Control Buttons
// =============================================
function setupControls() {
  // Next button
  nextBtn.addEventListener('click', () => {
    if (!deductGemsForFilter()) return;
    cleanupPeerConnection();
    socket.emit('next');
    setState('searching');
  });

  // Mic toggle
  micBtn.addEventListener('click', toggleMic);

  // Camera toggle
  cameraBtn.addEventListener('click', toggleCamera);

  // End call
  endBtn.addEventListener('click', endCall);

  // Find new (from partner left overlay)
  findNewBtn.addEventListener('click', () => {
    partnerLeftOverlay.classList.add('hidden');
    socket.emit('find_partner');
    setState('searching');
  });
}

function toggleMic() {
  if (!localStream) return;
  isMicOn = !isMicOn;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = isMicOn;
  });

  micBtn.classList.toggle('muted', !isMicOn);
  micBtn.querySelector('.mic-on').classList.toggle('hidden', !isMicOn);
  micBtn.querySelector('.mic-off').classList.toggle('hidden', isMicOn);
}

function toggleCamera() {
  if (!localStream) return;
  isCameraOn = !isCameraOn;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = isCameraOn;
  });

  cameraBtn.classList.toggle('muted', !isCameraOn);
  cameraBtn.querySelector('.cam-on').classList.toggle('hidden', !isCameraOn);
  cameraBtn.querySelector('.cam-off').classList.toggle('hidden', isCameraOn);
}

function endCall() {
  cleanupPeerConnection();
  socket.emit('stop_search');

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Switch back to welcome screen
  chatScreen.classList.remove('active');
  welcomeScreen.classList.add('active');
  setState('idle');
}

// =============================================
// WebRTC Peer Connection
// =============================================
async function createPeerConnection() {
  cleanupPeerConnection();

  peerConnection = new RTCPeerConnection(ICE_SERVERS);

  // Add local tracks
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Handle remote tracks
  peerConnection.ontrack = (event) => {
    console.log('[WebRTC] Remote track received');
    if (event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice_candidate', { candidate: event.candidate });
    }
  };

  // Connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('[WebRTC] Connection state:', peerConnection.connectionState);
    if (peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed') {
      console.log('[WebRTC] Connection lost');
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log('[WebRTC] ICE state:', peerConnection.iceConnectionState);
  };
}

async function createAndSendOffer() {
  try {
    const offer = await peerConnection.createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true
    });
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer: offer });
    console.log('[WebRTC] Offer sent');
  } catch (err) {
    console.error('[WebRTC] Error creating offer:', err);
  }
}

async function handleOffer(offer) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer: answer });
    console.log('[WebRTC] Answer sent');
  } catch (err) {
    console.error('[WebRTC] Error handling offer:', err);
  }
}

function cleanupPeerConnection() {
  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }
  remoteVideo.srcObject = null;
  stopCallTimer();
}

// =============================================
// UI State Management
// =============================================
function setState(state) {
  currentState = state;

  switch (state) {
    case 'idle':
      searchingOverlay.classList.add('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      stopCallTimer();
      break;

    case 'searching':
      searchingOverlay.classList.remove('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      stopCallTimer();
      break;

    case 'connected':
      searchingOverlay.classList.add('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.remove('hidden');
      callTimer.classList.remove('hidden');
      startCallTimer();
      break;

    case 'partner_left':
      searchingOverlay.classList.add('hidden');
      partnerLeftOverlay.classList.remove('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      stopCallTimer();
      break;
  }
}

function showPartnerInfo(data) {
  partnerFlag.textContent = countryCodeToFlag(data.partnerCountry);
  partnerCountryName.textContent = data.partnerCountryName || '';
  partnerGenderIcon.textContent = data.partnerGender === 'male' ? '👨' : '👩';
}

// =============================================
// Call Timer
// =============================================
function startCallTimer() {
  callSeconds = 0;
  updateTimerDisplay();
  callTimerInterval = setInterval(() => {
    callSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopCallTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
  callSeconds = 0;
}

function updateTimerDisplay() {
  const minutes = Math.floor(callSeconds / 60).toString().padStart(2, '0');
  const seconds = (callSeconds % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// =============================================
// Draggable Local Video (PiP)
// =============================================
function setupDraggableLocalVideo() {
  const wrapper = $('#local-video-wrapper');
  let isDragging = false;
  let startX, startY, initialX, initialY;

  wrapper.addEventListener('mousedown', startDrag);
  wrapper.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    isDragging = true;
    wrapper.style.cursor = 'grabbing';
    wrapper.style.transition = 'none';

    const rect = wrapper.getBoundingClientRect();
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }
    initialX = rect.left;
    initialY = rect.top;

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;

    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    // Boundaries
    const maxX = window.innerWidth - wrapper.offsetWidth - 10;
    const maxY = window.innerHeight - wrapper.offsetHeight - 100;
    newX = Math.max(10, Math.min(newX, maxX));
    newY = Math.max(10, Math.min(newY, maxY));

    wrapper.style.position = 'fixed';
    wrapper.style.left = newX + 'px';
    wrapper.style.top = newY + 'px';
    wrapper.style.right = 'auto';

    e.preventDefault();
  }

  function stopDrag() {
    isDragging = false;
    wrapper.style.cursor = 'grab';
    wrapper.style.transition = 'transform 0.2s';
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
  }
}

// =============================================
// Start
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupDraggableLocalVideo();
});
