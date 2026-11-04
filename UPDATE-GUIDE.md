# ScanQ - Project II feature update

Replaces/adds files under `src/`, plus `App.js` and `firestore.rules`.
It does NOT touch `src/firebase.js`, `.env`, `package.json` or `index.js`.

## 1. Install the new packages
```
npx expo install expo-location expo-crypto expo-print expo-sharing expo-file-system expo-image-picker @react-native-community/datetimepicker
```

## 2. Publish the new Firestore rules
Firebase console -> Firestore Database -> Rules -> paste `firestore.rules` -> Publish.

## 3. (Optional, needed only for real iOS/Android builds, not Expo Go)
Add to `app.json` -> `expo` -> `plugins`:
```
["expo-location", { "locationWhenInUsePermission": "ScanQ uses your location to confirm you are in the classroom." }],
["expo-image-picker", { "photosPermission": "ScanQ needs your photos to set a profile picture." }]
```

## 4. Run
```
npx expo start -c
```

## New / changed data (Firestore)
| Collection | New fields |
|---|---|
| modules | keySalt, enrollmentKeyHash |
| sessions | startAt, endAt (Timestamps), closed (bool), latitude, longitude, radius |
| users | profilePhotoUrl now holds a small compressed photo (data URI) |

Old modules (no key) can still be joined without a key; tutors can add a key with the key icon.
Old sessions (no location / startAt) keep working like Project I.

## Where each feature lives
1. Enrollment key: TutorDashboard (create), TutorModules (change key), StudentDashboard (join), services/security.js
2. Scheduled sessions: tutor/GenerateQrScreen, student/ScanScreen (windowError), firestore.rules (sessionOpen)
3. Geo-fencing: GenerateQrScreen (saves location), ScanScreen (checkLocation), utils.distanceMeters
4. CSV / PDF export: TutorRecords, components/ExportDialog, services/reports.js
5. Profile edit: EditProfileScreen, ProfileScreen
6. Dark Mode: theme.js, context/ThemeContext.js, Profile switch
