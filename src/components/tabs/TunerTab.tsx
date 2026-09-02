'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

interface TunerTabProps {
  functions: any;
  setCardRecipient: (val: string) => void;
  setCardOccasion: (val: string) => void;
  setCardMood: (val: string) => void;
  setCardInsider: (val: string) => void;
  setActiveTab: (val: 'chat' | 'seo' | 'cards' | 'planner' | 'bundle' | 'sticker' | 'tuner' | 'avatar') => void;
}

export default function TunerTab({
  functions,
  setCardRecipient,
  setCardOccasion,
  setCardMood,
  setCardInsider,
  setActiveTab
}: TunerTabProps) {
  const [userText, setUserText] = useState("");
  const [loading, setLoading] = useState(false);
  const [tunedResult, setTunedResult] = useState<any>(null);

  const handleTunePhrase = async () => {
    if (!userText.trim() || loading) return;

    setLoading(true);
    setTunedResult(null);

    try {
      const tunePhraseFn = httpsCallable<any, any>(functions, "tunePhrase", { timeout: 180000 });
      const response = await tunePhraseFn({
        text: userText
      });

      setTunedResult(response.data);
    } catch (err: any) {
      console.error("Error tuning phrase:", err);
      alert("Fehler beim Reimen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
          <h3 style={{ margin: "0 0 4px 0", color: "#f43f5e", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>✍️</span> Sprüche-Tuner & Reim-Automat
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Gib eine langweilige Alltagsnachricht ein und lass die KI einen unnachahmlichen, süß-frechen sheepworld-Reim daraus dichten!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Deine langweilige Nachricht</label>
          <textarea 
            placeholder="z. B. Ich vermisse dich im Urlaub, komm schnell wieder heim..." 
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            disabled={loading}
            rows={5}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", fontFamily: "inherit" }}
          />
        </div>

        <button
          onClick={handleTunePhrase}
          disabled={!userText.trim() || loading}
          style={{
            padding: "12px",
            backgroundColor: (!userText.trim() || loading) ? "#cbd5e1" : "#f43f5e",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "8px"
          }}
        >
          {loading ? "✨ Reime & Tune..." : "✨ Spruch veredeln (Tunen)"}
        </button>
      </div>

      {/* Right Panel: Output */}
      <div className="seo-result-card" style={{
        flex: "2 1 450px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%"
      }}>
        {tunedResult ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            backgroundColor: "#ffffff",
            padding: "28px",
            borderRadius: "16px",
            border: "1.5px solid #fecdd3",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "11px", color: "#f43f5e", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Veredelter sheepworld-Spruch</strong>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(tunedResult.tunedText);
                  alert("Veredelter Reim kopiert! 📋");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#e11d48",
                  cursor: "pointer"
                }}
              >
                📋 Kopieren
              </button>
            </div>

            {/* Premium Handwritten looking paper for the Rhyme */}
            <div style={{
              backgroundColor: "#fffdf9",
              border: "1px solid #cbd5e1",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.02)",
              position: "relative"
            }}>
              <span style={{ position: "absolute", top: "10px", right: "12px", fontSize: "18px" }}>🐏</span>
              <p style={{
                fontFamily: "Comic Sans MS, cursive, sans-serif",
                fontSize: "22px",
                fontWeight: "bold",
                color: "#1e293b",
                margin: 0,
                lineHeight: "1.5",
                fontStyle: "italic",
                whiteSpace: "pre-line"
              }}>
                "{tunedResult.tunedText}"
              </p>
            </div>

            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              <strong>Kreativ-Begründung der KI:</strong> {tunedResult.explanation}
            </p>

            {/* Bridge Action to CardsTab */}
            <div style={{
              borderTop: "1.5px solid #f1f5f9",
              paddingTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "14.5px", color: "#1e293b", fontWeight: "800" }}>
                  Diesen Spruch auf eine Postkarte drucken? 📮
                </h4>
                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
                  Vollautomatisch! Wir übertragen den veredelten Reim direkt in das Postkarten-Atelier für dich.
                </p>
              </div>

              <button
                onClick={() => {
                  setCardRecipient("Lieblingsmensch");
                  setCardOccasion("Kreative Überraschung");
                  setCardMood("Witzig & Humorvoll (leicht neckisch)");
                  setCardInsider(`STRICT: nutze exakt diesen Spruch als titelSpruch: "${tunedResult.tunedText}"`);
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
                📬 Postkarte dichten & verschicken
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
            border: "1.5px solid #cbd5e1",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            color: "var(--text-secondary)",
            padding: "40px",
            textAlign: "center"
          }}>
            <div className="auth-spinner" style={{ borderLeftColor: "#f43f5e" }}></div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
              ✨ Reime schleifen & dichten...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Bitte habe einen Moment Geduld. Wir übersetzen deine Nachricht in den typischen, emotionalen Reimstil von sheepworld!
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
            border: "2px dashed #cbd5e1",
            color: "var(--text-secondary)",
            padding: "40px"
          }}>
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>✍️</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zum Tunen</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links einen gewöhnlichen Text ein, um ihn per Knopfdruck in einen kartenreifen sheepworld-Reim zu verwandeln!</p>
          </div>
        )}
      </div>
    </div>
  );
}
