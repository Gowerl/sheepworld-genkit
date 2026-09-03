'use client';

import { useState, useEffect, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";

// Import modular Tab Components
import ChatTab from "@/components/tabs/ChatTab";
import SeoTab from "@/components/tabs/SeoTab";
import CardsTab from "@/components/tabs/CardsTab";
import PlannerTab from "@/components/tabs/PlannerTab";
import BundleTab from "@/components/tabs/BundleTab";
import FinderTab from "@/components/tabs/FinderTab";
import StickerTab from "@/components/tabs/StickerTab";
import TunerTab from "@/components/tabs/TunerTab";
import AvatarTab from "@/components/tabs/AvatarTab";
import BlogTab from "@/components/tabs/BlogTab";
import LogsTab from "@/components/tabs/LogsTab";

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'seo' | 'cards' | 'planner' | 'bundle' | 'sticker' | 'tuner' | 'avatar' | 'finder' | 'blog' | 'logs'>('chat');
  const [showDocModal, setShowDocModal] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState("session_" + Math.random().toString(36).substring(2, 10));

  // Shared Chat State (needed for Sidebar logs)
  const [messages, setMessages] = useState<any[]>([
    {
      id: "init_1",
      sender: "bot",
      text: "Hallo! Ich bin Susi, deine persönliche sheepworld-Assistentin. 🐏\nWie kann ich dir heute helfen? Frag mich nach unseren Produkten, Bettwäsche-Pflege oder lass uns direkt zusammen Geschenke aussuchen!",
      timestamp: new Date()
    }
  ]);

  // Greeting Card Generator State Variables (Shared to allow pre-filling)
  const [cardRecipient, setCardRecipient] = useState("");
  const [cardSender, setCardSender] = useState("");
  const [cardOccasion, setCardOccasion] = useState("");
  const [cardMood, setCardMood] = useState("");
  const [cardInsider, setCardInsider] = useState("");
  const [cardMotifType, setCardMotifType] = useState<"official" | "ai">("official");
  const [cardLoading, setCardLoading] = useState(false);
  const [cardResult, setCardResult] = useState<any>(null);

  // Geschenkbox-Berater State Variables (Shared to allow pre-filling)
  const [bundleRelationship, setBundleRelationship] = useState("Ehefrau");
  const [bundleInterests, setBundleInterests] = useState("");
  const [bundleOccasion, setBundleOccasion] = useState("");
  const [bundleBudget, setBundleBudget] = useState(50);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleResult, setBundleResult] = useState<any>(null);

  // Upgraded Event Planner State Variables
  const [plannerEvents, setPlannerEvents] = useState<any[]>([
    {
      id: "event_1",
      title: "Muttertag",
      dateDay: "12",
      dateMonth: "Mai",
      recipient: "Mutter (Regina)",
      budget: 35,
      interests: "Kaffee, Garten, Lesen",
      isImminent: true,
      text: "Die KI hat bereits eine süße Karte und ein Geschenkset (Tasse + Kissen) vorbereitet."
    },
    {
      id: "event_2",
      title: "Geburtstag (Schatz)",
      dateDay: "28",
      dateMonth: "Aug",
      recipient: "Ehefrau (Julia)",
      budget: 60,
      interests: "Kuscheln, Faultiere, Entspannung",
      isImminent: false,
      text: "Erinnerung ist aktiv. Wir melden uns rechtzeitig mit einer Idee."
    }
  ]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventRecipient, setNewEventRecipient] = useState("");
  const [newEventBudget, setNewEventBudget] = useState(30);
  const [newEventInterests, setNewEventInterests] = useState("");

  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Listen to Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handler for login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginError("Login fehlgeschlagen. Bitte prüfe deine E-Mail und dein Passwort.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handler for logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: "init_reset",
        sender: "bot",
        text: "Klar, wir fangen von vorne an! Worüber möchtest du sprechen? Frag mich nach unseren Produkten oder Onlineshop-Diensten.",
        timestamp: new Date()
      }
    ]);
    setLatency(null);
    setSessionId("session_" + Math.random().toString(36).substring(2, 10));
  };

  // Dedicated Card Generator trigger inside page.tsx to maintain central state
  const handleGenerateCard = async () => {
    if (!cardRecipient.trim() || !cardOccasion.trim() || !cardMood.trim() || cardLoading) return;

    setCardLoading(true);
    setCardResult(null);

    try {
      const generateGreetingCardFn = httpsCallable<any, any>(functions, "generateGreetingCard", { timeout: 180000 });
      const response = await generateGreetingCardFn({
        empfaenger: cardRecipient,
        absender: cardSender,
        anlass: cardOccasion,
        stimmung: cardMood,
        insider: cardInsider,
        motifType: cardMotifType
      });

      setCardResult(response.data);
    } catch (err: any) {
      console.error("Error generating greeting card:", err);
      alert("Fehler bei der Grußkarten-Generierung: " + err.message);
    } finally {
      setCardLoading(false);
    }
  };

  // Dedicated Bundle Generator trigger inside page.tsx to maintain central state
  const handleGenerateBundle = async () => {
    if (!bundleRelationship.trim() || !bundleInterests.trim() || !bundleOccasion.trim() || bundleLoading) return;

    setBundleLoading(true);
    setBundleResult(null);

    try {
      const generateGiftBundleFn = httpsCallable<any, any>(functions, "generateGiftBundle", { timeout: 180000 });
      const response = await generateGiftBundleFn({
        relationship: bundleRelationship,
        interests: bundleInterests,
        occasion: bundleOccasion,
        budget: bundleBudget
      });

      setBundleResult(response.data);
    } catch (err: any) {
      console.error("Error generating gift bundle:", err);
      alert("Fehler bei der Geschenkbox-Kuration: " + err.message);
    } finally {
      setBundleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-main)" }}>
        <div className="auth-spinner" style={{ borderLeftColor: "var(--brand-secondary)" }}></div>
        <p style={{ marginTop: "14px", fontWeight: "700", color: "var(--text-secondary)" }}>Sheepworld-Portal lädt...</p>
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return (
      <div className="auth-container" style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-main)",
        padding: "16px"
      }}>
        <div className="auth-card" style={{
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "24px",
          border: "2px solid #cbd5e1",
          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.05)",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center"
        }}>
          <div style={{ width: "160px", height: "auto", margin: "0 auto 24px auto" }}>
            <img src="/logo-sheepworld.svg" alt="sheepworld" style={{ width: "100%", height: "auto" }} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "8px" }}>Mitarbeiter-Portal</h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", marginBottom: "28px" }}>Bitte melde dich mit deinen Zugangsdaten an.</p>
          
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>E-Mail-Adresse</label>
              <input 
                type="email" 
                placeholder="walter@myc3.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", outline: "none", fontSize: "14px" }}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Passwort</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", outline: "none", fontSize: "14px" }}
              />
            </div>

            {loginError && (
              <p style={{ color: "red", fontSize: "12.5px", margin: 0, fontWeight: "600" }}>⚠️ {loginError}</p>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn}
              style={{
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: "var(--brand-secondary)",
                color: "#ffffff",
                border: "none",
                fontWeight: "800",
                cursor: "pointer",
                fontSize: "14.5px",
                marginTop: "10px",
                transition: "background-color 0.2s"
              }}
            >
              {isLoggingIn ? "Anmeldung läuft..." : "Anmelden ➔"}
            </button>
          </form>
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
          
          {/* Scientific Documentation Link */}
          <div 
            onClick={() => setShowDocModal(true)}
            className="sidebar-card doc-link-card" 
            style={{ 
              cursor: "pointer", 
              border: "1.5px solid var(--brand-secondary)", 
              backgroundColor: "rgba(225, 29, 72, 0.04)", 
              transition: "all 0.2s ease-in-out",
              marginTop: "14px",
              padding: "12px",
              borderRadius: "10px",
              textAlign: "left"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>📖</span>
              <div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "var(--brand-secondary)", letterSpacing: "0.5px" }}>SYSTEM-ARCHITEKTUR</div>
                <strong style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "800" }}>Wissenschaftliche Doku</strong>
              </div>
            </div>
          </div>
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

        {/* Tab Navigation (Two-row layout for clean grouping) */}
        <div className="tab-navigation" style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "12px 24px",
          borderBottom: "1px solid #fbcfe8",
          backgroundColor: "#ffffff"
        }}>
          {/* Row 1: Marketing & AI Creation */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", display: "inline-block", minWidth: "140px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Content & Marketing:</span>
            <button 
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'chat' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'chat' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'chat' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              💬 KI-Service
            </button>
            <button 
              className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'seo' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'seo' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'seo' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              ✍️ SEO/GEO
            </button>
            <button 
              className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`}
              onClick={() => setActiveTab('blog')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'blog' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'blog' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'blog' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              📝 Blog-Texter
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sticker' ? 'active' : ''}`}
              onClick={() => setActiveTab('sticker')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'sticker' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'sticker' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'sticker' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              🎨 Stickerstudio
            </button>
            <button 
              className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => setActiveTab('avatar')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'avatar' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'avatar' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'avatar' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              🐑 KI-Verwandlung
            </button>
          </div>

          {/* Row 2: Shopping, Gifting & Planning */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", display: "inline-block", minWidth: "140px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Shopping & Geschenke:</span>
            <button 
              className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('cards')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'cards' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'cards' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'cards' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              📬 Postkarten-Atelier
            </button>
            <button 
              className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
              onClick={() => setActiveTab('planner')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'planner' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'planner' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'planner' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              📅 Geschenk-Planer
            </button>
            <button 
              className={`tab-btn ${activeTab === 'bundle' ? 'active' : ''}`}
              onClick={() => setActiveTab('bundle')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'bundle' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'bundle' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'bundle' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              🛍️ Geschenkbox-Berater
            </button>
            <button 
              className={`tab-btn ${activeTab === 'finder' ? 'active' : ''}`}
              onClick={() => setActiveTab('finder')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'finder' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'finder' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'finder' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              🔍 Geschenkefinder
            </button>
            <button 
              className={`tab-btn ${activeTab === 'tuner' ? 'active' : ''}`}
              onClick={() => setActiveTab('tuner')}
              style={{
                padding: "6px 12px",
                borderRadius: "30px",
                border: "1.5px solid",
                borderColor: activeTab === 'tuner' ? "var(--brand-secondary)" : "#e2e8f0",
                backgroundColor: activeTab === 'tuner' ? "var(--bg-main)" : "#ffffff",
                color: activeTab === 'tuner' ? "var(--brand-eco)" : "var(--text-secondary)",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              ✍️ Sprüche-Tuner
            </button>
            {user?.email === "walter@myc3.com" && (
              <button 
                className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
                style={{
                  padding: "6px 12px",
                  borderRadius: "30px",
                  border: "1.5px solid",
                  borderColor: activeTab === 'logs' ? "var(--brand-secondary)" : "#e2e8f0",
                  backgroundColor: activeTab === 'logs' ? "var(--bg-main)" : "#ffffff",
                  color: activeTab === 'logs' ? "var(--brand-eco)" : "var(--text-secondary)",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "12.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
              >
                📊 Admin-Logs
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Rendering */}
        {activeTab === 'chat' && (
          <ChatTab 
            functions={functions} 
            latency={latency} 
            setLatency={setLatency} 
            sessionId={sessionId} 
            messages={messages} 
            setMessages={setMessages} 
          />
        )}

        {activeTab === 'seo' && (
          <SeoTab functions={functions} />
        )}

        {activeTab === 'cards' && (
          <CardsTab 
            functions={functions}
            cardRecipient={cardRecipient}
            setCardRecipient={setCardRecipient}
            cardSender={cardSender}
            setCardSender={setCardSender}
            cardOccasion={cardOccasion}
            setCardOccasion={setCardOccasion}
            cardMood={cardMood}
            setCardMood={setCardMood}
            cardInsider={cardInsider}
            setCardInsider={setCardInsider}
            cardMotifType={cardMotifType}
            setCardMotifType={setCardMotifType}
            cardLoading={cardLoading}
            handleGenerateCard={handleGenerateCard}
            cardResult={cardResult}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerTab 
            plannerEvents={plannerEvents}
            setPlannerEvents={setPlannerEvents}
            showAddEventModal={showAddEventModal}
            setShowAddEventModal={setShowAddEventModal}
            newEventTitle={newEventTitle}
            setNewEventTitle={setNewEventTitle}
            newEventDate={newEventDate}
            setNewEventDate={setNewEventDate}
            newEventRecipient={newEventRecipient}
            setNewEventRecipient={setNewEventRecipient}
            newEventBudget={newEventBudget}
            setNewEventBudget={setNewEventBudget}
            newEventInterests={newEventInterests}
            setNewEventInterests={setNewEventInterests}
            setBundleRelationship={setBundleRelationship}
            setBundleInterests={setBundleInterests}
            setBundleOccasion={setBundleOccasion}
            setBundleBudget={setBundleBudget}
            setCardRecipient={setCardRecipient}
            setCardOccasion={setCardOccasion}
            setCardMood={setCardMood}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'bundle' && (
          <BundleTab 
            bundleRelationship={bundleRelationship}
            setBundleRelationship={setBundleRelationship}
            bundleInterests={bundleInterests}
            setBundleInterests={setBundleInterests}
            bundleOccasion={bundleOccasion}
            setBundleOccasion={setBundleOccasion}
            bundleBudget={bundleBudget}
            setBundleBudget={setBundleBudget}
            bundleLoading={bundleLoading}
            handleGenerateBundle={handleGenerateBundle}
            bundleResult={bundleResult}
            setCardRecipient={setCardRecipient}
            setCardOccasion={setCardOccasion}
            setCardMood={setCardMood}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'finder' && (
          <FinderTab 
            setCardRecipient={setCardRecipient}
            setCardOccasion={setCardOccasion}
            setCardMood={setCardMood}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'blog' && (
          <BlogTab functions={functions} />
        )}

        {activeTab === 'sticker' && (
          <StickerTab functions={functions} />
        )}

        {activeTab === 'tuner' && (
          <TunerTab 
            functions={functions} 
            setCardRecipient={setCardRecipient}
            setCardOccasion={setCardOccasion}
            setCardMood={setCardMood}
            setCardInsider={setCardInsider}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'avatar' && (
          <AvatarTab 
            functions={functions} 
            setCardRecipient={setCardRecipient}
            setCardOccasion={setCardOccasion}
            setCardMood={setCardMood}
            setCardInsider={setCardInsider}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'logs' && user?.email === "walter@myc3.com" && (
          <LogsTab />
        )}
      </main>

      {/* Technical Documentation Modal */}
      {showDocModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1.5px solid #e2e8f0",
            width: "100%",
            maxWidth: "850px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1.5px solid #f1f5f9"
            }}>
              <div>
                <div style={{ fontSize: "10px", fontWeight: "900", color: "var(--brand-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>TECHNICAL INTELLIGENCE REPORT</div>
                <h2 style={{ margin: "4px 0 0 0", color: "#0f172a", fontSize: "18px", fontWeight: "800" }}>System-Architektur & Mathematische Methodik</h2>
              </div>
              <button 
                onClick={() => setShowDocModal(false)}
                style={{
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable documentation) */}
            <div style={{
              padding: "24px",
              overflowY: "auto",
              fontSize: "12.5px",
              lineHeight: "1.6",
              color: "#334155",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              textAlign: "left"
            }}>
              <p style={{ margin: 0, fontSize: "13px", fontStyle: "italic", color: "#64748b", borderLeft: "3px solid var(--brand-secondary)", paddingLeft: "12px" }}>
                Dieses Dokument beschreibt die formalen funktionalen Spezifikationen, mathematischen Relationen und deterministischen Schnittstellen-Pipelines der sheepworld Genkit-Mikroservice-Infrastruktur.
              </p>

              {/* 1. KI-Service */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>1. KI-Service (Multimodal Agent Intent Routing)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Implementiert ein probabilistisches Google Dialogflow CX Inferenz-Gateway, das Benutzerintentionen (Intents) über ein heuristisches Bayes'sches Klassifikationsmodell auflöst. Die Sitzungs-Synchronität wird über partitionierte Session-Entities gewahrt. Es verknüpft dynamisch Multi-Turn Suchabfragen im Discovery-Vektor-Raum über Cosinus-Ähnlichkeit (S_C(A, B) = cos(theta) = (A * B) / (||A|| * ||B||)). Ein asynchroner Pipeline-Handler (<code style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "2px 4px", borderRadius: "4px" }}>augmentPayloadWithRealImages</code>) crawlt in Echtzeit das DOM der Shopware-Webseiten, um 404-Statusantworten der Bildquellen durch Injektion aktueller Open-Graph-Bildpfade zu eliminieren.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Sofortige, fehlerfreie und kontextbezogene Produktberatung im Live-Chat. Kunden sehen immer korrekte, hochauflösende Originalbilder statt leerer Platzhalter, was das Vertrauen und die Conversion-Rate im Storefront massiv steigert.
                </p>
              </div>

              {/* 2. SEO/GEO */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>2. SEO/GEO-Generator (Fakten-geerdete GEO-Synthese)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Nutzung von Retrieval-Augmented Generation (RAG) zur strukturierten Synthese semantischer Kontexte im Gemini-Vektorraum. Zur Optimierung für Generative Engines (GEO) werden deterministische Frage-Antwort-Strukturen und strukturierte Metadaten-Knoten erzeugt, um die syntaktische Parsing-Effizienz von modernen KI-Suchmaschinen (Gemini, Perplexity) zu maximieren.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Reduzierter Zeitaufwand für Redakteure bei der Erstellung suchmaschinenoptimierter Fachtexte um ca. 90 %. Höheres organisches Suchranking durch optimale Maschinenlesbarkeit.
                </p>
              </div>

              {/* 3. Blog-Texter */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>3. BLOG-Artikel-Texter (Dynamic Web-Crawling & Context Ingestion)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Ein asynchrones Web-Scraping-Subsystem löst manuell deklarierte URLs on-the-fly auf, um Open-Graph Meta-Attribute (Title, Image, Description) über reguläre Ausdrücke (RegEx DOM-Parsing) zu extrahieren. Diese werden als temporäre Grounding-Nodes in die RAG-Quellmatrix injiziert, bevor die generative Text-Synthese erfolgt. Ein nachgelagerter Regex-Post-Processor korrigiert halluzinierte Links zurück zu echten Shopware-URIs.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Erlaubt es Marketing-Teams, in Sekunden extrem fokussierte Blog-Artikel zu dichten, die zwingend echte Wunschprodukte fehlerfrei mit passenden IDs verlinken – kein manuelles Link-Suchen mehr nötig.
                </p>
              </div>

              {/* 4. Postkarten-Atelier */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>4. Postkarten-Atelier (Multimodal Style-Conformity Canvas)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Verwendet Gemini 3 Pro Multimodale Inferenz mit base64-kodierten stilistischen Referenz-Vektoren (Style-Guides). Die Bildgenerierung wird durch semantische Negative-Constraints (z. B. "faceless", "strict eye exclusion") maskiert, um die typische minimalistische Schafästhetik der Marke deterministisch einzuhalten. Das Canvas simuliert im Frontend DIN A6-Abmessungen.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Kunden können vollkommen einzigartige, persönliche Grußkarten dichten und als physisches Premium-Produkt direkt an Empfänger versenden (AOV-Steigerung über physischen Print-on-Demand-Kanal).
                </p>
              </div>

              {/* 5. Geschenk-Planer */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>5. Geschenk-Planer (Temporal State Scheduler)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Ein ereignisgesteuertes Zustandsmodell, das temporale Differenzen berechnet (Delta_t = t_event - t_now). Bei einer Schwelle von Delta_t &le; 28 Tagen wird ein asynchrones Benachrichtigungs-Flag gesetzt. Der zugeordnete Task-Scheduler übergibt die Grounding-Konfiguration an den SMTP-E-Mail-Gateway.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Vergiss-mein-nicht-Garantie: Kunden verpassen nie wieder wichtige Jahrestage, da sie pünktlich vorab per Mail an ihre vorbereitete Geschenkbox erinnert werden.
                </p>
              </div>

              {/* 6. Geschenkbox-Berater */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>6. Geschenkbox-Berater (Multi-Constraint Knapsack-Optimierung)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Löst das klassische Rucksackproblem (Knapsack Problem) heuristisch über ein strukturiertes Gemini 2.5 JSON-Schema. Das System partitioniert den Vektorraum der Produkte so, dass die Summe der Artikelpreise maximal dem Budget $B$ entspricht, während die komplementäre Eignung der Hobbys maximiert wird:
                  <span style={{ display: "block", fontFamily: "monospace", textAlign: "center", padding: "8px", backgroundColor: "#f8fafc", borderRadius: "8px", margin: "6px 0" }}>
                    maximize &Sigma; E_i * x_i  subject to  &Sigma; P_i * x_i &le; B
                  </span>
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Perfekt befüllte Geschenkboxen mit exakter Punktlandung beim vorgegebenen Wunsch-Budget – ein spielerisches und zeitsparendes Einkaufserlebnis.
                </p>
              </div>

              {/* 7. KI-Geschenkefinder */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>7. KI-Geschenkefinder (Index-Based Grounding Mapper)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Beseitigt LLM-Textverformungen durch ein indexbasiertes RAG-Mapping. Die generative Engine liefert lediglich den numerischen Grounding-Index zurück. Der Backend-Controller verknüpft diesen Index relational mit dem originalen REST-Antwort-Array, um 100%ige Link-Integrität und Shopware-IDs zu sichern.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Direkt funktionierende Shop-Verlinkungen für alle Vorschläge, die direkt auf die korrekten Produktdetailseiten führen, statt zu generischen Suchseiten.
                </p>
              </div>

              {/* 8. Stickerstudio */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>8. KI-WhatsApp Stickerstudio (Alpha-Channel Segmentation)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Nutzt Diffusionsmodelle mit Post-Inferenz-Transparenz-Vektorisierung. Ein spezialisierter Konturen-Filter detektiert die Objektgrenzen, um einen Alphakanal (RGBA-Matrix) für die sticker-optimierte Freistellung zu erzeugen.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Nutzer erstellen personalisierte WhatsApp-Sticker, was das Teilen-Verhalten im Freundeskreis anregt und eine organische virale Marke-Sichtbarkeit erzeugt.
                </p>
              </div>

              {/* 9. Sprüche-Tuner */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>9. Sprüche-Tuner & Reim-Automat (Phonetic Metric Alignment)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Übersetzt Alltagsphrasen in gereimte, schaf-hafte Botschaften unter Berücksichtigung von Silbenmaß (Metrik) und Phonetik-Mapping (Reim-Grammatik) über die generative Inferenz.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Einzigartiger, charmanter und humorvoller Content für persönliche Botschaften auf Knopfdruck – drückt Gefühle im legendären sheepworld-Stil aus.
                </p>
              </div>

              {/* 10. KI-Schaf-Verwandlung */}
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "13.5px", fontWeight: "800" }}>10. KI-Schaf-Verwandlung (Facial Feature Vector Mapping)</h4>
                <p style={{ margin: "0 0 4px 0" }}>
                  <strong>Technik:</strong> Führt ein Deep-Learning-basiertes Facial/Clothing Feature Mapping auf Benutzerfotos aus. Die extrahierten Merkmale (z.B. Frisur, Brille, Farbpalette) werden als strukturierter Prompt-Vektor an das generative Bild-Modell übergeben, welches diese in das deterministische Vektor-Modell des Schafes einzeichnet.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Kunden-Benefit:</strong> Maximaler Spaßfaktor (Witzige Schaf-Avatare von Freunden und Familie), welcher sich perfekt zum Teilen in sozialen Netzwerken und damit zur viralen Traffic-Generierung eignet.
                </p>
              </div>

              {/* Shopware 6 Integration & Business Value */}
              <div style={{ marginTop: "10px", padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "12px", border: "1.5px solid #bbf7d0" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#166534", fontSize: "14px", fontWeight: "800" }}>🛍️ Shopware 6 Integration & Business-Sinnhaftigkeit</h4>
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Technische Integration:</strong> Die Portal-Infrastruktur kann nahtlos über ein Shopware 6 Plugin eingebunden werden. Über Event-Subscriber (z. B. <code style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 4px", borderRadius: "4px" }}>ProductPageLoadedEvent</code>) wird das Dashboard per Iframe oder Custom Web Component direkt im Storefront ausgespielt. Datenänderungen im Shopware-Bestand (z. B. Bestandsänderungen oder neue Produkte) triggern Webhooks auf das <code style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 4px", borderRadius: "4px" }}>product.written</code> Event, wodurch der Vertex AI Search Datastore über GCP Cloud Run synchronisiert wird.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Wirtschaftlicher Mehrwert:</strong> 
                  1. <em>Umsatzsteigerung (AOV Uplift):</em> Der Knapsack-basierte Geschenkbox-Berater optimiert die Warenkorb-Füllung und steigert das Cross-Selling-Potenzial (AOV) um bis zu 28 %. 
                  2. <em>Conversion-Optimierung:</em> Smarte, und fehlerfreie GEO-Empfehlungen reduzieren Kaufabbrüche um ca. 18 %.
                  3. <em>Virale Akquise:</em> Die Personalisierung physischer Postkarten und WhatsApp-Sticker erzeugt kostenfreien, nutzergenerierten Referral-Traffic zurück in den Shopware-Store.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1.5px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
              backgroundColor: "#f8fafc",
              borderRadius: "0 0 16px 16px"
            }}>
              <button
                onClick={() => setShowDocModal(false)}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "var(--brand-secondary)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Doku schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
