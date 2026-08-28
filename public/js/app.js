/* =============================================
   LiQaa - Video Chat Application
   Main Client-Side JavaScript
   ============================================= */

// =============================================
// Configuration - Fast WebRTC STUN & TURN
// =============================================
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay'
    }
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
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
let selectedGender = 'male';
let selectedGenderFilter = 'any';
let selectedCountry = 'ALL';
let selectedCountryName = 'كل العالم';
let callTimerInterval = null;
let callSeconds = 0;
let isInitiator = false;
let controlsSetup = false;

// Profile & Gems State
let userProfile = {
  username: '',
  phone: '',
  gender: '',
  country: 'ALL',
  gems: 50,
  hasCompletedSetup: false
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
const openSettingsModalBtn = $('#open-settings-modal-btn');

// Settings Modal elements
const settingsModal = $('#settings-modal');
const settingsUsername = $('#settings-username');
const settingsPhone = $('#settings-phone');
const settingsGenderMale = $('#settings-gender-male');
const settingsGenderFemale = $('#settings-gender-female');
const saveSettingsBtn = $('#save-settings-btn');
const closeSettingsBtn = $('#close-settings-btn');

// Welcome elements
const genderCards = $$('.gender-card[data-gender]');
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
  if (!code || code === 'ALL') return '🌍';
  return code
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
    .join('');
}

