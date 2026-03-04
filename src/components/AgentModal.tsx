
import { useState, useEffect, useRef } from "react";
import { AGENTS } from "../constants";

export default function AgentModal({ driver, onConfirm, onClose, currentAgent }: { driver: any, onConfirm: (data: any) => void, onClose: () => void, currentAgent: string }) {
  const [agent, setAgent] = useState(currentAgent || "");
  const [custom, setCustom] = useState("");
  const [comment, setComment] = useState(driver.commentaire || "");
  const [outcome, setOutcome] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const finalAgent = agent === "__custom__" ? custom.trim() : agent;
  const canConfirm = finalAgent.trim() !== "";

  const submit = () => {
    if (!canConfirm) return;
    onConfirm({ agent: finalAgent, comment, outcome });
  };

  const outcomes = [
    { code: "[RÉSOLU]", label: "✅ Problème résolu", color: "#22c55e" },
    { code: "[RAPPEL]", label: "📞 Pas répondu", color: "#6b7280" },
    { code: "[PANNE]", label: "🔧 En panne", color: "#dc2626" },
    { code: "[SOLDE]", label: "💰 Problème solde", color: "#d97706" },
    { code: "[DOCS]", label: "📄 Docs expirés", color: "#7c3aed" },
    { code: "[MALADE]", label: "🤒 Indisponible", color: "#0891b2" },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10000, display: "flex",
        alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: 0, width: 460, maxWidth: "95vw",
          boxShadow: "0 25px 80px rgba(0,0,0,0.25)", overflow: "hidden",
          animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          maxHeight: "90vh", display: "flex", flexDirection: "column"
        }}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", padding: "18px 24px", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2, letterSpacing: "0.06em", fontWeight: 600 }}>APPEL ENREGISTRÉ · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{driver.nom}</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{driver.tel} · Appel #{driver._callCount + 1}</div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
          {/* Agent selection */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", marginBottom: 8 }}>👤 QUI A PASSÉ CET APPEL ?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {AGENTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAgent(a)}
                  style={{
                    padding: "9px 12px", borderRadius: 8, border: `2px solid ${agent === a ? "#1d4ed8" : "#e5e7eb"}`,
                    background: agent === a ? "#eff6ff" : "#f9fafb", color: agent === a ? "#1d4ed8" : "#374151",
                    cursor: "pointer", fontSize: 13, fontWeight: agent === a ? 700 : 500, textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  {agent === a ? "✓ " : ""}{a}
                </button>
              ))}
              <button
                onClick={() => setAgent("__custom__")}
                style={{
                  padding: "9px 12px", borderRadius: 8, border: `2px dashed ${agent === "__custom__" ? "#1d4ed8" : "#d1d5db"}`,
                  background: agent === "__custom__" ? "#eff6ff" : "#fff", color: agent === "__custom__" ? "#1d4ed8" : "#9ca3af",
                  cursor: "pointer", fontSize: 13, fontWeight: 500, textAlign: "left",
                }}
              >
                ✏️ Autre agent...
              </button>
            </div>
            {agent === "__custom__" && (
              <input
                ref={inputRef}
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Saisir le nom de l'agent..."
                style={{
                  marginTop: 8, width: "100%", padding: "10px 12px", border: "2px solid #1d4ed8",
                  borderRadius: 8, fontSize: 14, boxSizing: "border-box"
                }}
              />
            )}
          </div>

          {/* Outcome */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", marginBottom: 8 }}>📊 RÉSULTAT DE L'APPEL</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {outcomes.map(o => (
                <button
                  key={o.code}
                  onClick={() => { setOutcome(o.code); setComment(o.code + " "); }}
                  style={{
                    padding: "7px 12px", borderRadius: 8, border: `2px solid ${outcome === o.code ? o.color : "#e5e7eb"}`,
                    background: outcome === o.code ? o.color + "18" : "#f9fafb",
                    color: outcome === o.code ? o.color : "#374151",
                    cursor: "pointer", fontSize: 12, fontWeight: outcome === o.code ? 700 : 500,
                    transition: "all 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", marginBottom: 6 }}>📝 NOTE RAPIDE (optionnel)</div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ex: Chauffeur dit qu'il reprend lundi, panne réparée..."
              style={{
                width: "100%", padding: "10px 12px", border: "1px solid #d1d5db",
                borderRadius: 8, fontSize: 13, resize: "vertical", minHeight: 56, boxSizing: "border-box"
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={submit}
              disabled={!canConfirm}
              style={{
                flex: 1, padding: "12px", background: canConfirm ? "#1d4ed8" : "#e5e7eb",
                color: canConfirm ? "#fff" : "#9ca3af", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 800, transition: "background 0.2s", cursor: canConfirm ? "pointer" : "not-allowed"
              }}
            >
              ✅ Confirmer l'appel
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 16px", background: "#f3f4f6", color: "#6b7280", border: "none",
                borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 600
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
