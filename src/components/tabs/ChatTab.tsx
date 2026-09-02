'use client';

import React, { useState, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';

// Simple Markdown rendering helper (since we only need basic bold, lists, and links)
const renderMarkdown = (text: string) => {
  if (!text) return "";
  
  // Format bold
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Format bullet points
  formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
  
  // Format markdown links [text](url)
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--brand-secondary); text-decoration: underline; font-weight: 700;">$1</a>');
  
  // Wrap list items in <ul> if needed
  if (formatted.includes('<li>')) {
    // Basic wrapper trick
    formatted = formatted.replace(/(<li>[\s\S]*?<\/li>)/, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>');
  }
  
  return <div dangerouslySetInnerHTML={{ __html: formatted.replace(/\n/g, '<br/>') }} />;
};

// Chat icon drawing SVG
const ChatIcon = () => (
  <div style={{
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--brand-eco)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.2)"
  }}>🐏</div>
);

const UserIcon = () => (
  <div style={{
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--bg-card)",
    color: "var(--brand-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    border: "1.5px solid var(--brand-secondary)"
  }}>👤</div>
);

// Formatter to render Quick Actions in chat
interface QuickActionsProps {
  payload: any;
  onActionClick: (utterance: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ payload, onActionClick }) => {
  if (!payload || typeof payload !== 'object') return null;

  const findActionsAndSummary = (obj: any): { actions: any[], summary: string } => {
    let foundActions: any[] = [];
    let foundSummary = "";

    const search = (item: any) => {
      if (!item || typeof item !== 'object') return;
      if (item.type === 'base_quick_actions' && Array.isArray(item.quickActions)) {
        foundActions = item.quickActions;
        if (item.summary) foundSummary = item.summary;
        return;
      }
      if (Array.isArray(item)) {
        for (const sub of item) search(sub);
        return;
      }
      for (const key of Object.keys(item)) {
        if (typeof item[key] === 'object' && item[key] !== null) {
          search(item[key]);
          if (foundActions.length > 0) return;
        }
      }
    };

    search(obj);
    return { actions: foundActions, summary: foundSummary };
  };

  const { actions, summary } = findActionsAndSummary(payload);
  const displaySummary = summary || "Hier sind einige Optionen, wie du fortfahren kannst.";

  if (actions.length === 0) return null;

  return (
    <div className="quick-actions-container" style={{
      marginTop: "12px",
      backgroundColor: "var(--bg-main)",
      padding: "16px",
      borderRadius: "12px",
      border: "1px solid var(--border-light)"
    }}>
      <p className="quick-actions-summary" style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: "700", color: "var(--brand-eco)" }}>
        {displaySummary}
      </p>
      <div className="quick-actions-list" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {actions.map((action: any, idx: number) => (
          <button 
            key={idx} 
            className="quick-action-card" 
            onClick={() => onActionClick(action.utterance)}
            style={{
              padding: "10px 14px",
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--brand-secondary)",
              borderRadius: "20px",
              fontSize: "12.5px",
              fontWeight: "700",
              color: "var(--brand-secondary)",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(244, 63, 94, 0.03)",
              transition: "transform 0.1s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <div className="quick-action-content" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <span className="quick-action-title">{action.content}</span>
              {action.description && (
                <span className="quick-action-desc" style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>{action.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Formatter to render carousels in chat
interface CarouselProps {
  payload: any;
}

const Carousel: React.FC<CarouselProps> = ({ payload }) => {
  if (!payload || typeof payload !== 'object') return null;

  const findProductDetails = (obj: any): any[] => {
    let foundProducts: any[] = [];

    const search = (item: any) => {
      if (!item || typeof item !== 'object') return;
      if (item.type === 'base_carousel' && Array.isArray(item.productDetails)) {
        foundProducts = item.productDetails;
        return;
      }
      if (Array.isArray(item)) {
        for (const sub of item) search(sub);
        return;
      }
      for (const key of Object.keys(item)) {
        if (typeof item[key] === 'object' && item[key] !== null) {
          search(item[key]);
          if (foundProducts.length > 0) return;
        }
      }
    };

    search(obj);
    return foundProducts;
  };

  const products = findProductDetails(payload);
  if (products.length === 0) return null;

  return (
    <div className="carousel-container" style={{
      marginTop: "16px",
      display: "flex",
      gap: "14px",
      overflowX: "auto",
      paddingBottom: "8px"
    }}>
      {products.map((prod: any, idx: number) => (
        <div key={idx} className="carousel-card" style={{
          flex: "0 0 200px",
          backgroundColor: "#ffffff",
          border: "1.5px solid var(--border-light)",
          borderRadius: "12px",
          padding: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          {prod.imageUris && prod.imageUris.length > 0 && (
            <div style={{ height: "120px", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-light)" }}>
              <img src={prod.imageUris[0]} alt={prod.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "var(--text-primary)" }}>{prod.title}</h4>
            {prod.price && (
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--brand-secondary)", display: "block", marginTop: "4px" }}>
                {prod.price.value} {prod.price.currencyCode}
              </span>
            )}
          </div>
          {prod.uri && (
            <a 
              href={prod.uri} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{
                display: "block",
                textAlign: "center",
                padding: "8px",
                backgroundColor: "var(--brand-secondary)",
                color: "#ffffff",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              Zum Shop ➔
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  payload?: any;
}

interface ChatTabProps {
  functions: any;
  latency: number | null;
  setLatency: (lat: number | null) => void;
  sessionId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SUGGESTIONS = [
  "🎁 Geschenkefinder starten",
  "🧼 Bettwäsche- & Pflegetipps erhalten",
  "📦 Fragen zu Versand & Rückgabe stellen",
  "🧸 sheepworld Marken & Welten entdecken"
];

export default function ChatTab({
  functions,
  latency,
  setLatency,
  sessionId,
  messages,
  setMessages
}: ChatTabProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMessage: Message = {
      id: "msg_" + Date.now() + "_user",
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const startTime = Date.now();

    try {
      const runSessionFn = httpsCallable<any, any>(functions, "runSession", { timeout: 180000 }); // 3 minutes timeout
      const result = await runSessionFn({
        message: textToSend,
        sessionId: sessionId
      });

      const endTime = Date.now();
      setLatency(Math.round((endTime - startTime) / 100) / 10);

      const data = result.data;
      let botText = "";
      let payload = null;

      if (data && Array.isArray(data.outputs) && data.outputs.length > 0) {
        for (const output of data.outputs) {
          if (output.text) {
            botText = output.text;
          }
        }
        
        for (const output of data.outputs) {
          if (output.structData) {
            payload = output.structData;
            break;
          } else if (output.payload) {
            payload = output.payload;
            break;
          }
        }
      }

      if (!botText && !payload) {
        botText = "Ich konnte die Antwort des Agenten nicht verarbeiten.";
      }

      const botMessage: Message = {
        id: "msg_" + Date.now() + "_bot",
        sender: "bot",
        text: botText,
        timestamp: new Date(),
        payload: payload
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Error communicating with chat API:", err);
      setError("Verbindungsproblem: Die Anfrage an den Sheepworld-Agenten ist fehlgeschlagen.");
      
      const errorMessage: Message = {
        id: "msg_" + Date.now() + "_error",
        sender: "bot",
        text: "Entschuldigung, es gab einen technischen Fehler beim Abrufen der Antwort. Bitte vergewissere dich, dass die Internetverbindung steht, oder versuche es gleich noch einmal.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <>
      {/* Message Container */}
      <section className="messages-container" style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        backgroundColor: "var(--bg-main)"
      }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender} ${msg.payload ? "has-payload" : ""}`} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: msg.sender === "bot" ? "flex-start" : "flex-end",
            width: "100%"
          }}>
            <div className="message-meta-header" style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "4px" }}>
              <span className="sender-name">
                {msg.sender === "bot" ? "Susi, deine digitale Assistentin" : "Kunde"}
              </span>
            </div>
            <div className="message-bubble-row" style={{ display: "flex", gap: "12px", maxWidth: "80%", flexDirection: msg.sender === "bot" ? "row" : "row-reverse" }}>
              <div className="message-avatar">
                {msg.sender === "bot" ? <ChatIcon /> : <UserIcon />}
              </div>
              {msg.text && (
                <div className="message-bubble" style={{
                  backgroundColor: msg.sender === "bot" ? "#ffffff" : "var(--brand-secondary)",
                  color: msg.sender === "bot" ? "var(--text-primary)" : "#ffffff",
                  padding: "14px 18px",
                  borderRadius: "20px",
                  boxShadow: msg.sender === "bot" ? "0 4px 10px rgba(0,0,0,0.03)" : "none",
                  border: msg.sender === "bot" ? "1px solid var(--border-light)" : "none",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  <div className="message-text">
                    {renderMarkdown(msg.text)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Custom Carousel Payload Block */}
            {msg.payload && <Carousel payload={msg.payload} />}

            {/* Custom Quick Actions Payload Block */}
            {msg.payload && (
              <QuickActions 
                payload={msg.payload} 
                onActionClick={(utterance) => handleSendMessage(utterance)} 
              />
            )}
          </div>
        ))}
        {loading && (
          <div className="message-wrapper bot" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
            <div className="message-bubble-row" style={{ display: "flex", gap: "12px" }}>
              <div className="message-avatar"><ChatIcon /></div>
              <div className="message-bubble typing-indicator" style={{ backgroundColor: "#ffffff", padding: "14px 20px", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ color: "red", padding: "10px", backgroundColor: "#ffebeb", borderRadius: "8px", border: "1px solid red", fontSize: "13px", alignSelf: "center" }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Input Panel with Suggestions */}
      <footer className="input-panel" style={{
        padding: "16px 24px",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #fbcfe8"
      }}>
        {/* Chips / Suggestions */}
        <div className="suggestions-container" style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "12px"
        }}>
          {SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => handleSendMessage(sug.substring(2))} // Strip emoji prefix for agent utterance
              style={{
                padding: "8px 16px",
                borderRadius: "30px",
                border: "1px solid var(--border-light)",
                backgroundColor: "#ffffff",
                color: "var(--text-secondary)",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.1s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--brand-secondary)";
                e.currentTarget.style.color = "var(--brand-secondary)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-light)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Text Input Row */}
        <div className="input-row" style={{
          display: "flex",
          gap: "12px"
        }}>
          <input
            type="text"
            className="chat-input"
            placeholder="Frag nach Tassen, Geschenkartikeln oder Lieferzeiten..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: "30px",
              border: "1.5px solid #cbd5e1",
              outline: "none",
              fontSize: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
            }}
          />
          <button
            className="send-btn"
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              padding: "0 24px",
              borderRadius: "30px",
              backgroundColor: (!input.trim() || loading) ? "#cbd5e1" : "var(--brand-secondary)",
              color: "#ffffff",
              border: "none",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "14px",
              transition: "background-color 0.15s ease"
            }}
          >
            Senden ➔
          </button>
        </div>
      </footer>
    </>
  );
}
