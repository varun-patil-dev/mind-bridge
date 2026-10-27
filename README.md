# MindBridge

MindBridge is an anonymous peer-support community. People can share a personal story, read community posts, and respond with supportive messages using a generated display name. It is intended to make it easier to ask for and offer everyday peer support; it is not a crisis service or a substitute for professional care.

## Users and core workflows

- Create an account or sign in with email and password.
- Browse the community feed and open a story with its responses.
- Find stories by searching their text or anonymous username, filter by support topic, and sort by newest or response count.
- Publish a story and receive responses.
- Respond to a story; an OpenRouter model checks the reply's tone, warns about negative wording, and blocks replies classified as harmful or crisis-risk.
- Edit the anonymous username, and delete your own stories or responses.

Stories and responses are public to anyone who can reach the app. Accounts are required to publish, respond, and manage your own content. “Anonymous” means the interface uses a generated username; Firebase Auth still associates content with an account ID. Do not post information you need to keep private.

## Technology and architecture

- React 18 and React Router provide the single-page interface and routes.
- Firebase Authentication handles email/password identity.
- Cloud Firestore stores profiles, stories, and responses.
- Firestore Security Rules enforce signed-in ownership on writes and limit response-count updates.
- The client calls the authenticated Vercel Function at `/api/moderate`. It validates the Firebase ID token, then sends response text to OpenRouter using `nvidia/nemotron-3-ultra-550b-a55b:free`. The OpenRouter key is a server-only environment variable. Response text is sent to OpenRouter for classification. Model classifications can be mistaken and are not a substitute for human moderation.

The OpenRouter listing for this free model says not to send confidential or personal information and notes that requests may be logged. Since peer-support replies can contain sensitive personal information, the app warns users before they post. Review the provider's data terms before using this moderation flow with real user stories.

### Data model

- `profiles/{uid}`: `user_id`, `username`, `created_at`
- `problems/{problemId}`: `content`, `topic`, `user_id`, `response_count`, `created_at`
- `responses/{responseId}`: `problem_id`, `content`, `user_id`, `created_at`

The app stores story and response text in Firestore. Topics are a fixed list in `src/utils/topics.js` and are validated on story creation by Firestore Rules. Stories created before topics were added are displayed as “General support.” Search and sorting run over the stories already loaded in the browser; this is suitable for the current small feed, not large-scale indexing. Review and publish `firestore.rules` in the Firebase console before using a project. `database-setup.sql` is retained only as a pointer; this app uses Firestore, not SQL.

## Local setup

Requirements: Node.js and npm, plus a Firebase project with Email/Password Authentication and Cloud Firestore enabled.

1. Create a Firebase web app and copy its config values into `.env` (use `.env.example` as a template).
2. Enable **Authentication → Email/Password** and create a Firestore database.
3. Publish the rules in `firestore.rules` from **Firestore Database → Rules**.
4. Install dependencies, then start the app and moderation API together:

   ```bash
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. The dev script starts the React development server and a local API server that reads `OPENROUTER_API_KEY` from `.env`. `npm start` does the same. Check `http://localhost:3000/api/health`; it should return JSON with `"api":"ready"` and `"openRouterConfigured":true`.

Restart the development server after editing `.env`. Do not commit `.env` or put private service/API keys in any `REACT_APP_*` variable; Create React App embeds those values in the browser build. Firebase web configuration is client-side configuration, so protect data with Firestore rules and configure Firebase Auth authorized domains for deployment.

### Environment variables

Copy `.env.example` and provide the Firebase web app configuration:

| Variable | Purpose |
| --- | --- |
| `REACT_APP_FIREBASE_API_KEY` | Firebase web app key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Firebase web app ID |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Optional Firebase measurement ID |
| `OPENROUTER_API_KEY` | Server-only OpenRouter key used by `api/moderate.js`; never add the `REACT_APP_` prefix |
| `OPENROUTER_MODEL` | OpenRouter model ID (defaults to `nvidia/nemotron-3-ultra-550b-a55b:free`) |

The root `.env` is ignored by Git. `OPENROUTER_API_KEY` has no `REACT_APP_` prefix, so the local API server can read it without embedding it in the browser bundle. For deployment, add all required values in Vercel Project Settings → Environment Variables; Vercel does not upload a local `.env` file automatically.

## Deploy to Vercel

1. Revoke the OpenRouter key that was pasted into chat and create a replacement.
2. Commit and push the project changes to GitHub (the existing repository is <https://github.com/varun-patil-dev/mind-bridge>).
3. In Vercel, choose **Add New → Project**, import the GitHub repository, and select `mind-bridge` as the root directory if Vercel shows the parent repository directory.
4. Use these build settings (also recorded in `vercel.json`):

   - Framework preset: Create React App (or Other)
   - Build command: `npm run build`
   - Output directory: `build`
   - Install command: `npm install`

5. Add each Firebase `REACT_APP_FIREBASE_*` value and `OPENROUTER_API_KEY` under **Settings → Environment Variables**. Add the OpenRouter key as a sensitive variable for Production and Preview. Do not add it with a `REACT_APP_` prefix.
6. Deploy. Vercel builds the React app and deploys `api/moderate.js` as a server-side function. Add the resulting `*.vercel.app` domain to Firebase Authentication → Authorized domains, and make sure the Firestore rules in `firestore.rules` are published.

For CLI deployment, install the Vercel CLI separately, link the project, add environment variables to Vercel, then deploy with `vercel --prod`. Every time you change a Vercel environment variable, create a new deployment for it to take effect.

The moderation endpoint requires a signed-in Firebase user and validates replies to 1000 characters. If OpenRouter is unreachable or returns an unusable result, the endpoint runs a small local phrase check for profanity and harmful language, then identifies that fallback in the reply form. This manual check is limited and should not be treated as comprehensive moderation.

## Demo video plan

Record a 3–5 minute walkthrough showing the target user and problem, account sign-in, browsing stories, publishing a story, posting a response, and managing a username or deleting owned content. Mention the limits of model-based tone checks. Add the shareable video link here before submission.

## Project submission details

- **Project:** MindBridge
- **Student:** Add the submitting student's name.
- **Problem:** People may want a low-friction way to share everyday challenges and receive peer encouragement.
- **Repository:** <https://github.com/varun-patil-dev/mind-bridge>
- **Deployment:** Add the accessible deployed application URL.
- **Demo:** Add the accessible demo video URL.
- **Stack:** React, React Router, Firebase Authentication, Cloud Firestore.
- **Features:** Searchable topic-based feed, newest/most-response sorting, account-based stories and replies, generated usernames, ownership checks, and server-side tone warnings for replies.

Before submitting, verify the repository, deployed app, and demo links in a private browser window, then complete the official form: <https://forms.gle/sBy4sfqyiRG2Zpom9>.
