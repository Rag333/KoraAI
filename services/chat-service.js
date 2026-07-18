import Groq from 'groq-sdk';
import { retrieve } from './retrieval-service.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an assistant for question-answering tasks. Use the following relevant pieces of retrieved context to answer the question. If you don't know the answer, say I don't know.`;

export async function answerQuestion(question) {
    const retrievedChunks = await retrieve(question, 'dense');
    const context = retrievedChunks.map((chunk) => chunk.pageContent).join('\n\n');

    const userQuery = `Question: ${question}
Relevant context: ${context}
Answer:`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: userQuery,
            },
        ],
        model: 'llama-3.3-70b-versatile',
    });

    return {
        answer: completion.choices[0].message.content,
        sources: retrievedChunks.map((chunk) => chunk.metadata),
    };
}
