# AGENTS.md

# Production RAG System with Evaluation Framework

## Project Goal

This project is an implementation of ** Production RAG System with Evaluation Framework** .

The goal is to build a Retrieval-Augmented Generation (RAG) system over a product knowledge base consisting of manuals, FAQs, and specifications.

The system must support:

- Dense vector retrieval
- Sparse keyword retrieval (BM25)
- Hybrid retrieval (Reciprocal Rank Fusion)
- Runtime retrieval strategy selection
- RAGAS evaluation
- Retrieved chunk visualization
- Performance dashboard

The implementation should prioritize simplicity, correctness, and incremental development over enterprise-scale abstractions.

---

# Current Stack

Frontend
- React
- Vite

Backend
- Node.js
- Express

LLM
- Groq (Llama 3.3 70B Versatile)

Embeddings
- HuggingFace Embeddings

Vector Database
- Pinecone

Retrieval
- Dense
- Sparse (BM25)
- Hybrid (RRF)

---

# Current Architecture

React
    │
    ▼
Express API
    │
    ├── document-service.js
    ├── chat-service.js
    └── retrieval-service.js
                │
      ┌─────────┼─────────┐
      ▼         ▼         ▼
   Dense      Sparse    Hybrid
      │         │
      └────RRF──┘
          │
          ▼
      Pinecone
          │
          ▼
        Groq

---

# Completed Work

## Existing Features

- PDF upload
- PDF parsing
- Text chunking
- HuggingFace embeddings
- Pinecone indexing
- Groq answer generation
- Source citation

## Phase 1 Complete

Implemented:

- retrieval-service.js
- Dense retrieval extraction
- Sparse BM25 retrieval
- Hybrid retrieval (RRF)
- Unified retrieve(question, strategy, k)

Current retrieval result format:

{
    id,
    pageContent,
    metadata,
    score,
    retrievalMethod
}

Document ingestion now:

- assigns stable chunk IDs
- stores chunk metadata
- registers chunks for sparse retrieval

chat-service now delegates retrieval to retrieval-service while preserving existing API behavior.

---

# Current Roadmap

## Phase 2

Implement runtime retrieval strategy selection.

Frontend

Dense
Sparse
Hybrid

Backend

POST /api/chat

{
    question,
    strategy
}

Response should include:

- answer
- strategy
- retrieved chunks
- evaluation metadata

---

## Phase 3

Retrieved Chunk Viewer

Display:

- chunk text
- source
- score
- retrieval method

---

## Phase 4

RAGAS Evaluation

Implement:

- Faithfulness
- Context Recall
- Answer Relevancy

---

## Phase 5

Dashboard

Compare:

- Dense
- Sparse
- Hybrid

Display:

- Metrics
- Latency
- Charts

---

# Coding Principles

When modifying this project:

- Prefer minimal changes.
- Reuse existing code whenever possible.
- Preserve current behavior unless explicitly requested.
- Keep retrieval separate from generation.
- Keep APIs backward compatible.
- Avoid unnecessary abstractions.
- Avoid introducing new frameworks.
- Do not rewrite working code.
- Keep functions small and focused.

---

# File Responsibilities

document-service.js

Responsible for:

- document ingestion
- chunking
- embeddings
- Pinecone indexing

chat-service.js

Responsible for:

- prompt construction
- LLM interaction
- formatting responses

retrieval-service.js

Responsible for:

- dense retrieval
- sparse retrieval
- hybrid retrieval
- retrieval ranking

Frontend

Responsible only for:

- upload
- chat
- retrieval strategy selection
- displaying retrieved chunks
- dashboard

---

# Constraints

This project is being completed under limited time.

Favor:

- readable code
- maintainability
- incremental improvements

Avoid:

- over-engineering
- unnecessary optimization
- enterprise-scale architecture
- unrelated refactoring

---

# Definition of Done

The project is complete when it supports:

✓ Dense retrieval

✓ Sparse retrieval

✓ Hybrid retrieval

✓ Runtime strategy switching

✓ Retrieved chunk visualization

✓ RAGAS evaluation

✓ Dashboard comparing retrieval strategies

while preserving the existing upload and chat functionality.

---

# Instructions for AI Coding Agents

Before making changes:

1. Understand the current architecture.
2. Modify only the files required for the requested task.
3. Preserve backward compatibility unless explicitly instructed otherwise.
4. Explain architectural decisions before major refactors.
5. Keep implementations simple and production-oriented.
6. Do not modify unrelated files.
7. If multiple approaches are possible, choose the one with the smallest impact on the existing codebase.
8. After completing a task, summarize:
   - Files changed
   - Features added
   - Any assumptions made
   - Any follow-up work recommended