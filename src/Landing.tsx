import React from 'react';
import { Link } from 'react-router-dom';
import { Car, BarChart, MessageSquare, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
          <Car className="w-6 h-6" />
          FlottePro
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Connexion</Link>
          <Link to="/auth" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">Essai gratuit</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold mb-6 uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Nouveau : Automatisation WhatsApp
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Gérez votre flotte VTC <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">sans effort.</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
            La plateforme SaaS tout-en-un pour les partenaires Yango, Uber et Heetch. Suivez vos chauffeurs, automatisez vos relances et maximisez vos revenus.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/auth" className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Démarrer maintenant <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-all">
              Découvrir les offres
            </a>
          </div>
        </div>
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-violet-50 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
          <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&q=80&w=1000" alt="Dashboard Preview" className="rounded-2xl shadow-2xl border border-white/50" />
          
          {/* Floating Card */}
          <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Relance automatique</p>
              <p className="text-sm font-bold text-slate-900">+45% d'activité</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-600">Une suite complète d'outils conçue spécifiquement pour les gestionnaires de flottes modernes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BarChart, title: "Tableau de bord unifié", desc: "Visualisez les performances de tous vos parcs en un seul coup d'œil." },
              { icon: MessageSquare, title: "Relances WhatsApp", desc: "Envoyez des messages personnalisés en un clic selon le statut du chauffeur." },
              { icon: Shield, title: "Gestion des accès", desc: "Créez des comptes pour vos agents avec des permissions spécifiques par parc." }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Des tarifs adaptés à votre croissance</h2>
            <p className="text-slate-400">Commencez gratuitement, évoluez sans limite.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "0", desc: "Pour les petits parcs", features: ["Jusqu'à 50 chauffeurs", "1 Parc", "Relances manuelles"] },
              { name: "Pro", price: "49", desc: "Pour les gestionnaires actifs", features: ["Chauffeurs illimités", "Jusqu'à 5 Parcs", "Modèles WhatsApp", "Support prioritaire"], popular: true },
              { name: "Enterprise", price: "Sur mesure", desc: "Pour les grandes flottes", features: ["Parcs illimités", "API & Webhooks", "Marque blanche", "Gestionnaire dédié"] }
            ].map((p, i) => (
              <div key={i} className={`p-8 rounded-3xl ${p.popular ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-900/50 transform md:-translate-y-4' : 'bg-slate-800 border-slate-700'} border flex flex-col`}>
                {p.popular && <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4">Le plus populaire</div>}
                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                <p className={`mb-6 ${p.popular ? 'text-indigo-200' : 'text-slate-400'}`}>{p.desc}</p>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold">{p.price !== "Sur mesure" ? p.price + "€" : p.price}</span>
                  {p.price !== "Sur mesure" && <span className={`text-sm ${p.popular ? 'text-indigo-200' : 'text-slate-400'}`}>/mois</span>}
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <CheckCircle2 className={`w-5 h-5 ${p.popular ? 'text-indigo-300' : 'text-indigo-500'}`} />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className={`w-full py-3 rounded-xl font-medium text-center transition-colors ${p.popular ? 'bg-white text-indigo-900 hover:bg-slate-50' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                  Choisir {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} FlottePro SaaS. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
