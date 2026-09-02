'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

interface SeoTabProps {
  functions: any;
}

export default function SeoTab({ functions }: SeoTabProps) {
  const [seoTopic, setSeoTopic] = useState("");
  const [seoBulletPoints, setSeoBulletPoints] = useState("");
  const [seoAudience, setSeoAudience] = useState("Endkunden (freundliches Du)");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoProductUrl, setSeoProductUrl] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<any>(null);

  const handleGenerateSEO = async () => {
    if (!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading) return;

    setSeoLoading(true);
    setSeoResult(null);

    try {
      const generateSEOContentFn = httpsCallable<any, any>(functions, "generateSEOContent", { timeout: 180000 }); // 3 minutes timeout
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
      {/* Left Panel: SEO Form */}
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
          <h3 style={{ margin: "0 0 4px 0", color: "var(--brand-eco)", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>✍️</span> SEO- & GEO-Generator
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Generiere suchmaschinenoptimierten Content mit intelligenten, realen Onlineshop-Verlinkungen aus unserer Live-Datenbank.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Thema des Textes / Ziel-Keyword</label>
          <input 
            type="text" 
            placeholder="z. B. Faultier Bettwäsche, Tasse 'Ohne Dich ist alles doof'..." 
            value={seoTopic}
            onChange={(e) => setSeoTopic(e.target.value)}
            disabled={seoLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Wichtige Stichpunkte & Details</label>
          <textarea 
            placeholder="z. B. Bettwäsche besteht aus 100 % Baumwolle, super Geschenk für Langschläfer, kuschelige Qualität..." 
            value={seoBulletPoints}
            onChange={(e) => setSeoBulletPoints(e.target.value)}
            disabled={seoLoading}
            rows={4}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Zielgruppe & Tonalität</label>
          <select 
            value={seoAudience}
            onChange={(e) => setSeoAudience(e.target.value)}
            disabled={seoLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", backgroundColor: "#ffffff" }}
          >
            <option value="Endkunden (freundliches Du)">Endkunden (freundliches Du)</option>
            <option value="B2B Händler (formelles Sie)">B2B Händler (formelles Sie)</option>
            <option value="Teenager (lässiges Du)">Teenager (lässiges Du)</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Zusätzliche Keywords (kommagetrennt)</label>
          <input 
            type="text" 
            placeholder="z. B. Geschenkidee, Kuscheln, Baumwollbettwäsche" 
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            disabled={seoLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Aktuelle Produkt-URL (Verlinkungs-Schutz)</label>
          <input 
            type="text" 
            placeholder="z. B. https://sheepworld.de/faultier-bettwaesche" 
            value={seoProductUrl}
            onChange={(e) => setSeoProductUrl(e.target.value)}
            disabled={seoLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
          <small style={{ fontSize: "10.5px", color: "#94a3b8" }}>
            Verhindert Eigen-Verlinkungen im generierten Text.
          </small>
        </div>

        <button
          onClick={handleGenerateSEO}
          disabled={!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading}
          style={{
            padding: "12px",
            backgroundColor: (!seoTopic.trim() || !seoBulletPoints.trim() || seoLoading) ? "#cbd5e1" : "var(--brand-eco)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "10px"
          }}
        >
          {seoLoading ? "✨ Text wird generiert..." : "✨ SEO-Text generieren"}
        </button>
      </div>

      {/* Right Panel: SEO Result Output */}
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
            border: "1.5px solid #cbd5e1",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "11px", color: "var(--brand-eco)", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Generierter Werbecontent</strong>
              <button 
                onClick={() => {
                  const fullCopy = `H1-Titel:\n${seoResult.title}\n\nMeta-Beschreibung:\n${seoResult.metaDescription}\n\nMarkdown-Inhalt:\n${seoResult.content}`;
                  navigator.clipboard.writeText(fullCopy);
                  alert("SEO-Inhalt erfolgreich kopiert! 📋");
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

            <div style={{ borderBottom: "1.5px solid var(--border-light)", paddingBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>GOOGLE H1-TITEL</span>
              <h3 style={{ margin: "4px 0 0 0", color: "var(--text-primary)", fontSize: "18px", fontWeight: "800" }}>
                {seoResult.title}
              </h3>
            </div>

            <div style={{ borderBottom: "1.5px solid var(--border-light)", paddingBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>META-BESCHREIBUNG (GOOGLE SNIPPET)</span>
              <p style={{ margin: "4px 0 0 0", color: "#475569", fontSize: "13.5px", lineHeight: "1.5" }}>
                {seoResult.metaDescription}
              </p>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", display: "block", marginBottom: "8px" }}>BODY-CONTENT (MARKDOWN & DEEPLINKS)</span>
              <div className="seo-markdown-body" style={{
                fontSize: "14.5px",
                lineHeight: "1.7",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                backgroundColor: "var(--bg-main)",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid var(--border-light)"
              }}>
                <div dangerouslySetInnerHTML={{
                  __html: seoResult.content
                    .replace(/<h2>(.*?)<\/h2>/g, '<h2 style="font-size: 16px; font-weight: 800; color: var(--brand-eco); margin: 16px 0 8px 0;">$1</h2>')
                    .replace(/<h3>(.*?)<\/h3>/g, '<h3 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 12px 0 6px 0;">$1</h3>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--brand-secondary); text-decoration: underline; font-weight: 700;">$1</a>')
                    .replace(/\n/g, '<br/>')
                }} />
              </div>
            </div>

            {seoResult.sources && seoResult.sources.length > 0 && (
              <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "6px" }}>GEERDETE QUELLE (DATENSTORE-ABGLEICH):</strong>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#64748b", lineHeight: "1.6" }}>
                  {seoResult.sources.map((src: any, idx: number) => (
                    <li key={idx}>
                      <a href={src.uri} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-secondary)", textDecoration: "underline" }}>
                        {src.title}
                      </a>
                    </li>
                  ))}
                </ul>
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
            border: "1.5px solid #cbd5e1",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            color: "var(--text-secondary)",
            padding: "40px",
            textAlign: "center"
          }}>
            {/* Real-time pulsing loading spinner */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div className="auth-spinner" style={{ borderLeftColor: "var(--brand-eco)" }}></div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
                🔍 Dursuche Wissensdatenbank...
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
                Wir rufen Live-Produktseiten von sheepworld.de ab, um reale Fakten, Preise und Deeplinks harmonisch in deinen SEO-Text einzubauen.
              </p>
            </div>
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
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zur Texterstellung</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links die Parameter ein, um in Sekunden einen suchmaschinenoptimierten, fakten-geerdeten Text zu dichten!</p>
          </div>
        )}
      </div>
    </div>
  );
}
