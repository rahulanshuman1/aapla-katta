// Adds the permissions the app needs to the generated Android / iOS projects. Safe to run many times.
// Usage: node scripts/patch-native.mjs [projectRoot]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const log = (m) => console.log('  ' + m);

export function patchAndroidManifest(xml) {
  const perms = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_LOCATION',
    'android.permission.POST_NOTIFICATIONS',
  ];
  let out = xml;
  const add = perms.filter((p) => !out.includes(`"${p}"`)).map((p) => `    <uses-permission android:name="${p}" />`);
  if (add.length) out = out.replace('</manifest>', add.join('\n') + '\n</manifest>');
  return out;
}

export function patchInfoPlist(plist) {
  let out = plist;
  const strings = {
    NSLocationWhenInUseUsageDescription: 'Aapla Katta uses your location to pin your delivery address and, for delivery partners, to share live delivery tracking with the customer.',
    NSLocationAlwaysAndWhenInUseUsageDescription: 'Delivery partners share their live location with the customer while a delivery is on the way, even when the app is in the background.',
  };
  let add = '';
  for (const [k, v] of Object.entries(strings)) if (!out.includes(`<key>${k}</key>`)) add += `\t<key>${k}</key>\n\t<string>${v}</string>\n`;
  if (!out.includes('<key>UIBackgroundModes</key>')) {
    add += '\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>location</string>\n\t\t<string>remote-notification</string>\n\t</array>\n';
  } else {
    for (const mode of ['location', 'remote-notification']) {
      const m = out.match(/<key>UIBackgroundModes<\/key>\s*<array>([\s\S]*?)<\/array>/);
      if (m && !m[1].includes(`<string>${mode}</string>`)) out = out.replace(m[0], m[0].replace('</array>', `\t<string>${mode}</string>\n\t</array>`));
    }
  }
  if (add) out = out.replace(/<\/dict>\s*<\/plist>\s*$/, add + '</dict>\n</plist>\n');
  return out;
}

function run() {
  const manifest = path.join(root, 'android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifest)) { fs.writeFileSync(manifest, patchAndroidManifest(fs.readFileSync(manifest, 'utf8'))); log('Android permissions set'); }
  else log('(no android/ folder yet – skipped)');
  const plist = path.join(root, 'ios/App/App/Info.plist');
  if (fs.existsSync(plist)) { fs.writeFileSync(plist, patchInfoPlist(fs.readFileSync(plist, 'utf8'))); log('iOS Info.plist set'); }
  else log('(no ios/ folder yet – skipped)');
}
if (import.meta.url === `file://${process.argv[1]}`) run();
