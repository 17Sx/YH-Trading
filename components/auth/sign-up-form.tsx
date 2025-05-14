"use client";

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpSchema, type SignUpInput } from '@/schemas/auth.schema';
import { signUpUser } from '@/lib/actions/auth.actions';
// import { Input } from "@/components/ui/input"; // Exemple si vous avez un composant Input personnalisé
// import { Button } from "@/components/ui/button"; // Exemple pour un Button

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit: SubmitHandler<SignUpInput> = (data) => {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await signUpUser(data);
      if (result?.error) {
        setError(result.error);
        if (result.issues) {
          // Gérer les erreurs Zod plus spécifiquement si nécessaire
          console.error("Zod issues:", result.issues);
        }
      } else if (result?.success && result?.message) {
        setSuccessMessage(result.message); 
        reset(); // Réinitialiser le formulaire en cas de succès (si confirmation email)
      }
      // Si redirect, la page changera automatiquement
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm"
        />
        {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm"
        />
        {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm"
        />
        {errors.confirmPassword && <p className="mt-2 text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      {successMessage && <p className="text-sm text-green-500 text-center">{successMessage}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-accent hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50"
        >
          {isPending ? "Création en cours..." : "Créer un compte"}
        </button>
      </div>
    </form>
  );
} 