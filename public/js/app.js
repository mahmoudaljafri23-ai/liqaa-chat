/* =============================================
   LiQaa - Video Chat Application
   Main Client-Side JavaScript
   ============================================= */

// =============================================
// Configuration - Fast WebRTC STUN & TURN
// =============================================
const SERVER_URL = (typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' || 
  window.location.protocol === 'file:' || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  !window.location.hostname.includes('onrender.com')
)) ? 'https://liqaa-chat.onrender.com' : (window.location.origin || 'https://liqaa-chat.onrender.com');
const API_BASE_URL = SERVER_URL || 'https://liqaa-chat.onrender.com';

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
let selectedTargetCountryMode = 'ALL'; // 'ALL' | 'HOME' | 'CUSTOM'
let selectedTargetCountryCode = 'ALL';
let selectedTargetCountryName = 'كل العالم';
let callTimerInterval = null;
let banCountdownInterval = null;
let nudityScanInterval = null;
let callSeconds = 0;
let isInitiator = false;
let controlsSetup = false;

// Profile & Gems State
let userProfile = {
  username: '',
  phone: '',
  age: 22,
  gender: '',
  country: 'ALL',
  gems: 50,
  hasCompletedSetup: false,
  bannedUntil: null
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
const initialSetupSection = $('#initial-profile-setup-section');

// Settings Modal elements
const settingsModal = $('#settings-modal');
const settingsUsername = $('#settings-username');
const settingsPhone = $('#settings-phone');
const settingsAge = $('#settings-age');
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

const bannedModal = $('#banned-modal');
const banCountdownTimer = $('#ban-countdown-timer');

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
// Auto-detect Country from IP (Ultra-fast concurrent with timeout)
// =============================================
const AR_COUNTRY_NAMES = {
  'JO': 'الأردن', 'SA': 'السعودية', 'AE': 'الإمارات', 'EG': 'مصر', 'IQ': 'العراق',
  'SY': 'سوريا', 'LB': 'لبنان', 'PS': 'فلسطين', 'KW': 'الكويت', 'QA': 'قطر',
  'BH': 'البحرين', 'OM': 'عمان', 'YE': 'اليمن', 'DZ': 'الجزائر', 'MA': 'المغرب',
  'TN': 'تونس', 'LY': 'ليبيا', 'SD': 'السودان', 'TR': 'تركيا', 'US': 'الولايات المتحدة',
  'DE': 'ألمانيا', 'FR': 'فرنسا', 'GB': 'المملكة المتحدة', 'CA': 'كندا', 'SE': 'السويد'
};

const TIMEZONE_TO_COUNTRY = {
  'Asia/Amman': 'JO',
  'Asia/Riyadh': 'SA',
  'Asia/Dubai': 'AE',
  'Africa/Cairo': 'EG',
  'Asia/Baghdad': 'IQ',
  'Asia/Damascus': 'SY',
  'Asia/Beirut': 'LB',
  'Asia/Gaza': 'PS',
  'Asia/Hebron': 'PS',
  'Asia/Jerusalem': 'PS',
  'Asia/Kuwait': 'KW',
  'Asia/Qatar': 'QA',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Asia/Aden': 'YE',
  'Africa/Algiers': 'DZ',
  'Africa/Casablanca': 'MA',
  'Africa/Tunis': 'TN',
  'Africa/Tripoli': 'LY',
  'Africa/Khartoum': 'SD',
  'Europe/Istanbul': 'TR',
  'Asia/Istanbul': 'TR',
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR'
};

function getInstantCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      const code = TIMEZONE_TO_COUNTRY[tz];
      return { code, name: AR_COUNTRY_NAMES[code] || code };
    }
  } catch (e) {}
  return { code: 'JO', name: 'الأردن' };
}

function applyCountry(code, name) {
  myHomeCountryCode = code;
  selectedCountry = code;
  selectedCountryName = name || AR_COUNTRY_NAMES[code] || code;

  const royalHomeName = $('#royal-home-country-name');
  if (royalHomeName) royalHomeName.textContent = `بلدي (${selectedCountryName} ${countryCodeToFlag(code)})`;

  if (selectedTargetCountryMode === 'HOME') {
    selectedTargetCountryCode = code;
    selectedTargetCountryName = selectedCountryName;
    const pillText = $('#pill-selected-country-text');
    if (pillText) pillText.textContent = `🏠 ${selectedCountryName}`;
  }

  validateForm();
}

// Native Android Location Bridge Listener
window.onNativeLocationDetected = function(code, name, lat, lon) {
  console.log('[Native Location] Received from Android:', code, name, lat, lon);
  if (code) {
    const finalName = name || AR_COUNTRY_NAMES[code] || code;
    applyCountry(code, finalName);
    showGemToast(`📍 تم تحديد بلدك تلقائياً عبر GPS: ${finalName} ${countryCodeToFlag(code)}`);
  }
};

async function autoDetectCountry() {
  // 1. Instant 0ms fallback from timezone
  const instant = getInstantCountry();
  applyCountry(instant.code, instant.name);

  // 2. Request native Android GPS via Java Bridge
  try {
    if (window.AndroidBridge && window.AndroidBridge.requestNativeLocation) {
      window.AndroidBridge.requestNativeLocation();
    }
  } catch (e) {
    console.warn('[Native Location] Bridge call:', e);
  }

  // 3. Request Android/Browser GPS Geolocation & reverse-geocode
  if (typeof navigator !== 'undefined' && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ar`);
          if (res.ok) {
            const data = await res.json();
            if (data.countryCode) {
              const code = data.countryCode.toUpperCase();
              const name = AR_COUNTRY_NAMES[code] || data.countryName || code;
              applyCountry(code, name);
              return;
            }
          }
        } catch (e) {
          console.warn('[GPS] Reverse geocoding error:', e);
        }
      },
      (err) => {
        console.warn('[GPS] Geolocation permission/fetch error:', err);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  // 4. Background IP refinement
  try {
    const result = await Promise.race([
      detectCountry(),
      new Promise(resolve => setTimeout(() => resolve(null), 2000))
    ]);

    if (result && result.code) {
      applyCountry(result.code, AR_COUNTRY_NAMES[result.code] || result.name || result.code);
    }
  } catch (e) {
    console.warn('[Geo] Background IP check skipped:', e);
  }
}

// =============================================
// Admin Developer Permissions & Security PIN
// =============================================
function checkAdminPermissions() {
  const uname = (userProfile.username || '').toLowerCase();
  const phone = (userProfile.phone || '').trim();

  // Ensure default admin PIN exists
  if (!userProfile.adminPin) {
    userProfile.adminPin = '2026';
  }

  // Check if username/phone matches Admin identity
  const isAdminIdentity = uname.includes('mahmoud') || uname.includes('محمود') || uname.includes('admin') || uname.includes('الجعفري') || phone === '0790181802' || phone === '07901818188';

  if (isAdminIdentity) {
    if (userProfile.adminUnlocked) {
      userProfile.isAdmin = true;
      userProfile.gems = 999999;
      delete userProfile.bannedUntil; // Full immunity and unban
      saveUserProfile();
      return true;
    } else {
      promptAdminPinModal();
      return false;
    }
  } else {
    userProfile.isAdmin = false;
    userProfile.adminUnlocked = false;
    if (userProfile.gems > 1000) {
      userProfile.gems = 50;
    }
    saveUserProfile();
  }
  return false;
}

function promptAdminPinModal() {
  const adminPinModal = $('#admin-pin-modal');
  const adminPinInput = $('#admin-pin-input');
  if (adminPinModal) adminPinModal.classList.remove('hidden');
  if (adminPinInput) adminPinInput.focus();
}

function setupAdminPinModal() {
  const adminPinModal = $('#admin-pin-modal');
  const adminPinInput = $('#admin-pin-input');
  const submitAdminPinBtn = $('#submit-admin-pin-btn');
  const cancelAdminPinBtn = $('#cancel-admin-pin-btn');

  if (submitAdminPinBtn) {
    submitAdminPinBtn.onclick = () => {
      const enteredPin = adminPinInput ? adminPinInput.value.trim() : '';
      const correctPin = userProfile.adminPin || '2026';

      if (enteredPin === correctPin) {
        userProfile.adminUnlocked = true;
        userProfile.isAdmin = true;
        userProfile.gems = 999999;
        delete userProfile.bannedUntil;
        saveUserProfile();
        updateProfileUI();
        if (adminPinModal) adminPinModal.classList.add('hidden');
        showGemToast('🔓 تم تفعيل حساب منشئ التطبيق بنجاح!');
      } else {
        showGemToast('❌ الرمز السري غير صحيح!');
      }
    };
  }

  if (cancelAdminPinBtn) {
    cancelAdminPinBtn.onclick = () => {
      if (adminPinModal) adminPinModal.classList.add('hidden');
      userProfile.isAdmin = false;
      userProfile.adminUnlocked = false;
      updateProfileUI();
    };
  }
}

// =============================================
// 24-Hour Ban System
// =============================================
function checkBanStatus() {
  checkAdminPermissions();
  if (userProfile.isAdmin || (userProfile.phone && userProfile.phone.includes('0790181802'))) {
    delete userProfile.bannedUntil;
    saveUserProfile();
    if (bannedModal) bannedModal.classList.add('hidden');
    return false;
  }

  if (userProfile.bannedUntil && Date.now() < userProfile.bannedUntil) {
    showBanModal(userProfile.bannedUntil);
    return true;
  } else if (userProfile.bannedUntil) {
    // Ban expired
    delete userProfile.bannedUntil;
    saveUserProfile();
  }
  return false;
}

function showBanModal(bannedUntil) {
  if (userProfile.isAdmin || (userProfile.phone && userProfile.phone.includes('0790181802'))) return;
  if (bannedModal) bannedModal.classList.remove('hidden');

  function updateBanCountdown() {
    const remainingMs = bannedUntil - Date.now();
    if (remainingMs <= 0) {
      if (banCountdownInterval) clearInterval(banCountdownInterval);
      delete userProfile.bannedUntil;
      saveUserProfile();
      if (bannedModal) bannedModal.classList.add('hidden');
      return;
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000).toString().padStart(2, '0');

    const countdownEl = $('#ban-countdown-timer');
    if (countdownEl) countdownEl.textContent = `${hours}:${mins}:${secs}`;
  }

  updateBanCountdown();
  if (banCountdownInterval) clearInterval(banCountdownInterval);
  banCountdownInterval = setInterval(updateBanCountdown, 1000);
}

function trigger24HourBan(reason, expiresAt) {
  if (userProfile.isAdmin || (userProfile.phone && userProfile.phone.includes('0790181802'))) {
    console.log('[BAN BYPASSED] Admin user is immune from bans');
    return;
  }

  console.warn('[BAN TRIGGERED]', reason);
  userProfile.bannedUntil = expiresAt || (Date.now() + 24 * 60 * 60 * 1000);
  saveUserProfile();

  cleanupPeerConnection();
  if (socket) socket.emit('stop_search');
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }

  if (chatScreen) chatScreen.classList.remove('active');
  if (welcomeScreen) welcomeScreen.classList.add('active');
  setState('idle');

  showBanModal(userProfile.bannedUntil);
}

// =============================================
// Real-Time Nudity Detector (Visual Frame Scanner Disabled)
// =============================================
function startNudityScanner() {
  // Automated pixel scanner disabled to prevent false positives in cars/dim lighting.
  stopNudityScanner();
}

function stopNudityScanner() {
  if (nudityScanInterval) {
    clearInterval(nudityScanInterval);
    nudityScanInterval = null;
  }
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
  updateSetupSectionVisibility();
  checkBanStatus();
}

function saveUserProfile() {
  localStorage.setItem('liqaa_user_profile', JSON.stringify(userProfile));
}

function updateSetupSectionVisibility() {
  if (!initialSetupSection) return;
  if (userProfile.hasCompletedSetup) {
    initialSetupSection.style.display = 'none';
  } else {
    initialSetupSection.style.display = 'block';
  }
}

function updateProfileUI() {
  checkAdminPermissions();

  if (usernameInput) usernameInput.value = userProfile.username;
  if (phoneInput) phoneInput.value = userProfile.phone || '';
  
  if (userDisplayName) {
    if (userProfile.isAdmin) {
      userDisplayName.innerHTML = `${userProfile.username} <span style="background: linear-gradient(135deg, #ffd700, #ff8e53); color: #000; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 800; margin-right: 2px;">👑 منشئ</span>`;
    } else {
      userDisplayName.textContent = userProfile.username;
    }
  }

  if (gemsBalanceCount) {
    if (userProfile.isAdmin) {
      gemsBalanceCount.textContent = '999k+';
    } else {
      gemsBalanceCount.textContent = userProfile.gems;
    }
  }

  genderCards.forEach(card => {
    if (card.dataset.gender === userProfile.gender) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  validateForm();
  updateOnlineDisplay();
}

let lastOnlineCount = 0;
let lastOnlineUsersList = [];

function updateOnlineDisplay(payload) {
  let count = 0;
  if (typeof payload === 'number') {
    count = payload;
  } else if (payload && typeof payload.count === 'number') {
    count = payload.count;
    if (payload.usersList) lastOnlineUsersList = payload.usersList;
  }

  lastOnlineCount = count;

  const searchOnlineWrapper = $('.searching-online');
  const welcomeOnlineWrapper = $('.online-indicator') || $('.welcome-online');

  if (userProfile && userProfile.isAdmin) {
    if (welcomeOnlineCount) welcomeOnlineCount.textContent = lastOnlineCount;
    if (searchOnlineCount) searchOnlineCount.textContent = lastOnlineCount;
    if (welcomeOnlineWrapper) welcomeOnlineWrapper.style.display = 'inline-flex';
    if (searchOnlineWrapper) searchOnlineWrapper.style.display = 'flex';
  } else {
    if (welcomeOnlineWrapper) welcomeOnlineWrapper.style.display = 'none';
    if (searchOnlineWrapper) searchOnlineWrapper.style.display = 'none';
  }

  renderFriendsAndOnlineUsers();
}

function renderFriendsAndOnlineUsers() {
  const container = $('#friends-container');
  if (!container) return;

  const searchInput = $('#messenger-search-input');
  const filterText = (searchInput ? searchInput.value.trim().toLowerCase() : '');

  const activeSockets = new Set();
  const allUsersToRender = [];

  if (lastOnlineUsersList && lastOnlineUsersList.length > 0) {
    lastOnlineUsersList.forEach(u => {
      if (socket && u.socketId === socket.id) return;
      activeSockets.add(u.socketId);
      allUsersToRender.push({
        id: u.socketId,
        username: u.username || 'مستخدم',
        gender: u.gender || 'male',
        country: u.country || 'JO',
        countryName: u.countryName || 'الأردن',
        isAdmin: u.isAdmin || false,
        isOnline: true
      });
    });
  }

  if (friendsList && friendsList.length > 0) {
    friendsList.forEach(f => {
      if (!activeSockets.has(f.id)) {
        allUsersToRender.push({
          id: f.id,
          username: f.name || f.username || 'صديق',
          gender: f.gender || 'male',
          country: f.country || 'JO',
          countryName: f.countryName || 'الأردن',
          isAdmin: false,
          isOnline: false
        });
      }
    });
  }

  const filteredUsers = allUsersToRender.filter(u => {
    if (!filterText) return true;
    return u.username.toLowerCase().includes(filterText) || (u.countryName && u.countryName.toLowerCase().includes(filterText));
  });

  const countBadge = $('#messenger-online-status');
  if (countBadge) {
    countBadge.textContent = `🌐 جميع المتصلين بالدردشة الآن (${lastOnlineUsersList.length} مستخدم)`;
  }

  if (filteredUsers.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #888; padding: 40px 10px; font-size: 14px;">
        لا يوجد مستخدمون متصلون حالياً يطابقون البحث.<br>
        <span style="font-size: 12px; color: #666; margin-top: 5px; display: inline-block;">شارك رابط التطبيق ليدخل أصدقاؤك للدردشة المباشرة!</span>
      </div>`;
    return;
  }

  container.innerHTML = '';
  filteredUsers.forEach(user => {
    const card = document.createElement('div');
    card.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255, 255, 255, 0.05); padding: 12px 16px; border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08); transition: all 0.2s ease; cursor: pointer;
    `;

    card.onmouseover = () => card.style.background = 'rgba(59, 130, 246, 0.15)';
    card.onmouseout = () => card.style.background = 'rgba(255, 255, 255, 0.05)';

    const flag = countryCodeToFlag(user.country || 'JO');
    const avatar = user.isAdmin ? '👑' : (user.gender === 'female' ? '👩' : '👨');
    const onlineBadge = user.isOnline 
      ? '<span style="font-size:11px; color:#22c55e; background:rgba(34,197,94,0.15); padding:2px 8px; border-radius:10px; border:1px solid rgba(34,197,94,0.3);">🟢 متصل الآن</span>' 
      : '<span style="font-size:11px; color:#888;">غير متصل</span>';

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px; background: rgba(0,0,0,0.3); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1);">
          ${avatar}
        </div>
        <div>
          <div style="color: #fff; font-weight: 800; font-size: 15px;">${flag} ${user.username}</div>
          <div style="font-size: 11px; color: #aaa;">${user.countryName || 'الأردن'}</div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        ${onlineBadge}
        <button style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; padding: 6px 14px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer;">
          💬 دردشة خاصة
        </button>
      </div>
    `;

    card.onclick = () => {
      openPrivateChatWindow(user);
    };

    container.appendChild(card);
  });
}

