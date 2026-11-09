# Aapla Katta – Android & iOS apps

The apps are the **same React website wrapped with Capacitor** (one codebase → Android + iOS), plus native features:

| Feature | How |
|---|---|
| Customers, admin and riders sign in to one app | role-based screens (already built) |
| **Push notifications** (order updates, new-order alert for owner, "delivery assigned" for riders) | Firebase Cloud Messaging; backend `utils/push.js` |
| **Rider background GPS** (works with screen off, shows a "sharing location" notification) | `@capacitor-community/background-geolocation` |
| Android back button, status bar, splash screen, safe-areas (notch) | `src/native.js`, `NativeBridge.jsx` |
| **Delete account** inside the app, **Privacy Policy**, **Terms** | required by both stores – `/account`, `/privacy`, `/terms` |

> I could not run Android Studio / Xcode / a phone in my environment, so the native projects are generated on **your** computer by one command, and everything below must be tested on a real device before you publish.

---

## 0. What you need (one-time)

| | Android | iOS |
|---|---|---|
| Developer account | Google Play Console – **$25 once** | Apple Developer Program – **$99 / year** |
| Computer | Windows / Mac / Linux | **A Mac with Xcode** (no way around this; or use a cloud Mac such as Codemagic / GitHub Actions `macos` runners) |
| Software | Node 18+, Android Studio (includes the SDK) | Node 18+, Xcode 15+, CocoaPods (`sudo gem install cocoapods`) |
| Firebase | one free project (https://console.firebase.google.com) for push notifications – used by both |

**Choose your app ID now** (e.g. `in.aaplakatta.app`) – it can never change after publishing. It is set in `frontend/capacitor.config.json` (`appId`). Use the same ID for Android and iOS.

---

## 1. Firebase (push notifications)

1. Firebase console → **Add project** → "Aapla Katta".
2. **Android:** Project settings → *Add app* → Android → package name = your app ID → download **`google-services.json`** → put it in `frontend/android/app/` (after step 3).
3. **iOS:** *Add app* → iOS → bundle ID = your app ID → download **`GoogleService-Info.plist`** → drag it into Xcode under `App/App` (after step 3, tick "Copy items").
4. **iOS only – APNs key:** Apple Developer → *Keys* → create a key with **Apple Push Notifications service (APNs)** → download the `.p8`. Firebase → Project settings → *Cloud Messaging* → *Apple app configuration* → upload the `.p8` with your Key ID and Team ID.
5. **Backend:** Firebase → Project settings → *Service accounts* → **Generate new private key** (a `.json` file). Convert it to one line and put it in Render as `FIREBASE_SERVICE_ACCOUNT`:
   ```bash
   base64 -w0 serviceAccount.json        # macOS: base64 -i serviceAccount.json
   ```
   Paste the output as the value (plain JSON also works). Redeploy the backend. In the Render logs you should see `[push] Firebase initialised`. Until this is set, push is silently skipped and everything else still works.

---

## 2. Create the apps (on your computer)

```bash
cd frontend
cp .env.example .env.production      # then set VITE_API_URL=https://<your-backend>.onrender.com
npm install
npm run mobile:setup
```

`mobile:setup` builds the website, creates `android/` (and `ios/` on a Mac), adds all permissions, generates the app icons + splash screens from `frontend/resources/` and syncs everything.
**Replace `resources/icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png` with your real logo artwork** (1024×1024 icon, 2732×2732 splash) and run `npm run assets` – the included ones are simple placeholders.

Commit the `android/` and `ios/` folders to Git (they are part of your project).

### iOS extra steps (Mac, one time)
1. `npm run ios` → Xcode opens. Select the **App** target → *Signing & Capabilities* → choose your Team, set the bundle identifier = your app ID.
2. **+ Capability →** *Push Notifications* and *Background Modes* (tick **Location updates** and **Remote notifications**).
3. Firebase on iOS needs two code changes:
   - `ios/App/Podfile` – inside `target 'App' do`, add: `pod 'FirebaseMessaging'`, then run `cd ios/App && pod install`.
   - `ios/App/App/AppDelegate.swift` – add `import FirebaseCore` and `import FirebaseMessaging` at the top, and as the first line of `application(_:didFinishLaunchingWithOptions:)` add `FirebaseApp.configure()`. Then replace the body of `didRegisterForRemoteNotificationsWithDeviceToken` with:
     ```swift
     Messaging.messaging().apnsToken = deviceToken
     Messaging.messaging().token(completion: { (token, error) in
         if let error = error { NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error) }
         else if let token = token { NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: token) }
     })
     ```
   (This is the official Capacitor + Firebase recipe: https://capacitorjs.com/docs/apis/push-notifications)

---

## 3. Test on a real phone (do not skip)

`npm run android` (or `npm run ios`) → press ▶ with a phone plugged in (USB debugging on for Android).

Checklist:
- [ ] Sign up → verification email → sign in; menu loads; place a **dine-in cash** order.
- [ ] **Razorpay test payment** (use test keys): cards, netbanking and UPI *collect* work in the in-app browser. **UPI app-intent (opening GPay/PhonePe directly) may not open from inside the app** – if you need it, Razorpay's native SDK is the upgrade (tell me and I'll add it).
- [ ] Notification permission prompt appears after sign-in; place an order as customer, then change its status in Admin → the customer phone gets a push.
- [ ] Owner phone gets "🛎️ New order" push.
- [ ] Delivery order: pin location → assign rider → rider signs in on a second phone → **Start delivery** → lock the rider's screen, walk/drive → customer map keeps moving → **Mark delivered**.
- [ ] Android back button, rotate, offline message, sign out → no more pushes to that phone.
- [ ] My account → Delete account works (test with a throw-away customer).

---

## 4. Publish – Android (Google Play)

1. Android Studio → **Build → Generate Signed App Bundle (AAB)** → create a **keystore** (keep the file and passwords somewhere very safe – losing it means you cannot update the app; Play App Signing also protects you).
2. Play Console → **Create app**. Fill in:
   - **Privacy policy URL:** `https://<your-site>/privacy`
   - **Account deletion:** a URL `https://<your-site>/account` and say users can delete in-app (My account → Delete my account).
   - **Data safety form:** collected – name, email, phone, address, precise location (delivery pin; rider live location), order history, device ID (push token); shared with Razorpay (payments), Google/Firebase (notifications); encrypted in transit; users can request deletion.
   - **Permissions declarations:** *Foreground service – location* (riders sharing live delivery location) – Play asks for a short screen recording of the rider flow.
   - Content rating, target audience (18+ is simplest), category *Food & Drink*.
3. **New personal developer accounts** must first run a **closed test** with testers for 14 days before production (the exact number is shown in the console; organisation accounts are exempt). Upload the `.aab` to *Closed testing*, add testers, then apply for production.

## 5. Publish – iOS (App Store)

1. Xcode → set the destination to *Any iOS Device* → **Product → Archive** → **Distribute App → App Store Connect**.
2. App Store Connect → new app (same bundle ID): screenshots (6.7" and 6.5" iPhones), description, **Privacy Policy URL** (`https://<your-site>/privacy`), **App Privacy** labels (same data as above).
3. **App Review information – give Apple demo logins** (a customer and a rider account) and write: *"Restaurant ordering app. Payments for physical food are taken via Razorpay. Delivery partners use the same app; live location is shared only while delivering."*
4. Apple's *Guideline 4.2* rejects apps that are "just a website". Yours is more than that (push notifications, native background GPS, account system, live tracking) – mention these in the review notes. Food is a physical good, so Razorpay is allowed (no in-app-purchase needed). Account deletion (required) is in My account.

---

## 6. Updating the app later

The app contains a **bundled copy** of the website. When you change code: `cd frontend && npm run build:mobile`, bump the version (Android: `versionCode`/`versionName` in `android/app/build.gradle`; iOS: *Version/Build* in Xcode), and upload a new build to both stores. **Admin edits (menu, prices, text, theme, logo, contact) apply instantly – no new release**, because they come from your server.

## 7. Safety notes
- Never commit your keystore, `.p8` or Firebase service-account file.
- `CLIENT_URL` on Render does **not** need changing – the backend automatically accepts the apps' internal origins (`https://localhost`, `capacitor://localhost`).
- The Privacy Policy and Terms pages are sensible defaults written for this app; please have them reviewed for your business (e.g. refund wording) before launch.

---

## 8. Automatic Android APK on every deployment (GitHub Actions)

`.github/workflows/android-apk.yml` builds the Android app **every time you push to `main`** (the same push that deploys Vercel and Render) – nothing to install on your computer.

**Get the APK:** GitHub → your repo → **Actions** → latest "Build Android APK" run → **Artifacts** → download the zip, *or* GitHub → **Releases** (a permanent link per build, e.g. "Android build 7"). Open the `AaplaKatta-debug.apk` on your phone (allow "install unknown apps" once) – or share the Release link with your riders.

**Optional GitHub settings** (repo → Settings → Secrets and variables → Actions):

| Name | Type | What it is |
|---|---|---|
| `VITE_API_URL` | Variable | your Render backend URL (defaults to `https://aapla-katta.onrender.com`) |
| `GOOGLE_SERVICES_JSON` | Secret | base64 of Firebase `google-services.json` (`base64 -w0 google-services.json`) – needed for push notifications |
| `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` | Secrets | your upload keystore (base64 of the `.jks` file). When present, the build also produces a **signed release APK** and the **signed `.aab` for Google Play** |

Without the keystore secrets you get the **debug APK**, which installs fine on phones for testing and for riders, but **cannot be uploaded to Google Play** – use the `.aab` from a keystore-signed build for that. Create the keystore once (keep it safe forever):
`keytool -genkey -v -keystore aapla-katta.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aaplakatta`

The version number is the GitHub build number, so every build installs over the previous one. iOS cannot be built this way without a paid Mac runner and Apple certificates.
