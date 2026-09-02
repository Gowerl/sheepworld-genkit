'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

interface BlogTabProps {
  functions: any;
}

export default function BlogTab({ functions }: BlogTabProps) {
  const [blogTopic, setBlogTopic] = useState("");
  const [blogProducts, setBlogProducts] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  
  // Specific target product URLs
  const [blogProductUrl1, setBlogProductUrl1] = useState("");
  const [blogProductUrl2, setBlogProductUrl2] = useState("");
  const [blogProductUrl3, setBlogProductUrl3] = useState("");

  const [blogLoading, setBlogLoading] = useState(false);
  const [blogResult, setBlogResult] = useState<any>(null);

  const handleGenerateBlog = async () => {
    if (!blogTopic.trim() || blogLoading) return;

    setBlogLoading(true);
    setBlogResult(null);

    const targetUrls = [blogProductUrl1.trim(), blogProductUrl2.trim(), blogProductUrl3.trim()].filter(Boolean);

    try {
      const generateBlogArticleFn = httpsCallable<any, any>(functions, "generateBlogArticle", { timeout: 180000 });
      const response = await generateBlogArticleFn({
        topic: blogTopic,
        targetProducts: blogProducts,
        productUrls: targetUrls,
        keywords: blogKeywords
      });

      setBlogResult(response.data);
    } catch (err: any) {
      console.error("Error generating blog article:", err);
      alert("Fehler bei der Blog-Generierung: " + err.message);
    } finally {
      setBlogLoading(false);
    }
  };

  const formatMarkdownToHtml = (markdown: string) => {
    if (!markdown) return "";
    let html = markdown;
    
    // Parse Headings
    html = html.replace(/^# (.*?)$/gm, '<h1 style="font-size: 20px; font-weight: 800; color: var(--brand-eco); margin: 20px 0 10px 0; border-bottom: 1.5px solid var(--border-light); padding-bottom: 8px;">$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="font-size: 16px; font-weight: 800; color: var(--brand-eco); margin: 18px 0 8px 0;">$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3 style="font-size: 14.5px; font-weight: 800; color: var(--text-primary); margin: 12px 0 6px 0;">$1</h3>');
    
    // Parse Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Parse Lists
    html = html.replace(/^\- (.*?)$/gm, '<li style="margin-left: 16px; margin-bottom: 4px;">$1</li>');
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-left: 16px; margin-bottom: 4px;">$1</li>');
    
    // Parse Markdown links [Anchor](URL)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--brand-secondary); text-decoration: underline; font-weight: 700;">$1</a>');
    
    // Convert newlines
    html = html.replace(/\n/g, '<br/>');
    
    return html;
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
      {/* Left Panel: Blog Form */}
      <div className="seo-form-card" style={{
        flex: "1 1 340px",
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        border: "1.5px solid #cbd5e1",
        boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        height: "fit-content",
        maxHeight: "100%",
        overflowY: "auto"
      }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", color: "#e11d48", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>📝</span> BLOG-Artikel-Texter
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Verfasse hochwertige Blog-Beiträge mit RAG-Grounding, Wunsch-Keywords und gezielten Produkt-Verlinkungen.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Blog-Thema / Aufhänger</label>
          <input 
            type="text" 
            placeholder="z. B. Ein gemütlicher Herbstsonntag zu Hause..." 
            value={blogTopic}
            onChange={(e) => setBlogTopic(e.target.value)}
            disabled={blogLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Wichtige Keywords (kommagetrennt)</label>
          <input 
            type="text" 
            placeholder="z. B. Entspannen, Tasse Tee, Gemütlich" 
            value={blogKeywords}
            onChange={(e) => setBlogKeywords(e.target.value)}
            disabled={blogLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Konkrete Produkt-URLs zum Referenzieren (max. 3)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input 
              type="text" 
              placeholder="z. B. https://www.sheepworld.de/Tasse-Relax/74123" 
              value={blogProductUrl1}
              onChange={(e) => setBlogProductUrl1(e.target.value)}
              disabled={blogLoading}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "12.5px" }}
            />
            <input 
              type="text" 
              placeholder="z. B. https://www.sheepworld.de/Kuschelkissen-Ohne-Dich/12345" 
              value={blogProductUrl2}
              onChange={(e) => setBlogProductUrl2(e.target.value)}
              disabled={blogLoading}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "12.5px" }}
            />
            <input 
              type="text" 
              placeholder="z. B. https://www.sheepworld.de/Wohlfuehlsocken/45483" 
              value={blogProductUrl3}
              onChange={(e) => setBlogProductUrl3(e.target.value)}
              disabled={blogLoading}
              style={{ padding: "8px 10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "12.5px" }}
            />
          </div>
          <small style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "2px" }}>
            Diese exakten Seiten werden im Hintergrund gecrawlt und garantiert im Fließtext verlinkt.
          </small>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Weitere Themen-Produkte (optionaler Text)</label>
          <textarea 
            placeholder="z. B. Faultier Tasse, Plüschschaf..." 
            value={blogProducts}
            onChange={(e) => setBlogProducts(e.target.value)}
            disabled={blogLoading}
            rows={2}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", fontFamily: "inherit" }}
          />
        </div>

        <button
          onClick={handleGenerateBlog}
          disabled={!blogTopic.trim() || blogLoading}
          style={{
            padding: "12px",
            backgroundColor: (!blogTopic.trim() || blogLoading) ? "#cbd5e1" : "#e11d48",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "6px",
            boxShadow: "0 4px 10px rgba(225, 29, 72, 0.15)"
          }}
        >
          {blogLoading ? "✨ Blog-Artikel wird generiert..." : "✨ Blog-Artikel dichten"}
        </button>
      </div>

      {/* Right Panel: Blog Result Output */}
      <div className="seo-result-card" style={{
        flex: "2 1 450px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%"
      }}>
        {blogResult ? (
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
              <strong style={{ fontSize: "11px", color: "#e11d48", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Echter RAG Blog-Artikel</strong>
              <button 
                onClick={() => {
                  const fullCopy = `Titel:\n${blogResult.title}\n\nMarkdown-Inhalt:\n${blogResult.content}`;
                  navigator.clipboard.writeText(fullCopy);
                  alert("Blog-Artikel erfolgreich in Zwischenablage kopiert! 📋");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "var(--bg-main)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#e11d48",
                  cursor: "pointer"
                }}
              >
                📋 Text kopieren
              </button>
            </div>

            <div style={{ borderBottom: "1.5px solid var(--border-light)", paddingBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>BLOG-UEBERSCHRIFT</span>
              <h3 style={{ margin: "4px 0 0 0", color: "var(--text-primary)", fontSize: "20px", fontWeight: "800" }}>
                {blogResult.title}
              </h3>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", display: "block", marginBottom: "8px" }}>ARTIKEL-BODY (FORMATED MARKDOWN & DEEPLINKS)</span>
              <div className="seo-markdown-body" style={{
                fontSize: "14.5px",
                lineHeight: "1.7",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                backgroundColor: "var(--bg-main)",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                maxHeight: "500px",
                overflowY: "auto"
              }}>
                <div dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(blogResult.content)
                }} />
              </div>
            </div>

            {blogResult.sources && blogResult.sources.length > 0 && (
              <div style={{ marginTop: "10px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "11px", color: "#64748b", display: "block", marginBottom: "6px" }}>EINGEBUNDENE PRODUKT-REFERENZEN (DATENSTORE):</strong>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11.5px", color: "#64748b", lineHeight: "1.6" }}>
                  {blogResult.sources.map((src: any, idx: number) => (
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
        ) : blogLoading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "450px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1.5px solid #cbd5e1",
            boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
            color: "var(--text-secondary)",
            padding: "40px",
            textAlign: "center"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div className="auth-spinner" style={{ borderLeftColor: "#e11d48" }}></div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "800" }}>
                🔍 Schreibe Blog-Artikel...
              </h3>
              <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
                Wir rufen Live-Produktseiten von sheepworld.de ab, crawlen eingegebene Wunsch-URLs in Echtzeit und dichten einen suchmaschinenoptimierten, ~1000 Zeichen langen Beitrag mit den perfekten Links.
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
            minHeight: "450px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "2px dashed #cbd5e1",
            color: "var(--text-secondary)",
            padding: "40px"
          }}>
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>📝</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zum Dichten</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links das Wunschthema, deine Wunsch-Produktlinks und SEO-Keywords an, um einen geerdeten Blog-Artikel in sheepworld-Qualität zu erstellen!</p>
          </div>
        )}
      </div>
    </div>
  );
}
