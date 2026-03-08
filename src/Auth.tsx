import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, ArrowRight } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        navigate('/app');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('La fenêtre de connexion a été fermée avant la fin.');
      } else {
        setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight mb-16">
          <Car className="w-6 h-6" />
          FlottePro
        </Link>
        
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isLogin ? 'Bon retour !' : 'Créer un compte'}
          </h1>
          <p className="text-slate-500 mb-8">
            {isLogin ? 'Connectez-vous pour gérer votre flotte.' : 'Rejoignez les gestionnaires de flotte performants.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm mb-6 text-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Sécurisé par Firebase</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-1 text-indigo-600 font-medium hover:text-indigo-700">
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900 z-10"></div>
        <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1000" alt="Fleet" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        
        <div className="relative z-20 max-w-lg text-white">
          <div className="mb-8">
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(i => <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
            </div>
            <blockquote className="text-2xl font-medium leading-relaxed mb-6">
              "Depuis que nous utilisons FlottePro, notre taux d'activité a augmenté de 40% et la gestion de nos 3 parcs est devenue un jeu d'enfant."
            </blockquote>
            <div>
              <p className="font-bold text-lg">Mamadou Fall</p>
              <p className="text-indigo-300">Directeur, Transport Ndongo Fall</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
