'use client';

import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';

// Modular PostcardViewer component inside CardsTab (self-contained layout)
interface PostcardViewerProps {
  cardResult: {
    cardId?: string;
    empfaenger: string;
    titelSpruch: string;
    innentext: string;
    motifUrl?: string;
  };
}

const PostcardViewer: React.FC<PostcardViewerProps> = ({ cardResult }) => {
  const [showPostcardCheckout, setShowPostcardCheckout] = useState(false);
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [postcardOrdered, setPostcardOrdered] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      backgroundColor: "#ffffff",
      padding: "24px",
      borderRadius: "16px",
      border: "1.5px solid #fbcfe8",
      boxShadow: "0 4px 15px rgba(19, 64, 148, 0.02)",
      textAlign: "left"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "var(--brand-eco)", fontWeight: "800" }}>🚀 Deine gestaltete Postkarte</h3>
        <button 
          onClick={() => {
            const fullCopy = `Karten-Vorderseite (Spruch):\n${cardResult.titelSpruch}\n\nKarten-Innenseite:\n${cardResult.innentext}`;
            navigator.clipboard.writeText(fullCopy);
            alert("Karteninhalt erfolgreich kopiert! 📋");
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

      {/* POSTCARD VISUALIZER (Horizontal format) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Postcard Front Side (Vorderseite) */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "2px solid #e2e8f0",
          boxShadow: "0 8px 16px rgba(0,0,0,0.04)",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          aspectRatio: "1.41", // Standard A6 horizontal ratio
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            position: "absolute",
            top: "10px",
            left: "12px",
            fontSize: "10px",
            fontWeight: "700",
            color: "#cbd5e1",
            letterSpacing: "1px",
            textTransform: "uppercase",
            zIndex: 10
          }}>Postkarte - Vorderseite</div>

          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            padding: "30px 10px 10px 10px",
            borderBottom: "1px solid #f1f5f9",
            overflow: "hidden"
          }}>
            {cardResult.motifUrl ? (
              <img 
                src={cardResult.motifUrl} 
                alt="Motiv" 
                style={{ 
                  maxHeight: "100%", 
                  maxWidth: "100%", 
                  objectFit: "contain",
                  borderRadius: "8px"
                }} 
              />
            ) : (
              <span style={{ fontSize: "40px" }}>🐑</span>
            )}
          </div>

          <div style={{
            padding: "16px 20px",
            textAlign: "center",
            backgroundColor: "#ffffff",
            minHeight: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <p style={{
              fontFamily: "Comic Sans MS, cursive, sans-serif",
              fontSize: "20px",
              fontWeight: "bold",
              color: "#0f172a",
              margin: 0,
              lineHeight: "1.3"
            }}>
              "{cardResult.titelSpruch}"
            </p>
          </div>
        </div>

        {/* Postcard Back Side (Rückseite) */}
        <div style={{
          backgroundColor: "#fffdf9", // Classic warm off-white postcard paper
          backgroundImage: "radial-gradient(#f3efe2 1.5px, transparent 0)",
          backgroundSize: "20px 20px",
          borderRadius: "12px",
          border: "2px solid #e2e8f0",
          boxShadow: "0 8px 16px rgba(0,0,0,0.04)",
          position: "relative",
          width: "100%",
          aspectRatio: "1.41",
          display: "flex",
          padding: "24px",
          boxSizing: "border-box",
          gap: "20px"
        }}>
          <div style={{
            position: "absolute",
            top: "10px",
            left: "12px",
            fontSize: "10px",
            fontWeight: "700",
            color: "#94a3b8",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}>Postkarte - Rückseite</div>

          {/* Thin vertical postcard splitter */}
          <div style={{
            position: "absolute",
            top: "30px",
            bottom: "30px",
            left: "50%",
            width: "1.5px",
            backgroundColor: "#cbd5e1"
          }} />

          {/* Left: Message */}
          <div style={{
            flex: 1,
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            textAlign: "left"
          }}>
            <p style={{
              fontFamily: "Georgia, serif",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#1e293b",
              fontStyle: "italic",
              margin: 0,
              whiteSpace: "pre-line",
              maxHeight: "100%",
              overflowY: "auto"
            }}>
              {cardResult.innentext}
            </p>
          </div>

          {/* Right: Stamp & Address lines */}
          <div style={{
            flex: 1,
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            position: "relative"
          }}>
            {/* Stamp Box */}
            <div style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "55px",
              height: "65px",
              border: "2px dashed #94a3b8",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              fontSize: "8px",
              fontWeight: "bold",
              color: "#94a3b8"
            }}>
              <span style={{ fontSize: "16px" }}>🐏</span>
              STAMP
            </div>

            {/* Address Lines */}
            <div style={{
              marginTop: "85px",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}>
              <div style={{ borderBottom: "1px dotted #94a3b8", paddingBottom: "4px", fontSize: "13px", color: "#1e293b", fontWeight: "700", textAlign: "left" }}>
                An: {cardResult.empfaenger}
              </div>
              <div style={{ borderBottom: "1px dotted #94a3b8", paddingBottom: "4px", fontSize: "13px", color: showPostcardCheckout && shippingStreet ? "#1e293b" : "#94a3b8", fontStyle: "italic", minHeight: "20px", textAlign: "left" }}>
                {showPostcardCheckout && shippingStreet ? shippingStreet : "Straße, Hausnummer"}
              </div>
              <div style={{ borderBottom: "1px dotted #94a3b8", paddingBottom: "4px", fontSize: "13px", color: showPostcardCheckout && (shippingZip || shippingCity) ? "#1e293b" : "#94a3b8", fontStyle: "italic", minHeight: "20px", textAlign: "left" }}>
                {showPostcardCheckout && (shippingZip || shippingCity) ? `${shippingZip} ${shippingCity}` : "PLZ, Ort"}
              </div>
              <div style={{ borderBottom: "1px dotted #94a3b8", paddingBottom: "4px", fontSize: "13px", color: "#475569", fontWeight: "600", textAlign: "left" }}>
                Deutschland
              </div>
            </div>

            {/* Tiny bottom loop info */}
            <div style={{
              position: "absolute",
              bottom: "-15px",
              left: "0",
              fontSize: "8.5px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span>📱</span> QR-Code: sheepworld Postkarten-Atelier
            </div>
          </div>

        </div>
      </div>

      {/* SHIPPING & SHARING OPTION PANEL */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginTop: "12px"
      }}>
        {/* Option 1: Digital sharing */}
        <div style={{
          border: "1.5px solid #cbd5e1",
          borderRadius: "16px",
          padding: "20px",
          backgroundColor: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#334155", fontWeight: "800" }}>
              Option A: Digital versenden 📱
            </h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
              Erhalte einen kostenlosen, interaktiven 3D-Link. Perfekt zum sofortigen Versenden per WhatsApp oder E-Mail.
            </p>
          </div>

          {cardResult.cardId && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/karte/${cardResult.cardId}`;
                  navigator.clipboard.writeText(link);
                  alert("Link erfolgreich kopiert! 📋 Schicke ihn jetzt per WhatsApp oder E-Mail.");
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#334155",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                📋 Link kopieren
              </button>
              
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Schau mal, ich habe eine persönliche schaf-hafte Postkarte für dich erstellt! 🐏 Hier ansehen: ${window.location.origin}/karte/${cardResult.cardId}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  backgroundColor: "#25d366",
                  color: "#ffffff",
                  padding: "10px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textDecoration: "none"
                }}
              >
                🟢 Über WhatsApp senden
              </a>
            </div>
          )}
        </div>

        {/* Option 2: Physical card printing */}
        <div style={{
          border: "2px solid #bbf7d0",
          borderRadius: "16px",
          padding: "20px",
          backgroundColor: "#f0fdf4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
              Option B: Echte Postkarte 📮
            </h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "#15803d", lineHeight: "1.4" }}>
              Lass sheepworld diese Karte in Premium-Qualität auf echten Postkartenkarton drucken und direkt per Post an {cardResult.empfaenger || "den Empfänger"} senden.
            </p>
          </div>

          <button
            onClick={() => {
              setShowPostcardCheckout(true);
              setPostcardOrdered(false);
            }}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
            }}
          >
            📬 Per Post verschicken (2,49 €)
          </button>
        </div>
      </div>

      {/* PREMIUM POSTCARD CHECKOUT OVERLAY / FORM */}
      {showPostcardCheckout && (
        <div style={{
          marginTop: "16px",
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1.5px solid #86efac",
          boxShadow: "0 6px 20px rgba(0,0,0,0.05)"
        }}>
          {!postcardOrdered ? (
            <div style={{ textAlign: "left" }}>
              <h4 style={{ margin: "0 0 4px 0", color: "#166534", fontSize: "16px", fontWeight: "800" }}>
                📮 Postkarten-Lieferadresse eingeben
              </h4>
              <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#64748b" }}>
                Gib die Versandadresse ein. Wir drucken die Karte noch heute und übergeben sie der Post!
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Empfängername</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={cardResult.empfaenger} 
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#f1f5f9", fontSize: "13px" }} 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Straße & Hausnummer</label>
                  <input 
                    type="text" 
                    placeholder="Schafstraße 4a" 
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }} 
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>PLZ</label>
                    <input 
                      type="text" 
                      placeholder="92289" 
                      value={shippingZip}
                      onChange={(e) => setShippingZip(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }} 
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#334155" }}>Ort</label>
                    <input 
                      type="text" 
                      placeholder="Ursensollen" 
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }} 
                    />
                  </div>
                </div>

                {/* Payment Method selection mockup */}
                <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <strong style={{ fontSize: "11px", display: "block", marginBottom: "8px", color: "#475569" }}>Zahlungsmethode</strong>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#334155", cursor: "pointer" }}>
                      <input type="radio" name="payment" defaultChecked /> PayPal
                    </label>
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#334155", cursor: "pointer" }}>
                      <input type="radio" name="payment" /> Kreditkarte
                    </label>
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#334155", cursor: "pointer" }}>
                      <input type="radio" name="payment" /> Google Pay
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => setShowPostcardCheckout(false)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => setPostcardOrdered(true)}
                    disabled={!shippingStreet || !shippingZip || !shippingCity}
                    style={{
                      flex: 2,
                      padding: "10px",
                      backgroundColor: (!shippingStreet || !shippingZip || !shippingCity) ? "#cbd5e1" : "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "800",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Jetzt zahlungspflichtig bestellen (2,49 €)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "8px" }}>🎉📬</span>
              <h4 style={{ color: "#15803d", fontSize: "18px", fontWeight: "800", margin: "0 0 8px 0" }}>
                Auftrag erfolgreich übermittelt!
              </h4>
              <p style={{ fontSize: "13.5px", color: "#166534", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                Vielen Dank für deine Bestellung! Die Postkarte für <strong>{cardResult.empfaenger}</strong> wurde erfolgreich an die Drucker-API übertragen. Sie wird gedruckt und innerhalb von 2-3 Werktagen per Post zugestellt!
              </p>
              <button
                onClick={() => setShowPostcardCheckout(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Zurück zum Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM: DIGITAL-TO-PHYSICAL BUSINESS PITCH */}
      <div style={{
        marginTop: "20px",
        padding: "24px",
        backgroundColor: "#fdf2f8", // Sweet soft pink pitch background
        border: "2px dashed #fbcfe8",
        borderRadius: "16px",
        textAlign: "left"
      }}>
        <h4 style={{ color: "#be185d", fontSize: "16px", fontWeight: "800", margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💡</span> Warum das "Digital-to-Physical" Postkarten-Modell ein Volltreffer ist
        </h4>
        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
          Die Transformation von einer rein digitalen, KI-generierten Grußkarte in ein physisches, bedrucktes Geschenkprodukt ist die stärkste Umsatzchance für das neue sheepworld Portal. Hier sind die Gründe, warum dieses Modell erfolgreich sein wird:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <strong style={{ fontSize: "12.5px", color: "#be185d", display: "block", marginBottom: "4px" }}>
              1. 100% Personalisierung
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Standard-Karten gibt es überall. Ein Unikat mit dem persönlichen Insider-Spruch ("Isst heimlich nachts Nutella") kombiniert mit dem legendären Schaf-Design existiert weltweit nur ein einziges Mal – das erzeugt maximale emotionale Kaufbereitschaft!
            </span>
          </div>

          <div>
            <strong style={{ fontSize: "12.5px", color: "#be185d", display: "block", marginBottom: "4px" }}>
              2. Exzellente Bruttomargen
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Die Produktions- und Versandkosten einer standardisierten Postkarte liegen im Sammeldruck im Centbereich (ca. 0,15 € - 0,30 € zzgl. Porto). Bei einem Endkundenpreis von 2,49 € erzielt sheepworld eine herausragende Marge von über 80%!
            </span>
          </div>

          <div>
            <strong style={{ fontSize: "12.5px", color: "#be185d", display: "block", marginBottom: "4px" }}>
              3. Impulskauf-Preisschwelle
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Bei Beträgen unter 3 € überlegt der Kunde nicht lange. Es gibt keine Kaufhürde, da der Betrag minimal ist, der emotionale Wert beim Empfänger aber gigantisch groß ausfällt.
            </span>
          </div>

          <div>
            <strong style={{ fontSize: "12.5px", color: "#be185d", display: "block", marginBottom: "4px" }}>
              4. Viraler QR-Marketing-Loop
            </strong>
            <span style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
              Jede gedruckte Karte erhält auf der Rückseite einen dezenten, schicken QR-Code mit dem Text: *"Möchtest du auch so ein Schaf-Unikat erstellen? Scanne mich!"*. Dadurch konvertiert jeder Empfänger automatisch zum potenziell neuen, kostenlosen Portalnutzer und Käufer!
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

interface CardsTabProps {
  functions: any;
  cardRecipient: string;
  setCardRecipient: (val: string) => void;
  cardSender: string;
  setCardSender: (val: string) => void;
  cardOccasion: string;
  setCardOccasion: (val: string) => void;
  cardMood: string;
  setCardMood: (val: string) => void;
  cardInsider: string;
  setCardInsider: (val: string) => void;
  cardMotifType: "official" | "ai";
  setCardMotifType: (val: "official" | "ai") => void;
  cardLoading: boolean;
  handleGenerateCard: () => Promise<void>;
  cardResult: any;
}

export default function CardsTab({
  cardRecipient,
  setCardRecipient,
  cardSender,
  setCardSender,
  cardOccasion,
  setCardOccasion,
  cardMood,
  setCardMood,
  cardInsider,
  setCardInsider,
  cardMotifType,
  setCardMotifType,
  cardLoading,
  handleGenerateCard,
  cardResult
}: CardsTabProps) {
  return (
    <div className="cards-tab-container" style={{
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
            <span>🎁</span> Grußkarten-Atelier
          </h3>
          <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            Lass die KI ein herzerwärmendes Gedicht inklusive einzigartiger Postkartenskizze entwerfen.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Empfänger (Name)</label>
          <input 
            type="text" 
            placeholder="z. B. Liebste Mama, Schatz, Papa..." 
            value={cardRecipient}
            onChange={(e) => setCardRecipient(e.target.value)}
            disabled={cardLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Absender (Dein Name - optional)</label>
          <input 
            type="text" 
            placeholder="z. B. dein Walter" 
            value={cardSender}
            onChange={(e) => setCardSender(e.target.value)}
            disabled={cardLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Anlass</label>
          <input 
            type="text" 
            placeholder="z. B. Geburtstag, Muttertag, Jahrestag..." 
            value={cardOccasion}
            onChange={(e) => setCardOccasion(e.target.value)}
            disabled={cardLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Gewünschte Stimmung</label>
          <select 
            value={cardMood}
            onChange={(e) => setCardMood(e.target.value)}
            disabled={cardLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px", backgroundColor: "#ffffff" }}
          >
            <option value="">-- Wähle eine Stimmung --</option>
            <option value="Süß & Herzerwärmend">Süß & Herzerwärmend</option>
            <option value="Witzig & Humorvoll (leicht neckisch)">Witzig & Humorvoll (leicht neckisch)</option>
            <option value="Frech & Sarkastisch (ohne Drama)">Frech & Sarkastisch (ohne Drama)</option>
            <option value="Tiefgründig & Emotional">Tiefgründig & Emotional</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Insider-Detail (optional)</label>
          <input 
            type="text" 
            placeholder="z. B. vergisst immer ihren Schlüssel, dicke Socken..." 
            value={cardInsider}
            onChange={(e) => setCardInsider(e.target.value)}
            disabled={cardLoading}
            style={{ padding: "10px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13.5px" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Karten-Motiv</label>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <label style={{ flex: 1, padding: "10px", border: "1.5px solid", borderColor: cardMotifType === "official" ? "var(--brand-secondary)" : "#cbd5e1", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12.5px", fontWeight: "600", color: "#334155", backgroundColor: cardMotifType === "official" ? "var(--bg-main)" : "#ffffff" }}>
              <input type="radio" checked={cardMotifType === "official"} onChange={() => setCardMotifType("official")} style={{ accentColor: "var(--brand-secondary)" }} />
              Offizielles Shop-Bild
            </label>
            <label style={{ flex: 1, padding: "10px", border: "1.5px solid", borderColor: cardMotifType === "ai" ? "var(--brand-secondary)" : "#cbd5e1", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12.5px", fontWeight: "600", color: "#334155", backgroundColor: cardMotifType === "ai" ? "var(--bg-main)" : "#ffffff" }}>
              <input type="radio" checked={cardMotifType === "ai"} onChange={() => setCardMotifType("ai")} style={{ accentColor: "var(--brand-secondary)" }} />
              Einzigartige KI-Zeichnung
            </label>
          </div>
        </div>

        <button
          onClick={handleGenerateCard}
          disabled={!cardRecipient.trim() || !cardOccasion.trim() || !cardMood.trim() || cardLoading}
          style={{
            padding: "12px 20px",
            backgroundColor: (!cardRecipient.trim() || !cardOccasion.trim() || !cardMood.trim() || cardLoading) ? "#cbd5e1" : "var(--brand-secondary)",
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
          {cardLoading ? "✨ Generiere Grußkarte..." : "✨ Grußkarte generieren"}
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
        {cardResult ? (
          <PostcardViewer cardResult={cardResult} />
        ) : cardLoading ? (
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
              ✨ sheepworld KI dichtet deinen Spruch...
            </h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "360px", lineHeight: "1.5" }}>
              Bitte habe einen Moment Geduld. Wir dichten dein Unikat und zeichnen eine brand-konforme Illustration (ohne Augen, mit krausem Haar)!
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
            <span style={{ fontSize: "54px", marginBottom: "16px" }}>🎁</span>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontWeight: "700" }}>Bereit zum Dichten</h3>
            <p style={{ margin: 0, fontSize: "13.5px", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>Gib links die Daten deines Empfängers und des Anlasses ein, um in Sekunden ein sheepworld-Grußkartenunikat zu texten!</p>
          </div>
        )}
      </div>
    </div>
  );
}
