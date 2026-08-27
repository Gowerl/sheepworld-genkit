"use client";

import { useState, useEffect, useRef } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  payload?: any;
}

// Helper to generate unique session IDs
const generateSessionId = () => {
  return "session_" + Math.random().toString(36).substring(2, 11);
};

// Photo Avatar of SUSI (placeholder SVG sheep or image)
const ChatIcon = () => (
  <div style={{ 
    width: "100%", 
    height: "100%", 
    backgroundColor: "#ffffff", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    borderRadius: "50%",
    border: "2px solid #134094",
    overflow: "hidden"
  }}>
    <span style={{ fontSize: "20px" }}>🐑</span>
  </div>
);

// SVG User Avatar Icon
const UserIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="20" 
    height="20" 
    style={{ fill: "currentColor" }}
  >
    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
  </svg>
);

// Safe inline Markdown-like parser
const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (keyPrefix: string | number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list_${keyPrefix}`} className="markdown-list">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ");
    
    if (isListItem) {
      if (!inList) {
        inList = true;
      }
      
      const itemText = trimmed.replace(/^[\-\*•]\s+/, "");
      const escaped = itemText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      
      const processed = escaped
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>");
        
      listItems.push(
        <li key={`li_${lineIdx}`} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    } else {
      if (inList) {
        flushList(lineIdx);
      }
      
      if (trimmed === "") {
        elements.push(<div key={`empty_${lineIdx}`} className="markdown-spacer" />);
      } else {
        const escaped = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
          
        const processed = escaped
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>')
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/`(.*?)`/g, "<code>$1</code>");
          
        elements.push(
          <p key={`p_${lineIdx}`} dangerouslySetInnerHTML={{ __html: processed }} />
        );
      }
    }
  });

  if (inList) {
    flushList("end");
  }

  return elements;
};

// Component to render structured product comparisons
const renderProductComparison = (payload: any) => {
  if (!payload || payload.type !== "product_comparison") return null;

  const { title, productDetails = [], features = [] } = payload;

  return (
    <div className="comparison-container">
      {title && <h3 className="comparison-title">{title}</h3>}
      
      {/* Product Cards Grid with horizontal scroll */}
      <div className="comparison-cards-grid">
        {productDetails.map((product: any, idx: number) => (
          <div key={product.productId || idx} className="comparison-card">
            {product.imageUris && product.imageUris[0] && (
              <div className="comparison-card-image" style={{ backgroundImage: `url(${product.imageUris[0]})` }}>
                <div className="image-overlay"></div>
              </div>
            )}
            <div className="comparison-card-content">
              <h4 className="product-title">{product.title}</h4>
              <p className="product-subtitle">{product.subtitle}</p>
              
              {/* Product Specifications / Features listed directly inside the card */}
              {features && features.length > 0 && (
                <div className="product-features-mini-list" style={{
                  margin: "12px 0",
                  padding: "10px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0"
                }}>
                  {features.map((feature: any, fIdx: number) => {
                    const spec = feature.productSpecs && feature.productSpecs[idx];
                    const specText = spec ? spec.text || (spec.anchor ? spec.anchor.displayText : null) : null;
                    if (!specText) return null;
                    return (
                      <div key={fIdx} style={{ fontSize: "12px", margin: "4px 0", textAlign: "left", color: "#64748b" }}>
                        <strong style={{ color: "#134094" }}>{feature.label}:</strong> {specText}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Star Rating */}
              {product.rating && (
                <div className="product-rating">
                  {"★".repeat(Math.floor(product.rating))}
                  {product.rating % 1 !== 0 ? "½" : ""}
                  {"☆".repeat(5 - Math.ceil(product.rating))}
                  <span className="rating-value">({product.rating})</span>
                </div>
              )}
              
              <div className="product-price-tag">
                <span className="price-label">Preis:</span>
                <span className="price-value">{product.price || "Individuell"}</span>
              </div>

              {product.uri && (
                <a 
                  href={product.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="product-cta-btn"
                >
                  Produktdetails ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component to render individual product details (styled identically to the comparison cards!)
const renderProductDetail = (payload: any) => {
  if (!payload || payload.type !== "base_product_detail") return null;

  const { title, subtitle, price, uri, imageUris = [], rating, review, productId, description } = payload;

  return (
    <div className="comparison-card" style={{
      maxWidth: "300px",
      margin: "12px 0",
      boxShadow: "0 4px 15px rgba(19, 64, 148, 0.04)"
    }}>
      <div className="comparison-card-image" style={{
        backgroundImage: imageUris && imageUris[0] ? `url(${imageUris[0]})` : "none",
        backgroundColor: imageUris && imageUris[0] ? "#ffffff" : "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        {(!imageUris || !imageUris[0]) && (
          <span style={{ fontSize: "40px" }}>🐑</span>
        )}
        <div className="image-overlay"></div>
      </div>
      <div className="comparison-card-content">
        <h4 className="product-title">{title}</h4>
        <p className="product-subtitle">{subtitle}</p>

        {description && (
          <p className="product-description" style={{
            fontSize: "12.5px",
            color: "#475569",
            lineHeight: "1.45",
            margin: "8px 0 12px 0",
            textAlign: "left"
          }}>{description}</p>
        )}

        {/* Dynamic product specs block inside card */}
        {(productId || rating || review) && (
          <div className="product-features-mini-list" style={{
            margin: "12px 0",
            padding: "10px",
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            {productId && (
              <div style={{ fontSize: "12px", margin: "4px 0", textAlign: "left", color: "#64748b" }}>
                <strong style={{ color: "#134094" }}>Artikel-Nr:</strong> {productId}
              </div>
            )}
            {rating && (
              <div style={{ fontSize: "12px", margin: "4px 0", textAlign: "left", color: "#64748b" }}>
                <strong style={{ color: "#134094" }}>Bewertung:</strong> {rating} / 5 ★
              </div>
            )}
            {review && review.count > 0 && (
              <div style={{ fontSize: "12px", margin: "4px 0", textAlign: "left", color: "#64748b" }}>
                <strong style={{ color: "#134094" }}>Bewertungen:</strong> {review.count} {review.reviewUri && <a href={review.reviewUri} target="_blank" rel="noopener noreferrer" style={{ color: "#0084C9", textDecoration: "none" }}>(Lesen ↗)</a>}
              </div>
            )}
          </div>
        )}

        {/* Star Rating */}
        {rating && (
          <div className="product-rating">
            {"★".repeat(Math.floor(rating))}
            {rating % 1 !== 0 ? "½" : ""}
            {"☆".repeat(5 - Math.ceil(rating))}
            <span className="rating-value">({rating})</span>
          </div>
        )}
        
        <div className="product-price-tag">
          <span className="price-label">Preis im Shop:</span>
          <span className="price-value">{price || "Auf Anfrage"}</span>
        </div>

        {uri && (
          <a 
            href={uri} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="product-cta-btn"
          >
            Produkt im Shop öffnen ↗
          </a>
        )}
      </div>
    </div>
  );
};

// Component to render a product detail carousel
const renderProductDetailCarousel = (payload: any) => {
  if (!payload || payload.type !== "product_detail_carousel") return null;

  const { productDetails = [] } = payload;

  return (
    <div className="carousel-container">
      {productDetails.map((product: any, idx: number) => (
        <div key={product.productId || idx} className="comparison-card" style={{
          flex: "0 0 280px",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff"
        }}>
          <div className="comparison-card-image" style={{
            backgroundImage: product.imageUris && product.imageUris[0] ? `url(${product.imageUris[0]})` : "none",
            backgroundColor: product.imageUris && product.imageUris[0] ? "#ffffff" : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {(!product.imageUris || !product.imageUris[0]) && (
              <span style={{ fontSize: "40px" }}>🐑</span>
            )}
            <div className="image-overlay"></div>
          </div>
          <div className="comparison-card-content" style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "space-between"
          }}>
            <div>
              <h4 className="product-title" style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#134094" }}>{product.title}</h4>
              {product.subtitle && <p className="product-subtitle" style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b" }}>{product.subtitle}</p>}
            </div>
            <div>
              <div className="product-price-tag" style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "bold" }}>
                <span className="price-label" style={{ fontWeight: "normal", color: "#64748b" }}>Preis: </span>
                <span className="price-value" style={{ color: "#78BE20" }}>{product.price || "Auf Anfrage"}</span>
              </div>

              {product.uri && (
                <a 
                  href={product.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="product-cta-btn"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "8px 16px",
                    backgroundColor: "#134094",
                    color: "#ffffff",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: "500"
                  }}
                >
                  Zum Shop ↗
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper to check if payload contains quick actions recursively
const hasQuickActions = (payload: any) => {
  if (!payload || typeof payload !== 'object') return false;
  
  let found = false;
  const search = (item: any) => {
    if (!item || typeof item !== 'object') return;
    if (Array.isArray(item.actions)) {
      found = true;
      return;
    }
    for (const key of Object.keys(item)) {
      if (typeof item[key] === 'object' && item[key] !== null) {
        search(item[key]);
        if (found) return;
      }
    }
  };
  search(payload);
  return found;
};

// Component to render interactive quick actions list
const renderQuickActions = (payload: any, onActionClick: (utterance: string) => void) => {
  const findActionsAndSummary = (obj: any): { actions: any[], summary: string } => {
    let foundActions: any[] = [];
    let foundSummary = "";

    const search = (item: any) => {
      if (!item || typeof item !== 'object') return;

      if (item.summary && typeof item.summary === 'string') {
        foundSummary = item.summary;
      }

      if (Array.isArray(item.actions)) {
        foundActions = item.actions;
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
    <div className="quick-actions-container">
      <p className="quick-actions-summary">{displaySummary}</p>
      <div className="quick-actions-list">
        {actions.map((action: any, idx: number) => (
          <button 
            key={idx} 
            className="quick-action-card" 
            onClick={() => onActionClick(action.utterance)}
          >
            <div className="quick-action-content">
              <span className="quick-action-title">{action.content}</span>
              {action.description && (
                <span className="quick-action-desc">{action.description}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Initial suggestion chips for sheepworld
const SUGGESTIONS = [
  "🎁 Geschenkefinder starten",
  "🧼 Bettwäsche- & Pflegetipps erhalten",
  "📦 Fragen zu Versand & Rückgabe stellen",
  "🧸 sheepworld Marken & Welten entdecken"
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // New SEO Generator State Variables
  const [activeTab, setActiveTab] = useState<'chat' | 'seo'>('chat');
  const [seoTopic, setSeoTopic] = useState("");
  const [seoBulletPoints, setSeoBulletPoints] = useState("");
  const [seoAudience, setSeoAudience] = useState("Endkunden (freundliches Du)");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoProductUrl, setSeoProductUrl] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<any>(null);

  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize unique session ID on mount
  useEffect(() => {
    setSessionId(generateSessionId());
    
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: "Hallo! Ich bin Susi, deine digitale Assistentin von sheepworld.de. Wie kann ich dir heute bei Fragen zu unseren Geschenken, Tassen, Geschenkartikeln oder Services helfen?",
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Bitte füllen Sie alle Felder aus.");
      return;
    }
    
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email"
      ) {
        setLoginError("E-Mail oder Passwort ist ungültig.");
      } else {
        setLoginError("Anmeldefehler: " + err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset session ID and chat history
      setSessionId(generateSessionId());
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: "Hallo! Ich bin Susi, deine digitale Assistentin von sheepworld.de. Wie kann ich dir heute bei Fragen zu unseren Geschenken, Tassen, Geschenkartikeln oder Services helfen?",
          timestamp: new Date()
        }
      ]);
      setLatency(null);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError(null);
    } catch (err: any) {
      console.error("Error signing out:", err);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: "msg_" + Date.now() + "_user",
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      // Direct Callable Function call
      const runSessionFn = httpsCallable<any, any>(functions, "runSession");
      const response = await runSessionFn({
        message: textToSend,
        sessionId: sessionId
      });

      const data = response.data;
      const endTime = performance.now();
      const duration = parseFloat(((endTime - startTime) / 1000).toFixed(1));
      setLatency(duration);
      
      // Parse Google CES API response structure
      let botText = "";
      let payload: any = null;
      if (data.outputs && Array.isArray(data.outputs)) {
        botText = data.outputs
          .map((output: any) => output.text)
          .filter(Boolean)
          .join("\n");

        // Try to find any custom payload (structData, payload, or any custom nested properties)
        for (const output of data.outputs) {
          if (output.structData) {
            payload = output.structData;
            break;
          } else if (output.payload) {
            payload = output.payload;
            break;
          }
          
          // Fallback: Check if there's any non-standard object key (e.g. actions, summary, custom fields)
          const keys = Object.keys(output);
          const potentialKeys = keys.filter(k => !['text', 'media', 'turnCompleted', 'turnIndex', 'diagnosticInfo'].includes(k));
          if (potentialKeys.length > 0) {
            for (const key of potentialKeys) {
              if (typeof output[key] === 'object' && output[key] !== null) {
                payload = output[key];
                break;
              }
            }
            if (payload) break;
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

  const startNewChat = () => {
    setSessionId(generateSessionId());
    setMessages([
      {
        id: "welcome_" + Date.now(),
        sender: "bot",
        text: "Ein neuer Chat-Verlauf wurde gestartet. Wie kann ich dir heute helfen?",
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  const handleGenerateSEO = async () => {
    if (!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading) return;

    setSeoLoading(true);
    setSeoResult(null);

    try {
      const generateSEOContentFn = httpsCallable<any, any>(functions, "generateSEOContent");
      const response = await generateSEOContentFn({
        topic: seoTopic,
        bulletPoints: seoBulletPoints,
        targetAudience: seoAudience,
        keywords: seoKeywords,
        productUrl: seoProductUrl
      });

      setSeoResult(response.data);
    } catch (err: any) {
      console.error("Error generating SEO content:", err);
      alert("Fehler bei der Inhaltsgenerierung: " + err.message);
    } finally {
      setSeoLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-spinner"></div>
        <p>Verbindung zu sheepworld wird hergestellt...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page-container">
        <div className="login-card">
          <div className="login-logo-box" style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #fbcfe8", display: "flex", justifyContent: "center", margin: "0 auto 20px auto", maxWidth: "240px" }}>
            <img src="https://media.sheepworld.de/live/media/39/b0/69/1767349291/logo-sheepworld.svg?ts=1767349291" alt="sheepworld" style={{ width: "100%", height: "auto" }} />
          </div>
          <h2 className="login-title">sheepworld Service-Portal</h2>
          <p className="login-subtitle">Melde dich an, um den KI-Chat-Assistenten zu starten</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-Mail-Adresse</label>
              <input 
                type="email" 
                id="email" 
                placeholder="beispiel@domain.de" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Passwort</label>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={isLoggingIn}
                required
              />
            </div>
            
            {loginError && <div className="login-error-banner">{loginError}</div>}
            
            <button type="submit" className="login-submit-btn" disabled={isLoggingIn}>
              {isLoggingIn ? "Anmeldung läuft..." : "Anmelden"}
            </button>
          </form>
          
          <div className="login-footer">
            sheepworld AG • Am Schafhügel 1 • 92289 Ursensollen
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="dashboard-title">sheepworld Dashboard</h2>
          <p className="dashboard-subtitle">KI-Monitor & Statistiken</p>
        </div>

        <div className="sidebar-cards-container">
          {/* Card 1: System Status */}
          <div className="sidebar-card system">
            <div className="card-label">SYSTEM-STATUS</div>
            <div className="card-value">
              <span className="indicator-dot online"></span> Online / Aktiv
            </div>
            <div className="card-desc">Verbunden mit Google Cloud</div>
          </div>

          {/* Card 2: Antwortzeit */}
          <div className="sidebar-card latency">
            <div className="card-label">ANTWORTZEIT</div>
            <div className="card-value">
              {latency !== null ? `${latency} Sek.` : "Keine Abfrage"}
            </div>
            <div className="card-desc">
              {latency !== null ? "Letzte Abfragegeschwindigkeit" : "Warte auf erste Frage..."}
            </div>
          </div>

          {/* Card 3: Wissensdatenbank */}
          <div className="sidebar-card database">
            <div className="card-label">WISSENSDATENBANK</div>
            <div className="card-value">sheepworld Webseite</div>
            <div className="card-desc">Produkte, Tassen, Geschenke</div>
          </div>

          {/* Card 4: Sitzungs-ID */}
          <div className="sidebar-card session">
            <div className="card-label">SITZUNGS-ID</div>
            <div className="card-value session-id" title={sessionId}>
              {sessionId ? sessionId.substring(0, 12) + "..." : "Initialisiere..."}
            </div>
            <div className="card-desc">Aktuelle Gesprächs-Session</div>
          </div>

          {/* Card 5: Benutzer */}
          <div className="sidebar-card user">
            <div className="card-label">BENUTZER</div>
            <div className="card-value">
              {user?.email ? user.email.split('@')[0] : "Walter"}
            </div>
            <div className="card-desc">
              {user?.email || "walter@myc3.com"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="chat-header">
          <div className="header-left">
            <div className="header-logo-box" style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "6px 10px", border: "1px solid #fbcfe8", display: "flex", alignItems: "center", justifyContent: "center", width: "110px", height: "42px" }}>
              <img src="/logo-sheepworld.svg" alt="sheepworld" style={{ width: "100%", height: "auto" }} />
            </div>
            <div className="agent-title-bar">
              <h2>sheepworld KI-Assistent</h2>
              <p className="status-text">
                <span className="status-indicator-dot online"></span> Klärt deine Fragen
              </p>
            </div>
          </div>
          <div className="header-right">
            <button className="header-btn restart" onClick={startNewChat}>
              <span className="btn-icon">⟳</span> Neu starten
            </button>
            <button onClick={handleLogout} className="header-btn logout">
              <span className="btn-icon">🔓</span> Abmelden
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="tab-navigation" style={{
          display: "flex",
          gap: "12px",
          padding: "12px 24px",
          borderBottom: "1px solid #fbcfe8",
          backgroundColor: "#ffffff"
        }}>
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            style={{
              padding: "8px 16px",
              borderRadius: "30px",
              border: "1.5px solid",
              borderColor: activeTab === 'chat' ? "var(--brand-secondary)" : "#e2e8f0",
              backgroundColor: activeTab === 'chat' ? "var(--bg-main)" : "#ffffff",
              color: activeTab === 'chat' ? "var(--brand-eco)" : "var(--text-secondary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            💬 KI-Kundenservice
          </button>
          <button 
            className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
            style={{
              padding: "8px 16px",
              borderRadius: "30px",
              border: "1.5px solid",
              borderColor: activeTab === 'seo' ? "var(--brand-secondary)" : "#e2e8f0",
              backgroundColor: activeTab === 'seo' ? "var(--bg-main)" : "#ffffff",
              color: activeTab === 'seo' ? "var(--brand-eco)" : "var(--text-secondary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            ✍️ SEO/GEO Content-Generator
          </button>
        </div>

        {/* Tab Content 1: Chat Assistant */}
        {activeTab === 'chat' && (
          <>
            {/* Message Container */}
            <section className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.sender} ${msg.payload ? "has-payload" : ""}`}>
                  <div className="message-meta-header">
                    <span className="sender-name">
                      {msg.sender === "bot" ? "Susi, deine digitale Assistentin" : "Kunde"}
                    </span>
                  </div>
                  <div className="message-bubble-row">
                    <div className="message-avatar">
                      {msg.sender === "bot" ? <ChatIcon /> : <UserIcon />}
                    </div>
                    {msg.text && (
                      <div className="message-bubble">
                        <div className="message-text">
                          {renderMarkdown(msg.text)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Full Width Custom Payloads */}
                  {msg.payload && msg.payload.type === "product_comparison" && (
                    <div className="full-width-payload-container">
                      {renderProductComparison(msg.payload)}
                    </div>
                  )}
                  {msg.payload && msg.payload.type === "product_detail_carousel" && (
                    <div className="full-width-payload-container">
                      {renderProductDetailCarousel(msg.payload)}
                    </div>
                  )}
                  {msg.payload && msg.payload.type === "base_product_detail" && (
                    <div className="full-width-payload-container">
                      {renderProductDetail(msg.payload)}
                    </div>
                  )}
                  {msg.payload && hasQuickActions(msg.payload) && (
                    <div className="full-width-payload-container">
                      {renderQuickActions(msg.payload, handleSendMessage)}
                    </div>
                  )}
                  <div className="message-meta-footer">
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-wrapper bot loading">
                  <div className="message-meta-header">
                    <span className="sender-name">Susi, deine digitale Assistentin</span>
                  </div>
                  <div className="message-bubble-row">
                    <div className="message-avatar"><ChatIcon /></div>
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="error-banner">{error}</div>}
              <div ref={messagesEndRef} />
            </section>

            {/* Dynamic suggestions if chat has only the welcome message */}
            {messages.length <= 1 && !loading && (
              <div className="suggestions-container">
                <p className="suggestions-title">Häufig gestellte Fragen:</p>
                <div className="suggestions-grid">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Box */}
            <footer className="chat-footer-box">
              <div className="input-row">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Stelle eine Frage zu Geschenken, Tassen, etc..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button
                  className="send-btn"
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || loading}
                  title="Nachricht senden"
                >
                  Senden
                </button>
              </div>
              <div className="footer-company-info">
                sheepworld AG • Am Schafhügel 1 • 92289 Ursensollen • Deutschland
              </div>
              <p className="disclaimer">
                Hinweis: Dies ist ein KI-gestützter Assistent. Antworten können Fehler enthalten. Bitte überprüfe wichtige Angaben stets anhand der offiziellen Unterlagen von sheepworld.
              </p>
            </footer>
          </>
        )}

        {/* Tab Content 2: SEO Content-Generator */}
        {activeTab === 'seo' && (
          <div className="seo-generator-container" style={{
            display: "flex",
            flexDirection: "row",
            gap: "24px",
            padding: "24px",
            height: "calc(100% - 68px)",
            overflowY: "auto",
            flexWrap: "wrap"
          }}>
            {/* Left Panel: Input Form */}
            <div className="seo-form-card" style={{
              flex: "1 1 340px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "16px",
              border: "1.5px solid #fbcfe8",
              boxShadow: "0 4px 15px rgba(19, 64, 148, 0.02)",
              height: "fit-content",
              textAlign: "left"
            }}>
              <h3 style={{ margin: "0 0 4px 0", color: "var(--brand-secondary)", fontWeight: "800" }}>📝 Text-Kriterien</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-secondary)" }}>Gib hier das Thema und deine Kernaspekte an. Der Generator zieht automatisch Daten aus deiner sheepworld-Datenbank!</p>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>Thema / Produkt</label>
                <input 
                  type="text" 
                  placeholder="z. B. Faultier Bettwäsche, Tasse 'Ohne Dich ist alles doof'..." 
                  value={seoTopic}
                  onChange={(e) => setSeoTopic(e.target.value)}
                  disabled={seoLoading}
                  style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>Kernaspekte / Stichpunkte</label>
                <textarea 
                  placeholder="Trage hier wichtige Inhalte ein (z. B. 100% Baumwolle, Geschenkidee zum Geburtstag, schläft 20h am Tag...)" 
                  value={seoBulletPoints}
                  onChange={(e) => setSeoBulletPoints(e.target.value)}
                  disabled={seoLoading}
                  style={{ padding: "12px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit", height: "130px", resize: "none", lineHeight: "1.5" }}
                />
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>Zielgruppe / Tonalität</label>
                <select 
                  value={seoAudience}
                  onChange={(e) => setSeoAudience(e.target.value)}
                  disabled={seoLoading}
                  style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit", backgroundColor: "#ffffff" }}
                >
                  <option value="Endkunden von sheepworld (herzliches Du)">Endkunden von sheepworld (herzliches Du)</option>
                  <option value="Geschäftskunden / B2B (formelle Sie-Form)">Geschäftskunden / B2B (formelle Sie-Form)</option>
                  <option value="Liebespaare und Verliebte">Liebespaare und Verliebte</option>
                  <option value="Mamas, Papas und Eltern">Mamas, Papas und Eltern</option>
                </select>
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>SEO-Fokus-Keywords</label>
                <input 
                  type="text" 
                  placeholder="z. B. kuschelig, Geschenkidee, Geburtstag (durch Komma trennen)..." 
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  disabled={seoLoading}
                  style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>Aktuelle Produkt-URL (optional)</label>
                <input 
                  type="text" 
                  placeholder="z. B. https://sheepworld.de/products/bettwaesche-faultier..." 
                  value={seoProductUrl}
                  onChange={(e) => setSeoProductUrl(e.target.value)}
                  disabled={seoLoading}
                  style={{ padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", fontFamily: "inherit" }}
                />
              </div>

              <button 
                onClick={handleGenerateSEO}
                disabled={!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading}
                style={{
                  padding: "12px 20px",
                  backgroundColor: (!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading) ? "#cbd5e1" : "var(--brand-secondary)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.15s ease",
                  marginTop: "10px"
                }}
              >
                {seoLoading ? "✨ Generiere SEO/GEO-Inhalte..." : "✨ SEO-Text generieren"}
              </button>
            </div>

            {/* Right Panel: Output Panel */}
            <div className="seo-result-card" style={{
              flex: "2 1 450px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              height: "100%"
            }}>
              {seoResult ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  backgroundColor: "#ffffff",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1.5px solid #fbcfe8",
                  boxShadow: "0 4px 15px rgba(19, 64, 148, 0.02)",
                  textAlign: "left"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, color: "var(--brand-eco)", fontWeight: "800" }}>🚀 Generierter Text</h3>
                    <button 
                      onClick={() => {
                        const fullCopy = `H1-Title: ${seoResult.title}\nMeta-Description: ${seoResult.metaDescription}\n\nContent:\n${seoResult.content}`;
                        navigator.clipboard.writeText(fullCopy);
                        alert("Text erfolgreich kopiert! 📋");
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "var(--bg-main)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--brand-eco)",
                        cursor: "pointer"
                      }}
                    >
                      📋 Alles kopieren
                    </button>
                  </div>

                  {/* Metadata Box */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <strong style={{ fontSize: "11px", color: "var(--brand-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>SEO-Titel (H1)</strong>
                      <h4 style={{ margin: "4px 0 0 0", color: "var(--text-primary)", fontSize: "15px", fontWeight: "700" }}>{seoResult.title}</h4>
                    </div>
                    <div>
                      <strong style={{ fontSize: "11px", color: "var(--brand-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Meta-Beschreibung (Google-Snippet)</strong>
                      <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.4" }}>{seoResult.metaDescription}</p>
                    </div>
                  </div>

                  {/* Main Content Box */}
                  <div>
                    <strong style={{ fontSize: "11px", color: "var(--brand-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Optimierter Marketing-Text (Markdown)</strong>
                    <div style={{
                      marginTop: "6px",
                      padding: "16px",
                      border: "1.5px solid #fbcfe8",
                      borderRadius: "10px",
                      maxHeight: "350px",
                      overflowY: "auto",
                      backgroundColor: "#fffdfd",
                      fontSize: "14px",
                      lineHeight: "1.6"
                    }}>
                      {renderMarkdown(seoResult.content)}
                    </div>
                  </div>

                  {/* Sources Box */}
                  {seoResult.sources && seoResult.sources.length > 0 && (
                    <div>
                      <strong style={{ fontSize: "11px", color: "var(--brand-secondary)", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px" }}>Fakten-Datenquellen (Grounded)</strong>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                        {seoResult.sources.map((src: any, idx: number) => (
                          <a 
                            key={idx} 
                            href={src.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              backgroundColor: "var(--bg-main)",
                              border: "1px solid var(--border-light)",
                              borderRadius: "20px",
                              fontSize: "12px",
                              color: "var(--brand-eco)",
                              textDecoration: "none"
                            }}
                          >
                            🔗 {src.title || "Produktseite"}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : seoLoading ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "400px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: "1.5px solid #fbcfe8",
                  boxShadow: "0 4px 15px rgba(19, 64, 148, 0.02)",
                  color: "var(--text-secondary)",
                  padding: "40px",
                  textAlign: "center"
                }}>
                  <div className="auth-spinner" style={{ borderLeftColor: "var(--brand-secondary)" }}></div>
                  <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
                    ✨ sheepworld KI generiert deinen SEO-Text...
                  </h3>
                  <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
                    Bitte habe einen kleinen Moment Geduld. Wir recherchieren im Datenspeicher nach passenden Produktinformationen und verfassen einen suchmaschinen- und GEO-optimierten Text für dich.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  minHeight: "400px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  border: "2px dashed #fbcfe8",
                  color: "var(--text-secondary)",
                  padding: "40px"
                }}>
                  <span style={{ fontSize: "54px", marginBottom: "16px" }}>✍️</span>
                  <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zum Schreiben</h3>
                  <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Trage links das Thema und deine Stichpunkte ein, um in Sekunden einen suchmaschinen- und KI-optimierten Text zu erhalten!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
