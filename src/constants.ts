
export const INITIAL_FLEETS = [
  { id: "diagne", name: "Diagne Transport" },
  { id: "ndongo", name: "Transport Ndongo Fall" },
  { id: "sy", name: "Sy Transport" },
  { id: "autres", name: "Autres Parcs" }
];

export const CODES_COMMENTAIRE = ["[PANNE]", "[SOLDE]", "[DOCS]", "[MALADE]", "[RAPPEL]", "[RÉSOLU]"];

export const AGENTS = [
  "Ndeye Khady", "RAMATA GAYE", "ALIOU CISSE", "ADAMA MBAYE", "COUMBA BA", 
  "NDONGO GAYE", "MAISSA SALL", "Thierno sadou Diallo", "COUMBA NIANG", "NDÉYE FALL"
];

export const WA_TEMPLATES = {
  ROUGE: (nom: string) => `Bonjour ${nom} 🚨, nous avons remarqué que vous n'avez pas effectué de course depuis plusieurs jours. Votre compte risque d'être archivé sous 48h. Pouvez-vous nous contacter pour qu'on vous aide ? 🤝`,
  ORANGE: (nom: string) => `Bonjour ${nom} 👋, nous espérons que tout va bien ! Saviez-vous que des *bonus sont disponibles* cette semaine sur Yango ? N'hésitez pas à vous connecter pour en profiter 🚕`,
  NOUVEAU: (nom: string) => `Bienvenue sur Yango ${nom} ! 🎉 Nous sommes ravis de vous compter parmi nos chauffeurs. Besoin d'aide pour votre première connexion ? Répondez à ce message, nous sommes là pour vous 🚀`,
  OK: (nom: string) => `Bonjour ${nom}, merci pour votre activité sur Yango ! 🌟 N'hésitez pas si vous avez des questions.`,
  SOLDE: (nom: string) => `Bonjour ${nom}, votre solde actuel ne vous permet plus de prendre des courses. Veuillez effectuer un versement pour reprendre votre activité. Pour tout renseignement, contactez-nous 📞`,
};

export const ZONE_CONFIG: Record<string, any> = {
  ROUGE: {
    label: "Zone Rouge", color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", priority: 1,
    icon: "🚨", joursMin: 7, joursMax: 12,
    risque: "Archivage automatique imminent (J+15)",
    action: "Appel téléphonique OBLIGATOIRE dans la journée",
    causes: ["Panne véhicule", "Accident", "Départ vers la concurrence", "Problème personnel", "Document expiré"],
    conseil: "Proposer une solution concrète : avance sur solde, aide document, mise en relation garage partenaire.",
    urgence: "CRITIQUE",
  },
  ORANGE: {
    label: "Zone Orange", color: "#f97316", bg: "#fff7ed", border: "#fed7aa", priority: 2,
    icon: "⚠️", joursMin: 3, joursMax: 6,
    risque: "Glissement possible vers Zone Rouge si pas de contact sous 48h",
    action: "Appel ou SMS groupé — rappeler les avantages actifs",
    causes: ["Démotivation passagère", "Solde insuffisant", "Problème technique mineur", "Manque de courses dans la zone"],
    conseil: "Rappeler les bonus en cours. Vérifier le solde et proposer un rechargement si nécessaire.",
    urgence: "MODÉRÉE",
  },
  NOUVEAU: {
    label: "Nouveau", color: "#8b5cf6", bg: "#f5f3ff", border: "#c4b5fd", priority: 3,
    icon: "🎉", joursMin: null, joursMax: null,
    risque: "Abandon avant la 1ère course — taux d'activation faible",
    action: "Appel de bienvenue dans les 48h suivant l'inscription",
    causes: ["Problème de connexion à l'app", "Documents non validés", "Ne comprend pas le fonctionnement", "Peur de commencer"],
    conseil: "Guider pas à pas : connexion app, première zone recommandée, heure de pointe, premier bonus débloqué.",
    urgence: "IMPORTANT",
  },
  OK: {
    label: "Actif", color: "#22c55e", bg: "#f0fdf4", border: "#86efac", priority: 4,
    icon: "✅", joursMin: 0, joursMax: 2,
    risque: "Aucun risque immédiat",
    action: "Maintenir la relation — appel de fidélisation mensuel recommandé",
    causes: [],
    conseil: "Informer des nouveaux bonus, recueillir les retours terrain, valoriser les bons chauffeurs.",
    urgence: "FAIBLE",
  },
  INCONNU: {
    label: "Inconnu", color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", priority: 5,
    icon: "❓", joursMin: null, joursMax: null,
    risque: "Données manquantes — impossible d'évaluer le risque",
    action: "Vérifier les données dans Yango Admin",
    causes: ["Date de dernière course absente", "Compte jamais activé", "Erreur de synchronisation CSV"],
    conseil: "Mettre à jour les données et reclassifier manuellement.",
    urgence: "À VÉRIFIER",
  },
};