function openPrivateChatWindow(user) {
  activeFriendChat = {
    id: user.id,
    socketId: user.id,
    name: user.username,
    gender: user.gender,
    country: user.country
  };

  const listView = $('#friends-list-view');
  const chatView = $('#private-chat-view');
  if (listView) listView.classList.add('hidden');
  if (chatView) chatView.classList.remove('hidden');

  const titleSpan = $('#private-chat-friend-name');
  if (titleSpan) titleSpan.textContent = `${user.username} ${countryCodeToFlag(user.country)}`;

  renderPrivateMessages(user.id);
}

// =============================================
// Web Push Notifications & Service Worker
// =============================================
function initPushNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration error:', err));
  }

  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    setTimeout(() => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showGemToast('🔔 تم تفعيل إشعارات لقاء بنجاح!');
          checkAndClaimReferralReward();
        }
      });
    }, 4000);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    checkAndClaimReferralReward();
  }
}

let pendingReferrerCode = null;

function checkReferralQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) {
    pendingReferrerCode = ref;
    localStorage.setItem('liqaa_pending_ref', ref);
  } else {
    pendingReferrerCode = localStorage.getItem('liqaa_pending_ref');
  }
}

function checkPaymentSuccessQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const gemsAdded = urlParams.get('gems_added');
  if (gemsAdded) {
    const gemsNum = parseInt(gemsAdded, 10);
    if (!isNaN(gemsNum) && gemsNum > 0) {
      userProfile.gems = (parseInt(userProfile.gems, 10) || 50) + gemsNum;
      saveUserProfile();
      updateProfileUI();
      showGemToast(`🎉 مبروك! تمت عملية الدفع بنجاح وتم إضافة +${gemsNum} مجوهرة إلى رصيدك! 💎`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

function checkAndClaimReferralReward() {
  if (!pendingReferrerCode) return;
  const claimed = localStorage.getItem(`liqaa_claimed_ref_${pendingReferrerCode}`);
  if (claimed) return;

  const isSetupDone = userProfile && (userProfile.hasCompletedSetup || userProfile.username);
  const isNotificationGranted = 'Notification' in window && Notification.permission === 'granted';

  if (isSetupDone && isNotificationGranted) {
    localStorage.setItem(`liqaa_claimed_ref_${pendingReferrerCode}`, 'true');
    localStorage.removeItem('liqaa_pending_ref');

    if (socket && socket.connected) {
      socket.emit('claim_referral_reward', {
        referrerCode: pendingReferrerCode,
        newUsername: userProfile.username || 'صديق جديد'
      });
    }

    showGemToast('🎉 شكراً لانضمامك وتفعيل الإشعارات! تم منح صديقك 50 مجوهرة!');
    pendingReferrerCode = null;
  }
}

function openInviteModal() {
  const link = 'https://play.google.com/store/apps/details?id=com.lokychat.app';
  const refLinkInput = $('#referral-link-input');
  if (refLinkInput) refLinkInput.value = link;
  const inviteModal = $('#invite-modal');
  if (inviteModal) inviteModal.classList.remove('hidden');
}
window.openInviteModal = openInviteModal;

function setupInviteModal() {
  const inviteModal = $('#invite-modal');
  const closeInviteBtn = $('#close-invite-modal-btn');
  const refLinkInput = $('#referral-link-input');
  const copyBtn = $('#copy-ref-link-btn');
  const shareWpBtn = $('#share-whatsapp-btn');

  // Pre-fill link immediately
  if (refLinkInput) refLinkInput.value = 'https://play.google.com/store/apps/details?id=com.lokychat.app';

  $$('#open-invite-modal-btn, [id="open-invite-modal-btn"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openInviteModal();
    };
  });

  if (closeInviteBtn) {
    closeInviteBtn.onclick = () => {
      if (inviteModal) inviteModal.classList.add('hidden');
    };
  }

  if (copyBtn) {
    copyBtn.onclick = () => {
      const link = 'https://play.google.com/store/apps/details?id=com.lokychat.app';
      if (refLinkInput) refLinkInput.value = link;
      navigator.clipboard.writeText(link).then(() => {
        showGemToast('📋 تم نسخ رابط الدعوة بنجاح!');
      }).catch(() => {
        if (refLinkInput) {
          refLinkInput.select();
          document.execCommand('copy');
          showGemToast('📋 تم نسخ رابط الدعوة بنجاح!');
        }
      });
    };
  }

  if (shareWpBtn) {
    shareWpBtn.onclick = () => {
      const playLink = 'https://play.google.com/store/apps/details?id=com.lokychat.app';
      const webLink = `https://loky-chat.onrender.com/?ref=${encodeURIComponent(userProfile.username || 'friend')}`;
      const text = `🔥 انضم معي الآن على تطبيق "Loky Chat - لوكي شات" لأفضل دردشة فيديو عشوائية ومباشرة مع أصدقاء من كل دول العالم! 🎥✨\n\n📲 حمّل التطبيق الرسمي من متجر Google Play:\n${playLink}\n\n🌐 أو ادخل للدردشة المباشرة عبر المتصفح:\n${webLink}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };
  }
}

function init() {
  checkReferralQuery();
  loadUserProfile();
  checkPaymentSuccessQuery();
  updateOnlineDisplay();
  initPushNotifications();
  setupAdminPinModal();
  setupWelcomeUI();
  setupSettingsUI();
  setupFriendsSystem();
  setupInviteModal();
  setupGemsStore();
  setupAuthSystem();
  setupReportModal();
  setupControls();
  connectSocket();
  autoDetectCountry();
  if (IS_NATIVE_APP) {
    initPlayBilling();
  }
}

// =============================================
// User Report & Violation System
// =============================================
function setupReportModal() {
  const reportModal = $('#report-modal');
  const reportPartnerBtn = $('#report-partner-btn');
  const closeReportBtn = $('#close-report-modal-btn');
  const cancelReportBtn = $('#cancel-report-btn');
  const submitReportBtn = $('#submit-report-btn');
  const reportDetailsInput = $('#report-details-input');

  function openReportModalForCurrentPartner() {
    if (!currentPartner || !currentPartner.id) {
      showGemToast('⚠️ لا يوجد شخص متصل معك حالياً لتقديم بلاغ ضده');
      return;
    }
    if (reportDetailsInput) reportDetailsInput.value = '';
    if (reportModal) reportModal.classList.remove('hidden');
  }

  if (reportPartnerBtn) {
    reportPartnerBtn.onclick = openReportModalForCurrentPartner;
  }

  if (closeReportBtn) {
    closeReportBtn.onclick = () => { if (reportModal) reportModal.classList.add('hidden'); };
  }
  if (cancelReportBtn) {
    cancelReportBtn.onclick = () => { if (reportModal) reportModal.classList.add('hidden'); };
  }

  if (submitReportBtn) {
    submitReportBtn.onclick = async () => {
      if (!currentPartner || !currentPartner.id) {
        showGemToast('⚠️ لا يوجد شريك محدد للإبلاغ عنه');
        if (reportModal) reportModal.classList.add('hidden');
        return;
      }

      const selectedOption = $('input[name="report-reason"]:checked');
      const reason = selectedOption ? selectedOption.value : 'مخالفة';
      const details = reportDetailsInput ? reportDetailsInput.value.trim() : '';

      try {
        const payload = {
          reporterUsername: userProfile.username || 'مستخدم',
          reporterPhone: userProfile.phone || '',
          reportedUsername: currentPartner.username || 'مستخدم',
          reportedGender: currentPartner.gender || '',
          reportedCountry: currentPartner.country || '',
          reportedSocketId: currentPartner.socketId || currentPartner.id,
          reason: reason,
          details: details
        };

        const res = await fetch(API_BASE_URL + '/api/report-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.success) {
          showGemToast('🚨 تم إرسال البلاغ بنجاح! ستتم مراجعته يدوياً من قِبل المشرف.');
        } else {
          showGemToast('✅ تم تسجيل بلاغك وسيقوم المشرف بمراجعته فوراً');
        }
      } catch (err) {
        console.error('[Report error]', err);
        showGemToast('🚨 تم إرسال البلاغ وسيقوم المشرف بمراجعته فوراً');
      }

      if (reportModal) reportModal.classList.add('hidden');
    };
  }
}

// =============================================
// Google & Account Auth System
// =============================================
function setupAuthSystem() {
  const authModal = $('#auth-modal');
  const openAuthModalBtn = $('#open-auth-modal-btn');
  const googleLoginBtn = $('#google-login-btn');
  const closeAuthModalBtn = $('#close-auth-modal-btn');
  const emailAuthForm = $('#email-auth-form');

  if (openAuthModalBtn) {
    openAuthModalBtn.onclick = () => {
      const settingsModal = $('#settings-modal');
      if (settingsModal) settingsModal.classList.add('hidden');
      if (authModal) authModal.classList.remove('hidden');
    };
  }

  if (closeAuthModalBtn) {
    closeAuthModalBtn.onclick = () => {
      if (authModal) authModal.classList.add('hidden');
    };
  }

  const googleInlineForm = $('#google-inline-form');
  const googleEmailInput = $('#google-email-input');
  const googleConfirmBtn = $('#google-confirm-btn');

  const processGoogleLink = (userGoogleEmail) => {
    if (userGoogleEmail && userGoogleEmail.includes('@')) {
      const usernameFromEmail = userGoogleEmail.split('@')[0];
      userProfile.accountEmail = userGoogleEmail;
      userProfile.username = usernameFromEmail;
      userProfile.hasAccount = true;

      const savedGems = localStorage.getItem(`liqaa_gems_${userGoogleEmail}`);
      if (savedGems !== null) {
        userProfile.gems = parseInt(savedGems, 10);
      } else {
        localStorage.setItem(`liqaa_gems_${userGoogleEmail}`, userProfile.gems);
      }

      saveUserProfile();
      updateProfileUI();
      if (authModal) authModal.classList.add('hidden');
      showGemToast(`🎉 تم ربط الحساب والجواهر ببريد Google (${userGoogleEmail}) بنجاح!`);
    } else {
      showGemToast('❌ يرجى إدخال عنوان بريد Google صحيح');
    }
  };

  if (googleLoginBtn) {
    googleLoginBtn.onclick = () => {
      if (googleInlineForm) {
        googleInlineForm.classList.toggle('hidden');
        if (!googleInlineForm.classList.contains('hidden') && googleEmailInput) {
          googleEmailInput.value = userProfile.accountEmail || '';
          googleEmailInput.focus();
        }
      }
    };
  }

  if (googleConfirmBtn) {
    googleConfirmBtn.onclick = () => {
      const email = googleEmailInput ? googleEmailInput.value.trim() : '';
      processGoogleLink(email);
    };
  }

  if (googleEmailInput) {
    googleEmailInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        processGoogleLink(googleEmailInput.value.trim());
      }
    };
  }

  if (emailAuthForm) {
    emailAuthForm.onsubmit = (e) => {
      e.preventDefault();
      const emailInput = $('#auth-email-input');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email || !email.includes('@')) {
        showGemToast('❌ يرجى إدخال عنوان بريد إلكتروني صحيح');
        return;
      }

      const usernameFromEmail = email.split('@')[0];
      userProfile.accountEmail = email;
      userProfile.username = usernameFromEmail;
      userProfile.hasAccount = true;

      const savedGems = localStorage.getItem(`liqaa_gems_${email}`);
      if (savedGems !== null) {
        userProfile.gems = parseInt(savedGems, 10);
      } else {
        localStorage.setItem(`liqaa_gems_${email}`, userProfile.gems);
      }

      saveUserProfile();
      updateProfileUI();
      if (authModal) authModal.classList.add('hidden');
      showGemToast(`🎉 تم ربط الحساب والجواهر ببريدك الإلكتروني بنجاح!`);
    };
  }
}

// =============================================
// Gems Store & Payment System
// =============================================
let currentSelectedPackage = { gems: 3000, price: 4.99, paypalUrl: '' };

// =============================================
// Google Play Billing (Android app only)
// =============================================
const IS_NATIVE_APP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const PlayBilling = IS_NATIVE_APP
  ? (window.Capacitor.Plugins && window.Capacitor.Plugins.PlayBilling) || (window.Capacitor.registerPlugin && window.Capacitor.registerPlugin('PlayBilling'))
  : null;
const GEM_PRODUCTS = { '1000': 'gems_1000', '3000': 'gems_3000', '7000': 'gems_7000', '15000': 'gems_15000' };
const PRODUCT_GEMS = { gems_1000: 1000, gems_3000: 3000, gems_7000: 7000, gems_15000: 15000 };
let playProductsLoaded = false;
let playPurchaseInProgress = false;

function getGrantedTokens() {
  try { return JSON.parse(localStorage.getItem('liqaa_play_tokens') || '[]'); } catch (e) { return []; }
}

// Grants gems exactly once per purchase token, then consumes it so it can be bought again.
async function grantAndConsumePlayPurchase(purchase) {
  if (!purchase || !purchase.purchaseToken || !purchase.purchased) return;
  const gemsToAdd = PRODUCT_GEMS[purchase.productId];
  if (!gemsToAdd) return;

  const tokens = getGrantedTokens();
  if (!tokens.includes(purchase.purchaseToken)) {
    userProfile.gems = (parseInt(userProfile.gems, 10) || 0) + gemsToAdd;
    tokens.push(purchase.purchaseToken);
    localStorage.setItem('liqaa_play_tokens', JSON.stringify(tokens.slice(-100)));
    saveUserProfile();
    updateProfileUI();
    showGemToast(`🎉 +${gemsToAdd} 💎`);
    fetch(API_BASE_URL + '/api/record-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gems: gemsToAdd, username: userProfile.username, method: 'Google Play', orderId: purchase.orderId || '' })
    }).catch(() => {});
  }

  try {
    await PlayBilling.consume({ purchaseToken: purchase.purchaseToken });
  } catch (err) {
    console.error('[PlayBilling] consume failed, will retry on next launch', err);
  }
}

async function initPlayBilling() {
  if (!PlayBilling) return;
  document.body.classList.add('native-app');

  try {
    const { products } = await PlayBilling.getProducts({ productIds: Object.values(GEM_PRODUCTS) });
    (products || []).forEach(p => {
      const gems = PRODUCT_GEMS[p.productId];
      const card = document.querySelector(`.gem-package-card[data-gems="${gems}"]`);
      const priceEl = card && card.querySelector('.package-price');
      if (priceEl && p.price) priceEl.textContent = p.price; // localized price from Google Play
    });
    playProductsLoaded = (products || []).length > 0;
  } catch (err) {
    console.error('[PlayBilling] getProducts failed', err);
  }

  // Recover purchases that were paid but not yet granted/consumed (e.g. app closed mid-purchase)
  try {
    const { purchases } = await PlayBilling.getUnconsumedPurchases();
    for (const p of purchases || []) await grantAndConsumePlayPurchase(p);
  } catch (err) {
    console.error('[PlayBilling] recovery failed', err);
  }

  if (PlayBilling.addListener) {
    PlayBilling.addListener('purchaseUpdated', (p) => grantAndConsumePlayPurchase(p));
  }
}

async function buyWithGooglePlay(gems) {
  if (!PlayBilling) return;
  if (playPurchaseInProgress) return;
  const productId = GEM_PRODUCTS[String(gems)];
  if (!productId) return;

  playPurchaseInProgress = true;
  try {
    if (!playProductsLoaded) await initPlayBilling();
    const result = await PlayBilling.purchase({ productId });
    if (result && result.pending) {
      showGemToast(t('purchase_pending'));
    } else {
      await grantAndConsumePlayPurchase(result);
      const rechargeModal = $('#recharge-modal');
      if (rechargeModal) rechargeModal.classList.add('hidden');
    }
  } catch (err) {
    const msg = String((err && err.message) || err);
    if (!msg.includes('USER_CANCELED')) showGemToast(t('purchase_failed'));
    console.error('[PlayBilling] purchase error', err);
  } finally {
    playPurchaseInProgress = false;
  }
}

function setupGemsStore() {
  const rechargeModal = $('#recharge-modal');
  const checkoutModal = $('#checkout-modal');
  const closeCheckoutBtn = $('#close-checkout-btn');
  const payNowBtn = $('#pay-now-btn');
  const checkoutTitle = $('#checkout-package-title');

  if (openRechargeModalBtn) {
    openRechargeModalBtn.onclick = () => {
      if (checkBanStatus()) return;
      if (rechargeModal) rechargeModal.classList.remove('hidden');
    };
  }

  function renderPayPalSmartButtons(gems, price) {
    const container = $('#paypal-button-container');
    if (!container) return;
    container.innerHTML = '';

    if (window.paypal && window.paypal.Buttons) {
      try {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: function(data, actions) {
            return actions.order.create({
              purchase_units: [{
                description: `Loky Chat - ${gems} Gems`,
                amount: {
                  currency_code: 'USD',
                  value: price
                }
              }],
              application_context: {
                shipping_preference: 'NO_SHIPPING'
              }
            });
          },
          onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
              const gemsToAdd = parseInt(gems, 10) || 1000;
              userProfile.gems = (parseInt(userProfile.gems, 10) || 50) + gemsToAdd;
              saveUserProfile();
              updateProfileUI();
              if (checkoutModal) checkoutModal.classList.add('hidden');
              showGemToast(`🎉 مبروك! تمت عملية الدفع بنجاح! تم إضافة +${gemsToAdd} مجوهرة إلى رصيدك! 💎`);
            });
          },
          onError: function(err) {
            console.error('PayPal Smart Button Error:', err);
            showGemToast('❌ حدث خطأ أثناء الدفع المباشر، يرجى تجربة الزر الخارجي');
          }
        }).render('#paypal-button-container');
      } catch(e) {
        console.error('Failed to render PayPal Smart Buttons:', e);
      }
    }
  }

  const packageCards = $$('.gem-package-card');
  packageCards.forEach(card => {
    const handlePackageClick = async (e) => {
      e.stopPropagation();
      const gems = card.dataset.gems || '1000';
      const price = card.dataset.price || '2.49';

      // Android app: Google Play Billing only (required by Play payments policy)
      if (IS_NATIVE_APP) {
        buyWithGooglePlay(gems);
        return;
      }

      currentSelectedPackage = { gems, price, paypalUrl: '' };

      if (checkoutTitle) {
        checkoutTitle.textContent = `${Number(gems).toLocaleString()} جوهرة (${price}$)`;
      }

      if (rechargeModal) rechargeModal.classList.add('hidden');
      if (checkoutModal) checkoutModal.classList.remove('hidden');

      renderPayPalSmartButtons(gems, price);

      try {
        const res = await fetch(API_BASE_URL + '/api/create-paypal-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: price, gems: gems })
        });
        const data = await res.json();
        if (data && data.paypalUrl) {
          currentSelectedPackage.paypalUrl = data.paypalUrl;
        }
      } catch (err) {
        console.error('[Payment API Error]', err);
      }
    };

    card.addEventListener('click', handlePackageClick);
    const buyBtn = card.querySelector('.buy-package-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', handlePackageClick);
    }
  });

  const payPaypalBtn = $('#pay-paypal-btn');

  if (payNowBtn) {
    payNowBtn.onclick = () => {
      const price = currentSelectedPackage.price || '4.99';
      const gems = currentSelectedPackage.gems || '3000';
      
      const targetUrl = currentSelectedPackage.paypalUrl || 
        `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent('mahmoud.aljafri23@gmail.com')}&item_name=${encodeURIComponent(`Loky Chat - ${gems} Gems`)}&amount=${encodeURIComponent(price)}&currency_code=USD&solution_type=sole&landing_page=billing&no_shipping=1&no_note=1`;

      showGemToast('💳 جاري التوجيه لصفحة الدفع ببطاقة الفيزا والماستركارد...');
      window.location.href = targetUrl;
    };
  }

  if (payPaypalBtn) {
    payPaypalBtn.onclick = () => {
      const price = currentSelectedPackage.price || '4.99';
      const gems = currentSelectedPackage.gems || '3000';
      
      const targetUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent('mahmoud.aljafri23@gmail.com')}&item_name=${encodeURIComponent(`Loky Chat - ${gems} Gems`)}&amount=${encodeURIComponent(price)}&currency_code=USD&landing_page=login&no_shipping=1&no_note=1`;

      showGemToast('🅿️ جاري التوجيه لصفحة الدفع عبر حساب PayPal...');
      window.location.href = targetUrl;
    };
  }

  if (closeCheckoutBtn) {
    closeCheckoutBtn.onclick = () => {
      if (checkoutModal) checkoutModal.classList.add('hidden');
      if (rechargeModal) rechargeModal.classList.remove('hidden');
    };
  }
}

