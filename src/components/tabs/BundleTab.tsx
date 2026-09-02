'use client';

import React from 'react';

interface BundleTabProps {
  bundleRelationship: string;
  setBundleRelationship: (val: string) => void;
  bundleInterests: string;
  setBundleInterests: (val: string) => void;
  bundleOccasion: string;
  setBundleOccasion: (val: string) => void;
  bundleBudget: number;
  setBundleBudget: (val: number) => void;
  bundleLoading: boolean;
  handleGenerateBundle: () => Promise<void>;
  bundleResult: any;
  setCardRecipient: (val: string) => void;
  setCardOccasion: (val: string) => void;
  setCardMood: (val: string) => void;
  setActiveTab: (val: 'chat' | 'seo' | 'cards' | 'planner' | 'bundle') => void;
}

export default function BundleTab({
  bundleRelationship,
  setBundleRelationship,
  bundleInterests,
  setBundleInterests,
  bundleOccasion,
  setBundleOccasion,
  bundleBudget,
  setBundleBudget,
  bundleLoading,
  handleGenerateBundle,
  bundleResult,
  setCardRecipient,
  setCardOccasion,
  setCardMood,
  setActiveTab
}: BundleTabProps) {
  return (
    <div className="bundle-container" style={{
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
          <h3 style={{ margin: "0 0 4px 0", color: "var(--brand-secondary)", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🎁</span> Geschenkbox-Berater
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Finde in Sekunden das perfekte sheepworld-Geschenkpaket basierend auf Budget und Interessen!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Beschenkte Person / Beziehung</label>
          <input 
            type="text" 
            placeholder="z. B. Ehefrau (Julia), Freundin, Schwester..." 
            value={bundleRelationship}
            onChange={(e) => setBundleRelationship(e.target.value)}
            disabled={bundleLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Hobbys & Interessen</label>
          <input 
            type="text" 
            placeholder="z. B. Faultiere, Kaffee trinken, Kuscheln, Hunde..." 
            value={bundleInterests}
            onChange={(e) => setBundleInterests(e.target.value)}
            disabled={bundleLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Anlass</label>
          <input 
            type="text" 
            placeholder="z. B. Geburtstag, Jahrestag, Ostern..." 
            value={bundleOccasion}
            onChange={(e) => setBundleOccasion(e.target.value)}
            disabled={bundleLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Maximales Budget: {bundleBudget} €</label>
          <input 
            type="range" 
            min="15" 
            max="150" 
            step="5"
            value={bundleBudget}
            onChange={(e) => setBundleBudget(Number(e.target.value))}
            disabled={bundleLoading}
            style={{ width: "100%", accentColor: "var(--brand-secondary)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
            <span>15 €</span>
            <span>150 €</span>
          </div>
        </div>

        <button
          onClick={handleGenerateBundle}
          disabled={!bundleRelationship.trim() || !bundleInterests.trim() || !bundleOccasion.trim() || bundleLoading}
          style={{
            padding: "12px",
            backgroundColor: (!bundleRelationship.trim() || !bundleInterests.trim() || !bundleOccasion.trim() || bundleLoading) ? "#cbd5e1" : "var(--brand-secondary)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "8px"
          }}
        >
          {bundleLoading ? "✨ Stelle Geschenkbox zusammen..." : "✨ Geschenkbox zusammenstellen"}
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
        {bundleResult ? (
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
            {/* Title & total budget */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #f1f5f9", paddingBottom: "12px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "11px", color: "#22c55e", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Perfekt kuratierte Box</strong>
                <h3 style={{ margin: "4px 0 0 0", color: "#1e293b", fontSize: "20px", fontWeight: "800" }}>{bundleResult.bundleName}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>GESAMTPREIS</span>
                <div style={{ fontSize: "24px", color: "#16a34a", fontWeight: "900", lineHeight: "1" }}>{bundleResult.totalPrice?.toFixed(2)} €</div>
              </div>
            </div>

            {/* AI justification text / Pitch */}
            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6", fontStyle: "italic", backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              "{bundleResult.pitch}"
            </p>

            {/* Product items in bundle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <strong style={{ fontSize: "12px", color: "#1e293b", textTransform: "uppercase", fontWeight: "700" }}>Karton-Inhalt:</strong>
              {bundleResult.products?.map((prod: any, idx: number) => (
                <div key={idx} style={{
                  display: "flex",
                  gap: "16px",
                  border: "1px solid #f1f5f9",
                  borderRadius: "12px",
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  alignItems: "center"
                }}>
                  <div style={{ width: "60px", height: "60px", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                    <img src={prod.imageUrl || "https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg"} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>{prod.title}</h4>
                      <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#475569" }}>{prod.price?.toFixed(2)} €</span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>{prod.reason}</p>
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
                      padding: "6px 12px",
                      backgroundColor: "var(--brand-secondary)",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "700",
                      borderRadius: "6px",
                      textDecoration: "none"
                    }}
                  >
                    🛒 Shop
                  </a>
                </div>
              ))}
            </div>

            {/* BRIDGE ACTION TO GREETING CARD GENERATOR */}
            {bundleResult.cardSuggestion && (
              <div style={{
                backgroundColor: "#fff1f2",
                border: "1.5px solid #fecdd3",
                borderRadius: "16px",
                padding: "20px",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap"
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#9f1239", fontWeight: "800" }}>
                    Passende Grußkarte dazu dichten? 💌
                  </h4>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#be123c", lineHeight: "1.4" }}>
                    Die KI hat bereits ein passendes Dicht-Profil für das Geschenk-Set entworfen. Wir legen die gedruckte Karte gratis mit ins Paket!
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Transfer suggested parameters to greeting card form state!
                    setCardRecipient(bundleRelationship);
                    setCardOccasion(bundleOccasion);
                    setCardMood(bundleResult.cardSuggestion.mood || "Süß & Herzerwärmend");
                    setActiveTab('cards');
                  }}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#f43f5e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "800",
                    cursor: "pointer",
                    fontSize: "13.5px",
                    boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)"
                  }}
                >
                  ✍️ Karte jetzt dichten
                </button>
              </div>
            )}

          </div>
        ) : bundleLoading ? (
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
            <div className="auth-spinner" style={{ borderLeftColor: "#22c55e" }}></div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
              🔍 Durchsuche sheepworld Onlineshop...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Wir durchsuchen unsere Vertex AI Search Grounding-Datenbank nach passenden Kollektionen zu den Hobbies "{bundleInterests}" und dem Anlass "{bundleOccasion}", um eine wunderschöne Box für unter {bundleBudget} € zusammenzustellen!
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
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>🛍️</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zur Kuration</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links die Daten deiner Liebsten und das Budget ein, um ein maßgeschneidertes sheepworld-Geschenk-Bundle zusammenzustellen!</p>
          </div>
        )}
      </div>
    </div>
  );
}
