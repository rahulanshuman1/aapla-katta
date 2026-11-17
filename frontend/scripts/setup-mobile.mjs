// One-time (and re-runnable) mobile setup:  npm run mobile:setup
// Builds the web app, creates the Android (and, on a Mac, iOS) projects, adds permissions, generates icons + splash screens and syncs.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

const sh = (cmd) => { console.log(`\n$ ${cmd}`); execSync(cmd, { stdio: 'inherit' }); };
const mac = os.platform() === 'darwin';

if (!fs.existsSync('capacitor.config.json')) { console.error('Run this from the frontend/ folder.'); process.exit(1); }
if (!process.env.VITE_API_URL && !fs.existsSync('.env.production') && !fs.existsSync('.env')) {
  console.warn('\n⚠️  VITE_API_URL is not set – the app will use the default backend URL from src/api.js. Create frontend/.env.production with VITE_API_URL=https://<your-backend>.onrender.com if that is not your backend.');
}

// push notifications are only switched on when the Firebase config file is present (otherwise Android crashes on register)
const hasFirebase = fs.existsSync('android/app/google-services.json') || fs.existsSync('ios/App/App/GoogleService-Info.plist');
process.env.VITE_PUSH_ENABLED = hasFirebase ? 'true' : 'false';
console.log(hasFirebase ? 'Firebase config found - push notifications ON' : 'No Firebase config file yet - push notifications OFF (see MOBILE.md step 1)');
sh('npx vite build');
if (!fs.existsSync('android')) sh('npx cap add android');
if (!fs.existsSync('ios')) { if (mac) sh('npx cap add ios'); else console.log('\n(iOS project skipped – it can only be created on a Mac. Run this script again on a Mac.)'); }
sh('node scripts/patch-native.mjs');
sh('npx capacitor-assets generate' + (fs.existsSync('ios') ? '' : ' --android'));
sh('npx cap sync');

console.log(`\n✅ Done.\n   Android:  npm run android   (opens Android Studio → Run ▶ on a phone/emulator)\n   iOS:      npm run ios       (Mac only → opens Xcode)\n   After any website change:  npm run build:mobile\n   Full guide: ../MOBILE.md`);
