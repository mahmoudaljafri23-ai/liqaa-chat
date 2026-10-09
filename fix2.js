const fs = require('fs');

function fixFiles() {
  // 1. app.js fixes
  let appJs = fs.readFileSync('public/js/app.js', 'utf8');

  // Remove welcome preview camera stream assignments and play calls
  appJs = appJs.replace(/const welcomePreview = \$\('#welcome-camera-preview'\);[\s\S]*?welcomePreview\.play\(\)\.catch\(\(\) => \{\}\);\s*\}/g, '');
  appJs = appJs.replace(/const preview = \$\('#welcome-camera-preview'\);[\s\S]*?preview\.style\.filter = VIDEO_FILTERS\[currentFilterIndex\];[\s\S]*?\}/g, '');
  
  // Remove `initWelcomeCamera` preview stop logic because we removed the element
  appJs = appJs.replace(/const preview = \$\('#welcome-camera-preview'\);[\s\S]*?preview\.srcObject = null;\n\s*\}/g, '');
  
  // Remove badges logic
  appJs = appJs.replace(/const names = \{ awesome: '⭐ رائع', handsome: '✨ وسيم', elegant: '🎩 أنيق' \};/g, '');
  appJs = appJs.replace(/if \(b\.awesome > 0\) text \+= `⭐\$\{b\.awesome\} `;[\s\S]*?if \(b\.elegant > 0\) text \+= `🎩\$\{b\.elegant\}`;/g, '');
  appJs = appJs.replace(/\$\$?\('\.give-badge-btn'\)\.forEach\(btn => \{[\s\S]*?\}\);\s*\n\s*\}\);/g, '');
  appJs = appJs.replace(/\$\$?\('\.give-badge-btn'\)\.forEach[\s\S]*?\}\);\n  \}\);/g, '');
  // Specifically for give-badge-btn
  appJs = appJs.replace(/\$\$?\('\.give-badge-btn'\)[\s\S]*?(showGemToast|ames\[badgeType\])[\s\S]*?\}\);\n  \}\);/g, '');

  // Hide in-call notification to fix popups ("اخفيلي الاشعارات الي بتطلع")
  appJs = appJs.replace(/function showInCallAlert\(message\) \{[\s\S]*?\}\n/g, 'function showInCallAlert(message) { /* Disabled per request */ }\n');

  fs.writeFileSync('public/js/app.js', appJs);

  console.log("App.js fixed.");
}

fixFiles();
