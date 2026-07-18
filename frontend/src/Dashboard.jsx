import { useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export default function Dashboard() {
  const [question, setQuestion] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEvaluate(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Evaluation failed.");
      }

      setEvaluation(data);
    } catch (err) {
      setError(err.message);
      setEvaluation(null);
    } finally {
      setLoading(false);
    }
  }

  if (!evaluation) {
    return (
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <h1>Strategy Comparison Dashboard</h1>
          <p>
            Compare dense, sparse, and hybrid retrieval strategies on a single
            question.
          </p>
        </section>

        <section className="dashboard-panel">
          <form onSubmit={handleEvaluate}>
            <label>
              <span>Enter your question:</span>
              <textarea
                rows="6"
                value={question}
                placeholder="What does the manual say about maintenance procedures?"
                onChange={(event) => setQuestion(event.target.value)}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Evaluating..." : "Compare All Strategies"}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </section>
      </div>
    );
  }

  const { results, summary } = evaluation;

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <h1>Strategy Comparison Results</h1>
        <p>Question: {evaluation.question}</p>
      </section>

      <section className="comparison-section">
        <h2>Performance Metrics</h2>
        <div className="metrics-grid">
          {results.map((result) => (
            <div key={result.strategy} className="metric-card">
              <div className="strategy-name">
                {result.strategy.toUpperCase()}
              </div>

              {result.error ? (
                <div className="error-state">
                  <p>Error: {result.error}</p>
                </div>
              ) : (
                <>
                  <div className="metric-row">
                    <span className="label">Latency</span>
                    <span className="value">{result.latency}ms</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Chunks Retrieved</span>
                    <span className="value">{result.chunkCount}</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Faithfulness</span>
                    <span className="value">
                      {(result.evaluation?.faithfulness * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Context Recall</span>
                    <span className="value">
                      {(result.evaluation?.contextRecall * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Answer Relevancy</span>
                    <span className="value">
                      {(result.evaluation?.answerRelevancy * 100).toFixed(0)}%
                    </span>
                  </div>
                </>
              )}

              {result.strategy === summary.bestStrategy && !result.error && (
                <div className="best-badge">Best Strategy</div>
              )}
            </div>
          ))}
        </div>

        <div className="summary-box">
          <h3>Summary</h3>
          <p>
            Average Latency: <strong>{summary.avgLatency.toFixed(0)}ms</strong>
          </p>
          <p>
            Best Strategy: <strong>{summary.bestStrategy}</strong>
          </p>
          <p>
            All Strategies Successful:{" "}
            <strong>{summary.allSucceeded ? "Yes" : "Some Failed"}</strong>
          </p>
        </div>
      </section>

      <section className="answers-section">
        <h2>Answers by Strategy</h2>
        {results.map((result) => (
          <details key={result.strategy} className="answer-details">
            <summary>{result.strategy.toUpperCase()} Answer</summary>
            <div className="answer-content">
              {result.error ? (
                <p className="error">Error: {result.error}</p>
              ) : (
                <>
                  <p>{result.answer}</p>
                  <div className="retrieved-chunks">
                    <h4>Retrieved Chunks ({result.chunkCount})</h4>
                    {result.retrievedChunks?.map((chunk, idx) => (
                      <details key={idx} className="chunk-details">
                        <summary>
                          {chunk.metadata?.source} • {chunk.retrievalMethod} •
                          score{" "}
                          {typeof chunk.score === "number"
                            ? chunk.score.toFixed(2)
                            : "n/a"}
                        </summary>
                        <p>{chunk.pageContent?.slice(0, 400)}...</p>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </div>
          </details>
        ))}
      </section>

      <section className="dashboard-actions">
        <button
          onClick={() => {
            setEvaluation(null);
            setQuestion("");
          }}
          className="back-button"
        >
          New Evaluation
        </button>
      </section>
    </div>
  );
}
