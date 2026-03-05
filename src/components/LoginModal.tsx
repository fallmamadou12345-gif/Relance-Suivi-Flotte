import React, { useState } from "react";
import { motion } from "motion/react";

interface LoginModalProps {
  users: any[];
  onLogin: (name: string, role: "ADMIN" | "AGENT") => void;
}

export default function LoginModal({ users, onLogin }: LoginModalProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const cleanName = name.trim().toUpperCase();
    const cleanPass = password.trim();

    const user = users.find(u => u.name === cleanName && u.code === cleanPass);

    if (user) {
      onLogin(user.name, user.role);
    } else {
      setError("Nom ou code d'accès incorrect.");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "#fff", padding: 40, borderRadius: 24,
          width: "100%", maxWidth: 400, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e3a5f", marginBottom: 8 }}>Accès Sécurisé</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>Identifiez-vous pour accéder à la plateforme.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            type="text"
            placeholder="Votre Nom (ex: THOMAS)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: "2px solid #e2e8f0", fontSize: 16, outline: "none",
              textAlign: "center", fontWeight: 600
            }}
          />
          <input
            type="password"
            placeholder="Code d'accès"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              border: "2px solid #e2e8f0", fontSize: 16, outline: "none",
              textAlign: "center", fontWeight: 600
            }}
          />
          
          {error && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button
            type="submit"
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: "#1d4ed8",
              color: "#fff", fontWeight: 700, fontSize: 16, border: "none",
              cursor: "pointer", marginTop: 8,
              transition: "background 0.2s"
            }}
          >
            Connexion →
          </button>
        </form>
        <div style={{ marginTop: 20, fontSize: 11, color: "#94a3b8" }}>
          Demandez votre code d'accès à l'administrateur.
        </div>
      </motion.div>
    </div>
  );
}
