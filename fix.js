const fs = require('fs');

function fixFiles() {
  // 1. app.js fixes
  let appJs = fs.readFileSync('public/js/app.js', 'utf8');

  // Remove welcome preview camera stream assignments and play calls
  appJs = appJs.replace(/const welcomePreview = \$\('#welcome-camera-preview'\);[^}]*welcomePreview\.play\(\)\.catch\(\(\) => \{\}\);\s*\}/g, '');
  appJs = appJs.replace(/const preview = \$\('#welcome-camera-preview'\);[^}]*preview\.style\.filter = VIDEO_FILTERS\[currentFilterIndex\];[^}]*\}/g, '');
  appJs = appJs.replace(/const preview = \$\('#welcome-camera-preview'\);[\s\S]*?preview\.srcObject\.getTracks\(\)\.forEach[\s\S]*?\}/g, '');
  
  // Disable calling requestMediaPermission on startup. It is only called in startChat().
  // (We don't need to change this if it's already only in startChat, but let's make sure startCameraPreview isn't called)
  
  // Remove badges logic
  appJs = appJs.replace(/const names = \{ awesome: '⭐ رائع', handsome: '✨ وسيم', elegant: '🎩 أنيق' \};/g, '');
  appJs = appJs.replace(/if \(b\.awesome > 0\) text \+= `⭐\$\{b\.awesome\} `;[\s\S]*?if \(b\.elegant > 0\) text \+= `🎩\$\{b\.elegant\}`;/g, '');
  appJs = appJs.replace(/\$\$?\('\.give-badge-btn'\)[\s\S]*?\}\);/g, '');

  fs.writeFileSync('public/js/app.js', appJs);

  // 2. index.html fixes
  let indexHtml = fs.readFileSync('public/index.html', 'utf8');

  // Remove welcome-camera-preview
  indexHtml = indexHtml.replace(/<video id="welcome-camera-preview" autoplay playsinline muted poster="data:image\/svg\+xml;utf8,<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg'\/>"><\/video>/g, '');

  // Hide counters and badges
  indexHtml = indexHtml.replace(/<div id="ban-countdown-timer"[^>]*>.*?<\/div>/g, '<div id="ban-countdown-timer" style="display:none;"></div>');
  indexHtml = indexHtml.replace(/<div id="partner-gender-badge"[^>]*>[\s\S]*?<\/div>/g, '<div id="partner-gender-badge" class="partner-gender-tag gender-male" style="display:none;"><span id="partner-gender-icon">👨</span><span id="partner-gender-text">ذكر</span></div>');

  fs.writeFileSync('public/index.html', indexHtml);

  // 3. style.css fixes
  let styleCss = fs.readFileSync('public/css/style.css', 'utf8');

  // Fix local-video-wrapper to not overlap at the top
  styleCss = styleCss.replace(/#local-video-wrapper \{[\s\S]*?top: 20px;/g, '#local-video-wrapper {\n  position: absolute;\n  top: 90px;');
  
  // For mobile queries
  styleCss = styleCss.replace(/top: 12px;/g, 'top: 90px;');

  // Hide online indicators completely
  styleCss = styleCss.replace(/\.online-indicator \{/g, '.online-indicator {\n  display: none !important;');
  styleCss = styleCss.replace(/\.searching-online \{/g, '.searching-online {\n  display: none !important;');

  fs.writeFileSync('public/css/style.css', styleCss);
  
  console.log("Fixes applied.");
}

fixFiles();
