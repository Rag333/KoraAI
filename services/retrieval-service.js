import { vectorStore } from '../lib/vector-store.js';

// Phase 1 keeps the lexical index in process memory.
const chunkCatalog = new Map();
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

export function addChunksToCatalog(chunks) {
    chunks.forEach((chunk) => chunkCatalog.set(chunk.metadata.chunkId, chunk));
}

export async function denseRetrieval(question, k = 3) {
    const matches = await vectorStore.similaritySearchWithScore(question, k);
    return matches.map(([chunk, score]) => result(chunk, score, 'dense'));
}

export function sparseRetrieval(question, k = 3) {
    const queryTerms = [...new Set(tokenize(question))];
    const entries = [...chunkCatalog.values()].map((chunk) => {
        const terms = tokenize(chunk.pageContent);
        const frequencies = new Map();
        terms.forEach((term) => frequencies.set(term, (frequencies.get(term) ?? 0) + 1));
        return { chunk, terms, frequencies };
    });

    if (!queryTerms.length || !entries.length) return [];

    const documentFrequencies = new Map();
    entries.forEach(({ frequencies }) => frequencies.forEach((_count, term) => {
        documentFrequencies.set(term, (documentFrequencies.get(term) ?? 0) + 1);
    }));
    const averageLength = entries.reduce((sum, entry) => sum + entry.terms.length, 0) / entries.length;
    const k1 = 1.5;
    const b = 0.75;

    return entries.map(({ chunk, terms, frequencies }) => {
        const score = queryTerms.reduce((total, term) => {
            const frequency = frequencies.get(term) ?? 0;
            if (!frequency) return total;
            const documentFrequency = documentFrequencies.get(term);
            const idf = Math.log(1 + ((entries.length - documentFrequency + 0.5) / (documentFrequency + 0.5)));
            const normalization = k1 * (1 - b + b * (terms.length / averageLength));
            return total + idf * ((frequency * (k1 + 1)) / (frequency + normalization));
        }, 0);
        return result(chunk, score, 'sparse');
    }).filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, k);
}

export async function hybridRetrieval(question, k = 3) {
    const [dense, sparse] = await Promise.all([denseRetrieval(question, k), sparseRetrieval(question, k)]);
    const fused = new Map();

    [dense, sparse].forEach((ranking) => ranking.forEach((entry, index) => {
        const existing = fused.get(entry.id) ?? { ...entry, score: 0, retrievalMethod: 'hybrid' };
        existing.score += 1 / (RRF_K + index + 1);
        fused.set(entry.id, existing);
    }));

    return [...fused.values()].sort((left, right) => right.score - left.score).slice(0, k);
}

export async function retrieve(question, strategy = 'dense', k = 3) {
    if (strategy === 'dense') return denseRetrieval(question, k);
    if (strategy === 'sparse') return sparseRetrieval(question, k);
    if (strategy === 'hybrid') return hybridRetrieval(question, k);
    throw new Error(`Unsupported retrieval strategy: ${strategy}`);
}
