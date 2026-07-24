import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowLeft,
  Mail,
  Download,
  TrendingUp,
  Zap,
  Layers,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Award,
  Info,
  Clock,
  Activity,
  FileText,
  AlertTriangle
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseJsonResponse(response) {
  const bodyText = await response.text();
  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(
      `Expected JSON response but received HTML or invalid JSON:\n${bodyText.slice(0, 400)}`,
    );
  }
}

export default function Dashboard({ onBackToChat }) {
  const [question, setQuestion] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [history, setHistory] = useState([]);

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

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Evaluation failed.");
      }

      setEvaluation(data);
      setHistory((prev) => [...prev, { timestamp: Date.now(), question: trimmedQuestion, ...data }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/history`);
      const json = await parseJsonResponse(res);
      setHistory(json.results || []);
    } catch (e) {
      // ignore
    }
  }

  async function handleDownloadHistory() {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTimestamp(ts) {
    return new Date(ts).toLocaleString();
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      gsap.fromTo(
        ".history-bar",
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.85, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [history]);

  async function handleEmailResults(event) {
    event.preventDefault();
    if (!recipientEmail.trim() || !evaluation) return;

    try {
      setEmailLoading(true);
      setEmailMessage("");
      const response = await fetch(`${API_BASE_URL}/api/email-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          question: evaluation.question,
          results: evaluation.results,
          summary: evaluation.summary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email.");
      }

      setEmailMessage(`✓ Email sent successfully to ${recipientEmail}`);
      setRecipientEmail("");
      setTimeout(() => {
        setEmailOpen(false);
        setEmailMessage("");
      }, 2000);
    } catch (err) {
      setEmailMessage(`✗ Error: ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  }

  if (!evaluation) {
    return (
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          {onBackToChat && (
            <button 
              type="button" 
              onClick={onBackToChat} 
              className="back-chat-btn"
              style={{ marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={14} /> Back to Chat Shell
            </button>
          )}
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}><Activity size={32} style={{ color: "var(--accent)" }} /> Strategy Comparison Dashboard</h1>
          <p>
            Trigger all three retrieval configurations (Dense, Sparse, and Hybrid RFF) concurrently on a test prompt to benchmark exact performance.
          </p>
        </section>

        <section className="dashboard-panel">
          <form onSubmit={handleEvaluate}>
            <label>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.95rem" }}><FileText size={16} style={{ color: "var(--accent)" }} /> Enter evaluation test prompt:</span>
              <textarea
                rows="6"
                value={question}
                placeholder="What does the document say about safety and guidelines?"
                onChange={(event) => setQuestion(event.target.value)}
              />
            </label>
            <button type="submit" disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <Activity size={16} />
              {loading ? "Benchmarking Models..." : "Compare All Strategies"}
            </button>
          </form>

          {error && <div className="error-message" style={{ display: "flex", alignItems: "center", gap: "8px" }}><AlertTriangle size={16} /> {error}</div>}
        </section>

        {history.length > 0 && (
          <section className="comparison-section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Clock size={20} style={{ color: "var(--accent)" }} /> Recent Evaluation History</h2>
            <div className="metrics-grid">
              {history
                .slice(-3)
                .reverse()
                .map((item) => (
                  <div key={item.timestamp} className="metric-card">
                    <div className="strategy-name" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                      <Clock size={12} /> {formatTimestamp(item.timestamp)}
                    </div>
                    <div className="metric-row">
                      <span className="label">Question</span>
                      <span className="value" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "20ch" }}>{item.question}</span>
                    </div>
                    <div className="metric-row">
                      <span className="label">Avg Latency</span>
                      <span className="value">{item.summary.avgLatency.toFixed(0)}ms</span>
                    </div>
                    <div className="metric-row">
                      <span className="label">Best Strategy</span>
                      <span className="value" style={{ textTransform: "uppercase", color: "var(--accent)" }}>{item.summary.bestStrategy}</span>
                    </div>
                  </div>
                ))}
            </div>
            <button onClick={handleDownloadHistory} className="email-button" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Download size={14} /> Download History JSON
            </button>
          </section>
        )}
      </div>
    );
  }

  const { results, summary } = evaluation;

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          {onBackToChat && (
            <button 
              type="button" 
              onClick={onBackToChat} 
              className="back-chat-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={14} /> Back to Chat Shell
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setEvaluation(null)} 
            className="back-chat-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(26, 34, 48, 0.04)", border: "1px solid rgba(26, 34, 48, 0.08)", color: "var(--text)" }}
          >
            <Clock size={14} /> View History & Form
          </button>
        </div>
        <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}><Activity size={32} style={{ color: "var(--accent)" }} /> Strategy Comparison Results</h1>
        <p style={{ fontWeight: "600", fontSize: "0.95rem", color: "var(--text)" }}>Question: "{evaluation.question}"</p>
      </section>

      <section className="comparison-section">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Activity size={20} style={{ color: "var(--accent)" }} /> Performance Metrics</h2>
        <div className="metrics-grid">
          {results.map((result) => (
            <div key={result.strategy} className={`metric-card metric-card-${result.strategy}`}>
              <div className="strategy-name" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {result.strategy === "dense" && <Zap size={14} />}
                {result.strategy === "sparse" && <Layers size={14} />}
                {result.strategy === "hybrid" && <Sparkles size={14} />}
                {result.strategy.toUpperCase()}
              </div>

              {result.error ? (
                <div className="error-state" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={14} />
                  <p style={{ margin: 0 }}>Error: {result.error}</p>
                </div>
              ) : (
                <>
                  <div className="metric-row">
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> Latency</span>
                    <span className="value">{result.latency}ms</span>
                  </div>
                  <div className="metric-row">
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: "6px" }}><FileText size={14} /> Chunks Retrieved</span>
                    <span className="value">{result.chunkCount}</span>
                  </div>
                  <div className="metric-row">
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle2 size={14} /> Faithfulness</span>
                    <span className="value">
                      {(result.evaluation?.faithfulness * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Layers size={14} /> Context Recall</span>
                    <span className="value">
                      {(result.evaluation?.contextRecall * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="label" style={{ display: "flex", alignItems: "center", gap: "6px" }}><Award size={14} /> Answer Relevancy</span>
                    <span className="value">
                      {(result.evaluation?.answerRelevancy * 100).toFixed(0)}%
                    </span>
                  </div>
                </>
              )}

              {result.strategy === summary.bestStrategy && !result.error && (
                <div className="best-badge" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Award size={12} /> Best
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => {
              const dataStr = JSON.stringify(
                { question: evaluation.question, ...evaluation },
                null,
                2,
              );
              const blob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `evaluation-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="email-button"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Download size={14} /> Export JSON
          </button>
        </div>

        <div className="summary-box">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 12px" }}>
            <TrendingUp size={18} /> Comparison Summary
          </h3>
          <p>
            Average Latency: <strong>{summary.avgLatency.toFixed(0)}ms</strong>
          </p>
          <p>
            Best Retrieval Model: <strong style={{ textTransform: "uppercase" }}>{summary.bestStrategy}</strong>
          </p>
          <p>
            All Strategies Successful:{" "}
            <strong>{summary.allSucceeded ? "Yes" : "Some Failed"}</strong>
          </p>
        </div>

        <details className="guide-accordion">
          <summary className="guide-summary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info size={15} style={{ color: "var(--accent)" }} />
            <span>Understanding RAG Evaluation Metrics</span>
          </summary>
          <div className="guide-content">
            <div className="guide-item">
              <strong>Faithfulness</strong>: Measures whether the generated answer is grounded strictly in the retrieved source context. A score of 100% means the model did not hallucinate.
            </div>
            <div className="guide-item">
              <strong>Context Recall</strong>: Measures whether all relevant details from the source document needed to answer the question were successfully retrieved.
            </div>
            <div className="guide-item">
              <strong>Answer Relevancy</strong>: Measures how directly the generated answer addresses the user's initial question, filtering out redundancy.
            </div>
          </div>
        </details>

        <section className="comparison-section" style={{ marginTop: 24, padding: 0, border: "none", boxShadow: "none", background: "none" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px" }}><Award size={20} style={{ color: "var(--accent)" }} /> Strategy Comparison Chart</h2>
          <div className="chart-grid">
            {results.map((result) => {
              const score = Math.round(
                result.evaluation?.answerRelevancy * 100 || 0,
              );
              return (
                <div key={result.strategy} className={`metric-card metric-card-${result.strategy}`} style={{ minHeight: "auto" }}>
                  <div className="strategy-name" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    {result.strategy === "dense" && <Zap size={14} />}
                    {result.strategy === "sparse" && <Layers size={14} />}
                    {result.strategy === "hybrid" && <Sparkles size={14} />}
                    {result.strategy.toUpperCase()}
                  </div>
                  <div className="metric-row" style={{ padding: "4px 0" }}>
                    <span className="label">Relevancy Score</span>
                    <span className="value">{score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>

      <section className="comparison-section">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Clock size={20} style={{ color: "var(--accent)" }} /> Historical Trend (Last {history.length} runs)</h2>
        <div style={{ display: "flex", gap: 16, alignItems: "end", padding: "16px 8px 8px", background: "rgba(243, 241, 235, 0.45)", borderRadius: "18px", overflowX: "auto" }}>
          {history.slice(-8).map((h, idx) => (
            <div key={h.timestamp || idx} style={{ textAlign: "center", flex: 1, minWidth: "50px" }}>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
                {h.summary.avgLatency.toFixed(0)}ms
              </div>
              <svg width="100%" height="80" viewBox="0 0 40 80" style={{ overflow: "visible" }}>
                <rect
                  className="history-bar"
                  x="6"
                  y={80 - Math.min(70, Math.round(h.summary.avgLatency / 15))}
                  width="28"
                  height={Math.min(70, Math.round(h.summary.avgLatency / 15))}
                  fill="rgba(99, 102, 241, 0.18)"
                  stroke="rgba(99, 102, 241, 0.35)"
                  strokeWidth="1.5"
                  rx="6"
                  style={{ transformOrigin: "bottom" }}
                />
              </svg>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, whiteSpace: "nowrap" }}>
                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="answers-section">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}><FileText size={20} style={{ color: "var(--accent)" }} /> Answers by Strategy</h2>
        {results.map((result) => (
          <details key={result.strategy} className="answer-details">
            <summary style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {result.strategy === "dense" && <Zap size={14} />}
              {result.strategy === "sparse" && <Layers size={14} />}
              {result.strategy === "hybrid" && <Sparkles size={14} />}
              <span style={{ textTransform: "uppercase" }}>{result.strategy} Retrieve-Answer</span>
            </summary>
            <div className="answer-content">
              {result.error ? (
                <p className="error" style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={14} /> Error: {result.error}</p>
              ) : (
                <>
                  <p style={{ whiteSpace: "pre-line", borderLeft: "3px solid var(--accent)", paddingLeft: "12px", background: "rgba(250, 249, 246, 0.4)", padding: "12px", borderRadius: "12px" }}>{result.answer}</p>
                  <div className="retrieved-chunks">
                    <h4 style={{ display: "flex", alignItems: "center", gap: "6px" }}><Layers size={14} /> Retrieved Chunks ({result.chunkCount})</h4>
                    {result.retrievedChunks?.map((chunk, idx) => (
                      <details key={idx} className="chunk-details">
                        <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center", listStyleType: "none" }}>
                          <span style={{ fontWeight: "700" }}>{chunk.metadata?.source || "Source"}</span>
                          <span className="feature-pill" style={{ padding: "2px 8px", fontSize: "0.7rem", textTransform: "uppercase" }}>
                            {chunk.retrievalMethod} (score {typeof chunk.score === "number" ? chunk.score.toFixed(2) : "n/a"})
                          </span>
                        </summary>
                        <p style={{ borderTop: "1px solid rgba(99,102,241,0.06)", paddingTop: "8px", marginTop: "8px", color: "var(--text)" }}>{chunk.pageContent}</p>
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
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <ArrowLeft size={14} /> New Evaluation
        </button>
        <button
          onClick={() => setEmailOpen(!emailOpen)}
          className="email-button"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Mail size={14} /> Email Results
        </button>
      </section>

      {emailOpen && (
        <section className="email-modal">
          <div className="email-form-container">
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={18} style={{ color: "var(--accent)" }} /> Send Results via Email</h3>
            <form onSubmit={handleEmailResults} className="email-form">
              <input
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(event) => setRecipientEmail(event.target.value)}
                required
              />
              <button type="submit" disabled={emailLoading} style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <Mail size={14} />
                {emailLoading ? "Sending..." : "Send Email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailOpen(false);
                  setEmailMessage("");
                }}
                className="close-button"
              >
                Cancel
              </button>
            </form>
            {emailMessage && (
              <div
                className={`email-message ${emailMessage.startsWith("✓") ? "success" : "error"}`}
              >
                {emailMessage}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
