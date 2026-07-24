# Kora AI - Production RAG System with Evaluation Framework

Kora AI is a Retrieval-Augmented Generation (RAG) system with support for Dense, Sparse (BM25), and Hybrid (RRF) retrieval, evaluation metrics, and interactive visualizations.

The codebase is split into **standalone frontend (`client`)** and **backend (`server`)** applications for independent deployment and development.

---

## Project Structure

```text
Kora-AI/
├── client/          # Frontend React + Vite application
│   ├── src/         # React components, pages, visual styles
│   ├── package.json # Frontend dependencies
│   └── vercel.json  # Vercel deployment config
│
├── server/          # Backend Express API & RAG pipeline
│   ├── routes/      # Express API routes (/api/upload, /api/chat, /api/evaluate)
│   ├── services/    # Retrieval, chat, document ingestion & evaluation services
│   ├── lib/         # Embeddings & Vector store setup
│   ├── render.yaml  # Render backend deployment blueprint
│   └── package.json # Backend dependencies
│
└── package.json     # Workspace root manager
```

---

## Local Setup & Development

### 1. Install Dependencies

Install dependencies for both client and server:

```bash
npm run install:all
```

Or install individually:

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Configure Environment Variables

Create `server/.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=kora-ai
HF_API_KEY=your_huggingface_api_key
HF_EMBEDDING_MODEL=sentence-transformers/distiluse-base-multilingual-cased
```

Create `client/.env` (optional for local dev proxy):

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Running Locally

Start Backend API (runs on `http://localhost:3000`):

```bash
npm run dev:server
```

Start Frontend (runs on `http://localhost:5173`):

```bash
npm run dev:client
```

---

## Deployment Instructions

### Deploying Frontend (`client`)
- **Platform**: Vercel / Netlify / Cloudflare Pages / Render Static Site
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://kora-backend.onrender.com`)

### Deploying Backend (`server`)
- **Platform**: Render / Railway / Vercel Serverless / AWS
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Set `GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `HF_API_KEY`, and `FRONTEND_URL` (set to your deployed frontend domain for CORS).

---

## CLI Tools (Terminal Chat & Document Indexing)

To index a document via CLI:

```bash
npm run index-doc
```

To start terminal chat:

```bash
npm run chat
```
