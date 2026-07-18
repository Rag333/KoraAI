import { Embeddings } from '@langchain/core/embeddings';

const DEFAULT_MODEL = 'sentence-transformers/distiluse-base-multilingual-cased';

function averageVectors(vectors) {
    if (!vectors.length) {
        return [];
    }

    const totals = new Array(vectors[0].length).fill(0);
    for (const vector of vectors) {
        vector.forEach((value, index) => {
            totals[index] += value;
        });
    }

    return totals.map((value) => value / vectors.length);
}

function toVector(item) {
    if (!Array.isArray(item) || !item.length) {
        return [];
    }

    if (typeof item[0] === 'number') {
        return item;
    }

    return averageVectors(item.map((nestedItem) => toVector(nestedItem)).filter(Boolean));
}

function normalizeEmbeddings(payload, expectedCount) {
    if (!Array.isArray(payload)) {
        throw new Error('Unexpected HuggingFace embedding response.');
    }

    if (typeof payload[0] === 'number') {
        return [payload];
    }

    if (expectedCount === 1) {
        return [toVector(payload)];
    }

    return payload.map((item) => toVector(item));
}

export class HuggingFaceEmbeddings extends Embeddings {
    constructor(fields = {}) {
        super(fields);
        this.apiKey = fields.apiKey ?? process.env.HF_API_KEY ?? process.env.HUGGINGFACE_API_KEY ?? '';
        this.model = fields.model ?? process.env.HF_EMBEDDING_MODEL ?? DEFAULT_MODEL;
    }

    async embedDocuments(texts) {
        if (!texts.length) {
            return [];
        }

        const response = await this.requestEmbeddings(texts);
        return normalizeEmbeddings(response, texts.length);
    }

    async embedQuery(text) {
        const response = await this.requestEmbeddings(text);
        return normalizeEmbeddings(response, 1)[0];
    }

    async requestEmbeddings(inputs) {
        const response = await fetch(`https://router.huggingface.co/hf-inference/models/${this.model}/pipeline/feature-extraction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
            },
            body: JSON.stringify({
                inputs,
                options: {
                    wait_for_model: true,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HuggingFace embeddings request failed: ${response.status} ${errorText}`);
        }

        return response.json();
    }
}