// =============================================
// Next Button 5-Second Cooldown
// =============================================
let nextCooldownTimer = null;

function startNextButtonCooldown() {
  if (!nextBtn) return;
  
  let remaining = 5;
  nextBtn.disabled = true;
  nextBtn.style.opacity = '0.5';
  nextBtn.style.cursor = 'not-allowed';

  function updateNextBtnText() {
    const label = nextBtn.querySelector('.next-label');
    if (remaining > 0) {
      if (label) label.textContent = `التالي (${remaining}s)`;
    } else {
      if (label) label.textContent = 'التالي';
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.style.cursor = 'pointer';
      if (nextCooldownTimer) clearInterval(nextCooldownTimer);
    }
  }

  updateNextBtnText();
  if (nextCooldownTimer) clearInterval(nextCooldownTimer);
  nextCooldownTimer = setInterval(() => {
    remaining--;
    updateNextBtnText();
  }, 1000);
}

// =============================================
// Friends & Private Direct Chat System
// =============================================
let currentPartner = null;
let activeFriendChat = null;
let friendsList = [];

function loadFriendsList() {
  try {
    const saved = localStorage.getItem('liqaa_friends_list');
    friendsList = saved ? JSON.parse(saved) : [];
  } catch (e) {
    friendsList = [];
  }
}

