import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { 
  Upload, 
  Send, 
  Layers, 
  BarChart2, 
  Mail, 
  FileText, 
  Sparkles, 
  Database,
  Info,
  Copy,
  Check,
  Trash2,
  User,
  Cpu,
  MessageSquare
} from "lucide-react";
import Dashboard from "./Dashboard.jsx";
import ThreeScene from "./ThreeScene.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function parseJsonResponse(response) {
  const bodyText = await response.text();
  try {
    return JSON.parse(bodyText);
  } catch (err) {
    if (bodyText.trim().startsWith("<!DOCTYPE") || bodyText.trim().startsWith("<html")) {
      const targetUrl = API_BASE_URL || window.location.origin;
      throw new Error(
        `Backend API connection error: Received HTML from ${response.url}.\n\n` +
        `Cause: The frontend cannot reach the backend API server.\n` +
        `Solution: In your Vercel / deployment environment variables, add:\n` +
        `VITE_API_BASE_URL = https://your-render-backend-url.onrender.com`
      );
    }
    throw new Error(
      `Expected JSON response but received invalid data:\n${bodyText.slice(0, 300)}`
    );
  }
}

export default function App() {
  const messageListRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [strategy, setStrategy] = useState("dense");
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleCopyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "chat";
    const hash = window.location.hash.replace("#", "");
    if (hash === "/dashboard" || hash === "dashboard") return "dashboard";
    if (window.location.pathname.endsWith("/dashboard")) return "dashboard";
    return "chat";
  });

  useEffect(() => {
    function syncFromHash() {
      const h = window.location.hash.replace("#", "");
      if (h === "/dashboard" || h === "dashboard") setActiveTab("dashboard");
      else setActiveTab("chat");
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) {
      return;
    }

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });

    if (messageList.lastElementChild) {
      gsap.fromTo(
        messageList.lastElementChild,
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.15)" }
      );
    }
  }, [messages]);

  useEffect(() => {
    gsap.from([".hero-headline > div", ".hero-feature", ".nav-tab"], {
      opacity: 0,
      y: 24,
      duration: 0.85,
      ease: "power3.out",
      stagger: 0.12,
      delay: 0.2,
    });
  }, []);

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setUploadStatus("Choose a PDF before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      setIsUploading(true);
      setUploadStatus("Uploading and indexing document...");

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setUploadStatus(
        `${data.message} ${data.chunksIndexed} chunks added from ${data.metadata.source}.`,
      );
    } catch (error) {
      setUploadStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function executeAsk(trimmedQuestion) {
    const nextMessages = [
      ...messages,
      { role: "user", content: trimmedQuestion },
    ];
    setMessages(nextMessages);
    setQuestion("");

    try {
      setIsChatting(true);
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion, strategy }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Chat request failed.");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.answer,
          sources: data.retrievedChunks ?? data.sources,
          evaluation: data.evaluation,
        },
      ]);
      setLastEvaluation(
        data.evaluation
          ? { ...data.evaluation, strategy: data.strategy }
          : null,
      );
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: error.message,
          sources: [],
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    if (showIntro) {
      gsap.to(".empty-state", {
        opacity: 0,
        y: -30,
        scale: 0.95,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          setShowIntro(false);
          executeAsk(trimmedQuestion);
        }
      });
    } else {
      executeAsk(trimmedQuestion);
    }
  }

  function handleSuggestionClick(prompt) {
    if (showIntro) {
      gsap.to(".empty-state", {
        opacity: 0,
        y: -30,
        scale: 0.95,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          setShowIntro(false);
          executeAsk(prompt);
        }
      });
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-visual">
          <ThreeScene />
        </div>
        <div className="hero-headline" style={{ maxWidth: "680px" }}>
          <div>
            <p className="eyebrow">Kora-AI RAG Platform</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px", marginBottom: "20px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Layers size={13} /> Active Retrieval Strategy
              </span>
              <div className="strategy-cards-grid">
                <button 
                  type="button"
                  className={`strategy-card-select ${strategy === "dense" ? "active" : ""}`}
                  onClick={() => setStrategy("dense")}
                >
                  <div className="strategy-card-icon dense">
                    <Sparkles size={14} />
                  </div>
                  <div className="strategy-card-content">
                    <span className="title">Dense Retrieval</span>
                    <span className="desc">Semantic matching via Pinecone</span>
                  </div>
                </button>
                
                <button 
                  type="button"
                  className={`strategy-card-select ${strategy === "sparse" ? "active" : ""}`}
                  onClick={() => setStrategy("sparse")}
                >
                  <div className="strategy-card-icon sparse">
                    <Layers size={14} />
                  </div>
                  <div className="strategy-card-content">
                    <span className="title">Sparse BM25</span>
                    <span className="desc">Keyword match for exact words</span>
                  </div>
                </button>
                
                <button 
                  type="button"
                  className={`strategy-card-select ${strategy === "hybrid" ? "active" : ""}`}
                  onClick={() => setStrategy("hybrid")}
                >
                  <div className="strategy-card-icon hybrid">
                    <Database size={14} />
                  </div>
                  <div className="strategy-card-content">
                    <span className="title">Hybrid RRF</span>
                    <span className="desc">Combined rank fusion model</span>
                  </div>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <span className="feature-pill">
                <Sparkles size={13} style={{ marginRight: 4 }} /> Transparent citations
              </span>
              <span className="feature-pill">
                <Mail size={13} style={{ marginRight: 4 }} /> Email reports
              </span>
            </div>
            
            <p style={{ marginTop: "16px", color: "var(--muted)", maxWidth: "58ch", lineHeight: "1.7", fontSize: "0.95rem", marginBottom: "20px" }}>
              Evaluate, visualize, and compare Dense, Sparse (BM25), and Hybrid retrieval models in real-time.
            </p>

            <div className="system-monitor-grid">
              <div className="status-item">
                <span className="label">Vector Index</span>
                <span className="value">
                  <span className="pulse-dot"></span> Pinecone
                </span>
              </div>
              <div className="status-item">
                <span className="label">Generator LLM</span>
                <span className="value">Llama 3.3 70B</span>
              </div>
              <div className="status-item">
                <span className="label">Embeddings</span>
                <span className="value">HF (384-dim)</span>
              </div>
              <div className="status-item">
                <span className="label">Cluster Status</span>
                <span className="value" style={{ color: "#10b981" }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="nav-tabs-container">
        <nav className="nav-tabs-segmented" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "chat"}
            className={`nav-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => {
              window.location.hash = "#/";
              setActiveTab("chat");
            }}
          >
            <MessageSquare size={16} className="nav-tab-icon" />
            <span>Chat Shell</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "dashboard"}
            className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              window.location.hash = "#/dashboard";
              setActiveTab("dashboard");
            }}
          >
            <BarChart2 size={16} className="nav-tab-icon" />
            <span>Strategy Comparison</span>
          </button>
        </nav>
      </div>

      {activeTab === "dashboard" ? (
        <Dashboard onBackToChat={() => {
          window.location.hash = "#/";
          setActiveTab("chat");
        }} />
      ) : (
        <section className="panel-grid">
          <form className="panel" onSubmit={handleUpload}>
            <h2 style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload size={18} /> 1. Upload PDF
            </h2>
            <label className="upload-box">
              <Upload size={32} style={{ margin: "0 auto 8px", color: "var(--accent)" }} />
              <span style={{ fontWeight: "600", fontSize: "0.92rem", color: "var(--text)" }}>
                {selectedFile ? selectedFile.name : "Select a PDF document"}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>PDF files up to 10MB</span>
              <input
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
            <button type="submit" disabled={isUploading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {isUploading ? "Indexing Document..." : "Upload and Index"}
            </button>
            <p className="status-text" style={{ fontSize: "0.82rem", marginTop: "12px", textAlign: "center" }}>
              {uploadStatus || "Ingested chunks are embedded and indexed in Pinecone."}
            </p>
          </form>

          <section className="panel chat-panel">
            <div className="chat-header">
              <div>
                <h2 style={{ fontSize: "1.2rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Database size={16} /> 2. Ask RAG Bot
                </h2>
                <p style={{ fontSize: "0.82rem", margin: "2px 0 0", color: "var(--muted)" }}>
                  Answers include interactive chunk references and performance scores.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {messages.length > 0 && (
                  <button
                    type="button"
                    className="clean-chat-btn"
                    onClick={() => {
                      setMessages([]);
                      setLastEvaluation(null);
                      setShowIntro(true);
                    }}
                    style={{ fontSize: "0.78rem", padding: "6px 10px" }}
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                )}
                <button
                  type="button"
                  className="email-button"
                  onClick={() => {
                    window.location.hash = "#/dashboard";
                    setActiveTab("dashboard");
                  }}
                  style={{ fontSize: "0.78rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <BarChart2 size={13} /> Compare models
                </button>
                <div className="strategy-picker">
                  <select
                    value={strategy}
                    onChange={(event) => setStrategy(event.target.value)}
                    style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                  >
                    <option value="dense">Dense</option>
                    <option value="sparse">Sparse (BM25)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {lastEvaluation ? (
              <div className="evaluation-summary" style={{ margin: "4px 0", padding: "8px 12px" }}>
                <span style={{ gridColumn: "span 2", fontWeight: "700", borderBottom: "1px solid rgba(99,102,241,0.08)", paddingBottom: "4px", fontSize: "0.8rem" }}>
                  <Info size={13} /> Strategy: {lastEvaluation.strategy.toUpperCase()}
                </span>
                <span style={{ fontSize: "0.78rem" }}>
                  Faithfulness: <strong>{(lastEvaluation.faithfulness * 100).toFixed(0)}%</strong>
                </span>
                <span style={{ fontSize: "0.78rem" }}>
                  Context recall: <strong>{(lastEvaluation.contextRecall * 100).toFixed(0)}%</strong>
                </span>
                <span style={{ gridColumn: "span 2", marginTop: "2px", fontSize: "0.78rem" }}>
                  Answer relevancy: <strong>{(lastEvaluation.answerRelevancy * 100).toFixed(0)}%</strong>
                </span>
              </div>
            ) : null}

            <div ref={messageListRef} className="message-list">
              {showIntro ? (
                <div className="empty-state-card">
                  <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.45rem", fontFamily: "Plus Jakarta Sans", color: "var(--text)" }}>Kora–AI RAG Assistant</h3>
                  <p style={{ margin: "6px 0 16px", fontSize: "0.92rem", color: "var(--muted)" }}>Ask questions to retrieve context and synthesize answers</p>
                  
                  {/* Siri/Gemini voice wave visualizer animation */}
                  <div className="ai-visualizer">
                    <div className="visualizer-bar"></div>
                    <div className="visualizer-bar"></div>
                    <div className="visualizer-bar"></div>
                    <div className="visualizer-bar"></div>
                    <div className="visualizer-bar"></div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={`message message-${message.role}`}
                  >
                    <div className="message-header">
                      <p className="message-role" style={{ display: "flex", alignItems: "center", gap: "6px", margin: 0, color: message.role === "user" ? "#b45309" : "var(--accent)" }}>
                        <span className={`chat-avatar ${message.role}`}>
                          {message.role === "user" ? <User size={11} /> : <Cpu size={11} />}
                        </span>
                        {message.role === "user" ? "User Query" : "RAG Synthesis"}
                      </p>
                      {message.role === "assistant" && (
                        <button
                          className={`copy-btn ${copiedIndex === index ? "copied" : ""}`}
                          onClick={() => handleCopyText(message.content, index)}
                          title="Copy response"
                        >
                          {copiedIndex === index ? <Check size={12} style={{ color: "#10b981" }} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                    <p style={{ whiteSpace: "pre-line", marginTop: "6px" }}>{message.content}</p>
                    {message.role === "assistant" &&
                    message.sources?.length > 0 ? (
                      <div className="source-block" style={{ marginTop: "10px" }}>
                        <p className="source-text" style={{ fontWeight: "700", fontSize: "0.8rem", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FileText size={12} /> Retrieved document chunks:
                        </p>
                        {message.sources.map((source, index) => (
                          <details
                            key={`${source.metadata?.chunkId ?? index}-${index}`}
                            className="source-entry"
                          >
                            <summary style={{ listStyleType: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                                {source.metadata?.source || "Indexed document"}
                              </span>
                              <span className="feature-pill" style={{ padding: "2px 8px", fontSize: "0.7rem", textTransform: "uppercase" }}>
                                {source.retrievalMethod || "dense"} ({(typeof source.score === "number" ? source.score.toFixed(2) : "n/a")})
                              </span>
                            </summary>
                            <p className="source-snippet" style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "8px", marginTop: "6px" }}>
                              {source.pageContent}
                            </p>
                          </details>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <form className="chat-form-tight" onSubmit={handleAsk}>
              <textarea
                rows="2"
                value={question}
                placeholder="Ask a question about the document..."
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleAsk(event);
                  }
                }}
              />
              <button type="submit" disabled={isChatting} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px" }}>
                <Send size={15} />
                {isChatting ? "Retrieving & Synthesizing..." : "Ask Bot"}
              </button>
            </form>
          </section>
        </section>
      )}
    </main>
  );
}
