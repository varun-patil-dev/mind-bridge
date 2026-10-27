# MindBridge Quick Start

## 1. Install

```bash
npm install
```

## 2. Create Firebase Project

1. Open https://console.firebase.google.com
2. Create a project.
3. Add a Web App to the project.
4. Copy the Firebase config values.

## 3. Enable Firebase Services

In Firebase Console:

1. Go to Authentication -> Sign-in method.
2. Enable Email/Password.
3. Go to Firestore Database.
4. Create a database.
5. Start in production mode, then paste the rules from `firestore.rules` into Firestore Rules and publish.
6. If Firebase asks you to enable the Cloud Firestore API, enable it and wait a few minutes for the change to propagate.

## 4. Configure Environment

Create or edit `.env`:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id_optional
OPENROUTER_API_KEY=your_rotated_openrouter_key
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

Keep the OpenRouter key unprefixed. Never name it `REACT_APP_OPENROUTER_API_KEY`; Create React App embeds `REACT_APP_*` values in the browser bundle.

## 5. Run

```bash
npm run dev
```

Open `http://localhost:3000`. This starts the React app and local moderation API together. `npm start` does the same.

## Firestore Collections

- `profiles/{uid}` stores anonymous display names.
- `problems/{problemId}` stores shared stories and `response_count`.
- `responses/{responseId}` stores supportive replies linked by `problem_id`.

## Notes

Replies are checked by the moderation handler in `api/moderate.js`. The local API validates the user's Firebase ID token and sends reply text to OpenRouter. Negative replies show a revise-or-post warning; harmful and crisis-risk replies are blocked. If OpenRouter is unavailable, a limited local phrase check screens terms such as profanity, “die,” and “suicide,” and the form tells the user when it was used. Reply text is sent to OpenRouter for classification. For production, configure `OPENROUTER_API_KEY` in Vercel Project Settings → Environment Variables. Vercel does not upload the local `.env` file automatically.

To deploy to Vercel:

```bash
vercel login
vercel link
vercel --prod
```

Before deploying, add the Firebase `REACT_APP_FIREBASE_*` values and a **new rotated** `OPENROUTER_API_KEY` to the Vercel project environment variables.
