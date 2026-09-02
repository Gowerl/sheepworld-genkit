'use client';

import React from 'react';

interface PlannerTabProps {
  plannerEvents: any[];
  setPlannerEvents: React.Dispatch<React.SetStateAction<any[]>>;
  showAddEventModal: boolean;
  setShowAddEventModal: (val: boolean) => void;
  newEventTitle: string;
  setNewEventTitle: (val: string) => void;
  newEventDate: string;
  setNewEventDate: (val: string) => void;
  newEventRecipient: string;
  setNewEventRecipient: (val: string) => void;
  newEventBudget: number;
  setNewEventBudget: (val: number) => void;
  newEventInterests: string;
  setNewEventInterests: (val: string) => void;
  setBundleRelationship: (val: string) => void;
  setBundleInterests: (val: string) => void;
  setBundleOccasion: (val: string) => void;
  setBundleBudget: (val: number) => void;
  setCardRecipient: (val: string) => void;
  setCardOccasion: (val: string) => void;
  setCardMood: (val: string) => void;
  setActiveTab: (val: 'chat' | 'seo' | 'cards' | 'planner' | 'bundle') => void;
}

export default function PlannerTab({
  plannerEvents,
  setPlannerEvents,
  showAddEventModal,
  setShowAddEventModal,
  newEventTitle,
  setNewEventTitle,
  newEventDate,
  setNewEventDate,
  newEventRecipient,
  setNewEventRecipient,
  newEventBudget,
  setNewEventBudget,
  newEventInterests,
  setNewEventInterests,
  setBundleRelationship,
  setBundleInterests,
  setBundleOccasion,
  setBundleBudget,
  setCardRecipient,
  setCardOccasion,
  setCardMood,
  setActiveTab
}: PlannerTabProps) {
  const [newEventEmail, setNewEventEmail] = React.useState("");
  const [newEventReminderActive, setNewEventReminderActive] = React.useState(true);

  return (
    <div className="planner-container" style={{
      padding: "24px",
      height: "calc(100% - 68px)",
      overflowY: "auto",
      position: "relative"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "32px",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
        border: "2px solid #bbf7d0",
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #4ade80, #22c55e, #16a34a)'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', color: '#1e293b', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span>📅</span> "Vergiss-mein-nicht" Planer
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.6', maxWidth: '600px' }}>
              Trage wichtige Ereignisse ein und definiere vorab Rahmenparameter (Budget, Interessen). Die KI erinnert dich pünktlich mit einer passenden Geschenkbox und Dicht-Vorschlägen!
            </p>
          </div>
          <button 
            onClick={() => setShowAddEventModal(true)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#22c55e",
              color: "#ffffff",
              border: "none",
              borderRadius: "50px",
              fontWeight: "800",
              cursor: "pointer",
              fontSize: "14px",
              boxShadow: "0 4px 15px rgba(34, 197, 94, 0.3)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ➕ Neues Ereignis anlegen
          </button>
        </div>

        {/* Dynamic Events List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {plannerEvents.map((event) => (
            <div key={event.id} style={{
              backgroundColor: event.isImminent ? '#fef2f2' : '#f8fafc',
              border: event.isImminent ? '2px solid #fca5a5' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              {/* Date Block */}
              <div style={{ 
                backgroundColor: event.isImminent ? '#ef4444' : '#cbd5e1', 
                color: event.isImminent ? 'white' : '#475569', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                textAlign: 'center', 
                minWidth: '70px' 
              }}>
                <div style={{ fontSize: '24px', fontWeight: '900', lineHeight: '1' }}>{event.dateDay}</div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', marginTop: '4px' }}>{event.dateMonth}</div>
              </div>

              {/* Content Block */}
              <div style={{ flex: 1, minWidth: '250px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', color: event.isImminent ? '#7f1d1d' : '#334155', fontWeight: '800' }}>
                    {event.title}
                  </h3>
                  {event.isImminent && (
                    <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '20px', fontWeight: 'bold' }}>DRINGEND</span>
                  )}
                  {event.reminderActive && (
                    <span style={{ backgroundColor: '#cbd5e1', color: '#1e293b', fontSize: '10.5px', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', border: '1.5px solid #94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🔔 Mail-Erinnerung aktiv ({event.email})
                    </span>
                  )}
                  <span style={{ backgroundColor: '#e2e8f0', color: '#475569', fontSize: '11px', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    Budget: {event.budget} €
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px', fontSize: '12.5px', color: '#475569' }}>
                  <div>👤 <strong>Beschenkte Person:</strong> {event.recipient}</div>
                  <div>🎨 <strong>Interessen:</strong> {event.interests}</div>
                </div>

                <p style={{ margin: 0, fontSize: '13.5px', color: event.isImminent ? '#b91c1c' : '#64748b' }}>
                  {event.text}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    // Copy parameters to Geschenkbox-Berater state and switch tab!
                    setBundleRelationship(event.recipient);
                    setBundleInterests(event.interests);
                    setBundleOccasion(event.title);
                    setBundleBudget(event.budget);
                    setActiveTab('bundle');
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: event.isImminent ? "#ef4444" : "#22c55e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap"
                  }}
                >
                  🎁 Box planen
                </button>
                
                <button
                  onClick={() => {
                    // Pre-fill greeting card generator!
                    setCardRecipient(event.recipient);
                    setCardOccasion(event.title);
                    setCardMood(event.isImminent ? "Tiefgründig & Emotional" : "Süß & Herzerwärmend");
                    setActiveTab('cards');
                  }}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#ffffff",
                    color: "#64748b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "13px",
                    whiteSpace: "nowrap"
                  }}
                >
                  💌 Karte dichten
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEUES EREIGNIS ANLEGEN MODAL (Overlay) */}
      {showAddEventModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            border: '2px solid #bbf7d0',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> Neues Ereignis hinzufügen
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Ereignis-Titel / Anlass</label>
                <input 
                  type="text" 
                  placeholder="z. B. Geburtstag Julia, Hochzeitstag..." 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Datum (Tag & Monat)</label>
                  <input 
                    type="text" 
                    placeholder="z. B. 14. Okt" 
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Beschenkte Person</label>
                  <input 
                    type="text" 
                    placeholder="z. B. Ehefrau (Julia)" 
                    value={newEventRecipient}
                    onChange={(e) => setNewEventRecipient(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Budget (€): {newEventBudget} €</label>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="5"
                  value={newEventBudget}
                  onChange={(e) => setNewEventBudget(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Interessen & Hobbys</label>
                <input 
                  type="text" 
                  placeholder="z. B. Faultiere, Kaffee, Wellness, Hunde..." 
                  value={newEventInterests}
                  onChange={(e) => setNewEventInterests(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>E-Mail-Adresse für Erinnerung</label>
                <input 
                  type="email" 
                  placeholder="name@beispiel.de" 
                  value={newEventEmail}
                  onChange={(e) => setNewEventEmail(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input 
                  type="checkbox" 
                  id="reminderActive"
                  checked={newEventReminderActive}
                  onChange={(e) => setNewEventReminderActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#22c55e' }}
                />
                <label htmlFor="reminderActive" style={{ fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                  ⏰ E-Mail-Erinnerung 4 Wochen vorher aktivieren
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (!newEventTitle || !newEventDate || !newEventRecipient) {
                      alert("Bitte fülle die wichtigsten Felder aus.");
                      return;
                    }
                    if (newEventReminderActive && !newEventEmail) {
                      alert("Bitte gib eine E-Mail-Adresse für die Erinnerung an.");
                      return;
                    }
                    const parts = newEventDate.split(" ");
                    const day = parts[0]?.replace(".", "") || "01";
                    const month = parts[1] || "Jan";

                    const createdEvent = {
                      id: `event_${Date.now()}`,
                      title: newEventTitle,
                      dateDay: day,
                      dateMonth: month,
                      recipient: newEventRecipient,
                      budget: newEventBudget,
                      interests: newEventInterests || "Keine Angabe",
                      isImminent: false,
                      email: newEventEmail,
                      reminderActive: newEventReminderActive,
                      text: newEventReminderActive 
                        ? `📧 E-Mail-Erinnerung ist aktiv für ${newEventEmail} (4 Wochen vor dem Event erhalten Sie die vorbereitete Geschenkbox).`
                        : `Erinnerung ist aktiv. Wir dichten 14 Tage vor dem ${newEventDate} ein persönliches Geschenk.`
                    };

                    setPlannerEvents(prev => [...prev, createdEvent]);
                    setShowAddEventModal(false);
                    
                    // Reset form
                    setNewEventTitle("");
                    setNewEventDate("");
                    setNewEventRecipient("");
                    setNewEventBudget(30);
                    setNewEventInterests("");
                    setNewEventEmail("");
                    setNewEventReminderActive(true);
                  }}
                  style={{
                    flex: 2,
                    padding: '10px',
                    backgroundColor: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Ereignis speichern
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
