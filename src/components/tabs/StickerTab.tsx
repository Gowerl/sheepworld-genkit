'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

interface StickerTabProps {
  functions: any;
}

export default function StickerTab({ functions }: StickerTabProps) {
  const [catchphrase, setCatchphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerateSticker = async () => {
    if (!catchphrase.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      // In Next.js/Firebase Callable, we invoke 'generateGreetingCard' or a custom function
      // Let's call the dedicated function we'll add 'generateGreetingCard' with specific parameters, or a custom one 'generateSticker'
      const generateStickerFn = httpsCallable<any, any>(functions, "generateGreetingCard", { timeout: 180000 });
      
      // We can use the same greeting card generator in the backend as an engine by passing specific parameters for stickers!
      // This is super token-efficient because we reuse the already loaded models and assets!
      const response = await generateStickerFn({
        empfaenger: "WhatsApp Sticker",
        absender: "",
        anlass: `Sticker mit Text: "${catchphrase}"`,
        stimmung: "lustig, minimalistisch, Sticker-Format",
        insider: "STRICT: render only a single isolated sheep with transparent/white background, and write no eyes",
        motifType: "ai"
      });

      setResult({
        imageUrl: response.data.motifUrl,
        text: catchphrase
      });
    } catch (err: any) {
      console.error("Error generating sticker:", err);
      alert("Fehler bei der Sticker-Erstellung: " + err.message);
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
          <h3 style={{ margin: "0 0 4px 0", color: "#25d366", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🎨</span> WhatsApp Stickerstudio
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Dichte ein kurzes Schlagwort und lass die KI ein kultiges Schaf-Sticker-Unikat erzeugen, das du sofort in WhatsApp teilen kannst!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Sticker-Text / Schlagwort</label>
          <input 
            type="text" 
            placeholder="z. B. Müde!, Ich hab Hunger, Lächeln bitte..." 
            value={catchphrase}
            onChange={(e) => setCatchphrase(e.target.value)}
            disabled={loading}
            maxLength={30}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <button
          onClick={handleGenerateSticker}
          disabled={!catchphrase.trim() || loading}
          style={{
            padding: "12px",
            backgroundColor: (!catchphrase.trim() || loading) ? "#cbd5e1" : "#25d366",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "8px"
          }}
        >
          {loading ? "✨ Erzeuge Sticker..." : "✨ Sticker generieren"}
        </button>
      </div>

      {/* Right Panel: Output sticker */}
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
            alignItems: "center",
            gap: "20px",
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            border: "2px solid #bbf7d0",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}>
            <strong style={{ fontSize: "11px", color: "#22c55e", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Dein WhatsApp Sticker-Unikat</strong>
            
            {/* Real Transparent Looking Card */}
            <div style={{
              width: "220px",
              height: "220px",
              backgroundColor: "#ffffff",
              backgroundImage: "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              {result.imageUrl && (
                <img src={result.imageUrl} alt="" style={{ width: "80%", height: "80%", objectFit: "contain", mixBlendMode: "multiply" }} />
              )}
              
              {/* Overlay Sticker Text */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "900",
                fontFamily: "Comic Sans MS, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
              }}>
                {result.text}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "340px", marginTop: "10px" }}>
              <a 
                href={result.imageUrl} 
                download={`sheepworld_sticker_${result.text}.png`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "12px",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                💾 Sticker downloaden
              </a>
              <button
                onClick={() => {
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Schau mal, ich habe einen persönlichen sheepworld WhatsApp-Sticker für uns erstellt! 🐏 Link: ${result.imageUrl}`)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                style={{
                  flex: 1.5,
                  padding: "12px",
                  backgroundColor: "#25d366",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.2)"
                }}
              >
                🟢 In WhatsApp teilen
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
              <strong>Viraler Loop:</strong> Jedes Mal, wenn du diesen Sticker verschickst, wird der Empfänger automatisch auf unser Postkarten-Portal verlinkt, um sich auch Sticker zu basteln!
            </p>
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
            <div className="auth-spinner" style={{ borderLeftColor: "#25d366" }}></div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
              ✨ Erzeuge transparentes Sticker-Unikat...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Bitte habe einen Moment Geduld. Wir zeichen dein Schaf (ohne Augen, mit krausem Umriss) und binden den Text "{catchphrase}" ein!
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
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>🎨</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zum Sticker-Design</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links einen lustigen Sticker-Text ein, um dein schaf-haftes Sticker-Unikat für WhatsApp zu gestalten!</p>
          </div>
        )}
      </div>
    </div>
  );
}
