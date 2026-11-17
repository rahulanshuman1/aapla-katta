// Everything that only exists inside the Android / iOS app (Capacitor). On the normal website every function is a harmless no-op.
import { Capacitor, registerPlugin } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

/** Run once at start-up: status bar, splash, Android back button, deep links. */
export async function initNative(navigate) {
  if (!isNative) return;
  document.documentElement.classList.add('native', `native-${platform}`);
  try {
    const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/app'), import('@capacitor/status-bar'), import('@capacitor/splash-screen'),
    ]);
    try { await StatusBar.setStyle({ style: Style.Light }); if (platform === 'android') await StatusBar.setBackgroundColor({ color: '#FFF8EC' }); } catch { /* not critical */ }
    // Android back button: go back in the app, exit only from the first screen
    App.addListener('backButton', () => {
      if (window.history.state && window.history.state.idx > 0) window.history.back(); else App.exitApp();
    });
    // links like https://…/track/TRK-… or aaplakatta://orders open the right screen
    App.addListener('appUrlOpen', ({ url }) => { try { const u = new URL(url); navigate(u.pathname + u.search); } catch { /* ignore */ } });
    setTimeout(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}), 300);
  } catch (e) { console.warn('[native] init failed', e); }
}

/** Ask for notification permission, register with Firebase and send the device token to our server. */
export async function registerPush(api, navigate, onForeground) {
  if (!isNative) return;
  // Without Firebase config inside the app (google-services.json), Android crashes the moment push is registered – so only enable it when the build included that file.
  if (import.meta.env.VITE_PUSH_ENABLED !== 'true') return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive.startsWith('prompt')) perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
    await PushNotifications.removeAllListeners(); // avoid duplicate listeners when the user signs in again
    PushNotifications.addListener('registration', ({ value }) => {
      try { localStorage.setItem('ak_push', value); } catch { /* ignore */ }
      api.post('/auth/push-token', { token: value, platform }).catch(() => {});
    });
    PushNotifications.addListener('registrationError', (e) => console.warn('[push] registration error', e));
    PushNotifications.addListener('pushNotificationReceived', (n) => onForeground && onForeground(`${n.title || ''} ${n.body || ''}`.trim()));
    PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => { const url = notification.data && notification.data.url; if (url) navigate(url); });
    await PushNotifications.register();
  } catch (e) { console.warn('[push] setup failed', e); }
}

/** Call BEFORE the login token is cleared, so this phone stops receiving the user's notifications. */
export function unregisterPush(api) {
  if (!isNative) return;
  let t = null;
  try { t = localStorage.getItem('ak_push'); localStorage.removeItem('ak_push'); } catch { /* ignore */ }
  if (t) api.del('/auth/push-token', { token: t }).catch(() => {});
}

/**
 * Live position updates for the delivery rider.
 * In the app: a native background watcher (keeps working with the screen off, shows a "sharing location" notification).
 * On the web: the browser's geolocation (needs the page open). Returns a stop function.
 * onFix gets { latitude, longitude, heading, speed, accuracy }; onError gets { code: 1 (blocked) | 2 (other) }.
 */
export function watchPosition(onFix, onError) {
  if (!isNative) {
    if (!navigator.geolocation) { onError({ code: 2 }); return () => {}; }
    const id = navigator.geolocation.watchPosition((p) => onFix(p.coords), onError, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
    return () => navigator.geolocation.clearWatch(id);
  }
  let id = null, stopped = false;
  BackgroundGeolocation.addWatcher(
    { backgroundTitle: 'Aapla Katta delivery', backgroundMessage: 'Sharing your live location with the customer', requestPermissions: true, stale: false, distanceFilter: 0 },
    (loc, err) => {
      if (err) return onError({ code: err.code === 'NOT_AUTHORIZED' ? 1 : 2 });
      if (loc) onFix({ latitude: loc.latitude, longitude: loc.longitude, heading: loc.bearing, speed: loc.speed, accuracy: loc.accuracy });
    }
  ).then((wid) => { if (stopped) BackgroundGeolocation.removeWatcher({ id: wid }); else id = wid; }).catch(() => onError({ code: 2 }));
  return () => { stopped = true; if (id) BackgroundGeolocation.removeWatcher({ id }); };
}

/** Opens the phone's location settings (used when the rider blocked location). */
export function openAppSettings() {
  if (isNative) BackgroundGeolocation.openSettings().catch(() => {});
}