function saveFriendsList() {
  localStorage.setItem('liqaa_friends_list', JSON.stringify(friendsList));
}

function setupFriendsSystem() {
  loadFriendsList();

  const openFriendsBtn = $('#open-friends-modal-btn');
  const friendsModal = $('#friends-modal');
  const closeFriendsBtn = $('#close-friends-btn');
  const addFriendBtn = $('#add-friend-btn');
  const backToFriendsListBtn = $('#back-to-friends-list-btn');

  if (openFriendsBtn) {
    openFriendsBtn.onclick = () => {
      renderFriendsAndOnlineUsers();
      if (friendsModal) friendsModal.classList.remove('hidden');
    };
  }

  if (closeFriendsBtn) {
    closeFriendsBtn.onclick = () => {
      if (friendsModal) friendsModal.classList.add('hidden');
    };
  }

  if (addFriendBtn) {
    addFriendBtn.onclick = () => {
      if (!currentPartner || !currentPartner.id) {
        showGemToast('❌ لا يوجد شريك متصل الآن');
        return;
      }

      const exists = friendsList.some(f => f.id === currentPartner.id);
      if (exists) {
        showGemToast('✨ هذا الشخص موجود في قائمة أصدقائك بالفعل');
        return;
      }

      const friendName = (currentPartner.username && currentPartner.username !== 'مستخدم') ? currentPartner.username : (currentPartner.name || 'صديق جديد');
      const newFriend = {
        id: currentPartner.id,
        socketId: currentPartner.socketId,
        name: friendName,
        username: friendName,
        gender: currentPartner.gender || 'male',
        age: currentPartner.age || 22,
        country: currentPartner.country || 'JO',
        countryName: currentPartner.countryName || 'الأردن',
        addedAt: Date.now()
      };

      friendsList.unshift(newFriend);
      saveFriendsList();
      renderFriendsAndOnlineUsers();
      showGemToast(`➕ تم إضافة ${friendName} (${newFriend.age} سنة) إلى أصدقائك!`);
    };
  }

  if (backToFriendsListBtn) {
    backToFriendsListBtn.onclick = () => {
      $('#private-chat-view').classList.add('hidden');
      $('#friends-list-view').classList.remove('hidden');
      renderFriendsList();
    };
  }

  const sendPrivateMsgBtn = $('#send-private-msg-btn');
  const privateChatInput = $('#private-chat-input');

  if (sendPrivateMsgBtn && privateChatInput) {
    const handleSendMsg = () => {
      const text = privateChatInput.value.trim();
      if (!text || !activeFriendChat) return;

      appendPrivateMessage(activeFriendChat.id, 'me', text);
      
      if (socket && socket.connected) {
        socket.emit('private_message', {
          targetSocketId: activeFriendChat.socketId || activeFriendChat.id,
          targetUserId: activeFriendChat.id,
          text: text
        });
      }

      privateChatInput.value = '';
    };

    sendPrivateMsgBtn.onclick = handleSendMsg;
    privateChatInput.onkeypress = (e) => {
      if (e.key === 'Enter') handleSendMsg();
    };
  }

  const messengerSearchInput = $('#messenger-search-input');
  if (messengerSearchInput) {
    messengerSearchInput.addEventListener('input', renderFriendsAndOnlineUsers);
  }
}

function removeFriend(friendId) {
  const friend = friendsList.find(f => f.id === friendId);
  const name = friend ? friend.name : 'الصديق';
  if (!confirm(`هل أنت متأكد من رغبتك في إزالة ${name} من قائمة الأصدقاء؟`)) return;

  friendsList = friendsList.filter(f => f.id !== friendId);
  saveFriendsList();
  $('#private-chat-view').classList.add('hidden');
  $('#friends-list-view').classList.remove('hidden');
  renderFriendsList();
  showGemToast(`🗑️ تم إزالة ${name} من قائمة الأصدقاء`);
}
window.removeFriend = removeFriend;

function clearPrivateChat(friendId) {
  if (!confirm('هل أنت متأكد من مسح جميع رسائل هذه المحادثة؟')) return;
  localStorage.removeItem(`liqaa_chat_${friendId}`);
  renderPrivateMessages(friendId);
  showGemToast('🧹 تم مسح المحادثة بالكامل');
}
window.clearPrivateChat = clearPrivateChat;

