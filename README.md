# 🌌 Kora AI — Production RAG System with Evaluation Framework

**Kora AI** is an enterprise-grade Retrieval-Augmented Generation (RAG) system built to deliver accurate, fast, and source-cited answers over document knowledge bases (manuals, FAQs, specifications, and PDFs).

It features **runtime retrieval strategy switching** (Dense, Sparse BM25, and Hybrid RRF), an interactive **Retrieved Chunk Inspector**, and a **RAGAS Evaluation Framework** dashboard.

---

## 📐 Project Structure

The repository is organized into decoupled **client** (frontend) and **server** (backend) directories for easy maintenance and independent deployment:

```text
Kora-AI/
├── client/                     # Frontend React 19 + Vite App
│   ├── src/                    # App UI, Dashboard, ThreeScene & Styles
│   ├── public/                 # Static assets
│   ├── package.json            # Client dependencies & scripts
│   ├── vite.config.js          # Vite build & proxy config
│   ├── tailwind.config.cjs     # Styling configuration
│   ├── .env.example            # Client env template (VITE_API_BASE_URL)
│   └── vercel.json             # Vercel static deployment config
│
├── server/                     # Backend Express API & RAG Services
│   ├── routes/                 # API endpoints (/api/upload, /api/chat, /api/evaluate)
│   ├── services/               # Retrieval, Chat, Document Ingestion & Evaluation
│   ├── lib/                    # HuggingFace Embeddings & Pinecone Vector Store
│   ├── data/                   # Evaluation history store
│   ├── server.js               # Express application entry point
│   ├── package.json            # Server dependencies & scripts
│   ├── render.yaml             # Render deployment blueprint
│   ├── .env.example            # Server env template (Groq, Pinecone, HF keys)
│   └── cg-internal-docs.pdf    # Default knowledge base document
│
├── README.md                   # Project documentation
├── package.json                # Monorepo root workspace runner
└── .gitignore                  # Git ignore rules
```

---

## ⚡ Core Features

- **Multi-Strategy Retrieval**:
  - **Dense Retrieval**: Semantic vector search using HuggingFace embeddings (`intfloat/e5-large-v2`) stored in Pinecone vector database.
  - **Sparse Retrieval**: Exact keyword/lexical search powered by BM25.
  - **Hybrid Retrieval**: Merges Dense and Sparse rankings using **Reciprocal Rank Fusion (RRF)**.
  - **Runtime Strategy Switcher**: Switch strategies dynamically from the UI.
- **Fast LLM Answer Synthesis**: Powered by **Groq (Llama 3.3 70B Versatile)** with transparent source citations.
- **Document Ingestion Engine**: Drag-and-drop PDF upload with automatic text extraction, chunking, vector indexing, and BM25 token registration.
- **Retrieved Chunk Inspector**: View retrieved text snippets, relevance scores, and retrieval methods behind every generated answer.
- **RAGAS Evaluation Framework**: Measure **Faithfulness**, **Context Recall**, and **Answer Relevancy** across retrieval strategies with an interactive dashboard and email summary reports.

---

## ⚙️ Requirements & API Keys

Before starting, obtain the following credentials:

1. **Groq API Key**: Get a free API key at [console.groq.com](https://console.groq.com/).
2. **Pinecone API Key & Index**: Create a 512-dimension index (metric: `cosine`) at [pinecone.io](https://www.pinecone.io/).
3. **HuggingFace API Key**: Generate an access token at [huggingface.co](https://huggingface.co/settings/tokens).

---

## 🚀 Quick Start

### 1. Install Dependencies

Install dependencies for both `client` and `server` at once from the root directory:

```bash
npm run install:all
```

*(Alternatively, run `npm install` inside `./client` and `./server` separately).*

---

### 2. Setup Environment Variables

Create `./server/.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

# Required API Credentials
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=kora-ai
HF_API_KEY=your_huggingface_api_key_here
HF_EMBEDDING_MODEL=intfloat/e5-large-v2

# Optional Email Configuration (For Sending Evaluation Reports)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Create `./client/.env` (Optional for local development):

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

### 3. Run Locally

Start the Backend Server (runs on `http://localhost:3000`):

```bash
npm run dev:server
```

In a second terminal, start the Frontend App (runs on `http://localhost:5173`):

```bash
npm run dev:client
```

Open `http://localhost:5173` in your browser.

---

## 💻 CLI Usage

Kora AI includes built-in command-line tools for offline indexing and terminal chat:

### Index a Document via CLI
```bash
npm run index-doc
```

### Terminal Chat Interface
```bash
npm run chat
```

---

## 🌐 Deployment Guide

### Deploying Frontend (`client`)
- **Supported Platforms**: Vercel, Netlify, Cloudflare Pages, Render Static Site.
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Set `VITE_API_BASE_URL` to your deployed backend URL.

### Deploying Backend (`server`)
- **Supported Platforms**: Render, Railway, Vercel Serverless, AWS Elastic Beanstalk.
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Set `GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `HF_API_KEY`, and `FRONTEND_URL`.

---

## 🛡️ License

This project is open source and available under the [MIT License](LICENSE).
