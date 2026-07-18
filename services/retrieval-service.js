import { vectorStore } from "../lib/vector-store.js";

// Phase 1 keeps the lexical index in process memory.
const chunkCatalog = new Map();
const sparseState = {
  documentFrequencies: new Map(),
  chunkFrequencies: new Map(),
  chunkLengths: new Map(),
  totalTerms: 0,
};
const RRF_K = 60;

function tokenize(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function result(chunk, score, retrievalMethod) {
  return {
    id: chunk.metadata.chunkId,
    pageContent: chunk.pageContent,
    metadata: chunk.metadata,
    score,
    retrievalMethod,
  };
}

function removeChunkFromSparseState(chunkId) {
  const frequencies = sparseState.chunkFrequencies.get(chunkId);
  const length = sparseState.chunkLengths.get(chunkId) ?? 0;
  if (!frequencies) {
    return;
  }

  frequencies.forEach((_count, term) => {
    const count = sparseState.documentFrequencies.get(term) ?? 0;
    if (count <= 1) {
      sparseState.documentFrequencies.delete(term);
    } else {
      sparseState.documentFrequencies.set(term, count - 1);
    }
  });

  sparseState.chunkFrequencies.delete(chunkId);
  sparseState.chunkLengths.delete(chunkId);
  sparseState.totalTerms -= length;
}

function addChunkToSparseState(chunk) {
  const chunkId = chunk.metadata.chunkId;
  if (chunkCatalog.has(chunkId)) {
    removeChunkFromSparseState(chunkId);
  }

  const terms = tokenize(chunk.pageContent);
  const frequencies = new Map();
  terms.forEach((term) =>
    frequencies.set(term, (frequencies.get(term) ?? 0) + 1),
  );

  const uniqueTerms = [...frequencies.keys()];
  uniqueTerms.forEach((term) => {
    sparseState.documentFrequencies.set(
      term,
      (sparseState.documentFrequencies.get(term) ?? 0) + 1,
    );
  });

  sparseState.chunkFrequencies.set(chunkId, frequencies);
  sparseState.chunkLengths.set(chunkId, terms.length);
  sparseState.totalTerms += terms.length;
}

export function addChunksToCatalog(chunks) {
  chunks.forEach((chunk) => {
    chunkCatalog.set(chunk.metadata.chunkId, chunk);
    addChunkToSparseState(chunk);
  });
}

export async function denseRetrieval(question, k = 3) {
  const matches = await vectorStore.similaritySearchWithScore(question, k);
  return matches.map(([chunk, score]) => result(chunk, score, "dense"));
}

export function sparseRetrieval(question, k = 3) {
  const queryTerms = [...new Set(tokenize(question))];
  if (!queryTerms.length || !chunkCatalog.size) return [];

  const documentCount = chunkCatalog.size;
  const averageLength = sparseState.chunkLengths.size
    ? sparseState.totalTerms / sparseState.chunkLengths.size
    : 1;
  const k1 = 1.5;
  const b = 0.75;

  const termIdf = new Map();
  queryTerms.forEach((term) => {
    const documentFrequency = sparseState.documentFrequencies.get(term) ?? 0;
    termIdf.set(
      term,
      Math.log(
        1 +
          (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5),
      ),
    );
  });

  return [...chunkCatalog.values()]
    .map((chunk) => {
      const chunkId = chunk.metadata.chunkId;
      const frequencies = sparseState.chunkFrequencies.get(chunkId);
      const length = sparseState.chunkLengths.get(chunkId) ?? 0;
      let score = 0;

      queryTerms.forEach((term) => {
        const frequency = frequencies?.get(term) ?? 0;
        if (!frequency) return;
        const idf = termIdf.get(term) ?? 0;
        const normalization = k1 * (1 - b + b * (length / averageLength));
        score += idf * ((frequency * (k1 + 1)) / (frequency + normalization));
      });

      return result(chunk, score, "sparse");
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, k);
}

export async function hybridRetrieval(question, k = 3) {
  const [dense, sparse] = await Promise.all([
    denseRetrieval(question, k),
    sparseRetrieval(question, k),
  ]);
  const fused = new Map();

  [dense, sparse].forEach((ranking) =>
    ranking.forEach((entry, index) => {
      const existing = fused.get(entry.id) ?? {
        ...entry,
        score: 0,
        retrievalMethod: "hybrid",
      };
      existing.score += 1 / (RRF_K + index + 1);
      fused.set(entry.id, existing);
    }),
  );

  return [...fused.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, k);
}

export async function retrieve(question, strategy = "dense", k = 3) {
  if (strategy === "dense") return denseRetrieval(question, k);
  if (strategy === "sparse") return sparseRetrieval(question, k);
  if (strategy === "hybrid") return hybridRetrieval(question, k);
  throw new Error(`Unsupported retrieval strategy: ${strategy}`);
}