function renderFriendsList() {
  const container = $('#friends-container');
  const emptyMsg = $('#friends-empty-msg');
  if (!container) return;

  container.innerHTML = '';
  if (friendsList.length === 0) {
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }
  if (emptyMsg) emptyMsg.classList.add('hidden');

  friendsList.forEach(friend => {
    const item = document.createElement('div');
    const isMale = friend.gender !== 'female';
    const genderIcon = isMale ? '👨' : '👩';
    const genderLabel = isMale ? 'ذكر' : 'أنثى';
    const age = friend.age || 22;
    const flag = countryCodeToFlag(friend.country || 'JO');

    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(20,10,30,0.6) 100%); padding:12px 14px; border-radius:18px; border:1.5px solid rgba(255,215,0,0.25); box-shadow: 0 4px 15px rgba(0,0,0,0.4);';
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #a855f7, #ec4899); display:flex; align-items:center; justify-content:center; font-size:22px; border:1.5px solid #ffd700; box-shadow: 0 0 12px rgba(255,215,0,0.35); flex-shrink:0;">
          ${genderIcon}
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; color:#fff; font-size:14.5px;">${friend.name} ${flag}</div>
          <div style="font-size:11.5px; color:#fef08a; font-weight:700; display:flex; align-items:center; gap:6px; margin-top:2px;">
            <span>${genderIcon} ${genderLabel}</span>
            <span>•</span>
            <span>🎂 ${age} سنة</span>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button class="royal-invite-btn" style="padding:8px 14px; font-size:12px; margin:0;" onclick="openPrivateChat('${friend.id}')">
          💬 دردشة
        </button>
        <button onclick="window.removeFriend('${friend.id}')" title="إزالة الصديق" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; width:34px; height:34px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.2s ease;">
          🗑️
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

function openPrivateChat(friendId) {
  const friend = friendsList.find(f => f.id === friendId);
  if (!friend) return;

  activeFriendChat = friend;
  $('#friends-list-view').classList.add('hidden');
  $('#private-chat-view').classList.remove('hidden');

  const isMale = friend.gender !== 'female';
  const genderIcon = isMale ? '👨' : '👩';
  const genderLabel = isMale ? 'ذكر' : 'أنثى';
  const age = friend.age || 22;
  const flag = countryCodeToFlag(friend.country || 'JO');

  const nameEl = $('#private-chat-friend-name');
  if (nameEl) nameEl.textContent = `${friend.name} ${flag}`;
  
  const tagEl = $('#private-chat-friend-tag');
  if (tagEl) {
    tagEl.textContent = `${genderIcon} ${genderLabel} • ${age} سنة`;
  }

  const btnClear = $('#btn-clear-chat');
  if (btnClear) {
    btnClear.onclick = () => clearPrivateChat(friendId);
  }
  const btnRemove = $('#btn-remove-friend');
  if (btnRemove) {
    btnRemove.onclick = () => removeFriend(friendId);
  }

  renderPrivateMessages(friendId);
}

function getPrivateMessages(friendId) {
  try {
    const saved = localStorage.getItem(`liqaa_chat_${friendId}`);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function appendPrivateMessage(friendId, sender, text) {
  const msgs = getPrivateMessages(friendId);
  msgs.push({ sender, text, timestamp: Date.now() });
  localStorage.setItem(`liqaa_chat_${friendId}`, JSON.stringify(msgs));
  renderPrivateMessages(friendId);
}

function renderPrivateMessages(friendId) {
  const container = $('#private-chat-messages');
  if (!container) return;

  container.innerHTML = '';
  const msgs = getPrivateMessages(friendId);

  if (msgs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; color:#94a3b8; font-size:12.5px; margin-top:60px; padding:20px; background:rgba(255,255,255,0.02); border-radius:16px; border:1px dashed rgba(255,215,0,0.2);">
        <div style="font-size:30px; margin-bottom:8px;">👑💬</div>
        <div style="font-weight:800; color:#ffd700; margin-bottom:4px;">بداية المحادثة الملكية الخاصة</div>
        <div>اكتب رسالتك وتحدث بحرية وبأمان تام ✨</div>
      </div>
    `;
    return;
  }

  msgs.forEach(msg => {
    const row = document.createElement('div');
    const isMe = msg.sender === 'me';
    row.className = `chat-msg-row ${isMe ? 'is-me' : 'is-other'}`;

    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    row.innerHTML = `
      <div class="chat-bubble-card">${msg.text}</div>
      <span class="chat-msg-time">${timeStr}</span>
    `;
    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

function setupSettingsUI() {
  const settingsAdminPin = $('#settings-admin-pin');
  const adminPinGroup = $('#settings-admin-pin-group');

  function updateAdminPinVisibility() {
    const phoneVal = settingsPhone ? settingsPhone.value.trim() : '';
    if (adminPinGroup) {
      if (phoneVal === '0790181802' || (userProfile && userProfile.isAdmin)) {
        adminPinGroup.classList.remove('hidden');
      } else {
        adminPinGroup.classList.add('hidden');
      }
    }
  }

  if (settingsPhone) {
    settingsPhone.addEventListener('input', updateAdminPinVisibility);
  }

  if (openSettingsModalBtn) {
    openSettingsModalBtn.addEventListener('click', () => {
      if (checkBanStatus()) return;

      if (settingsUsername) settingsUsername.value = userProfile.username || '';
      if (settingsPhone) settingsPhone.value = userProfile.phone || '';
      if (settingsAge) settingsAge.value = userProfile.age || 22;
      if (settingsAdminPin) settingsAdminPin.value = userProfile.adminPin || '2026';
      
      updateAdminPinVisibility();

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

      const adminBroadcastSection = $('#admin-broadcast-section');
      if (adminBroadcastSection) {
        adminBroadcastSection.classList.toggle('hidden', !userProfile.isAdmin);
        if (userProfile.isAdmin) {
          fetchAdminRechargeStats();
          fetchAdminReports();
        }
      }

      if (settingsModal) settingsModal.classList.remove('hidden');
    });
  }

  async function fetchAdminReports() {
    if (!userProfile || !userProfile.isAdmin) return;
    try {
      const res = await fetch(API_BASE_URL + '/api/admin/reports');
      const data = await res.json();
      if (data && data.success) {
        const countEl = $('#admin-pending-reports-count');
        const listEl = $('#admin-reports-list');
        const bannedCountEl = $('#admin-banned-count');
        const bannedListEl = $('#admin-banned-list');

        const pending = (data.reports || []).filter(r => r.status === 'pending');
        if (countEl) countEl.textContent = pending.length;

        if (listEl) {
          if (pending.length === 0) {
            listEl.innerHTML = '<div style="font-size: 11px; color: #aaa; text-align: center; padding: 6px;">لا توجد بلاغات معلقة حالياً ✅</div>';
          } else {
            listEl.innerHTML = pending.map(r => `
              <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 8px; font-size: 11px; text-align: right;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <strong style="color: #fca5a5; font-size: 12px;">🚨 ضد: ${r.reportedUsername} (${r.reportedGender === 'female' ? '👩 أنثى' : '👨 ذكر'})</strong>
                  <span style="color: #aaa; font-size: 9px;">${r.date}</span>
                </div>
                <div style="color: #ffd700; margin-bottom: 2px;">⚠️ السبب: <b>${r.reason}</b></div>
                ${r.details ? `<div style="color: #ddd; font-size: 10px; margin-bottom: 4px; background: rgba(0,0,0,0.4); padding: 3px 6px; border-radius: 4px;">💬 ${r.details}</div>` : ''}
                <div style="color: #aaa; font-size: 10px; margin-bottom: 6px;">👤 المُبلِّغ: ${r.reporter}</div>
                <div style="display: flex; gap: 4px; justify-content: flex-end;">
                  <button onclick="window.adminBanUser('${r.reportedUsername}', '${r.reportedSocketId}', 24, '${r.reason}', '${r.id}')" style="background: #ef4444; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">
                    ⛔ حظر 24 ساعة
                  </button>
                  <button onclick="window.adminBanUser('${r.reportedUsername}', '${r.reportedSocketId}', -1, '${r.reason}', '${r.id}')" style="background: #991b1b; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer;">
                    🚫 حظر دائم
                  </button>
                  <button onclick="window.adminDismissReport('${r.id}')" style="background: rgba(255,255,255,0.15); color: #ccc; border: none; padding: 3px 8px; border-radius: 6px; font-size: 10px; cursor: pointer;">
                    ✅ تجاهل
                  </button>
                </div>
              </div>
            `).join('');
          }
        }

        if (bannedCountEl) bannedCountEl.textContent = `(${ (data.bannedUsers || []).length } محظور)`;
        if (bannedListEl) {
          if (!data.bannedUsers || data.bannedUsers.length === 0) {
            bannedListEl.innerHTML = '<span style="color:#888;">لا يوجد مستخدمين محظورين</span>';
          } else {
            bannedListEl.innerHTML = data.bannedUsers.map(b => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span>🚫 <b>${b.username}</b> <small style="color:#aaa;">(${b.durationText || 'محظور'})</small></span>
                <button onclick="window.adminUnbanUser('${b.key}')" style="background: #10b981; color: #fff; border: none; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: bold; cursor: pointer;">
                  🔓 فك الحظر
                </button>
              </div>
            `).join('');
          }
        }
      }
    } catch(err) {
      console.error('[Admin Reports Fetch Error]', err);
    }
  }

  window.adminBanUser = async (username, socketId, hours, reason, reportId) => {
    try {
      const res = await fetch(API_BASE_URL + '/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername: username, targetSocketId: socketId, durationHours: hours, reason: reason, reportId: reportId })
      });
      const data = await res.json();
      showGemToast(`⛔ ${data.message || 'تم تنفيذ الحظر بنجاح'}`);
      fetchAdminReports();
    } catch (e) {
      showGemToast('❌ تعذر تنفيذ الحظر');
    }
  };

  window.adminUnbanUser = async (key) => {
    try {
      const res = await fetch(API_BASE_URL + '/api/admin/unban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key })
      });
      const data = await res.json();
      showGemToast(`🔓 ${data.message || 'تم فك الحظر بنجاح'}`);
      fetchAdminReports();
    } catch (e) {
      showGemToast('❌ تعذر فك الحظر');
    }
  };

  window.adminDismissReport = async (reportId) => {
    try {
      await fetch(API_BASE_URL + '/api/admin/dismiss-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: reportId })
      });
      showGemToast('✅ تم تجاهل وتبرئة البلاغ');
      fetchAdminReports();
    } catch (e) {
      console.error(e);
    }
  };

  const refreshReportsBtn = $('#refresh-admin-reports-btn');
  if (refreshReportsBtn) {
    refreshReportsBtn.onclick = fetchAdminReports;
  }

  async function fetchAdminRechargeStats() {
    if (!userProfile || !userProfile.isAdmin) return;
    try {
      const res = await fetch(API_BASE_URL + '/api/admin/recharge-stats');
      const data = await res.json();
      if (data && data.success) {
        const revEl = $('#admin-total-revenue');
        const gemsEl = $('#admin-total-gems-sold');
        const listEl = $('#admin-purchases-list');

        if (revEl) revEl.textContent = `${data.totalRevenue} $`;
        if (gemsEl) gemsEl.textContent = Number(data.totalGemsSold).toLocaleString();

        if (listEl) {
          if (!data.purchases || data.purchases.length === 0) {
            listEl.innerHTML = 'لا توجد عمليات شحن مسجلة بعد';
          } else {
            listEl.innerHTML = data.purchases.map(p => `
              <div style="padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between;">
                <span>👤 ${p.username} (${p.gems} 💎)</span>
                <span style="color: #4ade80; font-weight: bold;">${p.price}$ <small style="color: #aaa; font-weight: normal;">[${p.date}]</small></span>
              </div>
            `).join('');
          }
        }
      }
    } catch(err) {
      console.error('[Admin Stats Fetch Error]', err);
    }
  }

  const refreshStatsBtn = $('#refresh-admin-stats-btn');
  if (refreshStatsBtn) {
    refreshStatsBtn.onclick = fetchAdminRechargeStats;
  }

  const broadcastBtn = $('#admin-send-broadcast-btn');
  const broadcastInput = $('#admin-broadcast-text');
  if (broadcastBtn && broadcastInput) {
    broadcastBtn.onclick = () => {
      const msg = broadcastInput.value.trim();
      if (!msg) return;
      if (socket && socket.connected) {
        socket.emit('send_global_notification', {
          title: 'Loky Chat - لوكي شات 🚀',
          message: msg
        });
        showGemToast('📢 تم إرسال الإشعار لجميع المستخدمين بالعالم بنجاح!');
        broadcastInput.value = '';
      }
    };
  }

  const addGemsBtn = $('#admin-add-gems-btn');
  const addGemsAmountInput = $('#admin-add-gems-amount');
  if (addGemsBtn) {
    addGemsBtn.onclick = () => {
      const amount = parseInt(addGemsAmountInput ? addGemsAmountInput.value : '3000', 10) || 3000;
      userProfile.gems = (parseInt(userProfile.gems, 10) || 50) + amount;
      saveUserProfile();
      updateProfileUI();
      showGemToast(`💎 تم إضافة +${amount} مجوهرة إلى رصيدك بنجاح!`);
    };
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
      const newAge = settingsAge ? parseInt(settingsAge.value.trim(), 10) || 22 : 22;
      const newPin = settingsAdminPin ? settingsAdminPin.value.trim() : '';
      const selectedCard = $('.gender-card[data-settings-gender].selected');
      const newGender = selectedCard ? selectedCard.dataset.settingsGender : userProfile.gender;

      if (newName) userProfile.username = newName;
      userProfile.phone = newPhone;
      userProfile.age = newAge;
      if (newPin) userProfile.adminPin = newPin;
      userProfile.gender = newGender;
      selectedGender = newGender;
      userProfile.hasCompletedSetup = true;

      // Re-evaluate Admin status based on new phone/username
      if (newPhone !== '0790181802' && !newPhone.includes('0790181802') && !newName.toLowerCase().includes('mahmoud')) {
        userProfile.isAdmin = false;
        userProfile.adminUnlocked = false;
        userProfile.gems = 50; // Reset infinite gems to 50 for normal user testing
      } else {
        userProfile.isAdmin = true;
        userProfile.gems = 999999;
      }

      saveUserProfile();
      updateProfileUI();
      updateSetupSectionVisibility();

      if (settingsModal) settingsModal.classList.add('hidden');
      showGemToast('✨ تم تحديث بيانات الحساب بنجاح');
    });
  }
}

// =============================================
// Welcome Screen UI & Live Camera Controller
// =============================================
let welcomeCamStream = null;
let currentCameraFacing = 'user';
let isCameraMuted = false;
let currentFilterIndex = 0;
const VIDEO_FILTERS = [
  'none',
  'contrast(1.1) brightness(1.06) saturate(1.2)', // Natural Beauty
  'sepia(0.18) contrast(1.15) brightness(1.05)',  // Warm Tone
  'hue-rotate(15deg) saturate(1.3) brightness(1.05)', // Vibrant
  'grayscale(1) contrast(1.25)' // Black & White
];

const ROYAL_COUNTRIES = [
  { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬' },
  { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
  { code: 'JO', name: 'الأردن', flag: '🇯🇴' },
  { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
  { code: 'DZ', name: 'الجزائر', flag: '🇩🇿' },
  { code: 'MA', name: 'المغرب', flag: '🇲🇦' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦' },
  { code: 'OM', name: 'عمان', flag: '🇴🇲' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
  { code: 'LB', name: 'لبنان', flag: '🇱🇧' },
  { code: 'SY', name: 'سوريا', flag: '🇸🇾' },
  { code: 'PS', name: 'فلسطين', flag: '🇵🇸' },
  { code: 'YE', name: 'اليمن', flag: '🇾🇪' },
  { code: 'TN', name: 'تونس', flag: '🇹🇳' },
  { code: 'LY', name: 'ليبيا', flag: '🇱🇾' },
  { code: 'SD', name: 'السودان', flag: '🇸🇩' },
  { code: 'TR', name: 'تركيا', flag: '🇹🇷' },
  { code: 'US', name: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: 'GB', name: 'بريطانيا', flag: '🇬🇧' },
  { code: 'DE', name: 'ألمانيا', flag: '🇩🇪' },
  { code: 'FR', name: 'فرنسا', flag: '🇫🇷' },
  { code: 'IT', name: 'إيطاليا', flag: '🇮🇹' },
  { code: 'ES', name: 'إسبانيا', flag: '🇪🇸' },
  { code: 'RU', name: 'روسيا', flag: '🇷🇺' },
  { code: 'BR', name: 'البرازيل', flag: '🇧🇷' },
  { code: 'CA', name: 'كندا', flag: '🇨🇦' },
  { code: 'SE', name: 'السويد', flag: '🇸🇪' },
  { code: 'IN', name: 'الهند', flag: '🇮🇳' },
  { code: 'ID', name: 'إندونيسيا', flag: '🇮🇩' },
  { code: 'PK', name: 'باكستان', flag: '🇵🇰' },
  { code: 'IR', name: 'إيران', flag: '🇮🇷' }
];

async function initWelcomeCamera() {
  const preview = $('#welcome-camera-preview');
  const fallback = $('#camera-fallback-bg');
  if (!preview) return;

  preview.muted = true;
  preview.defaultMuted = true;
  preview.setAttribute('playsinline', '');
  preview.setAttribute('webkit-playsinline', '');
  preview.setAttribute('autoplay', '');

  // Mirror only for front camera, natural orientation for back camera
  preview.style.transform = currentCameraFacing === 'user' ? 'scaleX(-1)' : 'none';

  try {
    if (welcomeCamStream) {
      welcomeCamStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      welcomeCamStream = null;
    }

    let stream = null;
    const isBack = (currentCameraFacing === 'environment');

    // Strategy 1: High Definition 720p 30fps (Cool, battery-efficient, silky smooth)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isBack ? { ideal: 'environment' } : { ideal: 'user' },
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });
    } catch (e1) {
      console.warn('[Camera] Strategy 1 failed, trying basic video:', e1);
      // Strategy 2: Simple video constraint
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isBack ? 'environment' : 'user' },
          audio: false
        });
      } catch (e2) {
        console.warn('[Camera] Strategy 2 failed, querying device list:', e2);
        // Strategy 3: Enumerate devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          let targetDev = null;
          if (isBack) {
            targetDev = videoDevices.find(d => /back|rear|خلف|environment/i.test(d.label)) || (videoDevices.length > 1 ? videoDevices[videoDevices.length - 1] : videoDevices[0]);
          } else {
            targetDev = videoDevices.find(d => /front|user|أمام/i.test(d.label)) || videoDevices[0];
          }

          if (targetDev && targetDev.deviceId) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: targetDev.deviceId } },
              audio: false
            });
          } else {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        } catch (e3) {
          throw e3;
        }
      }
    }

    welcomeCamStream = stream;
    preview.srcObject = welcomeCamStream;
    
    const markVideoReady = () => {
      preview.classList.add('video-ready');
      if (fallback) fallback.style.display = 'none';
    };

    preview.onloadedmetadata = markVideoReady;
    preview.onplaying = markVideoReady;
    preview.onloadeddata = markVideoReady;

    await preview.play().catch(e => console.warn('Preview play catch:', e));
    markVideoReady();

    // Also feed to local-video in PiP window
    const localVid = $('#local-video');
    if (localVid) {
      localVid.srcObject = welcomeCamStream;
      localVid.style.transform = currentCameraFacing === 'user' ? 'scaleX(-1)' : 'none';
      localVid.play().catch(() => {});
    }
  } catch (err) {
    console.warn('[Welcome Camera] Local preview stream error:', err);
    preview.classList.remove('video-ready');
    if (fallback) fallback.style.display = 'flex';
  }
}

