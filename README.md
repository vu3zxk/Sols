# Gemini Reflections Journal

A user-authenticated multi-turn reflective journaling and AI synthesis application powered by **Google Gemini 3.6 Flash**, **Firebase Authentication**, and **Cloud Firestore**.

---

## System Architecture & Security Directives

This application implements zero-trust boundaries and follows OWASP Top 10 Web / LLM Application standards:
- **Identity & Authentication**: Google Sign-In with Firebase Authentication. Zero passwords stored in application code.
- **Database Partitioning**: Strict user isolation in Cloud Firestore under `/users/{userId}/reflections/{reflectionId}`.
- **AI Processing Engine**: Multi-turn reflective dialogue and automated summaries using `@google/genai` on an Express backend proxy.
- **Model Fallback Ladder**: Built-in 4-tier fallback (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **Secret Hygiene**: Zero API keys exposed to browser bundle; all Gemini credentials managed via Google Cloud Secret Manager / environment variables.

---

## 1. Prerequisites & Environment Setup

1. **Google Cloud Project**: Ensure billing is enabled and you have the Google Cloud CLI (`gcloud`) installed.
2. **Enable Required Google Cloud APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     identitytoolkit.googleapis.com
   ```

---

## 2. Cloud Firestore Security Configuration

Deploy owner-bound security rules to ensure users cannot read or write each other's journal entries:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 3. Secret Manager Setup & Bindings

Store your Gemini API key in Google Cloud Secret Manager and grant Cloud Run runtime service account access:

```bash
# Set your project configuration
PROJECT_ID="YOUR_PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant Cloud Run default compute service account access
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# Build & deploy container
gcloud run deploy gemini-reflections-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 5. Required Campaign Labeling

Apply the mandatory challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update gemini-reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite)
npm run dev

# Lint & type check
npm run lint

# Build for production
npm run build
```
