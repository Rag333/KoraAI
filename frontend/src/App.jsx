import { useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) {
      return;
    }

    messageList.scrollTo({
      top: messageList.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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

      const data = await response.json();
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

  async function handleAsk(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

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

      const data = await response.json();
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

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">RAG Dashboard</p>
        <h1>Upload a PDF and chat with your company knowledge base.</h1>
        <p className="hero-copy">
          This UI keeps the existing Groq plus Pinecone retrieval flow in place
          and adds a simple document upload and chat experience on top.
        </p>
      </section>

      <section className="panel-grid">
        <form className="panel" onSubmit={handleUpload}>
          <h2>1. Upload PDF</h2>
          <label className="upload-box">
            <span>Select a PDF file</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
          <button type="submit" disabled={isUploading}>
            {isUploading ? "Indexing..." : "Upload and Index"}
          </button>
          <p className="status-text">
            {uploadStatus || "Your indexed chunks will be stored in Pinecone."}
          </p>
        </form>

        <section className="panel chat-panel">
          <div className="chat-header">
            <div>
              <h2>2. Ask Questions</h2>
              <p>
                Chat responses use runtime-selected retrieval and return
                citations plus evaluation metrics.
              </p>
            </div>
            <div className="strategy-picker">
              <label>
                Retrieval strategy
                <select
                  value={strategy}
                  onChange={(event) => setStrategy(event.target.value)}
                >
                  <option value="dense">Dense</option>
                  <option value="sparse">Sparse</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
            </div>
          </div>
          {lastEvaluation ? (
            <div className="evaluation-summary">
              <span>Strategy: {lastEvaluation.strategy}</span>
              <span>
                Faithfulness: {(lastEvaluation.faithfulness * 100).toFixed(0)}%
              </span>
              <span>
                Context recall:{" "}
                {(lastEvaluation.contextRecall * 100).toFixed(0)}%
              </span>
              <span>
                Answer relevancy:{" "}
                {(lastEvaluation.answerRelevancy * 100).toFixed(0)}%
              </span>
            </div>
          ) : null}

          <div ref={messageListRef} className="message-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                Ask a question after uploading at least one PDF.
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`message message-${message.role}`}
                >
                  <p className="message-role">
                    {message.role === "user" ? "You" : "Assistant"}
                  </p>
                  <p>{message.content}</p>
                  {message.role === "assistant" &&
                  message.sources?.length > 0 ? (
                    <div className="source-block">
                      <p className="source-text">Retrieved chunks:</p>
                      {message.sources.map((source, index) => (
                        <details
                          key={`${source.metadata?.chunkId ?? index}-${index}`}
                          className="source-entry"
                        >
                          <summary>
                            {source.metadata?.source || "Indexed document"} •{" "}
                            {source.retrievalMethod || "dense"} • score{" "}
                            {typeof source.score === "number"
                              ? source.score.toFixed(2)
                              : "n/a"}
                          </summary>
                          <p className="source-snippet">
                            {source.pageContent?.slice(0, 280) ?? ""}
                            {source.pageContent?.length > 280 ? "..." : ""}
                          </p>
                        </details>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <form className="chat-form" onSubmit={handleAsk}>
            <textarea
              rows="4"
              value={question}
              placeholder="What does the internal policy say about leave approval?"
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button type="submit" disabled={isChatting}>
              {isChatting ? "Thinking..." : "Send"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