function renderRoyalCountryGrid(searchFilter = '') {
  const grid = $('#royal-country-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const query = searchFilter.trim().toLowerCase();
  const list = ROYAL_COUNTRIES.filter(c => 
    !query || c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
  );

  list.forEach(c => {
    const item = document.createElement('div');
    item.className = 'royal-country-item';
    if (selectedTargetCountryMode === 'CUSTOM' && selectedTargetCountryCode === c.code) {
      item.classList.add('active');
    }
    item.innerHTML = `
      <div class="country-item-meta">
        <span class="country-item-flag">${c.flag}</span>
        <span class="country-item-name">${c.name}</span>
      </div>
      <span class="country-item-gem">10 💎</span>
    `;

    item.addEventListener('click', () => {
      selectedTargetCountryMode = 'CUSTOM';
      selectedTargetCountryCode = c.code;
      selectedTargetCountryName = c.name;

      const pillText = $('#pill-selected-country-text');
      if (pillText) pillText.textContent = `${c.flag} ${c.name} (10💎)`;

      $('#royal-opt-all')?.classList.remove('active');
      $('#royal-opt-home')?.classList.remove('active');
      $$('.royal-country-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      const modal = $('#royal-country-modal');
      if (modal) modal.classList.add('hidden');
      validateForm();
    });

    grid.appendChild(item);
  });
}

function openRoyalCountryModal() {
  const modal = $('#royal-country-modal');
  if (modal) {
    renderRoyalCountryGrid();
    modal.classList.remove('hidden');
  }
}
window.openRoyalCountryModal = openRoyalCountryModal;

function openRoyalGenderModal() {
  const modal = $('#royal-gender-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}
window.openRoyalGenderModal = openRoyalGenderModal;

function setupSwipeGestures() {
  // Swipe on Welcome Screen Camera Card to Start Video Chat (ONLY when idle)
  const welcomeCard = $('#welcome-camera-card');
  if (welcomeCard) {
    let startX = 0, startY = 0;
    welcomeCard.addEventListener('touchstart', (e) => {
      if (currentState !== 'idle' || e.target.closest('button') || e.target.closest('#searching-overlay') || e.target.closest('#controls-bar')) {
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    welcomeCard.addEventListener('touchend', (e) => {
      if (currentState !== 'idle' || e.target.closest('button') || e.target.closest('#searching-overlay') || e.target.closest('#controls-bar')) {
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
        console.log('[Swipe] Swipe detected on home camera -> starting chat!');
        startChat();
      }
    }, { passive: true });
  }

  // Swipe on Live Video Call Screen to Match Next Partner
  const chatVideosContainer = $('#videos-container');
  if (chatVideosContainer) {
    let callStartX = 0, callStartY = 0;
    chatVideosContainer.addEventListener('touchstart', (e) => {
      callStartX = e.touches[0].clientX;
      callStartY = e.touches[0].clientY;
    }, { passive: true });

    chatVideosContainer.addEventListener('touchend', (e) => {
      const callEndX = e.changedTouches[0].clientX;
      const callEndY = e.changedTouches[0].clientY;
      const deltaX = callEndX - callStartX;
      const deltaY = callEndY - callStartY;

      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
        console.log('[Swipe] Swiped on video call -> next partner!');
        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
        }
      }
    }, { passive: true });
  }
}

function setupWelcomeUI() {
  // Start camera preview immediately
  initWelcomeCamera();
  setupSwipeGestures();

  // Camera floating toolbar buttons
  const btnFilters = $('#btn-cam-filters');
  if (btnFilters) {
    btnFilters.addEventListener('click', (e) => {
      e.stopPropagation();
      currentFilterIndex = (currentFilterIndex + 1) % VIDEO_FILTERS.length;
      const preview = $('#welcome-camera-preview');
      if (preview) preview.style.filter = VIDEO_FILTERS[currentFilterIndex];
      showGemToast(`✨ تم تفعيل الفلتر ${currentFilterIndex + 1}`);
    });
  }

  const btnCamToggle = $('#btn-cam-toggle');
  if (btnCamToggle) {
    btnCamToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      isCameraMuted = !isCameraMuted;
      if (welcomeCamStream) {
        welcomeCamStream.getVideoTracks().forEach(t => t.enabled = !isCameraMuted);
      }
      const icon = $('#cam-toggle-icon');
      if (icon) icon.textContent = isCameraMuted ? '🚫' : '📹';
    });
  }

  const btnCamFlip = $('#btn-cam-flip');
  if (btnCamFlip) {
    btnCamFlip.addEventListener('click', (e) => {
      e.stopPropagation();
      currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
      initWelcomeCamera();
    });
  }

  // Start chat on Camera Card Tap (ONLY when idle)
  const welcomeCamCard = $('#welcome-camera-card');
  if (welcomeCamCard) {
    welcomeCamCard.addEventListener('click', (e) => {
      if (currentState !== 'idle') return;
      if (e.target.closest('button') || e.target.closest('#searching-overlay') || e.target.closest('#controls-bar') || e.target.closest('#welcome-floating-toolbar') || e.target.closest('#camera-match-trigger')) {
        return;
      }
      startChat();
    });
  }

  // Cancel Search Button (Direct binding on startup with stopPropagation)
  const cancelSearchBtn = $('#cancel-search-btn');
  if (cancelSearchBtn) {
    const handleCancel = (e) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      console.log('[App] Cancel search clicked!');
      endCall();
    };
    cancelSearchBtn.addEventListener('click', handleCancel);
    cancelSearchBtn.addEventListener('touchend', handleCancel);
  }

  // Royal Country Selector Modal Logic
  const openCountryBtn = $('#btn-open-country-modal');
  const royalCountryModal = $('#royal-country-modal');
  const closeCountryBtn = $('#close-royal-country-btn');
  const countrySearchInput = $('#royal-country-search');

  if (openCountryBtn) {
    openCountryBtn.onclick = (e) => {
      e.stopPropagation();
      openRoyalCountryModal();
    };
  }
  if (closeCountryBtn && royalCountryModal) {
    closeCountryBtn.onclick = () => {
      royalCountryModal.classList.add('hidden');
    };
  }
  if (countrySearchInput) {
    countrySearchInput.addEventListener('input', (e) => {
      renderRoyalCountryGrid(e.target.value);
    });
  }

  // Royal Country Quick Cards (All / Home)
  const optAll = $('#royal-opt-all');
  const optHome = $('#royal-opt-home');
  if (optAll) {
    optAll.onclick = () => {
      selectedTargetCountryMode = 'ALL';
      selectedTargetCountryCode = 'ALL';
      selectedTargetCountryName = 'كل العالم';
      const pillText = $('#pill-selected-country-text');
      if (pillText) pillText.textContent = '🌍 كل العالم';

      optAll.classList.add('active');
      optHome?.classList.remove('active');
      $$('.royal-country-item').forEach(el => el.classList.remove('active'));
      royalCountryModal?.classList.add('hidden');
      validateForm();
    };
  }
  if (optHome) {
    optHome.onclick = () => {
      selectedTargetCountryMode = 'HOME';
      selectedTargetCountryCode = selectedCountry || 'JO';
      selectedTargetCountryName = selectedCountryName || 'الأردن';
      const pillText = $('#pill-selected-country-text');
      if (pillText) pillText.textContent = `🏠 ${selectedTargetCountryName}`;

      optHome.classList.add('active');
      optAll?.classList.remove('active');
      $$('.royal-country-item').forEach(el => el.classList.remove('active'));
      royalCountryModal?.classList.add('hidden');
      validateForm();
    };
  }

  // Royal Gender Selector Modal Logic
  const openGenderBtn = $('#btn-open-gender-modal');
  const royalGenderModal = $('#royal-gender-modal');
  const closeGenderBtn = $('#close-royal-gender-btn');

  if (openGenderBtn) {
    openGenderBtn.onclick = (e) => {
      e.stopPropagation();
      openRoyalGenderModal();
    };
  }
  if (closeGenderBtn && royalGenderModal) {
    closeGenderBtn.onclick = () => {
      royalGenderModal.classList.add('hidden');
    };
  }

  const genderCards = $$('.royal-gender-card');
  genderCards.forEach(card => {
    card.onclick = () => {
      genderCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedGenderFilter = card.dataset.genderChoice || 'any';

      const pillGenderText = $('#pill-selected-gender-text');
      if (pillGenderText) {
        if (selectedGenderFilter === 'female') pillGenderText.textContent = '👩 إناث (10💎)';
        else if (selectedGenderFilter === 'male') pillGenderText.textContent = '👨 ذكور (10💎)';
        else pillGenderText.textContent = 'الكل ⚧ (مجاني)';
      }
      royalGenderModal?.classList.add('hidden');
      validateForm();
    };
  });

  // Bottom Nav settings tab
  const tabSettings = $('#tab-open-settings');
  if (tabSettings) {
    tabSettings.onclick = () => {
      const modal = $('#settings-modal');
      if (modal) modal.classList.remove('hidden');
    };
  }

  if (startBtn) {
    startBtn.addEventListener('click', startChat);
  }

  if (closeRechargeBtn) {
    closeRechargeBtn.addEventListener('click', () => {
      rechargeModal.classList.add('hidden');
      cleanupPeerConnection();
      if (socket) socket.emit('stop_search');
      if (chatScreen) chatScreen.classList.remove('active');
      if (welcomeScreen) welcomeScreen.classList.add('active');
      setState('idle');
    });
  }

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

  retryPermissionBtn.addEventListener('click', async () => {
    permissionModal.classList.add('hidden');
    await startChat();
  });

  if (closePermissionBtn) {
    closePermissionBtn.addEventListener('click', () => {
      permissionModal.classList.add('hidden');
    });
  }

  $$('.give-badge-btn').forEach(btn => {
    btn.onclick = () => {
      const badgeType = btn.dataset.badge;
      if (socket && socket.connected) {
        socket.emit('give_badge', { badgeType });
        const names = { awesome: '⭐ رائع', handsome: '✨ وسيم', elegant: '🎩 أنيق' };
        showGemToast(`✨ تم إرسال وسام "${names[badgeType] || badgeType}" للشريك!`);
      }
    };
  });
}

function validateForm() {
  const isValid = !!(selectedGender && (selectedCountry || selectedCountry === 'ALL'));
  if (startBtn) startBtn.disabled = !isValid;
}

// =============================================
// Socket.IO Connection - Fast matching & reconnect
// =============================================
function connectSocket() {
  socket = io(SERVER_URL, {
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
    
    // Always register identity with server on connect/reconnect
    socket.emit('register', {
      gender: selectedGender || userProfile.gender || 'male',
      myCountry: myHomeCountryCode || 'JO',
      targetCountry: selectedTargetCountryCode || selectedCountry || 'ALL',
      country: selectedCountry || 'ALL',
      countryName: selectedCountryName || 'كل العالم',
      genderFilter: selectedGenderFilter || 'any',
      username: userProfile.username || 'مستخدم',
      phone: userProfile.phone || ''
    });
    
    if (currentState === 'searching') {
      socket.emit('find_partner', {
        gender: selectedGender || userProfile.gender || 'male',
        myCountry: myHomeCountryCode || 'JO',
        targetCountry: selectedTargetCountryCode || selectedCountry || 'ALL',
        country: selectedCountry || 'ALL',
        countryName: selectedCountryName || 'كل العالم',
        genderFilter: selectedGenderFilter || 'any',
        username: userProfile.username || 'مستخدم'
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('online_count', (count) => {
    updateOnlineDisplay(count);
  });

  socket.on('waiting', () => {
    console.log('[Socket] Waiting for match...');
    setState('searching');
  });

  socket.on('global_notification', (data) => {
    showGemToast(`📢 ${data.title}: ${data.message}`);
    sendLocalPushNotification(data.title || 'Loky Chat - لوكي شات 🚀', data.message);
  });

  socket.on('admin_new_report', (data) => {
    if (userProfile && userProfile.isAdmin) {
      showGemToast(`🚨 بلاغ جديد وارد ضد: ${data.reportedUsername} (${data.reason})`);
      sendLocalPushNotification('🚨 بلاغ جديد وارد!', `ضد: ${data.reportedUsername} - السبب: ${data.reason}`);
      const refreshBtn = $('#refresh-admin-reports-btn');
      if (refreshBtn) refreshBtn.click();
    }
  });

  socket.on('you_are_banned', (data) => {
    console.warn('[Banned by Admin]', data);
    trigger24HourBan(data.reason || 'مخالفة شروط الاستخدام', data.expiresAt);
  });

  socket.on('private_message', (data) => {
    if (data && data.senderSocketId) {
      showGemToast(`💬 رسالة جديدة من ${data.senderUsername || 'صديق'}`);
      appendPrivateMessage(data.senderSocketId, 'other', data.text);
      sendLocalPushNotification(`💬 رسالة من ${data.senderUsername || 'صديق'}`, data.text);
    }
  });

  socket.on('receive_badge', (data) => {
    if (!userProfile.badges) userProfile.badges = { awesome: 0, handsome: 0, elegant: 0 };
    userProfile.badges[data.badgeType] = (userProfile.badges[data.badgeType] || 0) + 1;
    saveUserProfile();

    const names = { awesome: '⭐ رائع', handsome: '✨ وسيم', elegant: '🎩 أنيق' };
    showGemToast(`🎉 حصلت على وسام "${names[data.badgeType] || data.badgeType}" من ${data.fromUsername || 'شريك'}!`);
  });

  socket.on('referral_reward_received', (data) => {
    if (!userProfile.isAdmin) {
      userProfile.gems = (userProfile.gems || 0) + (data.bonusGems || 50);
      saveUserProfile();
      updateProfileUI();
    }
    showGemToast(`🎁 مبروك! انضم ${data.friendUsername || 'صديقك'} عبر رابطك وفعل الإشعارات! تم إضافة +50 مجوهرة لرصيدك 💎`);
  });

function sendLocalPushNotification(title, body) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body: body, icon: 'icons/icon-192.png' });
    }
  } catch (e) {
    console.log('[Notification] Local notification suppressed:', e);
  }
}

  // Matched event -> Deduct gems if filtered and transition immediately to video call
  socket.on('matched', async (data) => {
    try {
      console.log('[Socket] Matched with partner:', data);
      isInitiator = data.isInitiator;
      currentPartner = {
        id: data.partnerId,
        socketId: data.partnerId,
        username: data.partnerUsername || 'مستخدم',
        gender: data.partnerGender,
        country: data.partnerCountry,
        countryName: data.partnerCountryName,
        badges: data.partnerBadges || { awesome: 0, handsome: 0, elegant: 0 }
      };

      sendLocalPushNotification('Loky Chat - مطابقة فيديو جديدة 🎥', `تم ربطك مع ${data.partnerUsername || 'شريك'} الآن!`);

      let totalCost = 0;
      if (selectedGenderFilter !== 'any') totalCost += FILTER_COST;
      if (selectedTargetCountryMode === 'CUSTOM' && selectedTargetCountryCode !== 'ALL' && selectedTargetCountryCode !== selectedCountry) {
        totalCost += FILTER_COST;
      }

      if (totalCost > 0) {
        if (userProfile.gems < totalCost) {
          console.warn('[Gems] Insufficient gems for matched chat');
          cleanupPeerConnection();
          socket.emit('stop_search');
          if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
          setState('idle');
          return;
        }

        userProfile.gems -= totalCost;
        saveUserProfile();
        updateProfileUI();
        showGemToast(`💎 تم استهلاك ${totalCost} جوهرة لتطبيق فلتر البحث`);
      }

      // 1. Immediately switch UI state to connected
      setState('connected');
      showPartnerInfo(data);
      startNextButtonCooldown();

      // 2. Establish WebRTC Peer Connection
      await createPeerConnection();

      // 3. Initiator creates offer
      if (isInitiator) {
        await createAndSendOffer();
      }
    } catch (err) {
      console.error('[Socket] Error in matched handler:', err);
      setState('connected');
    }
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
        await flushIceCandidateQueue();
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
      }
    }
  });

  socket.on('ice_candidate', async (data) => {
    if (data && data.candidate) {
      if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('[ICE] Error adding candidate, queuing:', err);
          iceCandidateQueue.push(data.candidate);
        }
      } else {
        iceCandidateQueue.push(data.candidate);
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
// Media Stream Permission & Ultra HD Setup
// =============================================
async function requestMediaPermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showPermissionError(
      'متصفحك لا يدعم الكاميرا',
      'يرجى استخدام متصفح حديث أو منح الإذن للكاميرا والميكروفون.',
      false
    );
    return false;
  }

  // If localStream already has active tracks, return true immediately (0 delay, 0 restart)
  if (localStream && localStream.active && localStream.getVideoTracks().length > 0 && localStream.getAudioTracks().length > 0) {
    return true;
  }

  const isBack = (currentCameraFacing === 'environment');

  try {
    // If we have welcomeCamStream already active, just attach microphone without killing video (zero lag!)
    if (welcomeCamStream && welcomeCamStream.active && welcomeCamStream.getVideoTracks().length > 0) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        const videoTrack = welcomeCamStream.getVideoTracks()[0];
        const audioTrack = audioStream.getAudioTracks()[0];
        localStream = new MediaStream([videoTrack, audioTrack]);
        if (localVideo) {
          localVideo.srcObject = localStream;
          localVideo.style.transform = isBack ? 'none' : 'scaleX(-1)';
          localVideo.play().catch(() => {});
        }
        return true;
      } catch (eAudio) {
        console.warn('Audio only acquire failed, will request full stream:', eAudio);
      }
    }

    // Full acquire with Balanced HD 30fps (Cool, battery-efficient, silky smooth)
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: isBack ? { ideal: 'environment' } : { ideal: 'user' },
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    if (localVideo) {
      localVideo.srcObject = localStream;
      localVideo.style.transform = isBack ? 'none' : 'scaleX(-1)';
      await localVideo.play().catch(() => {});
    }
    const welcomePreview = $('#welcome-camera-preview');
    if (welcomePreview) {
      welcomePreview.srcObject = localStream;
      welcomePreview.style.transform = isBack ? 'none' : 'scaleX(-1)';
      welcomePreview.classList.add('video-ready');
      welcomePreview.play().catch(() => {});
    }
    welcomeCamStream = localStream;
    return true;

  } catch (err) {
    console.warn('[Media] 720p getUserMedia failed, trying fallback basic:', err);
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isBack ? 'environment' : 'user' },
        audio: true
      });
      if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.style.transform = isBack ? 'none' : 'scaleX(-1)';
        await localVideo.play().catch(() => {});
      }
      const welcomePreview = $('#welcome-camera-preview');
      if (welcomePreview) {
        welcomePreview.srcObject = localStream;
        welcomePreview.style.transform = isBack ? 'none' : 'scaleX(-1)';
        welcomePreview.classList.add('video-ready');
        welcomePreview.play().catch(() => {});
      }
      welcomeCamStream = localStream;
      return true;
    } catch (err2) {
      console.error('[Media] All media requests failed:', err2);
      showPermissionError('🚫 إذن الكاميرا والميكروفون', 'يرجى السماح بالوصول للكاميرا والميكروفون للبدء في الدردشة.', true);
      return false;
    }
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
// Start Chat (Unified Single-Screen Matching)
// =============================================
async function startChat() {
  if (checkBanStatus()) return;
  if (currentState === 'searching' || currentState === 'connected') return;

  console.log('[App] startChat() triggered on royal single-screen interface!');
  showGemToast('🔍 جاري تشغيل الرادار والبحث عن شريك...');

  userProfile.hasCompletedSetup = true;
  saveUserProfile();
  updateSetupSectionVisibility();

  let totalCost = 0;
  if (selectedGenderFilter !== 'any') totalCost += FILTER_COST;
  if (selectedTargetCountryMode === 'CUSTOM' && selectedTargetCountryCode !== 'ALL' && selectedTargetCountryCode !== selectedCountry) {
    totalCost += FILTER_COST;
  }

  if (totalCost > 0 && userProfile.gems < totalCost) {
    if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
    return;
  }

  const hasPermission = await requestMediaPermission();
  if (!hasPermission) {
    console.warn('[App] Media permission was not acquired');
    return;
  }

  if (!controlsSetup) {
    setupControls();
    controlsSetup = true;
  }

  startNudityScanner();

  const matchPayload = {
    gender: selectedGender || userProfile.gender || 'male',
    myCountry: myHomeCountryCode || 'JO',
    targetCountry: selectedTargetCountryCode || selectedCountry || 'ALL',
    country: selectedCountry || 'ALL',
    countryName: selectedCountryName || 'كل العالم',
    genderFilter: selectedGenderFilter || 'any',
    username: userProfile.username || 'مستخدم',
    phone: userProfile.phone || ''
  };

  emitWhenReady('register', matchPayload);
  emitWhenReady('find_partner', matchPayload);
  setState('searching');
}
window.startChat = startChat;

