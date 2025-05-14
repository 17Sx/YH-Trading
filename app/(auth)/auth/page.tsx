"use client";

import { useState } from 'react';
import { SignInForm } from '@/components/auth/sign-in-form';
import { SignUpForm } from '@/components/auth/sign-up-form';

export default function AuthenticationPage() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {isLoginView ? "Accédez à votre compte" : "Créez un nouveau compte"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Ou{" "}
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="font-medium text-primary-accent hover:text-purple-400 focus:outline-none"
            >
              {isLoginView ? "créez un nouveau compte" : "connectez-vous à votre compte"}
            </button>
            {" "}
            pour commencer votre journal.
          </p>
        </div>
        
        {isLoginView ? <SignInForm /> : <SignUpForm />}
        
      </div>
    </div>
  );
} 