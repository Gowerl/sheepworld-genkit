"use client";

import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import styles from "./page.module.css";

// Interface for search results
interface SearchResult {
  title: string;
  uri: string;
  snippet: string;
}

// Interface for chat message
interface ChatMessage {
  role: "user" | "model";
  text: string;
  citations?: Array<{ title: string; uri: string }>;
}

export default function Home() {
  // Config state
  const [dataStoreId, setDataStoreId] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // Tab navigation: 'search' | 'chat'
  const [activeTab, setActiveTab] = useState<"search" | "chat">("search");

  // Search tab states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSummary, setSearchSummary] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");

  // Chat tab states
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // Load configuration from local storage if available
  useEffect(() => {
    const savedDatastore = localStorage.getItem("vertex_ai_datastore_id");
    if (savedDatastore) {
      setDataStoreId(savedDatastore);
    }
  }, []);

  const saveDatastoreId = (id: string) => {
    setDataStoreId(id);
    localStorage.setItem("vertex_ai_datastore_id", id);
  };

  // Perform Classic Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchSummary("");
    setSearchResults([]);

    try {
      const searchFn = httpsCallable<any, any>(functions, "search");
      const response = await searchFn({
        query: searchQuery,
        dataStoreId: dataStoreId || undefined,
      });

      const data = response.data;
      setSearchSummary(data.summary || "");
      setSearchResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || "An error occurred while performing search.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Send message in Chat (RAG)
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessageText = chatInput;
    setChatInput("");
    setChatError("");

    // Append user message immediately to the chat view
    const newMessages: ChatMessage[] = [
      ...chatMessages,
      { role: "user", text: userMessageText },
    ];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      // Map current React state history to the schema expected by Genkit functions
      const historyPayload = chatMessages.map((msg) => ({
        role: msg.role,
        content: [{ text: msg.text }],
      }));

      const chatFn = httpsCallable<any, any>(functions, "chat");
      const response = await chatFn({
        query: userMessageText,
        history: historyPayload,
        dataStoreId: dataStoreId || undefined,
      });

      const data = response.data;
      setChatMessages([
        ...newMessages,
        {
          role: "model",
          text: data.text || "",
          citations: data.citations || [],
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "An error occurred during the chat.");
    } finally {
      setChatLoading(false);
    }
  };

  // Clear chat history
  const handleResetChat = () => {
    setChatMessages([]);
    setChatError("");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>🐑</span>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Sheepworld AI Hub</h1>
            <p className={styles.subtitle}>Grounded Search & Chat powered by Vertex AI & Genkit</p>
          </div>
        </div>
        <button
          className={styles.configToggleBtn}
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? "⚙️ Hide Config" : "⚙️ Datastore Config"}
        </button>
      </header>

      {showConfig && (
        <section className={styles.configCard}>
          <h3 className={styles.configTitle}>Vertex AI Search Configuration</h3>
          <p className={styles.configLabel}>
            Enter your Google Cloud Vertex AI Search Data Store ID below. If left blank, the system will fall back to the server environment variable.
          </p>
          <div className={styles.configInputRow}>
            <input
              type="text"
              className={styles.inputField}
              placeholder="e.g. website-search-datastore-id"
              value={dataStoreId}
              onChange={(e) => saveDatastoreId(e.target.value)}
            />
            {dataStoreId && (
              <button
                className={styles.clearBtn}
                onClick={() => saveDatastoreId("")}
              >
                Reset
              </button>
            )}
          </div>
          {dataStoreId && (
            <p className={styles.configSavedNote}>✓ Configuration saved to browser storage.</p>
          )}
        </section>
      )}

      {/* Main Tabs Navigation */}
      <nav className={styles.tabsNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === "search" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("search")}
        >
          🔍 Classic Search
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "chat" ? styles.activeTabBtn : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          💬 AI Chatbot
        </button>
      </nav>

      {/* Tabs Content */}
      <main className={styles.tabContent}>
        {/* TAB 1: SEARCH */}
        {activeTab === "search" && (
          <div className={styles.searchSection}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="What website information are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className={styles.searchSubmitBtn}
                disabled={searchLoading || !searchQuery.trim()}
              >
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {searchError && (
              <div className={styles.errorAlert}>
                <strong>Error:</strong> {searchError}
              </div>
            )}

            {searchLoading && (
              <div className={styles.loadingSpinnerContainer}>
                <div className={styles.spinner}></div>
                <p>Retrieving results and generating AI summary...</p>
              </div>
            )}

            {!searchLoading && (searchSummary || searchResults.length > 0) && (
              <div className={styles.resultsWrapper}>
                {searchSummary && (
                  <article className={styles.summaryCard}>
                    <h3 className={styles.summaryTitle}>✨ AI Summary</h3>
                    <p className={styles.summaryText}>{searchSummary}</p>
                  </article>
                )}

                <section className={styles.classicResultsSection}>
                  <h3 className={styles.sectionTitle}>
                    Grounded Search Results ({searchResults.length})
                  </h3>
                  {searchResults.length === 0 ? (
                    <p className={styles.noResultsText}>No direct page links returned. Use the AI Summary above.</p>
                  ) : (
                    <div className={styles.resultsGrid}>
                      {searchResults.map((result, idx) => (
                        <div key={idx} className={styles.resultCard}>
                          <h4 className={styles.resultTitle}>{result.title}</h4>
                          <p className={styles.resultSnippet}>{result.snippet}</p>
                          {result.uri && (
                            <a
                              href={result.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.resultLink}
                            >
                              Visit Page ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {!searchLoading && !searchSummary && searchResults.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3>Start your grounded search</h3>
                <p>Enter a query to retrieve matching articles, pages, and dynamic AI summaries of your customer's website.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHAT */}
        {activeTab === "chat" && (
          <div className={styles.chatSection}>
            <div className={styles.chatHeader}>
              <span>Conversational Agent</span>
              <button onClick={handleResetChat} className={styles.resetChatBtn}>
                🔄 Clear Conversation
              </button>
            </div>

            <div className={styles.chatMessagesArea}>
              {chatMessages.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>💬</span>
                  <h3>Chat with your Website Data</h3>
                  <p>Ask complex questions! The bot retrieves context from your website in real-time to answer you factually.</p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`${styles.messageWrapper} ${
                        msg.role === "user" ? styles.userMessage : styles.modelMessage
                      }`}
                    >
                      <div className={styles.messageBubble}>
                        <div className={styles.messageRoleLabel}>
                          {msg.role === "user" ? "You" : "Sheepworld AI"}
                        </div>
                        <p className={styles.messageText}>{msg.text}</p>

                        {/* Citations / Sources badges */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className={styles.citationsSection}>
                            <div className={styles.citationsLabel}>Sources:</div>
                            <div className={styles.citationsList}>
                              {msg.citations.map((cite, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={cite.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.citationBadge}
                                  title={cite.title}
                                >
                                  📄 {cite.title.length > 25 ? `${cite.title.substring(0, 25)}...` : cite.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className={`${styles.messageWrapper} ${styles.modelMessage}`}>
                      <div className={styles.messageBubble}>
                        <div className={styles.messageRoleLabel}>Sheepworld AI</div>
                        <div className={styles.chatTypingLoader}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className={styles.chatErrorAlert}>
                      <strong>Error:</strong> {chatError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className={styles.chatInputForm}>
              <input
                type="text"
                className={styles.chatInputField}
                placeholder="Ask a question about the website..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button
                type="submit"
                className={styles.chatSendBtn}
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