// =============================================
// Control Buttons
// =============================================
function setupControls() {
  if (controlsSetup) return;
  controlsSetup = true;

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      cleanupPeerConnection();
      if (socket) socket.emit('next');
      setState('searching');
    });
  }

  if (micBtn) micBtn.addEventListener('click', toggleMic);
  if (cameraBtn) cameraBtn.addEventListener('click', toggleCamera);
  if (endBtn) endBtn.addEventListener('click', endCall);

  const flipCamBtn = $('#flip-cam-btn');
  if (flipCamBtn) {
    flipCamBtn.addEventListener('click', switchCamera);
  }

  if (findNewBtn) {
    findNewBtn.addEventListener('click', () => {
      if (partnerLeftOverlay) partnerLeftOverlay.classList.add('hidden');
      if (socket) socket.emit('find_partner');
      setState('searching');
    });
  }

  const cancelSearchBtn = $('#cancel-search-btn');
  if (cancelSearchBtn) {
    cancelSearchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      endCall();
    });
    cancelSearchBtn.addEventListener('touchend', (e) => {
      e.stopPropagation();
      endCall();
    });
  }

  const chatBackHomeBtn = $('#chat-back-home-btn');
  if (chatBackHomeBtn) {
    chatBackHomeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      endCall();
    });
    chatBackHomeBtn.addEventListener('touchend', (e) => {
      e.stopPropagation();
      endCall();
    });
  }
}

