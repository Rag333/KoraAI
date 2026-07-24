# Kora AI - Production RAG System

This project keeps the original Groq plus Pinecone RAG flow and extends it with:

- HuggingFace embeddings
- Express APIs for PDF upload and chat
- React frontend for uploading PDFs and chatting with indexed content

## Environment Variables

Set these before running the app:

```bash
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index
HF_API_KEY=your_huggingface_api_key
HF_EMBEDDING_MODEL=sentence-transformers/distiluse-base-multilingual-cased
PORT=3000
```

`HF_API_KEY` is optional for basic public inference, but recommended for better rate limits. The default model here is set to a 512-dimensional Sentence Transformers embedding model so it matches a 512-dimension Pinecone index.

## Install

```bash
npm install
```

Create or update `.env` in the project root:

```bash
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index
HF_API_KEY=your_huggingface_api_key
HF_EMBEDDING_MODEL=sentence-transformers/distiluse-base-multilingual-cased
PORT=3000
```

## Original CLI Flows

Index the default PDF:

```bash
npm run run
```

Or:

```bash
npm run index-doc
```

Run terminal chat:

```bash
npm run chat
```

## Web App

Start the Express API:

```bash
npm start
```

Or:

```bash
npm run server
```

Start the React app in a second terminal:

```bash
npm run client
```

Then open `http://localhost:5173`.

To serve the built React app from Express:

```bash
npm run build
npm start
```
