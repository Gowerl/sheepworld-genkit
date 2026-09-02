import React from 'react';
import { Metadata } from 'next';
import { db } from '@/lib/firebase-admin';
import CardReader from './CardReader';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 1. Dynamic Open Graph Metadata generation for messaging platforms (WhatsApp, Slack, FB, etc.)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const cardDoc = await db.collection('greeting_cards').doc(id).get();
    
    if (cardDoc.exists) {
      const card = cardDoc.data();
      if (card) {
        return {
          title: `Eine ganz persönliche Grußkarte für ${card.empfaenger}! 🐏`,
          description: card.titelSpruch || 'sheepworld Grußkarten-Generator',
          openGraph: {
            title: `Eine ganz persönliche Grußkarte für ${card.empfaenger}! 🐏`,
            description: card.titelSpruch || 'sheepworld Grußkarten-Generator',
            images: [
              {
                url: card.motifUrl,
                width: 1024,
                height: 1024,
                alt: card.titelSpruch,
              }
            ],
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: `Eine ganz persönliche Grußkarte für ${card.empfaenger}! 🐏`,
            description: card.titelSpruch,
            images: [card.motifUrl],
          }
        };
      }
    }
  } catch (error) {
    console.error('Error fetching metadata for card:', error);
  }

  // Fallback metadata if not found
  return {
    title: 'Süße sheepworld Grußkarte! 🐏',
    description: 'Erstelle und verschicke jetzt deine eigene personalisierte Grußkarte.',
    openGraph: {
      title: 'Süße sheepworld Grußkarte! 🐏',
      description: 'Erstelle und verschicke jetzt deine eigene personalisierte Grußkarte.',
      images: ['https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg']
    }
  };
}

// 2. Next.js Server Component to fetch the card data securely from Cloud Firestore
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  let cardData: any = null;

  try {
    const cardDoc = await db.collection('greeting_cards').doc(id).get();
    if (cardDoc.exists) {
      cardData = cardDoc.data();
    }
  } catch (error) {
    console.error('Error fetching card document:', error);
  }

  // Handle Card not found or error
  if (!cardData) {
    return (
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #f0fdf4 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/de/7/70/Sheepworld_Logo.svg" 
          alt="sheepworld" 
          style={{ height: '70px', marginBottom: '24px' }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
          Hoppla, diese Karte existiert nicht! 😮
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '400px', lineHeight: '1.6', marginBottom: '32px' }}>
          Vielleicht wurde der Link falsch kopiert, oder die Karte wurde gelöscht. Keine Sorge – du kannst jederzeit deine eigene erstellen!
        </p>
        <a 
          href="/" 
          style={{
            backgroundColor: '#22c55e',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '50px',
            fontSize: '16px',
            fontWeight: '800',
            textDecoration: 'none',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.4)',
            transition: 'transform 0.15s ease'
          }}
        >
          🐏 Eigene kostenlose KI-Karte erstellen!
        </a>
      </div>
    );
  }

  // Format card object strictly for Client Component
  const card = {
    id: cardData.id,
    empfaenger: cardData.empfaenger || '',
    anlass: cardData.anlass || '',
    stimmung: cardData.stimmung || '',
    insider: cardData.insider || '',
    titelSpruch: cardData.titelSpruch || '',
    innentext: cardData.innentext || '',
    motifUrl: cardData.motifUrl || '',
    shopUrl: cardData.shopUrl || '',
    shopTitle: cardData.shopTitle || '',
    motifTypeUsed: cardData.motifTypeUsed || ''
  };

  return <CardReader card={card} />;
}
