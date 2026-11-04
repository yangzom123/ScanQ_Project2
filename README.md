# ScanQ (React Native + Expo)


Run the app
```bash
npm install
npx expo install --fix      # aligns package versions with your Expo SDK
npx expo start              # scan the QR with the Expo Go app (Android or iOS)
```


### Data model 
| Collection | Fields |
|---|---|
| `users/{uid}` | uid, fullName, idNumber, email, role (`student`/`tutor`), profilePhotoUrl, createdDate |
| `modules/{id}` | name, code (first 6 letters of name, upper-case), tutorId, enrolledStudentIds[] |
| `sessions/{id}` | moduleId, moduleName, tutorId, date, startTime, endTime, totalStudents, presentCount, currentToken, createdAt |
| `sessions/{id}/attendance/{studentUid}` | studentId, timestamp, status |

QR payload: `sessionId|currentToken` (the token changes every 10 s).

## Project structure
```
App.js                      providers + navigator
src/firebase.js             Firebase config  <-- edit this
src/theme.js                colours from colors.xml
src/context/                AuthContext (login state + role), ToastContext
src/navigation/index.js     auth stack, student tabs, tutor tabs
src/services/data.js        attendance aggregation queries
src/components/             ui.js (inputs, buttons, cards, chips), Cards.js (list items)
src/screens/                Welcome, About, Login, Register, Profile
src/screens/student/        Dashboard, Modules, Attendance, Scan
src/screens/tutor/          Dashboard, Modules, Records, GenerateQr
```