function toggleMic() {
  if (!localStream) return;
  isMicOn = !isMicOn;

  localStream.getAudioTracks().forEach(track => {
    track.enabled = isMicOn;
  });

  if (peerConnection) {
    peerConnection.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === 'audio') {
        sender.track.enabled = isMicOn;
      }
    });
  }

  if (micBtn) {
    micBtn.classList.toggle('muted', !isMicOn);
    const micOn = micBtn.querySelector('.mic-on');
    const micOff = micBtn.querySelector('.mic-off');
    if (micOn) micOn.classList.toggle('hidden', !isMicOn);
    if (micOff) micOff.classList.toggle('hidden', isMicOn);
  }
}

function toggleCamera() {
  if (!localStream) return;
  isCameraOn = !isCameraOn;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = isCameraOn;
  });

  if (cameraBtn) {
    cameraBtn.classList.toggle('muted', !isCameraOn);
    const camOn = cameraBtn.querySelector('.cam-on');
    const camOff = cameraBtn.querySelector('.cam-off');
    if (camOn) camOn.classList.toggle('hidden', !isCameraOn);
    if (camOff) camOff.classList.toggle('hidden', isCameraOn);
  }
}

async function switchCamera() {
  if (!localStream) return;
  currentCameraFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
  const isBack = (currentCameraFacing === 'environment');
  
  try {
    localStream.getVideoTracks().forEach(t => {
      try { t.stop(); } catch(e) {}
    });

    let newVideoStream = null;
    try {
      newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isBack ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: false
      });
    } catch(e1) {
      try {
        newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isBack ? 'environment' : 'user' },
          audio: false
        });
      } catch (e2) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const targetDev = isBack 
          ? (videoDevices.find(d => /back|rear|خلف|environment/i.test(d.label)) || (videoDevices.length > 1 ? videoDevices[videoDevices.length - 1] : videoDevices[0]))
          : (videoDevices.find(d => /front|user|أمام/i.test(d.label)) || videoDevices[0]);
        
        if (targetDev && targetDev.deviceId) {
          newVideoStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: targetDev.deviceId } },
            audio: false
          });
        } else {
          newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }
    }

    const newVideoTrack = newVideoStream.getVideoTracks()[0];
    if (newVideoTrack) {
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack);
      }
      localStream.addTrack(newVideoTrack);

      if (peerConnection) {
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      }

      if (localVideo) {
        localVideo.srcObject = localStream;
        localVideo.style.transform = isBack ? 'none' : 'scaleX(-1)';
      }
      const welcomePreview = $('#welcome-camera-preview');
      if (welcomePreview) {
        welcomePreview.srcObject = localStream;
        welcomePreview.style.transform = isBack ? 'none' : 'scaleX(-1)';
      }
      showGemToast(isBack ? '📷 تم التبديل للكاميرا الخلفية' : '🤳 تم التبديل للكاميرا الأمامية');
    }
  } catch (err) {
    console.error('[App] Failed to switch camera:', err);
    showGemToast('❌ تعذر تبديل الكاميرا');
  }
}
window.switchCamera = switchCamera;

function endCall() {
  console.log('[App] Ending call / returning to home screen...');
  stopNudityScanner();
  cleanupPeerConnection();

  if (socket && socket.connected) {
    socket.emit('stop_search');
  }

  setState('idle');

  // Reset draggable video PiP if moved
  const wrapper = $('#local-video-wrapper');
  if (wrapper) {
    wrapper.style.position = '';
    wrapper.style.left = '';
    wrapper.style.top = '';
    wrapper.style.right = '';
  }

  validateForm();
  updateProfileUI();

  if (!welcomeCamStream || !welcomeCamStream.active) {
    initWelcomeCamera();
  }
}
window.endCall = endCall;

// =============================================
// WebRTC Peer Connection (HD & Buffered Signaling)
// =============================================
let iceCandidateQueue = [];

async function flushIceCandidateQueue() {
  if (!peerConnection || !peerConnection.remoteDescription || !peerConnection.remoteDescription.type) {
    return;
  }
  while (iceCandidateQueue.length > 0) {
    const cand = iceCandidateQueue.shift();
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(cand));
    } catch (e) {
      console.warn('[ICE] Flush candidate warn:', e);
    }
  }
}

function setVideoBitrate(sdp, bitrateKbps = 1200) {
  if (!sdp) return sdp;
  return sdp.replace(/a=mid:video\r\n/g, `a=mid:video\r\nb=AS:${bitrateKbps}\r\n`);
}

async function createPeerConnection() {
  cleanupPeerConnection();

  try {
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log('[WebRTC] ontrack received partner stream!');
      if (event.streams && event.streams[0]) {
        const remoteVid = $('#remote-video');
        if (remoteVid) {
          remoteVid.srcObject = event.streams[0];
          remoteVid.classList.remove('hidden');
          remoteVid.play().catch(e => console.warn('Remote video play catch:', e));
        }
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', { candidate: event.candidate });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('[WebRTC] P2P Video Call Connected Successfully!');
      }
    };

  } catch (err) {
    console.error('[WebRTC] Error creating connection:', err);
  }
}

async function createAndSendOffer() {
  try {
    const offer = await peerConnection.createOffer();
    offer.sdp = setVideoBitrate(offer.sdp, 1200);
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
    await flushIceCandidateQueue();
    const answer = await peerConnection.createAnswer();
    answer.sdp = setVideoBitrate(answer.sdp, 1200);
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer: answer });
    console.log('[WebRTC] Answer sent');
  } catch (err) {
    console.error('[WebRTC] Error handling offer:', err);
  }
}

function cleanupPeerConnection() {
  iceCandidateQueue = [];
  if (peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onicecandidate = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.close();
    peerConnection = null;
  }
  const remoteVid = $('#remote-video');
  if (remoteVid) {
    remoteVid.srcObject = null;
    remoteVid.classList.add('hidden');
  }
  stopCallTimer();
}

// =============================================
// UI State Management (Unified Single-Screen)
// =============================================
function setState(state) {
  currentState = state;
  const welcomeCamCard = $('#welcome-camera-card');
  const searchingOverlay = $('#searching-overlay');
  const partnerLeftOverlay = $('#partner-left-overlay');
  const partnerInfo = $('#partner-info');
  const callTimer = $('#call-timer');
  const callBadgesBar = $('#call-badges-bar');
  const controlsBar = $('#controls-bar');
  const localVideoWrapper = $('#local-video-wrapper');
  const remoteVid = $('#remote-video');
  const welcomePreview = $('#welcome-camera-preview');
  const idleTrigger = $('#camera-match-trigger');
  const floatingToolbar = $('#welcome-floating-toolbar');
  const filterRow = $('.modern-filter-row');
  const bottomNav = $('.modern-bottom-nav');

  switch (state) {
    case 'idle':
      if (welcomeCamCard) {
        welcomeCamCard.classList.remove('in-call', 'is-searching');
      }
      if (searchingOverlay) searchingOverlay.classList.add('hidden');
      if (partnerLeftOverlay) partnerLeftOverlay.classList.add('hidden');
      if (partnerInfo) partnerInfo.classList.add('hidden');
      if (callTimer) callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      if (controlsBar) controlsBar.classList.add('hidden');
      if (localVideoWrapper) localVideoWrapper.classList.add('hidden');
      if (remoteVid) {
        remoteVid.classList.add('hidden');
        remoteVid.srcObject = null;
      }
      if (welcomePreview) welcomePreview.style.display = 'block';
      if (idleTrigger) idleTrigger.classList.remove('hidden');
      if (floatingToolbar) floatingToolbar.classList.remove('hidden');
      if (filterRow) filterRow.classList.remove('hidden');
      if (bottomNav) bottomNav.classList.remove('hidden');
      stopCallTimer();
      break;

    case 'searching':
      if (welcomeCamCard) {
        welcomeCamCard.classList.add('is-searching');
        welcomeCamCard.classList.remove('in-call');
      }
      if (searchingOverlay) searchingOverlay.classList.remove('hidden');
      if (partnerLeftOverlay) partnerLeftOverlay.classList.add('hidden');
      if (partnerInfo) partnerInfo.classList.add('hidden');
      if (callTimer) callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      if (controlsBar) controlsBar.classList.remove('hidden');
      if (localVideoWrapper) localVideoWrapper.classList.add('hidden');
      if (remoteVid) {
        remoteVid.classList.add('hidden');
        remoteVid.srcObject = null;
      }
      if (welcomePreview) welcomePreview.style.display = 'block';
      if (idleTrigger) idleTrigger.classList.add('hidden');
      if (floatingToolbar) floatingToolbar.classList.add('hidden');
      if (filterRow) filterRow.classList.add('hidden');
      if (bottomNav) bottomNav.classList.add('hidden');
      stopCallTimer();
      break;

    case 'connected':
      if (welcomeCamCard) {
        welcomeCamCard.classList.add('in-call');
        welcomeCamCard.classList.remove('is-searching');
      }
      if (searchingOverlay) searchingOverlay.classList.add('hidden');
      if (partnerLeftOverlay) partnerLeftOverlay.classList.add('hidden');
      if (partnerInfo) partnerInfo.classList.remove('hidden');
      if (callTimer) callTimer.classList.remove('hidden');
      if (callBadgesBar) callBadgesBar.classList.remove('hidden');
      if (controlsBar) controlsBar.classList.remove('hidden');
      if (localVideoWrapper) localVideoWrapper.classList.remove('hidden');
      if (remoteVid) remoteVid.classList.remove('hidden');
      if (welcomePreview) welcomePreview.style.display = 'none';
      if (idleTrigger) idleTrigger.classList.add('hidden');
      if (floatingToolbar) floatingToolbar.classList.add('hidden');
      if (filterRow) filterRow.classList.add('hidden');
      if (bottomNav) bottomNav.classList.add('hidden');
      startCallTimer();
      break;

    case 'partner_left':
      if (welcomeCamCard) {
        welcomeCamCard.classList.add('is-searching');
        welcomeCamCard.classList.remove('in-call');
      }
      if (searchingOverlay) searchingOverlay.classList.remove('hidden');
      if (partnerLeftOverlay) partnerLeftOverlay.classList.remove('hidden');
      setTimeout(() => {
        if (partnerLeftOverlay) partnerLeftOverlay.classList.add('hidden');
      }, 2500);
      if (partnerInfo) partnerInfo.classList.add('hidden');
      if (callTimer) callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      if (controlsBar) controlsBar.classList.remove('hidden');
      if (localVideoWrapper) localVideoWrapper.classList.add('hidden');
      if (remoteVid) {
        remoteVid.classList.add('hidden');
        remoteVid.srcObject = null;
      }
      if (welcomePreview) welcomePreview.style.display = 'block';
      if (idleTrigger) idleTrigger.classList.add('hidden');
      if (floatingToolbar) floatingToolbar.classList.add('hidden');
      if (filterRow) filterRow.classList.add('hidden');
      if (bottomNav) bottomNav.classList.add('hidden');
      stopCallTimer();
      break;
  }
}

function showPartnerInfo(data) {
  if (partnerFlag) partnerFlag.textContent = countryCodeToFlag(data.partnerCountry);
  const nameEl = $('#partner-username');
  if (nameEl) nameEl.textContent = data.partnerUsername || 'مستخدم';

  const isMale = data.partnerGender === 'male';
  const badgeEl = $('#partner-gender-badge');
  const iconEl = $('#partner-gender-icon');
  const textEl = $('#partner-gender-text');

  if (iconEl) iconEl.textContent = isMale ? '👨' : '👩';
  if (textEl) textEl.textContent = isMale ? 'ذكر' : 'أنثى';
  if (badgeEl) {
    badgeEl.className = `partner-gender-tag ${isMale ? 'gender-male' : 'gender-female'}`;
  }

  const badgesEl = $('#partner-badges-display');
  if (badgesEl && data.partnerBadges) {
    const b = data.partnerBadges;
    let text = '';
    if (b.awesome > 0) text += `⭐${b.awesome} `;
    if (b.handsome > 0) text += `✨${b.handsome} `;
    if (b.elegant > 0) text += `🎩${b.elegant}`;
    badgesEl.textContent = text;
  }
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
