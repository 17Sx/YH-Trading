"use client";

import { useState } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { motion, AnimatePresence } from 'framer-motion'; // Pour des transitions fluides
import { Lock, UserPlus } from 'lucide-react'; // Icônes

export default function AuthenticationPage() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 text-gray-100 selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-gray-800/30 backdrop-blur-md p-8 md:p-10 shadow-2xl shadow-purple-500/10">
        <div className="text-center">
          <div className="inline-block p-3 bg-purple-500/20 rounded-full mb-4">
            {isLoginView ? (
              <Lock className="h-8 w-8 text-purple-400" />
            ) : (
              <UserPlus className="h-8 w-8 text-purple-400" />
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {isLoginView ? "Bienvenue !" : "Rejoignez-nous"}
          </h2>
          <p className="mt-3 text-sm text-gray-400">
            {isLoginView ? "Connectez-vous pour accéder à votre journal." : "Créez un compte pour commencer à suivre vos trades."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLoginView ? "login" : "signup"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isLoginView ? <SignInForm /> : <SignUpForm />}
          </motion.div>
        </AnimatePresence>

        <div className="text-center">
          <button
            onClick={() => setIsLoginView(!isLoginView)}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 hover:underline focus:outline-none transition-colors duration-150"
          >
            {isLoginView
              ? "Pas encore de compte ? Créez-en un"
              : "Déjà un compte ? Connectez-vous"}
          </button>
        </div>
      </div>
       <p className="mt-8 text-xs text-gray-600 text-center">
        YH Trading Journal &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
} 