
import { useState } from "react";
import { WA_TEMPLATES } from "../constants";
import { waUrl } from "../utils";
import RippleBtn from "./RippleBtn";

export default function WhatsAppModal({ driver, onClose }: { driver: any, onClose: () => void }) {
  const defaultMsg = (WA_TEMPLATES[driver.fin_bloque ? "SOLDE" : driver.zone] || WA_TEMPLATES.OK)(driver.nom);
  const [msg, setMsg] = useState(defaultMsg);
  const [sent, setSent] = useState(false);

  const templates = [
    { label: "Zone Rouge 🚨", msg: WA_TEMPLATES.ROUGE(driver.nom) },
    { label: "Zone Orange ⚠️", msg: WA_TEMPLATES.ORANGE(driver.nom) },
    { label: "Nouveau 🎉", msg: WA_TEMPLATES.NOUVEAU(driver.nom) },
    { label: "Solde bloqué 💰", msg: WA_TEMPLATES.SOLDE(driver.nom) },
    { label: "Général 🌟", msg: WA_TEMPLATES.OK(driver.nom) },
  ];

  const handleSend = () => {
    window.open(waUrl(driver.tel, msg), "_blank");
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1500);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 10001, display: "flex",
        alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: 500, maxWidth: "95vw", maxHeight: "90vh",
          overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.25)",
          animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", flexDirection: "column"
        }}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#075e54,#25d366)", padding: "18px 24px", color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2, letterSpacing: "0.06em", fontWeight: 600 }}>WHATSAPP · {driver.tel}</div>
          <div style={{ fontWeight: 800, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>💬</span> {driver.nom}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Choisissez un modèle ou rédigez votre message</div>
        </div>

        <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {/* Templates */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", marginBottom: 8 }}>📋 MODÈLES DE MESSAGE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {templates.map(t => (
                <button
                  key={t.label}
                  onClick={() => setMsg(t.msg)}
                  style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: msg === t.msg ? "#dcfce7" : "#f9fafb",
                    color: msg === t.msg ? "#15803d" : "#374151",
                    border: `2px solid ${msg === t.msg ? "#22c55e" : "#e5e7eb"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message editor */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.06em", marginBottom: 6 }}>✏️ MESSAGE</div>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              style={{
                width: "100%", padding: "12px", border: "2px solid #e5e7eb", borderRadius: 10,
                fontSize: 13, resize: "vertical", minHeight: 120, lineHeight: 1.6,
                boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{msg.length} caractères</div>
          </div>

          {/* Preview bubble */}
          <div style={{
            background: "#dcfce7", borderRadius: "12px 12px 0 12px", padding: "12px 14px",
            fontSize: 13, color: "#111827", lineHeight: 1.6, border: "1px solid #bbf7d0", position: "relative"
          }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4, fontWeight: 600 }}>APERÇU</div>
            {msg}
            <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 4 }}>
              {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} ✓✓
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <RippleBtn
              onClick={handleSend}
              style={{
                flex: 1, padding: "13px", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 15, fontWeight: 800, background: sent ? "#15803d" : "#25d366", color: "#fff",
                transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}
            >
              {sent ? "✅ Ouvert !" : <><span style={{ fontSize: 18 }}>🚀</span> Ouvrir WhatsApp</>}
            </RippleBtn>
            <button
              onClick={onClose}
              style={{
                padding: "13px 16px", background: "#f3f4f6", color: "#6b7280", border: "none",
                borderRadius: 10, fontSize: 14, cursor: "pointer", fontWeight: 600
              }}
            >
              Annuler
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
            WhatsApp s'ouvrira avec ce message pré-rempli. Vous pouvez l'envoyer ou le modifier.
          </div>
        </div>
      </div>
    </div>
  );
}
