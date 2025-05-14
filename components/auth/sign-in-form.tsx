"use client";

import { useState, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignInSchema, type SignInInput } from '@/schemas/auth.schema';
import { signInUser } from '@/lib/actions/auth.actions';
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";

export function SignInForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
  });

  const onSubmit: SubmitHandler<SignInInput> = (data) => {
    setError(null);
    startTransition(async () => {
      const result = await signInUser(data);
      if (result?.error) {
        setError(result.error);
      }
      // Si redirect, la page changera automatiquement
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email-signin" className="block text-sm font-medium text-gray-300">
          Adresse e-mail
        </label>
        <input
          id="email-signin"
          type="email"
          {...register("email")}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm"
        />
        {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password-signin" className="block text-sm font-medium text-gray-300">
          Mot de passe
        </label>
        <input
          id="password-signin"
          type="password"
          {...register("password")}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm"
        />
        {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-accent hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50"
        >
          {isPending ? "Connexion en cours..." : "Se connecter"}
        </button>
      </div>
    </form>
  );
} 