import Groq from "groq-sdk";
import { retrieve } from "./retrieval-service.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an assistant for question-answering tasks. Use the following relevant pieces of retrieved context to answer the question. If you don't know the answer, say I don't know.`;

function tokenizeText(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function uniqueTokens(text) {
  return [...new Set(tokenizeText(text))];
}

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function evaluateAnswer(question, answer, retrievedChunks) {
  const answerTokens = uniqueTokens(answer);
  const questionTokens = new Set(uniqueTokens(question));
  const allContextText = retrievedChunks
    .map((chunk) => chunk.pageContent)
    .join(" ");
  const topContextText =
    retrievedChunks.length > 0 ? retrievedChunks[0].pageContent : "";

  const allContextTokens = new Set(uniqueTokens(allContextText));
  const topContextTokens = new Set(uniqueTokens(topContextText));

  const matchedInTop = answerTokens.filter((token) =>
    topContextTokens.has(token),
  ).length;
  const matchedInAll = answerTokens.filter((token) =>
    allContextTokens.has(token),
  ).length;
  const matchedWithQuestion = answerTokens.filter((token) =>
    questionTokens.has(token),
  ).length;

  const faithfulness = answerTokens.length
    ? clamp(matchedInTop / answerTokens.length)
    : 1;
  const contextRecall = answerTokens.length
    ? clamp(matchedInAll / answerTokens.length)
    : 1;
  const questionOverlap = questionTokens.size
    ? matchedWithQuestion / questionTokens.size
    : 0;
  const answerRelevancy = clamp(
    (questionOverlap +
      (answerTokens.length ? matchedInAll / answerTokens.length : 1)) /
      2,
  );

  return {
    faithfulness,
    contextRecall,
    answerRelevancy,
  };
}

export async function answerQuestion(question, strategy = "dense", k = 3) {
  const retrievedChunks = await retrieve(question, strategy, k);
  const context = retrievedChunks
    .map((chunk) => chunk.pageContent)
    .join("\n\n");

  const userQuery = `Question: ${question}
Relevant context: ${context}
Answer:`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    model: "llama-3.3-70b-versatile",
  });

  const answer = completion.choices[0].message.content;
  const evaluation = evaluateAnswer(question, answer, retrievedChunks);

  return {
    answer,
    strategy,
    evaluation,
    retrievedChunks: retrievedChunks.map((chunk) => ({
      pageContent: chunk.pageContent,
      score: chunk.score,
      retrievalMethod: chunk.retrievalMethod,
      metadata: chunk.metadata,
    })),
    sources: retrievedChunks.map((chunk) => chunk.metadata),
  };
}
