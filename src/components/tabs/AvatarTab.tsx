'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

interface AvatarTabProps {
  functions: any;
  setCardRecipient: (val: string) => void;
  setCardOccasion: (val: string) => void;
  setCardMood: (val: string) => void;
  setCardInsider: (val: string) => void;
  setActiveTab: (val: 'chat' | 'seo' | 'cards' | 'planner' | 'bundle' | 'sticker' | 'tuner' | 'avatar') => void;
}

export default function AvatarTab({
  functions,
  setCardRecipient,
  setCardOccasion,
  setCardMood,
  setCardInsider,
  setActiveTab
}: AvatarTabProps) {
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarResultUrl, setAvatarResultUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = async () => {
    if (!selectedFileBase64 || loading) return;

    setLoading(true);
    setAvatarResultUrl(null);

    try {
      const generateAvatarFn = httpsCallable<any, any>(functions, "generateAvatar", { timeout: 180000 });
      const response = await generateAvatarFn({
        image: selectedFileBase64
      });

      setAvatarResultUrl(response.data.avatarUrl);
    } catch (err: any) {
      console.error("Error generating avatar:", err);
      alert("Fehler bei der Schaf-Verwandlung: " + err.message);
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
          <h3 style={{ margin: "0 0 4px 0", color: "#6366f1", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🐑</span> KI-Schaf-Verwandlung
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Lade ein Foto von dir, deinem Partner oder Haustier hoch und die KI zeichnet daraus ein maßgeschneidertes, ikonisches sheepworld-Schaf!
          </p>
        </div>

        {/* File Uploader */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Foto hochladen (JPEG/PNG)</label>
          <div style={{
            border: "2px dashed #6366f1",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            backgroundColor: "#f5f3ff",
            cursor: "pointer",
            position: "relative"
          }}>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                cursor: "pointer",
                width: "100%",
                height: "100%"
              }}
            />
            <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>📸</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5", display: "block" }}>
              {selectedFileName ? `Ausgewählt: ${selectedFileName}` : "Klicke zum Auswählen oder Drag & Drop"}
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
              Merkmale wie Haare, Brille und Kleidung werden schaf-haft übersetzt.
            </span>
          </div>
        </div>

        {selectedFileBase64 && (
          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>DEIN ORIGINAL-FOTO:</span>
            <div style={{ width: "120px", height: "120px", borderRadius: "8px", overflow: "hidden", display: "inline-block", border: "1px solid #cbd5e1" }}>
              <img src={selectedFileBase64} alt="Original" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerateAvatar}
          disabled={!selectedFileBase64 || loading}
          style={{
            padding: "12px",
            backgroundColor: (!selectedFileBase64 || loading) ? "#cbd5e1" : "#6366f1",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "800",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "8px",
            boxShadow: "0 4px 15px rgba(99, 102, 241, 0.25)"
          }}
        >
          {loading ? "✨ Verwandle Foto..." : "✨ Foto in Schaf verwandeln"}
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
        {avatarResultUrl ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            backgroundColor: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            border: "2px solid #c7d2fe",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}>
            <strong style={{ fontSize: "11px", color: "#6366f1", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Dein persönliches Schaf-Portrait</strong>
            
            {/* Side by side comparison */}
            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              {/* Original */}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", display: "block", marginBottom: "8px" }}>FOTO</span>
                <div style={{ width: "160px", height: "160px", borderRadius: "12px", overflow: "hidden", border: "1.5px solid #cbd5e1" }}>
                  <img src={selectedFileBase64 || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>

              {/* Arrow */}
              <div style={{ fontSize: "28px", color: "#6366f1" }}>➔</div>

              {/* Sheep Avatar */}
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", display: "block", marginBottom: "8px" }}>DEIN KI-SCHAF</span>
                <div style={{ width: "200px", height: "160px", borderRadius: "12px", overflow: "hidden", border: "2px solid #6366f1", backgroundColor: "#ffffff" }}>
                  <img src={avatarResultUrl} alt="Sheep Avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "380px", marginTop: "10px" }}>
              <button
                onClick={() => {
                  setCardRecipient("Menschlein");
                  setCardOccasion("Ich als Schaf");
                  setCardMood("Süß & Herzerwärmend");
                  // Trigger generator with this custom image injected
                  setCardInsider(`Nutze dieses persönliche Schaf-Portrait als Motiv: ${avatarResultUrl}`);
                  setActiveTab('cards');
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ffffff",
                  color: "#4f46e5",
                  border: "1.5px solid #c7d2fe",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                💌 Auf Postkarte drucken
              </button>
              
              <a 
                href={avatarResultUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1.2,
                  textAlign: "center",
                  padding: "12px",
                  backgroundColor: "#6366f1",
                  color: "white",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "800",
                  textDecoration: "none",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
                }}
              >
                ☕ Auf Kaffeetasse drucken
              </a>
            </div>

            <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8", lineHeight: "1.4", maxWidth: "420px" }}>
              <strong>100% Brand Compliance:</strong> Das Schaf wurde vom Bild-Generator gezeichnet – unter Einhaltung des Verbots von Augen und mit der krausen Textur des offiziellen Styleguides!
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
            <div className="auth-spinner" style={{ borderLeftColor: "#6366f1" }}></div>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
              🧬 Merkmale werden extrahiert...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Wir nutzen das Vertex AI Gemini Modell zur optischen Stilanalyse deines Fotos, um deine persönlichen Merkmale in eine originale schaf-hafte Handzeichnung zu verwandeln.
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
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>🐑📸</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Warte auf Foto-Upload</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Lade links ein Foto hoch, um zu sehen, wie du als gezeichnetes Kultschaf von sheepworld aussehen würdest!</p>
          </div>
        )}
      </div>
    </div>
  );
}
