# Parallel You

Parallel You is a behavioral AI layer for social platforms, built as:

- A Chrome Extension (Manifest v3) that overlays persona-driven AI assistance on X/Twitter, LinkedIn, and Reddit.
- A Cloud Run-ready Node.js app that now also serves a standalone frontend at `/` for users without the extension.

<img width="1591" height="1162" alt="Screenshot at Apr 25 19-20-12" src="https://github.com/user-attachments/assets/0d82bc5f-3837-4f19-be21-7a2c914328e8" />


## Production URL

- Live app: `https://parallel-you-backend-330015043682.us-central1.run.app`
- Health: `https://parallel-you-backend-330015043682.us-central1.run.app/health`
- Extension download: `https://parallel-you-backend-330015043682.us-central1.run.app/parallel-you-extension.zip`

## Security Note

- `OPENAI_API_KEY` is provided via Cloud Run environment variables and is not committed to this repository.

## Project Structure

```txt
parallel-you/
├── Dockerfile
├── .dockerignore
├── README.md
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── contentScript.js
│   ├── injectedUI.js
│   └── styles.css
└── server/
    ├── .env.example
    ├── package.json
    ├── public/
    │   ├── index.html
    │   ├── styles.css
    │   ├── app.js
    │   └── parallel-you-extension.zip
    └── src/
        ├── index.js
        ├── config.js
        ├── routes/
        │   ├── observe.js
        │   ├── generateReply.js
        │   ├── predict.js
        │   ├── truth.js
        │   └── scheduleReply.js
        ├── services/
        │   ├── openaiClient.js
        │   ├── personaPrompts.js
        │   ├── replyService.js
        │   ├── predictService.js
        │   ├── truthService.js
        │   └── schedulerService.js
        └── storage/
            └── memoryStore.js
```

## Features Implemented

- Persona-Based Reply Generator (`Professional`, `Unhinged`, `Analytical`)
- Prediction Engine (tone, engagement, risk flags)
- Shadow User opt-in behavior tracking (`/observe`)
- Reply Later Mode with async delayed generation (`/schedule-reply` + `/scheduled-replies`)
- Truth Mode rewrite (`/truth`)
- Safety default: no auto-posting, manual insertion only
- Standalone Web App UI at `/` for users without extension
- Extension download entry point from app (`/parallel-you-extension.zip`)

## Local Setup

1. Install dependencies:

```bash
cd /Users/kotra/experiments/parallel-you/server
npm install
```

2. Set environment variables:

```bash
export OPENAI_API_KEY="your_openai_key"
export OPENAI_MODEL="gpt-4.1-mini"
# Optional (if extension is published to Chrome Web Store)
export CHROME_WEB_STORE_URL="https://chromewebstore.google.com/detail/your-extension-id"
```

3. Run server:

```bash
npm start
```

4. Open app:

- `http://localhost:8080`

## Extension Setup (From Web App)

Open app at `/` and use **Download Extension (.zip)**.

Then:

1. Extract the zip.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select extracted extension folder.

If Developer Mode installs are blocked by browser/org policy, the app shows a **Chrome Web Store install button** when `CHROME_WEB_STORE_URL` is configured.

## API Endpoints

- `GET /health`
- `GET /app-config`
- `POST /observe`
- `POST /generate-reply`
- `POST /predict`
- `POST /truth`
- `POST /schedule-reply`
- `GET /scheduled-replies`

## Demo Flows

### A) Extension Flow

1. Start backend.
2. Open `https://x.com`.
3. Focus reply composer and open floating **Parallel You** panel.
4. Generate reply by persona.
5. Run prediction.
6. Run truth mode.
7. Schedule reply.
8. Refresh and see `You replied while away`.

### B) No Extension Flow

1. Open Cloud Run URL.
2. Paste post context and choose persona.
3. Generate reply.
4. Run prediction and truth mode.
5. Use reply later and wait for async completion message.

## Cloud Run Deployment

From repo root (`/Users/kotra/experiments/parallel-you`):

1. Set variables:

```bash
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="parallel-you-backend"
```

2. Build and push:

```bash
gcloud config set project "$PROJECT_ID"
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME"
```

3. Deploy:

```bash
gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars OPENAI_API_KEY="your_openai_key",OPENAI_MODEL="gpt-4.1-mini",CHROME_WEB_STORE_URL="https://chromewebstore.google.com/detail/your-extension-id"
```

4. Open the Cloud Run URL.

## Important Install Constraint

A website cannot silently bypass Chrome extension install restrictions.

Supported paths are:

- Load unpacked (Developer mode) from downloaded source.
- Install from Chrome Web Store (recommended for non-technical users and managed devices).

## Extension Ideas

- Replace in-memory state with Redis/Firestore.
- Replace `setTimeout` async jobs with Cloud Tasks + Pub/Sub.
- Add auth and per-user memory segmentation.
- Add platform-specific adapters for robust composer detection.
