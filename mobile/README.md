# Omni AI for Android

## Install and start

```sh
npm ci
npm run start
```

For Android development, install Android Studio with Android SDK Platform 36, Android SDK Build-Tools, Android Emulator, and an API 36 x86_64 system image. Set `ANDROID_HOME` to the SDK directory and add its `platform-tools` and `emulator` directories to `PATH`. Create and start an Android Virtual Device, then run:

```sh
npm run android
```

To generate and install a native debug build on the running emulator:

```sh
npm run android:local
```

## Google Play builds

Sign in to an Expo account, initialize the EAS project, and build an installable preview APK:

```sh
npm run eas:login
npm run eas:init
npm run android:build:preview
```

Create a signed Play Store app bundle with:

```sh
npm run android:build:production
```

The production build can be uploaded to the Play Console production track with `npm run android:submit`. This requires an Expo account, a Google Play developer account, a Play Console app listing, and EAS Android signing/submission credentials. The app ID is currently `com.pashamartynau.omniai`; confirm it is available before the first Play Store upload, since an app ID cannot be changed after release.
