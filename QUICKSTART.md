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
REACT_APP_LLM_PROVIDER=openrouter
REACT_APP_LLM_MODEL=openai/gpt-4o-mini
REACT_APP_LLM_API_KEY=your_llm_api_key_here
REACT_APP_LLM_API_URL=https://openrouter.ai/api/v1/chat/completions
```

Restart the dev server every time you change `.env`.

## 5. Run

```bash
npm start
```

Open `http://localhost:3000`.

## Firestore Collections

- `profiles/{uid}` stores anonymous display names.
- `problems/{problemId}` stores shared stories and `response_count`.
- `responses/{responseId}` stores supportive replies linked by `problem_id`.

## Notes

AI moderation is optional, but a local safety check always runs. If `REACT_APP_LLM_API_KEY` is left as the placeholder, the app still blocks obvious negative or crisis-risk replies using local rules. For production, move the LLM call to a backend or Firebase Function so your API key is not exposed in the browser.
