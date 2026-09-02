'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

interface FinderTabProps {
  setCardRecipient: (val: string) => void;
  setCardOccasion: (val: string) => void;
  setCardMood: (val: string) => void;
  setActiveTab: (val: 'chat' | 'seo' | 'cards' | 'planner' | 'bundle' | 'finder') => void;
}

export default function FinderTab({
  setCardRecipient,
  setCardOccasion,
  setCardMood,
  setActiveTab
}: FinderTabProps) {
  const [relationship, setRelationship] = useState('');
  const [interests, setInterests] = useState('');
  const [occasion, setOccasion] = useState('');
  const [budget, setBudget] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerateRecommendations = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const generateGiftRecommendationsFn = httpsCallable<any, any>(
        functions, 
        'generateGiftRecommendations', 
        { timeout: 180000 }
      );
      
      const response = await generateGiftRecommendationsFn({
        relationship: relationship,
        interests: interests,
        occasion: occasion,
        budget: budget
      });
      
      setResult(response.data);
    } catch (err: any) {
      console.error("Error generating gift recommendations:", err);
      alert("Fehler bei der Suche: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="finder-container" style={{
      display: "flex",
      gap: "24px",
      padding: "24px",
      height: "calc(100% - 68px)",
      overflowY: "auto",
      flexWrap: "wrap",
      textAlign: "left"
    }}>
      {/* Left Panel: Query Form */}
      <div className="seo-form-card" style={{
        flex: "1 1 320px",
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        border: "1.5px solid #cbd5e1",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        height: "fit-content"
      }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", color: "#16a34a", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔍</span> KI-Geschenkefinder
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Erhalte sofort 3 inspirierende sheepworld-Einzelgeschenkideen perfekt passend für jeden Anlass!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Beschenkte Person / Beziehung</label>
          <input 
            type="text" 
            placeholder="z. B. Bester Kumpel, Kollege, Opa, Julia..." 
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            disabled={loading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Hobbys & Interessen</label>
          <input 
            type="text" 
            placeholder="z. B. Grillen, Radfahren, Ausschlafen, Schokolade..." 
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            disabled={loading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Anlass</label>
          <input 
            type="text" 
            placeholder="z. B. Einweihung, Geburtstag, Ruhestand, Vatertag..." 
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            disabled={loading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Max. Budget pro Produkt: {budget} €</label>
          <input 
            type="range" 
            min="5" 
            max="100" 
            step="5"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            disabled={loading}
            style={{ width: "100%", accentColor: "#16a34a" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
            <span>5 €</span>
            <span>100 €</span>
          </div>
        </div>

        <button
          onClick={handleGenerateRecommendations}
          disabled={!relationship.trim() || !interests.trim() || !occasion.trim() || loading}
          style={{
            padding: "12px",
            backgroundColor: (!relationship.trim() || !interests.trim() || !occasion.trim() || loading) ? "#cbd5e1" : "#16a34a",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "8px"
          }}
        >
          {loading ? "✨ Suche Geschenkideen..." : "✨ Geschenkideen suchen"}
        </button>
      </div>

      {/* Right Panel: Curated Result */}
      <div className="seo-result-card" style={{
        flex: "2 1 450px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%"
      }}>
        {result ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #bbf7d0",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}>
            {/* Title */}
            <div style={{ borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px" }}>
              <strong style={{ display: "block", fontSize: "11px", color: "#16a34a", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Gefundene Geschenkideen</strong>
              <h3 style={{ margin: "4px 0 0 0", color: "#1e293b", fontSize: "20px", fontWeight: "800" }}>
                Top 3 Vorschläge für {relationship}
              </h3>
            </div>

            {/* Recommendations Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {result.recommendations?.map((prod: any, idx: number) => (
                <div key={idx} style={{
                  display: "flex",
                  gap: "16px",
                  border: "1px solid #f1f5f9",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#f8fafc",
                  alignItems: "center"
                }}>
                  {/* Badge Number */}
                  <div style={{
                    backgroundColor: "#16a34a",
                    color: "white",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "900",
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>

                  <div style={{ width: "70px", height: "70px", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                    <img src={prod.imageUrl || "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg"} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>{prod.title}</h4>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#16a34a", whiteSpace: "nowrap" }}>{prod.price?.toFixed(2)} €</span>
                    </div>
                    <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "#475569", lineHeight: "1.4" }}>
                      {prod.reason}
                    </p>
                  </div>
                  
                  <a 
                    href={
                      prod.url && prod.url !== "https://sheepworld.de" && prod.url !== "https://www.sheepworld.de"
                        ? prod.url 
                        : `https://www.sheepworld.de/search?sSearch=${encodeURIComponent(prod.title)}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#16a34a",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      textDecoration: "none",
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)"
                    }}
                  >
                    🛒 Shop
                  </a>
                </div>
              ))}
            </div>

            {/* Quick Action Box */}
            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1.5px solid #bbf7d0",
              borderRadius: "12px",
              padding: "16px",
              marginTop: "8px"
            }}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#166534", fontWeight: "800" }}>
                Möchtest du eine Grußkarte dazu dichten? 💌
              </h4>
              <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#166534", lineHeight: "1.4" }}>
                Verfasse passend zum Anlass "{occasion}" direkt eine passende schaf-hafte Botschaft an "{relationship}".
              </p>
              <button
                onClick={() => {
                  setCardRecipient(relationship);
                  setCardOccasion(occasion);
                  setCardMood("Süß & Herzerwärmend");
                  setActiveTab('cards');
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                ✍️ Karte dichten
              </button>
            </div>

          </div>
        ) : loading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "400px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1.5px solid #bbf7d0",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            color: "var(--text-secondary)",
            padding: "40px",
            textAlign: "center"
          }}>
            <div className="auth-spinner" style={{ borderLeftColor: "#16a34a" }}></div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
              🔍 Durchsuche sheepworld Onlineshop...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Wir durchkämmen unsere Produktkataloge nach den besten Einzelgeschenken zu den Hobbys "{interests}" und dem Anlass "{occasion}".
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
            border: "2px dashed #bbf7d0",
            color: "var(--text-secondary)",
            padding: "40px"
          }}>
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>🎁</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zur Suche</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>
              Gib links die Interessen und den Anlass an, um eine personalisierte Auswahl von 3 tollen Einzelgeschenken zu erhalten!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
