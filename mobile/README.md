# AgriVault Mobile

Expo React Native app for Android and iOS.

## Local setup

```bash
cd mobile
npm install
npm start
```

Use these API server values on the login screen:

- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Physical phone: use your computer LAN IP, for example `http://192.168.1.20:3000`

Start the web backend from the repo root:

```bash
npm run dev
```

## App store builds

```bash
cd mobile
npx eas login
npx eas build --platform android
npx eas build --platform ios
```

The app uses the existing `/api/mobile/*` JWT endpoints. Capture drafts are stored locally and can be synced when the phone is back online.
