import { retrieve } from "./retrieval-service.js";
import { answerQuestion } from "./chat-service.js";

export async function evaluateAllStrategies(question, k = 3) {
  const strategies = ["dense", "sparse", "hybrid"];
  const results = [];

  for (const strategy of strategies) {
    const startTime = Date.now();

    try {
      const result = await answerQuestion(question, strategy, k);
      const endTime = Date.now();
      const latency = endTime - startTime;

      results.push({
        strategy,
        answer: result.answer,
        latency,
        evaluation: result.evaluation,
        retrievedChunks: result.retrievedChunks,
        chunkCount: result.retrievedChunks?.length ?? 0,
        error: null,
      });
    } catch (error) {
      const endTime = Date.now();
      const latency = endTime - startTime;

      results.push({
        strategy,
        answer: null,
        latency,
        evaluation: null,
        retrievedChunks: [],
        chunkCount: 0,
        error: error.message,
      });
    }
  }

  const avgLatency =
    results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const bestStrategy = results.reduce((best, r) =>
    !r.error &&
    (!best.error ||
      r.evaluation?.answerRelevancy > best.evaluation?.answerRelevancy)
      ? r
      : best,
  );

  return {
    question,
    results,
    summary: {
      avgLatency,
      bestStrategy: bestStrategy.strategy,
      allSucceeded: results.every((r) => !r.error),
    },
  };
}
