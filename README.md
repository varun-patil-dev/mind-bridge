# MindBridge

MindBridge is a React + Firebase mental health support app where people can share what they are going through, respond with supportive messages, and use anonymous calm usernames.

## Stack

- React 18
- Firebase Auth for email/password login
- Cloud Firestore for profiles, stories, and responses
- Optional LLM moderation for response safety

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Add a Web App and copy its config.
3. Enable Authentication -> Email/Password.
4. Create a Firestore database.
5. Paste `firestore.rules` into Firestore Rules and publish.
6. If prompted, enable the Cloud Firestore API and wait a few minutes.
7. Add Firebase config values to `.env`.

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

## Run Locally

```bash
npm install
npm start
```

Restart `npm start` after changing `.env`.

## Data Model

- `profiles/{uid}`
  - `user_id`
  - `username`
  - `created_at`
- `problems/{problemId}`
  - `content`
  - `user_id`
  - `response_count`
  - `created_at`
- `responses/{responseId}`
  - `problem_id`
  - `content`
  - `user_id`
  - `created_at`

## Scripts

```bash
npm start
npm test -- --watchAll=false
npm run build
```

## Reply Moderation

Replies are checked before they are saved to Firestore.

- `POSITIVE` and `NEUTRAL` replies are allowed.
- `NEGATIVE`, `HARMFUL`, and `CRISIS_RISK` replies are blocked.
- If no LLM key is configured, a local keyword-based safety check still runs.

For Anthropic, use:

```env
REACT_APP_LLM_PROVIDER=anthropic
REACT_APP_LLM_MODEL=claude-3-haiku-20240307
REACT_APP_LLM_API_URL=https://api.anthropic.com/v1/messages
REACT_APP_LLM_API_KEY=your_anthropic_key
```

For an OpenAI-compatible endpoint, use:

```env
REACT_APP_LLM_PROVIDER=openrouter
REACT_APP_LLM_MODEL=openai/gpt-4o-mini
REACT_APP_LLM_API_URL=https://openrouter.ai/api/v1/chat/completions
REACT_APP_LLM_API_KEY=your_openrouter_key
```

For production, move LLM moderation to a backend or Firebase Function so the API key is not exposed in the browser.
