'use client';

import React, { useState } from 'react';

interface CardReaderProps {
  card: {
    id: string;
    empfaenger: string;
    anlass: string;
    stimmung: string;
    insider: string;
    titelSpruch: string;
    innentext: string;
    motifUrl: string;
    shopUrl?: string;
    shopTitle?: string;
    motifTypeUsed?: string;
  };
}

export default function CardReader({ card }: CardReaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef2f2 0%, #f0fdf4 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box'
    }}>
      {/* Sheepworld Style Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <img 
            src="/logo-sheepworld.svg" 
            alt="sheepworld logo" 
            style={{ height: '50px', marginBottom: '10px' }} 
            onError={(e) => {
              // Fallback logo if svg is missing
              (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg';
            }}
          />
        </a>
        <h1 style={{ fontSize: '20px', color: '#1e293b', fontWeight: '800', marginTop: '5px', letterSpacing: '-0.025em' }}>
          Eine ganz persönliche Grußkarte für dich! 🐏
        </h1>
      </div>

      {/* Main Interactive Card Workspace */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        perspective: '1500px', // Crucial for 3D card folding effect
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        
        {/* The Card container */}
        <div 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            height: '560px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            borderRadius: '20px',
            backgroundColor: '#ffffff'
          }}
        >
          
          {/* CARD FRONT SIDE (Vorderseite) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden', // Hides the back during flip
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #e2e8f0',
            backgroundColor: '#ffffff',
            zIndex: 2
          }}>
            {/* Stamp/Decoration */}
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2px dashed #fca5a5'
            }}>
              Für dich ❤️
            </div>

            {/* Main Motif Image */}
            <div style={{ 
              flex: '1', 
              backgroundColor: '#f8fafc', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderBottom: '2px solid #f1f5f9',
              padding: '20px',
              position: 'relative'
            }}>
              <img 
                src={card.motifUrl} 
                alt="Kartenmotiv" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain', 
                  borderRadius: '12px' 
                }} 
              />
            </div>

            {/* Front Card Slogan Banner */}
            <div style={{ 
              padding: '30px 24px', 
              textAlign: 'center',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '120px'
            }}>
              <p style={{ 
                fontFamily: 'Comic Sans MS, cursive, sans-serif', 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#0f172a', 
                margin: 0,
                lineHeight: '1.3'
              }}>
                {card.titelSpruch}
              </p>
            </div>

            {/* Instruction Footer */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b',
              fontWeight: '600',
              borderTop: '1px solid #f1f5f9'
            }}>
              Klicke auf die Karte zum Öffnen 📖
            </div>
          </div>

          {/* CARD INSIDE (Innenseite - flipped 180deg) */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #e2e8f0',
            backgroundColor: '#fffdf5', // Warm paper color
            backgroundImage: 'radial-gradient(#f5f3e7 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}>
            {/* Header decor */}
            <div style={{ 
              height: '12px', 
              background: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #ffffff 10px, #ffffff 20px)' 
            }} />

            {/* Scrollable Letter Area */}
            <div style={{
              flex: '1',
              padding: '40px 30px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}>
              {/* Card Main Text (with dynamic AI-generated greeting and sign-off) */}
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: '17px',
                lineHeight: '1.8',
                color: '#334155',
                whiteSpace: 'pre-wrap',
                flex: 1
              }}>
                {card.innentext}
              </div>
            </div>

            {/* Shop Product Connection (RAG) */}
            {card.shopUrl && card.shopTitle && (
              <div style={{
                backgroundColor: '#ffffff',
                borderTop: '2px dashed #e2e8f0',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    Passendes Produkt im Shop:
                  </p>
                  <a 
                    href={card.shopUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} // Stop opening/closing card on link click
                    style={{ 
                      margin: 0, 
                      fontSize: '13px', 
                      color: '#ef4444', 
                      fontWeight: '700',
                      textDecoration: 'underline',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block'
                    }}
                  >
                    {card.shopTitle}
                  </a>
                </div>
              </div>
            )}

            {/* Inside Footer */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#64748b',
              fontWeight: '600',
              borderTop: '1px solid #f1f5f9'
            }}>
              Klicke zum Schließen 📖
            </div>
          </div>

        </div>

        {/* Pulsing CTA Traffic Button */}
        <div style={{ width: '100%', marginTop: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '12px' }}>
            Hat dir diese persönliche Grußkarte gefallen?
          </p>
          <a 
            href="/" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '800',
              textDecoration: 'none',
              boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
              transition: 'all 0.2s ease',
              animation: 'pulse 2s infinite',
              border: '2px solid #ffffff'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#16a34a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#22c55e';
            }}
          >
            🐏 Eigene kostenlose KI-Karte erstellen!
          </a>
        </div>

      </div>

      {/* KI-Geschenk-Atelier (Digital-to-Physical) & Smarte Geschenk-Concierge */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        {/* Idea 1: KI-Geschenk-Atelier */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
          border: '2px solid #fbcfe8',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #f472b6, #fb7185, #f43f5e)'
          }} />
          <h2 style={{ fontSize: '24px', color: '#1e293b', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎨</span> Das KI-Geschenk-Atelier
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            Dein einzigartiges Motiv und Spruch gefällt dir? Verwandle es jetzt per Knopfdruck in ein echtes, greifbares sheepworld-Unikat! Wir drucken es für dich in Premium-Qualität.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Mockup 1: Mug */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                height: '140px', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #cbd5e1',
                position: 'relative'
              }}>
                <span style={{ fontSize: '40px', zIndex: 1 }}>☕</span>
                <img src={card.motifUrl} style={{ position: 'absolute', width: '60%', height: '60%', objectFit: 'contain', opacity: 0.8, mixBlendMode: 'multiply' }} alt="" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: '0 0 8px 0' }}>Die Unikat-Tasse</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Mit deinem Spruch: "{card.titelSpruch}"</p>
              <button style={{ width: '100%', padding: '10px', backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Ab 14,95 €
              </button>
            </div>

            {/* Mockup 2: Pillow */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                height: '140px', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #cbd5e1',
                position: 'relative'
              }}>
                <span style={{ fontSize: '40px', zIndex: 1 }}>🛋️</span>
                <img src={card.motifUrl} style={{ position: 'absolute', width: '70%', height: '70%', objectFit: 'contain', opacity: 0.8, mixBlendMode: 'multiply' }} alt="" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: '0 0 8px 0' }}>Kuschelkissen</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Extra weich mit deinem Schaf-Motiv.</p>
              <button style={{ width: '100%', padding: '10px', backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Ab 24,95 €
              </button>
            </div>
            
            {/* Mockup 3: Physical Card */}
            <div style={{
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                height: '140px', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #cbd5e1',
                position: 'relative'
              }}>
                <span style={{ fontSize: '40px', zIndex: 1 }}>💌</span>
                <img src={card.motifUrl} style={{ position: 'absolute', width: '50%', height: '50%', objectFit: 'contain', opacity: 0.9, left: '10px', top: '20px' }} alt="" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#334155', margin: '0 0 8px 0' }}>Echte Postkarte</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>Wir drucken und versenden sie per Post.</p>
              <button style={{ width: '100%', padding: '10px', backgroundColor: '#f43f5e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                Nur 4,95 €
              </button>
            </div>
          </div>
        </div>

        {/* Idea 2: Smarte Geschenk-Concierge */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
          border: '2px solid #bbf7d0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #4ade80, #22c55e, #16a34a)'
          }} />
          <h2 style={{ fontSize: '24px', color: '#1e293b', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎁</span> Der Geschenk-Concierge
          </h2>
          <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            Wir haben basierend auf deiner Karte das perfekte Geschenk-Bundle aus dem sheepworld-Shop zusammengestellt. <strong>Das Beste: Wir legen diese KI-Karte gedruckt kostenlos ins Paket!</strong>
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0fdf4',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #86efac',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px', backgroundColor: '#ffffff', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  {card.anlass?.toLowerCase().includes('geburtstag') ? '🎂' : card.anlass?.toLowerCase().includes('liebe') ? '❤️' : '🌟'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#166534', fontWeight: '800' }}>
                    {card.shopTitle ? `Das "${card.shopTitle}" Bundle` : 'Das perfekte sheepworld Bundle'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#15803d', fontWeight: '600' }}>Passend zum Anlass: {card.anlass || 'Eine kleine Freude'}</p>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#3f6212', fontSize: '14px', lineHeight: '1.8' }}>
                <li>1x {card.shopTitle || 'Premium sheepworld Geschenkartikel'}</li>
                <li>1x Passende sheepworld Tasse aus der Serie</li>
                <li><strong>GRATIS:</strong> Deine persönliche KI-Karte gedruckt dazu!</li>
              </ul>
            </div>
            
            <div style={{ 
              backgroundColor: '#ffffff', 
              padding: '24px', 
              borderRadius: '16px', 
              boxShadow: '0 8px 20px rgba(34,197,94,0.15)',
              textAlign: 'center',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '13px', color: '#ef4444', textDecoration: 'line-through', fontWeight: '700' }}>Einzeln: 39,90 €</div>
              <div style={{ fontSize: '28px', color: '#16a34a', fontWeight: '900', margin: '4px 0 12px 0' }}>Bundle: 34,90 €</div>
              <a 
                href={card.shopUrl || "https://sheepworld.de"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: '800',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
              >
                🛒 1-Klick Bundle-Kauf
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Pulse Keyframes */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
      `}</style>
    </div>
  );
}
