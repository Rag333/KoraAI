import pdf from 'pdf-parse';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { vectorStore } from '../lib/vector-store.js';
import { addChunksToCatalog } from './retrieval-service.js';

async function splitIntoDocuments(pageContent, metadata = {}) {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
    });

    const texts = await textSplitter.splitText(pageContent);

    const source = metadata.source ?? 'document';

    return texts.map((chunk, chunkIndex) => ({
        pageContent: chunk,
        metadata: {
            ...metadata,
            chunkId: `${source}-${chunkIndex}`,
            chunkIndex,
        },
    }));
}

export async function indexTheDocument(filePath) {
    const loader = new PDFLoader(filePath, { splitPages: false });
    const doc = await loader.load();
    const documents = await splitIntoDocuments(doc[0].pageContent, doc[0].metadata);

    await vectorStore.addDocuments(documents);
    addChunksToCatalog(documents);
    return documents.length;
}

export async function indexDocumentFromBuffer(buffer, fileName = 'uploaded-document.pdf') {
    const parsedDocument = await pdf(buffer);
    const metadata = {
        source: fileName,
        uploadedAt: new Date().toISOString(),
    };

    const documents = await splitIntoDocuments(parsedDocument.text, metadata);
    await vectorStore.addDocuments(documents);
    addChunksToCatalog(documents);

    return {
        chunksIndexed: documents.length,
        metadata,
    };
}
