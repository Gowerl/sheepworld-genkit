import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuditLog {
  id: string;
  uid: string;
  email: string;
  module: string;
  timestamp?: any;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: AuditLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsData.push({
          id: doc.id,
          uid: data.uid || 'anonym',
          email: data.email || 'anonymer_benutzer@myc3.com',
          module: data.module || 'Unbekannt',
          timestamp: data.timestamp
        });
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.uid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === '' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  // Calculate stats
  const totalCalls = filteredLogs.length;
  
  // Unique users
  const uniqueUsers = new Set(filteredLogs.map(l => l.email)).size;
  
  // Most active module
  const moduleCounts: { [key: string]: number } = {};
  filteredLogs.forEach(l => {
    moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
  });
  const mostActiveModule = Object.entries(moduleCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['Keines', 0]);

  // Unique modules list for dropdown filter
  const allModules = Array.from(new Set(logs.map(l => l.module)));

  // Format timestamp helper
  const formatTime = (ts: any) => {
    if (!ts) return 'Gerade eben...';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="tab-pane" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="pane-header" style={{ marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Echtzeit Admin-Nutzungslogs
          <span style={{ fontSize: '0.85rem', fontWeight: 400, backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '9999px' }}>
            Live aus Firestore (Letzte 100)
          </span>
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
          Diese Ansicht ist exklusiv für dich (walter@myc3.com) sichtbar. Hier siehst du live, wer wann welches KI-Modul aufruft.
        </p>
      </div>

      {/* Metrics Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aufrufe insgesamt</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>{totalCalls}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>In der aktuellen Filter-Auswahl</div>
        </div>
        
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aktive Nutzer</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{uniqueUsers}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Eindeutige E-Mail-Adressen</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beliebtestes Modul</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mostActiveModule[0]}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{mostActiveModule[1]} Aufrufe</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '15px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Suche nach User (E-Mail / UID)</label>
          <input 
            type="text" 
            placeholder="z.B. walter@myc3.com..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
        </div>
        
        <div style={{ width: '200px', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Filter nach Modul</label>
          <select 
            value={moduleFilter} 
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#ffffff' }}
          >
            <option value="">Alle Module</option>
            {allModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table Area */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 0', gap: '12px' }}>
            <div className="auth-spinner" style={{ borderLeftColor: 'var(--brand-secondary)', width: '32px', height: '32px' }}></div>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Lade Audit-Logs in Echtzeit...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Keine Log-Einträge für deine Filterkriterien gefunden.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '12px 16px' }}>Zeitstempel</th>
                  <th style={{ padding: '12px 16px' }}>Modul / Feature</th>
                  <th style={{ padding: '12px 16px' }}>E-Mail-Adresse</th>
                  <th style={{ padding: '12px 16px' }}>Firebase UID</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: idx < filteredLogs.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {formatTime(log.timestamp)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        backgroundColor: log.module.includes('Chat') ? '#eff6ff' : 
                                         log.module.includes('Postkarte') ? '#fff1f2' : 
                                         log.module.includes('Avatar') ? '#faf5ff' : 
                                         log.module.includes('Tuner') ? '#fff1f2' : 
                                         log.module.includes('Geschenk') ? '#f0fdf4' : '#f1f5f9',
                        color: log.module.includes('Chat') ? '#1d4ed8' : 
                               log.module.includes('Postkarte') ? '#be123c' : 
                               log.module.includes('Avatar') ? '#6b21a8' : 
                               log.module.includes('Tuner') ? '#be123c' : 
                               log.module.includes('Geschenk') ? '#15803d' : '#334155',
                      }}>
                        {log.module}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontFamily: 'monospace' }}>
                      {log.email}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.uid}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
