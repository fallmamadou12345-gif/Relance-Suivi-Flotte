import React, { useState, useMemo } from "react";

interface GoldTabProps {
  drivers: any[];
  recruits: Record<string, string>; // Phone -> "Date|Name|FleetId"
  currentFleetId: string;
  onAddRecruit: (phone: string, date: string, name?: string) => void;
  onRemoveRecruit: (phone: string) => void;
}

export default function GoldTab({ drivers, recruits, currentFleetId, onAddRecruit, onRemoveRecruit }: GoldTabProps) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const d = new Date();
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    
    Object.values(recruits).forEach(val => {
      const date = val.split('|')[0];
      if (date) {
        months.add(date.substring(0, 7));
      }
    });
    
    return Array.from(months).sort().reverse();
  }, [recruits]);

  const recruitList = useMemo(() => {
    return Object.entries(recruits).map(([phone, value]) => {
      const parts = value.split('|');
      const date = parts[0];
      const savedName = parts[1];
      const fleetId = parts[2]; // Optional

      // Filter by fleet if specified
      if (currentFleetId !== "ALL") {
        // If recruit has a fleet ID, it MUST match
        if (fleetId && fleetId !== currentFleetId) return null;
        // If recruit has NO fleet ID (legacy), we only show it in "ALL" view to avoid pollution,
        // UNLESS the driver is found in the current fleet list (which means they belong to this fleet).
      }

      // Filter by Selected Month
      if (date.substring(0, 7) !== selectedMonth) return null;

      // Find driver in the main list to get real-time stats
      const driver = drivers.find(d => d.tel === phone || d.phone === phone || d.telephone === phone);
      
      // If filtering by fleet, and no fleetId recorded, ONLY show if driver is found in this fleet
      if (currentFleetId !== "ALL" && !fleetId && !driver) return null;

      const name = driver ? driver.nom : (savedName || "Inconnu");
      const rides = driver ? (parseInt(driver.commandes) || 0) : 0;
      
      // Parse date manually to ensure local time comparison
      const [y, m, d] = date.split('-').map(Number);
      const startDate = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysRemaining = 30 - diffDays;
      
      // Updated Logic:
      // Success: Reached 50 rides (regardless of time, assuming they did it within the window or we just care about the total)
      // Failed: Did NOT reach 50 rides AND 30 days have passed.
      const success = rides >= 50;
      const failed = rides < 50 && diffDays > 30;
      
      return { 
        phone, 
        date, 
        name, 
        rides, 
        daysRemaining, 
        success, 
        failed,
        formattedDate: startDate.toLocaleDateString('fr-FR'),
        formattedEndDate: endDate.toLocaleDateString('fr-FR')
      };
    })
    .filter(Boolean)
    // Removed the .filter(daysRemaining >= 0) to allow viewing past months
    .sort((a: any, b: any) => {
        // Sort: Success first, then by rides descending
        if (a.success && !b.success) return -1;
        if (!a.success && b.success) return 1;
        return b.rides - a.rides;
    });
  }, [recruits, drivers, currentFleetId, selectedMonth]);

  const handleAdd = () => {
    if (!newPhone) return;
    onAddRecruit(newPhone, newDate, newName);
    setShowModal(false);
    setNewPhone("");
    setNewName("");
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    setNewDate(new Date(d.getTime() - offset).toISOString().split('T')[0]);
    setSearch("");
  };

  const searchResults = useMemo(() => {
    if (!search) return [];
    return drivers.filter(d => 
      (d.nom && d.nom.toLowerCase().includes(search.toLowerCase())) || 
      (d.tel && d.tel.includes(search))
    ).slice(0, 5);
  }, [search, drivers]);

  const currentMonthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    const label = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [selectedMonth]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e3a8a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              🏆 Objectif Gold
            </h2>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ 
                fontSize: 16, fontWeight: 700, color: "#1e3a8a", 
                padding: "6px 12px", borderRadius: 8, border: "2px solid #bfdbfe", 
                background: "#eff6ff", cursor: "pointer", outline: "none"
              }}
            >
              {availableMonths.map(m => {
                const [y, month] = m.split('-');
                const date = new Date(parseInt(y), parseInt(month) - 1);
                const label = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
              })}
            </select>
          </div>
          <p style={{ color: "#64748b", maxWidth: 600, lineHeight: 1.5 }}>
            Suivi des conducteurs inscrits en <strong>{currentMonthLabel}</strong>. 
            Objectif : <strong>50 courses</strong> dans les 30 jours suivant l'inscription.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            background: "#f59e0b", color: "#fff", border: "none", padding: "12px 24px", 
            borderRadius: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> Ajouter une recrue
        </button>
      </div>

      {recruitList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🚕</div>
          <h3 style={{ color: "#1e293b", fontWeight: 700, marginBottom: 8 }}>Aucune recrue suivie</h3>
          <p style={{ color: "#64748b" }}>Ajoutez des chauffeurs pour suivre leur progression vers l'objectif Gold.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {recruitList.map(r => (
            <div key={r.phone} style={{ 
              background: "#fff", borderRadius: 16, padding: 20, 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", 
              border: r.success ? "2px solid #22c55e" : r.failed ? "2px solid #ef4444" : "1px solid #e2e8f0",
              position: "relative", overflow: "hidden"
            }}>
              {r.success && (
                <div style={{ position: "absolute", top: 0, right: 0, background: "#22c55e", color: "#fff", padding: "4px 12px", borderRadius: "0 0 0 12px", fontSize: 11, fontWeight: 800 }}>
                  OBJECTIF ATTEINT
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "#0f172a", marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", fontFamily: "monospace", marginBottom: 4 }}>{r.phone}</div>
                  <div style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column" }}>
                    <span>Inscrit le {r.formattedDate}</span>
                    <span style={{ color: "#94a3b8" }}>Fin le {r.formattedEndDate}</span>
                  </div>
                </div>
                {!r.success && !r.failed && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6", lineHeight: 1 }}>{r.daysRemaining}</div>
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Jours restants</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#64748b", fontWeight: 500 }}>Progression courses</span>
                  <span style={{ fontWeight: 800, color: r.success ? "#166534" : "#0f172a" }}>{r.rides} / 50</span>
                </div>
                <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ 
                    width: `${Math.min(100, (r.rides / 50) * 100)}%`, 
                    background: r.success ? "#22c55e" : r.failed ? "#ef4444" : "linear-gradient(90deg, #3b82f6, #60a5fa)", 
                    height: "100%",
                    transition: "width 1s ease-out"
                  }}></div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <div style={{ color: "#64748b" }}>
                  Inscrit le <span style={{ fontWeight: 600, color: "#334155" }}>{new Date(r.date).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Supprimer ce chauffeur du suivi Gold ?")) onRemoveRecruit(r.phone);
                  }} 
                  style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 8px", borderRadius: 6 }}
                  onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                  onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 24, width: 450, maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#1e293b" }}>Ajouter une recrue</h3>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#475569" }}>Rechercher un chauffeur existant</label>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  placeholder="Nom ou téléphone..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", transition: "border 0.2s" }}
                  onFocus={e => e.target.style.borderColor = "#3b82f6"}
                  onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                />
                {search && searchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, maxHeight: 200, overflowY: "auto", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", zIndex: 10 }}>
                    {searchResults.map(d => (
                      <div 
                        key={d.tel} 
                        onClick={() => { setNewPhone(d.tel); setNewName(d.nom); setSearch(""); }}
                        style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", fontSize: 13, transition: "background 0.1s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseOut={e => e.currentTarget.style.background = "#fff"}
                      >
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{d.nom}</div>
                        <div style={{ color: "#64748b" }}>{d.tel}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#475569" }}>Téléphone</label>
              <input 
                type="text" 
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Ex: 771234567"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#475569" }}>Nom (si nouveau)</label>
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom complet"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#475569" }}>Date d'inscription</label>
              <input 
                type="date" 
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "12px 20px", background: "#f1f5f9", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", color: "#475569" }}>Annuler</button>
              <button onClick={handleAdd} style={{ padding: "12px 24px", background: "#1e3a8a", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(30, 58, 138, 0.3)" }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