// Toast notification helper
function showGemToast(message) {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// =============================================
// Auto-detect Country from IP
// =============================================
async function detectCountry() {
  for (const apiUrl of GEO_APIS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();

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
      const option = countrySelect.querySelector(`option[value="${result.code}"]`);
      if (option) {
        selectedCountry = result.code;
        selectedCountryName = option.dataset.name || option.textContent;
      } else {
        selectedCountry = result.code;
        selectedCountryName = result.name;
      }
      detectedFlag.textContent = countryCodeToFlag(result.code);
      detectedName.textContent = selectedCountryName;

      countryDetecting.classList.add('hidden');
      countryDetected.classList.remove('hidden');
      countryManual.classList.add('hidden');
      validateForm();
      return;
    }
  } catch (e) {
    console.warn('[Geo] Auto-detect failed:', e);
  }

  // Fallback to manual global country select
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
  if (!userProfile.gender) {
    userProfile.gender = 'male';
  }
  if (userProfile.gems === undefined || userProfile.gems === null) {
    userProfile.gems = 50;
  }

  selectedGender = userProfile.gender;
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

  // Highlight gender card
  genderCards.forEach(card => {
    if (card.dataset.gender === userProfile.gender) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  validateForm();
}

// =============================================
// Initialize Application
// =============================================
function init() {
  loadUserProfile();
  setupWelcomeUI();
  setupSettingsUI();
  connectSocket();
  autoDetectCountry();
}

// =============================================
// Settings Modal Logic
// =============================================
function setupSettingsUI() {
  if (openSettingsModalBtn) {
    openSettingsModalBtn.addEventListener('click', () => {
      if (settingsUsername) settingsUsername.value = userProfile.username || '';
      if (settingsPhone) settingsPhone.value = userProfile.phone || '';
      
      let tempGender = userProfile.gender || 'male';
      if (settingsGenderMale && settingsGenderFemale) {
        settingsGenderMale.classList.toggle('selected', tempGender === 'male');
        settingsGenderFemale.classList.toggle('selected', tempGender === 'female');

        settingsGenderMale.onclick = () => {
          tempGender = 'male';
          settingsGenderMale.classList.add('selected');
          settingsGenderFemale.classList.remove('selected');
        };
        settingsGenderFemale.onclick = () => {
          tempGender = 'female';
          settingsGenderFemale.classList.add('selected');
          settingsGenderMale.classList.remove('selected');
        };
      }

      if (settingsModal) settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.add('hidden');
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const newName = settingsUsername ? settingsUsername.value.trim() : '';
      const newPhone = settingsPhone ? settingsPhone.value.trim() : '';
      const selectedCard = $('.gender-card[data-settings-gender].selected');
      const newGender = selectedCard ? selectedCard.dataset.settingsGender : userProfile.gender;

      if (newName) userProfile.username = newName;
      userProfile.phone = newPhone;
      userProfile.gender = newGender;
      selectedGender = newGender;
      userProfile.hasCompletedSetup = true;

      saveUserProfile();
      updateProfileUI();

      if (settingsModal) settingsModal.classList.add('hidden');
      showGemToast('✨ تم تحديث بيانات الحساب بنجاح');
    });
  }
}

// =============================================
// Welcome Screen UI
// =============================================
function setupWelcomeUI() {
  // Username & Phone inputs
  if (usernameInput) {
    usernameInput.addEventListener('input', (e) => {
      userProfile.username = e.target.value.trim() || 'مستخدم جديد';
      userProfile.hasCompletedSetup = true;
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

  // Gender selection
  genderCards.forEach(card => {
    card.addEventListener('click', () => {
      genderCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedGender = card.dataset.gender;
      userProfile.gender = selectedGender;
      userProfile.hasCompletedSetup = true;
      saveUserProfile();
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

  // Country manual selection
  countrySelect.addEventListener('change', () => {
    selectedCountry = countrySelect.value || 'ALL';
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    selectedCountryName = selectedOption.dataset.name || selectedOption.text;
    validateForm();
  });

  // Change country button (switch to manual)
  if (changeCountryBtn) {
    changeCountryBtn.addEventListener('click', () => {
      countryDetected.classList.add('hidden');
      countryManual.classList.remove('hidden');
      selectedCountry = 'ALL';
      selectedCountryName = 'كل العالم';
      validateForm();
    });
  }

  // Start button
  startBtn.addEventListener('click', startChat);

  // Insufficient gems modal handlers
  if (goToRechargeBtn) {
    goToRechargeBtn.addEventListener('click', () => {
      insufficientGemsModal.classList.add('hidden');
      rechargeModal.classList.remove('hidden');
    });
  }

  if (switchToAnyBtn) {
    switchToAnyBtn.addEventListener('click', () => {
      insufficientGemsModal.classList.add('hidden');
      selectedGenderFilter = 'any';
      filterCards.forEach(c => c.classList.remove('active'));
      const anyCard = $('#filter-any');
      if (anyCard) anyCard.classList.add('active');
    });
  }

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
  const isValid = !!(selectedGender && (selectedCountry || selectedCountry === 'ALL'));
  if (startBtn) startBtn.disabled = !isValid;
}

// =============================================
// Socket.IO Connection - Fast matching & reconnect
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
    
    if (currentState !== 'idle' && selectedGender) {
      socket.emit('register', {
        gender: selectedGender,
        country: selectedCountry || 'ALL',
        countryName: selectedCountryName || 'كل العالم',
        genderFilter: selectedGenderFilter,
        username: userProfile.username,
        phone: userProfile.phone
      });
      
      if (currentState === 'searching') {
        socket.emit('find_partner');
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('online_count', (count) => {
    if (welcomeOnlineCount) welcomeOnlineCount.textContent = count;
    if (searchOnlineCount) searchOnlineCount.textContent = count;
  });

  socket.on('waiting', () => {
    console.log('[Socket] Waiting for match...');
    setState('searching');
  });

  // Matched event -> Deduct 10 gems per connected match if gender filter active
  socket.on('matched', async (data) => {
    console.log('[Socket] Matched with:', data.partnerId);
    isInitiator = data.isInitiator;

    // Verify & deduct gems ONLY when a real match is connected
    if (selectedGenderFilter !== 'any') {
      if (userProfile.gems < FILTER_COST) {
        console.warn('[Gems] Insufficient gems for matched chat');
        cleanupPeerConnection();
        socket.emit('stop_search');
        if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
        setState('idle');
        return;
      }

      // Deduct gems for this matched connection
      userProfile.gems -= FILTER_COST;
      saveUserProfile();
      updateProfileUI();
      showGemToast(`💎 -${FILTER_COST} جواهر (تحديد الجنس)`);
    }

    showPartnerInfo(data);
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

  // Partner left -> Auto Next without showing "Conversation Ended" overlay
  socket.on('partner_left', () => {
    console.log('[Socket] Partner left -> Instant auto-search for next partner...');
    cleanupPeerConnection();
    socket.emit('find_partner');
    setState('searching');
  });
}

function emitWhenReady(event, data) {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    socket.once('connect', () => {
      socket.emit(event, data);
    });
  }
}

// =============================================
// Media Stream Permission
// =============================================
async function requestMediaPermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showPermissionError(
      'متصفحك لا يدعم الكاميرا',
      'يرجى استخدام متصفح Chrome أو Firefox أو Edge حديث. تأكد من أنك تستخدم HTTPS.',
      false
    );
    return false;
  }

  try {
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
    console.log('[Media] Stream acquired successfully');
    return true;

  } catch (err) {
    console.error('[Media] Permission error:', err.name, err.message);

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      showPermissionError(
        '🚫 تم رفض إذن الكاميرا',
        'يرجى السماح بالوصول للكاميرا والميكروفون من إعدادات المتصفح.',
        true
      );
    } else {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        return true;
      } catch (err2) {
        showPermissionError('❌ مشكلة الكاميرا', 'تعذر الحصول على صورة الكاميرا.', true);
      }
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

  if (permissionModal) permissionModal.classList.remove('hidden');
}

// =============================================
// Start Chat
// =============================================
async function startChat() {
  // Check if gems available if gender filter is selected
  if (selectedGenderFilter !== 'any' && userProfile.gems < FILTER_COST) {
    if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
    return;
  }

  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return;

  emitWhenReady('register', {
    gender: selectedGender || 'male',
    country: selectedCountry || 'ALL',
    countryName: selectedCountryName || 'كل العالم',
    genderFilter: selectedGenderFilter,
    username: userProfile.username,
    phone: userProfile.phone
  });

  welcomeScreen.classList.remove('active');
  chatScreen.classList.add('active');

  if (!controlsSetup) {
    setupControls();
    controlsSetup = true;
  }

  emitWhenReady('find_partner');
  setState('searching');
}

// =============================================
// Control Buttons
// =============================================
function setupControls() {
  // Next button -> Instant auto search for next partner
  nextBtn.addEventListener('click', () => {
    cleanupPeerConnection();
    socket.emit('next');
    setState('searching');
  });

  micBtn.addEventListener('click', toggleMic);
  cameraBtn.addEventListener('click', toggleCamera);
  endBtn.addEventListener('click', endCall);

  if (findNewBtn) {
    findNewBtn.addEventListener('click', () => {
      partnerLeftOverlay.classList.add('hidden');
      socket.emit('find_partner');
      setState('searching');
    });
  }
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

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  chatScreen.classList.remove('active');
  welcomeScreen.classList.add('active');
  setState('idle');
}

// =============================================
// WebRTC Peer Connection
// =============================================
async function createPeerConnection() {
  cleanupPeerConnection();

  try {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { candidate: event.candidate });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        cleanupPeerConnection();
        // Instant search for next partner on WebRTC failure
        socket.emit('find_partner');
        setState('searching');
      }
    };

  } catch (err) {
    console.error('[WebRTC] Error creating connection:', err);
  }
}

async function createAndSendOffer() {
  try {
    const offer = await peerConnection.createOffer();
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
  if (remoteVideo) remoteVideo.srcObject = null;
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
      // Instant transition back to searching
      searchingOverlay.classList.remove('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      stopCallTimer();
      break;
  }
}

function showPartnerInfo(data) {
  partnerFlag.textContent = countryCodeToFlag(data.partnerCountry);
  partnerCountryName.textContent = data.partnerCountryName || 'شريك جديد';
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
  if (timerDisplay) timerDisplay.textContent = `${minutes}:${seconds}`;
}

// =============================================
// Draggable Local Video (PiP)
// =============================================
function setupDraggableLocalVideo() {
  const wrapper = $('#local-video-wrapper');
  if (!wrapper) return;

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
