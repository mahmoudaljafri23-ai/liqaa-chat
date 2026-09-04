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
let banCountdownInterval = null;
let nudityScanInterval = null;
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

let myHomeCountryCode = 'JO';

async function autoDetectCountry() {
  try {
    const result = await detectCountry();

    if (result && result.code) {
      myHomeCountryCode = result.code;
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

function trigger24HourBan(reason) {
  if (userProfile.isAdmin || (userProfile.phone && userProfile.phone.includes('0790181802'))) {
    console.log('[BAN BYPASSED] Admin user is immune from bans');
    return;
  }

  console.warn('[BAN TRIGGERED]', reason);
  userProfile.bannedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours
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

function setupInviteModal() {
  const openInviteBtn = $('#open-invite-modal-btn');
  const inviteModal = $('#invite-modal');
  const closeInviteBtn = $('#close-invite-modal-btn');
  const refLinkInput = $('#referral-link-input');
  const copyBtn = $('#copy-ref-link-btn');
  const shareWpBtn = $('#share-whatsapp-btn');

  function getMyReferralLink() {
    const code = userProfile.username || userProfile.phone || 'friend';
    return `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
  }

  if (openInviteBtn) {
    openInviteBtn.onclick = () => {
      const link = getMyReferralLink();
      if (refLinkInput) refLinkInput.value = link;
      if (inviteModal) inviteModal.classList.remove('hidden');
    };
  }

  if (closeInviteBtn) {
    closeInviteBtn.onclick = () => {
      if (inviteModal) inviteModal.classList.add('hidden');
    };
  }

  if (copyBtn) {
    copyBtn.onclick = () => {
      const link = getMyReferralLink();
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
      const link = getMyReferralLink();
      const text = `⚡ انضم معي الآن على تطبيق "Loky Chat - لوكي شات" لأفضل دردشة فيديو ومحادثات مباشرة! 🎥✨\nسجل وفعل الإشعارات من الرابط التالي:\n${link}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    };
  }
}

function init() {
  checkReferralQuery();
  loadUserProfile();
  updateOnlineDisplay();
  initPushNotifications();
  setupAdminPinModal();
  setupWelcomeUI();
  setupSettingsUI();
  setupFriendsSystem();
  setupInviteModal();
  setupGemsStore();
  connectSocket();
  autoDetectCountry();
}

// =============================================
// Gems Store & Payment System
// =============================================
let currentSelectedPackage = { gems: 3000, price: 4.99, paypalUrl: '' };

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

  const packageCards = $$('.gem-package-card');
  packageCards.forEach(card => {
    const handlePackageClick = async (e) => {
      e.stopPropagation();
      const gems = card.dataset.gems || '1000';
      const price = card.dataset.price || '2.49';

      currentSelectedPackage = { gems, price, paypalUrl: '' };

      if (checkoutTitle) {
        checkoutTitle.textContent = `${Number(gems).toLocaleString()} جوهرة (${price}$)`;
      }

      if (rechargeModal) rechargeModal.classList.add('hidden');
      if (checkoutModal) checkoutModal.classList.remove('hidden');

      try {
        const res = await fetch('/api/create-paypal-payment', {
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

  if (payNowBtn) {
    payNowBtn.onclick = () => {
      const price = currentSelectedPackage.price || '4.99';
      const gems = currentSelectedPackage.gems || '3000';
      
      const targetUrl = currentSelectedPackage.paypalUrl || 
        `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent('mahmoud.aljafri23@gmail.com')}&item_name=${encodeURIComponent(`Loky Chat - ${gems} Gems`)}&amount=${encodeURIComponent(price)}&currency_code=USD`;

      window.open(targetUrl, '_blank');
      showGemToast('💳 جاري فتح صفحة الدفع الآمنة...');
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
        gender: currentPartner.gender,
        country: currentPartner.country,
        countryName: currentPartner.countryName,
        addedAt: Date.now()
      };

      friendsList.unshift(newFriend);
      saveFriendsList();
      renderFriendsAndOnlineUsers();
      showGemToast(`➕ تم إضافة ${friendName} إلى قائمة أصدقائك!`);
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
    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:12px; border:1px solid var(--border);';
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:24px;">${friend.gender === 'female' ? '👩' : '👨'}</span>
        <div style="text-align:right;">
          <div style="font-weight:bold; color:#fff; font-size:14px;">${friend.name} ${countryCodeToFlag(friend.country)}</div>
          <div style="font-size:11px; color:#aaa;">${friend.countryName || 'متصل'}</div>
        </div>
      </div>
      <button class="action-button" style="padding:6px 14px; font-size:12px; border-radius:14px; margin:0;" onclick="openPrivateChat('${friend.id}')">
        💬 دردشة خاصة
      </button>
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
  $('#private-chat-friend-name').textContent = `${friend.name} ${countryCodeToFlag(friend.country)}`;

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
    container.innerHTML = '<div style="text-align:center; color:#666; font-size:12px; margin-top:80px;">بداية المحادثة الخاصة...</div>';
    return;
  }

  msgs.forEach(msg => {
    const bubble = document.createElement('div');
    const isMe = msg.sender === 'me';
    bubble.style.cssText = `max-width: 80%; padding: 8px 14px; border-radius: 14px; font-size: 13px; font-weight: 500; align-self: ${isMe ? 'flex-end' : 'flex-start'}; background: ${isMe ? 'var(--gradient)' : 'rgba(255,255,255,0.1)'}; color: #fff; margin: 2px 0;`;
    bubble.textContent = msg.text;
    container.appendChild(bubble);
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
      }

      if (settingsModal) settingsModal.classList.remove('hidden');
    });
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

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.add('hidden');
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const newName = settingsUsername ? settingsUsername.value.trim() : '';
      const newPhone = settingsPhone ? settingsPhone.value.trim() : '';
      const newPin = settingsAdminPin ? settingsAdminPin.value.trim() : '';
      const selectedCard = $('.gender-card[data-settings-gender].selected');
      const newGender = selectedCard ? selectedCard.dataset.settingsGender : userProfile.gender;

      if (newName) userProfile.username = newName;
      userProfile.phone = newPhone;
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
// Welcome Screen UI
// =============================================
function setupWelcomeUI() {
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

  genderCards.forEach(card => {
    card.addEventListener('click', () => {
      genderCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedGender = card.dataset.gender;
      userProfile.gender = selectedGender;
      saveUserProfile();
      validateForm();
    });
  });

  filterCards.forEach(card => {
    card.addEventListener('click', () => {
      filterCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedGenderFilter = card.dataset.filter;
    });
  });

  countrySelect.addEventListener('change', () => {
    selectedCountry = countrySelect.value || 'ALL';
    const selectedOption = countrySelect.options[countrySelect.selectedIndex];
    selectedCountryName = selectedOption.dataset.name || selectedOption.text;
    validateForm();
  });

  if (changeCountryBtn) {
    changeCountryBtn.addEventListener('click', () => {
      countryDetected.classList.add('hidden');
      countryManual.classList.remove('hidden');
      selectedCountry = 'ALL';
      selectedCountryName = 'كل العالم';
      validateForm();
    });
  }

  startBtn.addEventListener('click', startChat);

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
        myCountry: myHomeCountryCode || 'JO',
        targetCountry: selectedCountry || 'ALL',
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
    sendLocalPushNotification('🎁 هدية دعوة صديق!', `انضم ${data.friendUsername || 'صديقك'} وتم إضافة +50 مجوهرة لرصيدك!`);
  });

  // Matched event -> Deduct 10 gems per connected match if gender filter active
  socket.on('matched', async (data) => {
    console.log('[Socket] Matched with:', data.partnerId);
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

    if (selectedGenderFilter !== 'any') {
      if (userProfile.gems < FILTER_COST) {
        console.warn('[Gems] Insufficient gems for matched chat');
        cleanupPeerConnection();
        socket.emit('stop_search');
        if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
        setState('idle');
        return;
      }

      userProfile.gems -= FILTER_COST;
      saveUserProfile();
      updateProfileUI();
    }

    showPartnerInfo(data);
    startNextButtonCooldown();
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
  if (checkBanStatus()) return;

  // Mark setup completed when user starts chat & hide setup section
  userProfile.hasCompletedSetup = true;
  saveUserProfile();
  updateSetupSectionVisibility();

  if (selectedGenderFilter !== 'any' && userProfile.gems < FILTER_COST) {
    if (insufficientGemsModal) insufficientGemsModal.classList.remove('hidden');
    return;
  }

  const hasPermission = await requestMediaPermission();
  if (!hasPermission) return;

  emitWhenReady('register', {
    gender: selectedGender || 'male',
    myCountry: myHomeCountryCode || 'JO',
    targetCountry: selectedCountry || 'ALL',
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

  startNudityScanner();
  emitWhenReady('find_partner');
  setState('searching');
}

// =============================================
// Control Buttons
// =============================================
function setupControls() {
  nextBtn.addEventListener('click', () => {
    cleanupPeerConnection();
    socket.emit('next');
    setState('searching');
  });

  micBtn.addEventListener('click', toggleMic);
  cameraBtn.addEventListener('click', toggleCamera);
  endBtn.addEventListener('click', endCall);

  const flipCamBtn = $('#flip-cam-btn');
  if (flipCamBtn) {
    flipCamBtn.addEventListener('click', switchCamera);
  }

  if (findNewBtn) {
    findNewBtn.addEventListener('click', () => {
      partnerLeftOverlay.classList.add('hidden');
      socket.emit('find_partner');
      setState('searching');
    });
  }

  const cancelSearchBtn = $('#cancel-search-btn');
  if (cancelSearchBtn) {
    cancelSearchBtn.addEventListener('click', () => {
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
  stopNudityScanner();
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
  const callBadgesBar = $('#call-badges-bar');

  switch (state) {
    case 'idle':
      searchingOverlay.classList.add('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      stopCallTimer();
      break;

    case 'searching':
      searchingOverlay.classList.remove('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      stopCallTimer();
      break;

    case 'connected':
      searchingOverlay.classList.add('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.remove('hidden');
      callTimer.classList.remove('hidden');
      if (callBadgesBar) callBadgesBar.classList.remove('hidden');
      startCallTimer();
      break;

    case 'partner_left':
      searchingOverlay.classList.remove('hidden');
      partnerLeftOverlay.classList.add('hidden');
      partnerInfo.classList.add('hidden');
      callTimer.classList.add('hidden');
      if (callBadgesBar) callBadgesBar.classList.add('hidden');
      stopCallTimer();
      break;
  }
}

function showPartnerInfo(data) {
  partnerFlag.textContent = countryCodeToFlag(data.partnerCountry);
  const nameEl = $('#partner-username');
  if (nameEl) nameEl.textContent = data.partnerUsername || 'مستخدم';
  partnerGenderIcon.textContent = data.partnerGender === 'male' ? '👨' : '👩';

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
