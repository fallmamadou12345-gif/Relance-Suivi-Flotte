
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { generateSampleDrivers } from "./utils";
import { ZONE_CONFIG } from "./constants";
import AnimatedNumber from "./components/AnimatedNumber";
import RippleBtn from "./components/RippleBtn";
import AgentModal from "./components/AgentModal";
import WhatsAppModal from "./components/WhatsAppModal";
import DriverRow from "./components/DriverRow";
import Toast from "./components/Toast";
import LoginModal from "./components/LoginModal";
import SettingsModal from "./components/SettingsModal";

const PER_PAGE = 30;

export default function App() {
  const [drivers, setDrivers] = useState<any[]>(() => generateSampleDrivers());
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [modal, setModal] = useState<{ driverId: string } | null>(null);
  const [waModal, setWaModal] = useState<{ driverId: string } | null>(null);
  const [currentAgent, setCurrentAgent] = useState("");
  const [userRole, setUserRole] = useState<"ADMIN" | "AGENT" | null>(null);
  const [users, setUsers] = useState<any[]>([
    { name: "ADMIN", code: "admin", role: "ADMIN" },
    { name: "AGENT", code: "1234", role: "AGENT" }
  ]);
  const [agentSessionStart, setAgentSessionStart] = useState<number | null>(null);
  const [agentSessions, setAgentSessions] = useState<any>({}); // { agent: { totalTime: ms, calls: number } }
  const [globalLogs, setGlobalLogs] = useState<any[]>([]); // { time, agent, action, details }
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [responsableFilter, setResponsableFilter] = useState("ALL");
  const [showBloques, setShowBloques] = useState(false);
  const [inactifMin, setInactifMin] = useState("");
  const [inactifMax, setInactifMax] = useState("");
  const [inactifPreset, setInactifPreset] = useState("");
  const [nonAppeles, setNonAppeles] = useState(false);
  const [sortBy, setSortBy] = useState("zone");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("pilotage");
  const [toasts, setToasts] = useState<any[]>([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [storageMode, setStorageMode] = useState<"cloud" | "local" | "unknown">("unknown");
  const [showSettings, setShowSettings] = useState(false);
  
  const driversRef = useRef(drivers);
  driversRef.current = drivers;

  // LOAD from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("flotte_drivers");
        if (saved && saved.value) {
          const data = JSON.parse(saved.value);
          if (data && data.length > 0) setDrivers(data);
        }
      } catch (e) { }
      
      try {
        const hist = await window.storage.get("flotte_history");
        if (hist && hist.value) setImportHistory(JSON.parse(hist.value));
      } catch (e) { }

      try {
        const u = await window.storage.get("flotte_users");
        if (u && u.value) setUsers(JSON.parse(u.value));
      } catch (e) { }

      try {
        const ag = await window.storage.get("flotte_agent");
        if (ag && ag.value) {
          // Don't auto-login, force re-login for session tracking, but maybe remember last
          // Actually, let's clear currentAgent on refresh to force login and session start
          // setCurrentAgent(ag.value); 
        }
      } catch (e) { }

      try {
        const sess = await window.storage.get("flotte_sessions");
        if (sess && sess.value) setAgentSessions(JSON.parse(sess.value));
      } catch (e) { }

      try {
        const logs = await window.storage.get("flotte_logs");
        if (logs && logs.value) setGlobalLogs(JSON.parse(logs.value));
      } catch (e) { }

      try {
        const tc = await window.storage.get("flotte_totalcalls");
        if (tc && tc.value) setTotalCalls(parseInt(tc.value) || 0);
      } catch (e) { }

      setStorageReady(true);
      setStorageMode(window.storage.mode);
    })();
  }, []);

  // SAVE sessions & logs
  useEffect(() => {
    if (!storageReady) return;
    const save = async () => {
      try { await window.storage.set("flotte_sessions", JSON.stringify(agentSessions)); } catch (e) { }
      try { await window.storage.set("flotte_logs", JSON.stringify(globalLogs)); } catch (e) { }
      try { await window.storage.set("flotte_users", JSON.stringify(users)); } catch (e) { }
    };
    const t = setTimeout(save, 2000);
    return () => clearTimeout(t);
  }, [agentSessions, globalLogs, storageReady]);

  // Update current session time every minute
  useEffect(() => {
    if (!currentAgent || !agentSessionStart) return;
    const interval = setInterval(() => {
      setAgentSessions((prev: any) => ({
        ...prev,
        [currentAgent]: {
          ...prev[currentAgent],
          lastActive: Date.now(),
          totalTime: (prev[currentAgent]?.totalTime || 0) + 60000 
        }
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [currentAgent, agentSessionStart]);

  // SAVE totalCalls
  useEffect(() => {
    if (!storageReady) return;
    (async () => { try { await window.storage.set("flotte_totalcalls", String(totalCalls)); } catch (e) { } })();
  }, [totalCalls, storageReady]);

  const stats = useMemo(() => ({
    total: drivers.length,
    rouge: drivers.filter(d => d.zone === "ROUGE").length,
    orange: drivers.filter(d => d.zone === "ORANGE").length,
    nouveau: drivers.filter(d => d.zone === "NOUVEAU").length,
    ok: drivers.filter(d => d.zone === "OK").length,
    fin_bloque: drivers.filter(d => d.fin_bloque).length,
    appeles: drivers.filter(d => d._called).length,
    rougeApp: drivers.filter(d => d.zone === "ROUGE" && d._called).length,
    orangeApp: drivers.filter(d => d.zone === "ORANGE" && d._called).length,
    nouveauApp: drivers.filter(d => d.zone === "NOUVEAU" && d._called).length,
  }), [drivers]);

  const responsables = useMemo(() => [...new Set(drivers.map(d => d.responsable).filter(Boolean))].sort(), [drivers]);

  const filtered = useMemo(() => {
    let d = drivers;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(dr => dr.nom.toLowerCase().includes(q) || dr.tel.includes(q) || (dr.plaque || "").toLowerCase().includes(q));
    }
    if (zoneFilter !== "ALL") d = d.filter(dr => dr.zone === zoneFilter);
    if (responsableFilter !== "ALL") d = d.filter(dr => dr.responsable === responsableFilter);
    if (showBloques) d = d.filter(dr => dr.fin_bloque);
    if (nonAppeles) d = d.filter(dr => !dr._called);
    
    const min = inactifMin !== "" ? parseInt(inactifMin) : null;
    const max = inactifMax !== "" ? parseInt(inactifMax) : null;
    if (min !== null) d = d.filter(dr => dr.jours_inactif != null && dr.jours_inactif >= min);
    if (max !== null) d = d.filter(dr => dr.jours_inactif != null && dr.jours_inactif <= max);

    return [...d].sort((a, b) => {
      if (sortBy === "zone") return (ZONE_CONFIG[a.zone]?.priority || 9) - (ZONE_CONFIG[b.zone]?.priority || 9);
      if (sortBy === "jours") return (b.jours_inactif || 0) - (a.jours_inactif || 0);
      if (sortBy === "solde") return a.solde - b.solde;
      if (sortBy === "calls") return b._callCount - a._callCount;
      return a.nom.localeCompare(b.nom);
    });
  }, [drivers, search, zoneFilter, responsableFilter, showBloques, nonAppeles, inactifMin, inactifMax, sortBy]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleCallClick = useCallback((driverId: string) => {
    setModal({ driverId });
  }, []);

  const handleLogin = (name: string, role: "ADMIN" | "AGENT") => {
    setCurrentAgent(name);
    setUserRole(role);
    setAgentSessionStart(Date.now());
    setAgentSessions((prev: any) => ({
      ...prev,
      [name]: {
        ...prev[name],
        lastLogin: new Date().toISOString(),
        totalTime: prev[name]?.totalTime || 0,
        calls: prev[name]?.calls || 0
      }
    }));
    // Log login
    setGlobalLogs(l => [{ time: new Date().toISOString(), agent: name, action: "LOGIN", details: `Connexion (${role})` }, ...l].slice(0, 500));
  };

  const handleConfirm = useCallback(({ agent, comment, outcome }: any) => {
    if (!modal) return;
    const { driverId } = modal;
    const driver = driversRef.current.find(d => d.id === driverId);
    if (!driver) return;

    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const newCount = driver._callCount + 1;
    const entry = { agent, time: now, comment, outcome, via: "call" };

    // Update agent stats
    setAgentSessions((prev: any) => ({
      ...prev,
      [agent]: {
        ...prev[agent],
        calls: (prev[agent]?.calls || 0) + 1,
        lastActive: Date.now()
      }
    }));

    // Add to global log
    setGlobalLogs(l => [{ 
      time: new Date().toISOString(), 
      agent, 
      action: "CALL", 
      details: `Appel ${driver.nom} (${outcome})` 
    }, ...l].slice(0, 500));

    setCurrentAgent(agent);
    setTotalCalls(c => c + 1);
    setDrivers(ds => ds.map(d => d.id === driverId ? { ...d, _called: true, _callCount: newCount, _callLog: [...d._callLog, entry], commentaire: comment || d.commentaire } : d));

    const ev = { id: Date.now() + Math.random(), driverNom: driver.nom, count: newCount, agent, time: now };
    setToasts(t => [...t, ev]);
    setTimeout(() => setToasts(t => t.filter(e => e.id !== ev.id)), 4000);
    setModal(null);
  }, [modal]);

  const handleWaClick = useCallback((driverId: string) => {
    setWaModal({ driverId });
  }, []);

  const onComment = useCallback((id: string, comment: string) => {
    setDrivers(ds => ds.map(d => d.id === id ? { ...d, commentaire: comment } : d));
  }, []);

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const sep = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^\uFEFF/, ""));
      const today = new Date();
      
      const parsed = lines.slice(1).map((line, i) => {
        const vals = line.split(sep);
        const row: any = {};
        headers.forEach((h, idx) => row[h] = (vals[idx] || "").replace(/^"|"$/g, "").trim());
        
        const solde = parseFloat((row["Solde"] || "0").replace(",", ".")) || 0;
        const limite = parseFloat((row["Limite"] || "0").replace(",", ".")) || 0;
        const lastOrderStr = row["Date de la dernière commande"] || "";
        let jours = null;
        if (lastOrderStr) {
          const d = new Date(lastOrderStr);
          if (!isNaN(d.getTime())) jours = Math.floor((today.getTime() - d.getTime()) / 86400000);
        }
        
        const commandes = parseInt(row["Commandes terminées"]) || 0;
        const zone = commandes === 0 ? "NOUVEAU" : !jours ? "INCONNU" : jours >= 7 ? "ROUGE" : jours >= 3 ? "ORANGE" : "OK";

        return {
          id: row["Lead ID"] || `r${i}`,
          nom: row["Nom complet"] || "—",
          tel: row["Numéro de téléphone"] || "",
          solde, limite,
          derniere_commande: lastOrderStr,
          jours_inactif: jours,
          commandes,
          zone,
          responsable: row["Employé responsable"] || "",
          commentaire: row["Commentaire"] || "",
          vehicule: row["Véhicule"] || "",
          plaque: row["Numéro de la plaque d'immatriculation du véhicule"] || "",
          note: row["Note"] || "",
          date_ajout: row["Date d'ajout"] || "",
          fin_bloque: limite < 0 && solde <= limite,
          ville: row["Ville"] || "",
          _called: false, _callCount: 0, _callLog: []
        };
      }).filter(r => r.nom !== "—" || r.tel);

      // Merge: preserve existing call logs & comments by driver ID
      const prev = driversRef.current;
      const prevMap = Object.fromEntries(prev.map(d => [d.id, d]));
      const merged = parsed.map(d => {
        const old = prevMap[d.id];
        if (old) {
          return {
            ...d,
            _called: old._called,
            _callCount: old._callCount,
            _callLog: old._callLog,
            commentaire: old.commentaire || d.commentaire
          };
        }
        return d;
      });

      // Stats snapshot
      const snap = {
        date: new Date().toLocaleString("fr-FR"),
        filename: file.name,
        count: merged.length,
        rouge: merged.filter(d => d.zone === "ROUGE").length,
        orange: merged.filter(d => d.zone === "ORANGE").length,
        nouveau: merged.filter(d => d.zone === "NOUVEAU").length,
        ok: merged.filter(d => d.zone === "OK").length,
        fin_bloque: merged.filter(d => d.fin_bloque).length
      };

      // Save history
      const newHist = [snap, ...importHistory].slice(0, 20);
      setImportHistory(newHist);
      try { await window.storage.set("flotte_history", JSON.stringify(newHist)); } catch (e) { }

      setDrivers(merged);
      setPage(1);
      setTotalCalls(0);
    };
    reader.readAsText(file, "utf-8");
  };

  const modalDriver = modal ? driversRef.current.find(d => d.id === modal.driverId) : null;
  const waDriver = waModal ? driversRef.current.find(d => d.id === waModal.driverId) : null;

  if (!currentAgent) {
    return <LoginModal users={users} onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {modal && modalDriver && (
        <AgentModal
          driver={modalDriver}
          currentAgent={currentAgent}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {waModal && waDriver && (
        <WhatsAppModal driver={waDriver} onClose={() => setWaModal(null)} />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <Toast events={toasts} />

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)", color: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.18)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🚕</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Cellule de Relance & Suivi Flotte</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Yango · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {storageMode === "local" && (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1px solid #fca5a5", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️ Mode Local (Non synchronisé)</span>
                </div>
              )}
              {currentAgent && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,0.15)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)" }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1 }}>Agent actif</div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{currentAgent}</div>
                  </div>
                  <button onClick={() => setCurrentAgent("")} style={{ marginLeft: 4, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
              )}
              {/* Live call counter */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: "10px 16px", background: "rgba(255,255,255,0.12)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.22)", position: "relative", boxShadow: totalCalls > 0 ? "0 0 0 3px rgba(34,197,94,0.35)" : "none", transition: "box-shadow 0.3s" }}>
                  <span style={{ fontSize: 22 }}>📞</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <AnimatedNumber value={totalCalls} color="#fff" size={24} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>appels</span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
                    <AnimatedNumber value={stats.appeles} color="rgba(255,255,255,0.7)" size={11} /> contacté{stats.appeles > 1 ? "s" : ""}
                  </div>
                </div>
                {totalCalls > 0 && <span style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px rgba(34,197,94,0.3)", animation: "pop 0.3s ease-out" }}>{stats.appeles}</span>}
              </div>
              {userRole === "ADMIN" && (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.28)" }}>
                    📂 Importer CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
                  </label>
                  <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.28)", color: "#fff" }}>
                    ⚙️ Paramètres
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[["pilotage", "📊 Pilotage"], ["liste", "👥 Chauffeurs"], ["kpi", "📈 KPI du Soir"], ["agents", "bust_in_silhouette Équipe & Accès"], ["historique", "🕒 Historique"]].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 18px",
                  background: activeTab === tab ? "rgba(255,255,255,0.18)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === tab ? "3px solid #fff" : "3px solid transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: activeTab === tab ? 700 : 400,
                  borderRadius: "8px 8px 0 0",
                  display: "flex", alignItems: "center", gap: 6
                }}
              >
                {label.includes("bust") ? "👥 Équipe & Accès" : label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {/* PILOTAGE */}
        {activeTab === "pilotage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Trends Section - Fixed to compare with previous import */}
            {importHistory.length > 1 && (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[
                  { label: "Zone Rouge", curr: stats.rouge, prev: importHistory[1].rouge, color: "#ef4444", inverse: true },
                  { label: "Zone Orange", curr: stats.orange, prev: importHistory[1].orange, color: "#f97316", inverse: true },
                  { label: "Actifs", curr: stats.ok, prev: importHistory[1].ok, color: "#22c55e", inverse: false }
                ].map(({ label, curr, prev, color, inverse }) => {
                  const diff = curr - prev;
                  const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";
                  const isGood = inverse ? diff <= 0 : diff >= 0;
                  return (
                    <div key={label} style={{ background: "#fff", padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{label}</div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color }}>{curr}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isGood ? "#16a34a" : "#dc2626" }}>
                          {diff > 0 ? "+" : ""}{diff} ({diff > 0 ? "↗" : diff < 0 ? "↘" : "="} {pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalCalls > 0 && (
              <div style={{ background: "linear-gradient(90deg,#1e3a5f,#1d4ed8)", borderRadius: 12, padding: "14px 22px", display: "flex", alignItems: "center", gap: 20, color: "#fff", flexWrap: "wrap" }}>
                <span style={{ fontSize: 26 }}>🚀</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{totalCalls} appel{totalCalls > 1 ? "s" : ""} passé{totalCalls > 1 ? "s" : ""} aujourd'hui</div>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>{stats.appeles} chauffeur{stats.appeles > 1 ? "s" : ""} contacté{stats.appeles > 1 ? "s" : ""}</div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                  {[["🚨", stats.rougeApp, stats.rouge], ["⚠️", stats.orangeApp, stats.orange], ["🎉", stats.nouveauApp, stats.nouveau]].map(([em, called, total], i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{called}/{total}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{em}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12 }}>
              {[
                { label: "Total Flotte", v: stats.total, c: "#1d4ed8", icon: "🚕", key: "count", inverse: false },
                { label: "Zone Rouge", v: stats.rouge, c: "#ef4444", icon: "🚨", key: "rouge", inverse: true },
                { label: "Zone Orange", v: stats.orange, c: "#f97316", icon: "⚠️", key: "orange", inverse: true },
                { label: "Nouveaux", v: stats.nouveau, c: "#8b5cf6", icon: "🎉", key: "nouveau", inverse: false },
                { label: "Actifs", v: stats.ok, c: "#22c55e", icon: "✅", key: "ok", inverse: false },
                { label: "Bloqués", v: stats.fin_bloque, c: "#dc2626", icon: "⛔", key: "fin_bloque", inverse: true },
                { label: "Appels passés", v: totalCalls, c: "#1d4ed8", icon: "📞", key: null, inverse: false },
                { label: "Contactés", v: stats.appeles, c: "#0891b2", icon: "🗣️", key: null, inverse: false },
              ].map(({ label, v, c, icon, key, inverse }) => {
                let trend = null;
                if (key) {
                  if (importHistory.length > 1) {
                    const prev = importHistory[1][key];
                    if (prev !== undefined) {
                      const diff = (v as number) - prev;
                      const pct = prev > 0 ? Math.round((diff / prev) * 100) : 0;
                      const isGood = inverse ? diff <= 0 : diff >= 0;
                      trend = { diff, pct, isGood, hasHistory: true };
                    }
                  } else {
                    // Placeholder for no history
                    trend = { diff: 0, pct: 0, isGood: true, hasHistory: false };
                  }
                }

                return (
                  <div key={label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 17 }}>{icon}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <AnimatedNumber value={v as number} color={c} />
                      {trend && (
                        <span style={{ 
                          fontSize: 11, fontWeight: 700, 
                          color: trend.hasHistory ? (trend.isGood ? "#16a34a" : "#dc2626") : "#9ca3af", 
                          background: trend.hasHistory ? (trend.isGood ? "#f0fdf4" : "#fef2f2") : "#f3f4f6", 
                          padding: "1px 6px", borderRadius: 99,
                          display: "flex", alignItems: "center", gap: 2
                        }}>
                          {trend.hasHistory ? (
                            <>
                              {trend.diff > 0 ? "+" : ""}{trend.diff} ({trend.diff > 0 ? "↗" : trend.diff < 0 ? "↘" : "="} {Math.abs(trend.pct)}%)
                            </>
                          ) : (
                            <span title="Importez un second fichier pour voir l'évolution">--</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {[
                { zone: "ROUGE", called: stats.rougeApp, total: stats.rouge },
                { zone: "ORANGE", called: stats.orangeApp, total: stats.orange },
                { zone: "NOUVEAU", called: stats.nouveauApp, total: stats.nouveau },
                { zone: "OK", called: 0, total: stats.ok },
              ].map(({ zone, called, total }) => {
                const cfg = ZONE_CONFIG[zone] || ZONE_CONFIG.INCONNU;
                const pct = total > 0 ? Math.round((called / total) * 100) : 0;
                return (
                  <div key={zone} style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 26 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: cfg.color, fontSize: 16 }}>{cfg.label}</div>
                          {cfg.joursMin !== null && <div style={{ fontSize: 12, color: "#6b7280" }}>{cfg.joursMin}–{cfg.joursMax} jours d'inactivité</div>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <AnimatedNumber value={total} color={cfg.color} size={28} />
                        {zone !== "OK" && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}><strong style={{ color: cfg.color }}>{called}</strong> appelés</div>}
                      </div>
                    </div>

                    {/* Urgency badge */}
                    <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, background: cfg.urgence === "CRITIQUE" ? "#fee2e2" : cfg.urgence === "MODÉRÉE" ? "#fff7ed" : cfg.urgence === "IMPORTANT" ? "#f5f3ff" : cfg.urgence === "FAIBLE" ? "#f0fdf4" : "#f9fafb", color: cfg.urgence === "CRITIQUE" ? "#b91c1c" : cfg.urgence === "MODÉRÉE" ? "#c2410c" : cfg.urgence === "IMPORTANT" ? "#6d28d9" : cfg.urgence === "FAIBLE" ? "#15803d" : "#6b7280", border: `1px solid ${cfg.border}` }}>Urgence : {cfg.urgence}</span>

                    {/* Risque */}
                    <div style={{ background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 2 }}>⚠️ RISQUE</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{cfg.risque}</div>
                    </div>

                    {/* Action */}
                    <div style={{ background: cfg.color + "18", borderRadius: 8, padding: "8px 10px", border: `1px solid ${cfg.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>⚡ ACTION REQUISE</div>
                      <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{cfg.action}</div>
                    </div>

                    {/* Causes */}
                    {cfg.causes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>🔍 CAUSES FRÉQUENTES</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {cfg.causes.map((c: string) => (
                            <span key={c} style={{ fontSize: 11, padding: "2px 8px", background: "#fff", border: `1px solid ${cfg.border}`, borderRadius: 99, color: "#374151" }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conseil */}
                    <div style={{ fontSize: 12, color: "#059669", background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", fontStyle: "italic", borderLeft: "3px solid #22c55e" }}>
                      💡 {cfg.conseil}
                    </div>

                    {/* Progress + CTA */}
                    {zone !== "OK" ? (
                      <>
                        <div style={{ height: 8, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 99, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{pct}% traités aujourd'hui</span>
                          <RippleBtn onClick={() => { setZoneFilter(zone); setActiveTab("liste"); }} style={{ padding: "7px 14px", background: cfg.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                            Filtrer →
                          </RippleBtn>
                        </div>
                      </>
                    ) : (
                      <RippleBtn onClick={() => { setZoneFilter(zone); setActiveTab("liste"); }} style={{ padding: "9px 14px", background: cfg.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, width: "100%" }}>
                        Voir les {stats.ok} chauffeurs actifs →
                      </RippleBtn>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>ℹ️ Codes commentaires</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                {[
                  ["[PANNE]", "Véhicule au garage", "#dc2626"],
                  ["[SOLDE]", "Manque de crédit", "#d97706"],
                  ["[DOCS]", "Document expiré", "#7c3aed"],
                  ["[MALADE]", "Indisponible", "#0891b2"],
                  ["[RAPPEL]", "N'a pas décroché", "#374151"],
                  ["[RÉSOLU]", "Problème résolu", "#15803d"]
                ].map(([code, desc, color]) => (
                  <div key={code} style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color, fontFamily: "monospace" }}>{code}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LISTE */}
        {activeTab === "liste" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* ZONE LEGEND EXPLAINER */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>ℹ️ Guide des Zones — Comprendre la Passivité</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {Object.entries(ZONE_CONFIG).map(([key, cfg]) => (
                  <div key={key} style={{ padding: "14px 16px", borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, color: cfg.color, fontSize: 14 }}>{cfg.label}</div>
                        {cfg.joursMin !== null && <div style={{ fontSize: 11, color: "#6b7280" }}>{cfg.joursMin}–{cfg.joursMax} jours d'arrêt</div>}
                      </div>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: cfg.urgence === "CRITIQUE" ? "#fee2e2" : cfg.urgence === "MODÉRÉE" ? "#fff7ed" : cfg.urgence === "IMPORTANT" ? "#f5f3ff" : cfg.urgence === "FAIBLE" ? "#f0fdf4" : "#f9fafb", color: cfg.urgence === "CRITIQUE" ? "#b91c1c" : cfg.urgence === "MODÉRÉE" ? "#c2410c" : cfg.urgence === "IMPORTANT" ? "#6d28d9" : cfg.urgence === "FAIBLE" ? "#15803d" : "#6b7280", border: `1px solid ${cfg.border}` }}>{cfg.urgence}</span>
                    <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginBottom: 4 }}>⚠️ {cfg.risque}</div>
                    <div style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 6 }}>⚡ {cfg.action}</div>
                    {cfg.causes.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3 }}>Causes fréquentes :</div>
                        {cfg.causes.map((c: string) => <div key={c} style={{ fontSize: 11, color: "#6b7280", paddingLeft: 8 }}>· {c}</div>)}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#059669", background: "#f0fdf4", borderRadius: 6, padding: "4px 8px", marginTop: 4, fontStyle: "italic" }}>💡 {cfg.conseil}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MAIN FILTERS */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Row 1: search + zone + agent */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Nom, téléphone, plaque..." style={{ flex: 1, minWidth: 200, padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }} />
                <select value={zoneFilter} onChange={e => { setZoneFilter(e.target.value); setPage(1); }} style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}>
                  <option value="ALL">🌍 Toutes les zones</option>
                  {Object.entries(ZONE_CONFIG).map(([z, c]) => <option key={z} value={z}>{c.icon} {c.label}</option>)}
                </select>
                <select value={responsableFilter} onChange={e => { setResponsableFilter(e.target.value); setPage(1); }} style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}>
                  <option value="ALL">👥 Tous les agents</option>
                  {responsables.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}>
                  <option value="zone">⚡ Trier : Priorité</option>
                  <option value="jours">📉 Jours inactif (↓)</option>
                  <option value="calls">📞 Nb appels</option>
                  <option value="solde">💰 Solde</option>
                  <option value="nom">🔤 Nom A→Z</option>
                </select>
              </div>

              {/* Row 2: inactivity presets + range + toggles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.05em" }}>⏳ INACTIVITÉ :</span>
                {[
                  { label: "Aujourd'hui (0j)", min: "0", max: "0" },
                  { label: "1–2 jours", min: "1", max: "2" },
                  { label: "3–6j ⚠️", min: "3", max: "6" },
                  { label: "7–12j 🚨", min: "7", max: "12" },
                  { label: "13+ jours ⛔", min: "13", max: "" },
                  { label: "Tout effacer", min: "", max: "" },
                ].map(p => {
                  const active = inactifMin === p.min && inactifMax === p.max;
                  return (
                    <button
                      key={p.label}
                      onClick={() => { setInactifMin(p.min); setInactifMax(p.max); setInactifPreset(p.label); setPage(1); }}
                      style={{
                        padding: "6px 12px", borderRadius: 8, border: `2px solid ${active ? "#1d4ed8" : "#e5e7eb"}`,
                        background: active ? "#eff6ff" : "#f9fafb", color: active ? "#1d4ed8" : "#374151",
                        cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, transition: "all 0.15s"
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>De</span>
                  <input type="number" min="0" value={inactifMin} onChange={e => { setInactifMin(e.target.value); setInactifPreset(""); setPage(1); }} placeholder="min" style={{ width: 60, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, textAlign: "center" }} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>à</span>
                  <input type="number" min="0" value={inactifMax} onChange={e => { setInactifMax(e.target.value); setInactifPreset(""); setPage(1); }} placeholder="max" style={{ width: 60, padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, textAlign: "center" }} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>jours</span>
                </div>
              </div>

              {/* Row 3: checkboxes */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", padding: "7px 12px", background: showBloques ? "#fee2e2" : "#f9fafb", borderRadius: 8, border: `1px solid ${showBloques ? "#fca5a5" : "#d1d5db"}` }}>
                  <input type="checkbox" checked={showBloques} onChange={e => { setShowBloques(e.target.checked); setPage(1); }} />
                  ⛔ Solde bloqué uniquement
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", padding: "7px 12px", background: nonAppeles ? "#fff7ed" : "#f9fafb", borderRadius: 8, border: `1px solid ${nonAppeles ? "#fed7aa" : "#d1d5db"}` }}>
                  <input type="checkbox" checked={nonAppeles} onChange={e => { setNonAppeles(e.target.checked); setPage(1); }} />
                  📞 Non contactés uniquement
                </label>
                <div style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>
                  <strong style={{ color: "#111827", fontSize: 15 }}>{filtered.length}</strong> chauffeurs · Page {page}/{Math.max(1, totalPages)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["📞", "Appels passés", totalCalls, "#1d4ed8"], ["🗣️", "Contactés", stats.appeles, "#22c55e"], ["⛔", "Rouge restants", stats.rouge - stats.rougeApp, "#ef4444"]].map(([em, label, v, c]) => (
                <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 }}>
                  <span>{em}</span><span style={{ color: "#6b7280" }}>{label} :</span><AnimatedNumber value={v as number} color={c as string} size={15} />
                </div>
              ))}
              {currentAgent && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: userRole === "ADMIN" ? "#fef3c7" : "#eff6ff", borderRadius: 10, border: `1px solid ${userRole === "ADMIN" ? "#fcd34d" : "#bfdbfe"}`, fontSize: 13, color: userRole === "ADMIN" ? "#92400e" : "#1d4ed8", fontWeight: 700 }}>
                  {userRole === "ADMIN" ? "🛡️ Admin" : "👤 Agent"} : {currentAgent}
                  {userRole === "ADMIN" && (
                    <button 
                      onClick={() => setActiveTab("agents")}
                      style={{ marginLeft: 8, padding: "4px 8px", background: "#d97706", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                    >
                      🔑 Gérer les accès
                    </button>
                  )}
                  <button onClick={() => window.location.reload()} title="Déconnexion" style={{ marginLeft: 8, border: "none", background: "transparent", cursor: "pointer", fontSize: 10, opacity: 0.6 }}>❌</button>
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                    {["#", "Chauffeur", "Zone", "Inactif", "Solde", "Commentaire", "Agent", "Appel rapide", "Statut"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(driver => <DriverRow key={driver.id} driver={driver} onComment={onComment} onCallClick={handleCallClick} onWaClick={handleWaClick} />)}
                  {paginated.length === 0 && <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Aucun chauffeur trouvé</td></tr>}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>← Préc</button>
                {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 3, totalPages - 7)) + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: p === page ? "#1d4ed8" : "#fff", color: p === page ? "#fff" : "#374151", cursor: "pointer", fontSize: 13 }}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>Suiv →</button>
              </div>
            )}
          </div>
        )}

        {/* KPI */}
        {activeTab === "kpi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>📈 Rapport KPI du Soir</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
                {[{ label: "Appels passés", v: totalCalls, icon: "📞", c: "#1d4ed8" }, { label: "Chauffeurs contactés", v: stats.appeles, icon: "🗣️", c: "#22c55e" }, { label: "Bloqués financièrement", v: stats.fin_bloque, icon: "⛔", c: "#dc2626" }].map(({ label, v, icon, c }) => (
                  <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: 16, textAlign: "center", border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
                    <AnimatedNumber value={v} color={c} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 6 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb", fontFamily: "monospace", fontSize: 13, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                {`📅 RAPPORT FLOTTE — ${new Date().toLocaleDateString("fr-FR")}
──────────────────────────────

📞 Appels passés : ${totalCalls}
🗣️ Chauffeurs contactés: ${stats.appeles}
⛔ Soldes bloqués : ${stats.fin_bloque}

🌍 ZONES :
🚨 Rouge (7-12j) : ${stats.rouge} → ${stats.rougeApp} appelés
⚠️ Orange (3-6j) : ${stats.orange} → ${stats.orangeApp} appelés
🎉 Nouveaux (0 course) : ${stats.nouveau} → ${stats.nouveauApp} appelés
✅ Actifs : ${stats.ok}

──────────────────────────────
Cellule de Relance Yango`}
              </div>
              <RippleBtn onClick={() => {
                const t = `📅 RAPPORT FLOTTE — ${new Date().toLocaleDateString("fr-FR")}\n\n📞 Appels: ${totalCalls}\n🗣️ Contactés: ${stats.appeles}\n⛔ Bloqués: ${stats.fin_bloque}\n\n🚨 Rouge: ${stats.rouge} (${stats.rougeApp} appelés)\n⚠️ Orange: ${stats.orange} (${stats.orangeApp} appelés)\n🎉 Nouveaux: ${stats.nouveau} (${stats.nouveauApp} appelés)\n✅ Actifs: ${stats.ok}`;
                navigator.clipboard?.writeText(t);
              }} style={{ marginTop: 12, padding: "10px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
                📋 Copier le rapport
              </RippleBtn>
            </div>
          </div>
        )}

        {/* AGENTS */}
        {activeTab === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ACCESS MANAGEMENT - ADMIN ONLY */}
            {userRole === "ADMIN" && (
              <div style={{ background: "#fff", borderRadius: 12, border: "2px solid #fcd34d", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
                    🔑 Gestion des Accès <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 99 }}>ADMIN</span>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, background: "#fffbeb", padding: 16, borderRadius: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Nom de l'Agent</label>
                    <input 
                      type="text" 
                      placeholder="Ex: PAUL" 
                      id="new-agent-name"
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, width: 140 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Code d'accès</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 0000" 
                      id="new-agent-code"
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, width: 100 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Rôle</label>
                    <select id="new-agent-role" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14 }}>
                      <option value="AGENT">👤 Agent</option>
                      <option value="ADMIN">🛡️ Admin</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById("new-agent-name") as HTMLInputElement;
                      const codeInput = document.getElementById("new-agent-code") as HTMLInputElement;
                      const roleInput = document.getElementById("new-agent-role") as HTMLSelectElement;
                      
                      if (nameInput.value && codeInput.value) {
                        const newUsers = [...users, { 
                          name: nameInput.value.toUpperCase(), 
                          code: codeInput.value, 
                          role: roleInput.value as "ADMIN" | "AGENT" 
                        }];
                        setUsers(newUsers);
                        window.storage.set("flotte_users", JSON.stringify(newUsers)).catch(() => {});
                        
                        nameInput.value = "";
                        codeInput.value = "";
                        alert(`Utilisateur ${nameInput.value} ajouté !`);
                      }
                    }}
                    style={{ padding: "8px 16px", background: "#d97706", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                  >
                    Ajouter
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {users.map((u, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: u.role === "ADMIN" ? "#b45309" : "#1e3a5f" }}>
                          {u.role === "ADMIN" ? "🛡️" : "👤"} {u.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>Code: {u.code}</div>
                      </div>
                      {users.length > 1 && (
                        <button 
                          onClick={() => {
                            if (window.confirm(`Supprimer l'accès pour ${u.name} ?`)) {
                              const newUsers = users.filter((_, idx) => idx !== i);
                              setUsers(newUsers);
                              window.storage.set("flotte_users", JSON.stringify(newUsers)).catch(() => {});
                            }
                          }}
                          style={{ border: "none", background: "#fee2e2", color: "#b91c1c", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>👥 Performance des Agents</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                {Object.entries(agentSessions).map(([name, data]: [string, any]) => {
                  const hours = Math.floor((data.totalTime || 0) / 3600000);
                  const mins = Math.floor(((data.totalTime || 0) % 3600000) / 60000);
                  return (
                    <div key={name} style={{ background: "#f8fafc", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e3a5f" }}>{name}</div>
                        {name === currentAgent && <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>ACTIF</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: "#fff", padding: 10, borderRadius: 8, textAlign: "center", border: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#1d4ed8" }}>{data.calls || 0}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Appels</div>
                        </div>
                        <div style={{ background: "#fff", padding: 10, borderRadius: 8, textAlign: "center", border: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{hours}h{mins}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Temps total</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 12, textAlign: "right" }}>
                        Dernière activité : {data.lastActive ? new Date(data.lastActive).toLocaleTimeString() : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 700, fontSize: 15 }}>
                📜 Journal d'Activité Global
              </div>
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {globalLogs.map((log, i) => (
                  <div key={i} style={{ padding: "10px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "center", fontSize: 13 }}>
                    <div style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 11, minWidth: 130 }}>
                      {new Date(log.time).toLocaleString()}
                    </div>
                    <div style={{ fontWeight: 700, color: "#1e3a5f", minWidth: 80 }}>{log.agent}</div>
                    <div style={{ padding: "2px 8px", borderRadius: 6, background: log.action === "LOGIN" ? "#dbeafe" : log.action === "CALL" ? "#dcfce7" : "#f1f5f9", color: log.action === "LOGIN" ? "#1e40af" : log.action === "CALL" ? "#166534" : "#475569", fontSize: 11, fontWeight: 700 }}>
                      {log.action}
                    </div>
                    <div style={{ color: "#334155", flex: 1 }}>{log.details}</div>
                  </div>
                ))}
                {globalLogs.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Aucune activité enregistrée</div>}
              </div>
            </div>
          </div>
        )}

        {/* HISTORIQUE */}
        {activeTab === "historique" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960 }}>
            {/* Storage badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: storageReady ? "#f0fdf4" : "#fff7ed", border: `1px solid ${storageReady ? "#86efac" : "#fed7aa"}`, borderRadius: 12 }}>
              <span style={{ fontSize: 24 }}>{storageReady ? "💾" : "⏳"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: storageReady ? "#15803d" : "#92400e" }}>{storageReady ? "Sauvegarde automatique active — données persistantes" : "Chargement de la mémoire..."}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Appels, commentaires et historiques sauvegardés automatiquement. Disponibles à la prochaine ouverture.</div>
              </div>
              <button onClick={async () => {
                if (!window.confirm("Effacer TOUTES les données sauvegardées ? Appels et historiques seront perdus.")) return;
                try { await window.storage.delete("flotte_drivers"); } catch (e) { }
                try { await window.storage.delete("flotte_history"); } catch (e) { }
                try { await window.storage.delete("flotte_agent"); } catch (e) { }
                try { await window.storage.delete("flotte_totalcalls"); } catch (e) { }
                setDrivers(generateSampleDrivers()); setImportHistory([]); setCurrentAgent(""); setTotalCalls(0);
              }} style={{ padding: "8px 14px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                🗑️ Tout effacer
              </button>
            </div>

            {/* Session stats */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📊 Données actuellement en mémoire</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {[
                  { label: "Chauffeurs", v: drivers.length, c: "#1d4ed8", icon: "👥" },
                  { label: "Appels total", v: drivers.reduce((s, d) => s + d._callCount, 0), c: "#1d4ed8", icon: "📞" },
                  { label: "Contactés", v: drivers.filter(d => d._called).length, c: "#22c55e", icon: "🗣️" },
                  { label: "Commentaires", v: drivers.filter(d => d.commentaire && d.commentaire.startsWith("[")).length, c: "#8b5cf6", icon: "📝" },
                  { label: "Bloqués", v: drivers.filter(d => d.fin_bloque).length, c: "#dc2626", icon: "⛔" },
                  { label: "Importations", v: importHistory.length, c: "#0891b2", icon: "📂" },
                ].map(({ label, v, c, icon }) => (
                  <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                    <AnimatedNumber value={v} color={c} size={22} />
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call logs */}
            {drivers.filter(d => d._callCount > 0).length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", fontWeight: 700, fontSize: 15 }}>
                  🕒 Historique des appels — {drivers.filter(d => d._callCount > 0).length} chauffeurs contactés
                </div>
                <div style={{ maxHeight: 450, overflowY: "auto" }}>
                  {drivers.filter(d => d._callCount > 0).sort((a, b) => b._callCount - a._callCount).map(d => (
                    <div key={d.id} style={{ padding: "12px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1d4ed8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{d._callCount}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{d.nom} <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>· {d.tel}</span></div>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: (ZONE_CONFIG[d.zone] || ZONE_CONFIG.INCONNU).bg, color: (ZONE_CONFIG[d.zone] || ZONE_CONFIG.INCONNU).color, border: `1px solid ${(ZONE_CONFIG[d.zone] || ZONE_CONFIG.INCONNU).border}`, fontWeight: 700 }}>
                            {(ZONE_CONFIG[d.zone] || ZONE_CONFIG.INCONNU).icon} {(ZONE_CONFIG[d.zone] || ZONE_CONFIG.INCONNU).label}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {d._callLog.map((entry: any, i: number) => (
                            <div key={i} style={{ fontSize: 11, background: "#f9fafb", border: "1px solid #e5e7eb", borderLeft: "3px solid #1d4ed8", borderRadius: 6, padding: "5px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                              <span style={{ fontWeight: 800, color: "#1d4ed8" }}>#{i + 1}</span>
                              <span style={{ fontWeight: 600, color: "#374151" }}>👤 {entry.agent}</span>
                              <span style={{ color: "#9ca3af" }}>🕒 {entry.time}</span>
                              {entry.outcome && <span style={{ color: "#7c3aed", fontFamily: "monospace", fontWeight: 700, fontSize: 10 }}>{entry.outcome}</span>}
                              {entry.comment && entry.comment.trim() !== entry.outcome && <span style={{ color: "#6b7280", fontStyle: "italic", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{entry.comment}"</span>}
                            </div>
                          ))}
                        </div>
                        {d.commentaire && <div style={{ marginTop: 5, fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>📝 Dernier commentaire : {d.commentaire}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import history */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>📂 Historique des importations CSV</span>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{importHistory.length} / 20 importations enregistrées</span>
              </div>
              {importHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                  Aucune importation enregistrée.<br />Importez un fichier CSV Yango pour commencer.
                </div>
              ) : (
                importHistory.map((h, i) => (
                  <div key={i} style={{ padding: "14px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", background: i === 0 ? "#eff6ff" : "#fff" }}>
                    <div style={{ width: 34, height: 34, background: i === 0 ? "#1d4ed8" : "#f3f4f6", color: i === 0 ? "#fff" : "#6b7280", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {i === 0 ? "🆕" : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        📄 {h.filename}
                        {i === 0 && <span style={{ fontSize: 11, background: "#1d4ed8", color: "#fff", padding: "1px 8px", borderRadius: 99, fontWeight: 700 }}>Dernière</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>📅 {h.date}</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[{ label: "Total", v: h.count, c: "#1d4ed8" }, { label: "🚨 Rouge", v: h.rouge, c: "#ef4444" }, { label: "⚠️ Orange", v: h.orange, c: "#f97316" }, { label: "🎉 Nouveau", v: h.nouveau, c: "#8b5cf6" }, { label: "✅ Actifs", v: h.ok, c: "#22c55e" }, { label: "⛔ Bloqués", v: h.fin_bloque, c: "#dc2626" }].map(({ label, v, c }) => (
                        <div key={label} style={{ textAlign: "center", minWidth: 44 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
