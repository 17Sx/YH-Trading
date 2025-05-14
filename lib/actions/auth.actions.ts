"use server";

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignUpSchema, SignInSchema } from '@/schemas/auth.schema';
import { createSupabaseActionClient } from '@/lib/supabase/actions';

export async function signUpUser(values: z.infer<typeof SignUpSchema>) {
  const cookieStore = cookies();
  const supabase = createSupabaseActionClient();

  const result = SignUpSchema.safeParse(values);
  if (!result.success) {
    return { error: "Données invalides.", issues: result.error.issues };
  }

  const { email, password } = result.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
       emailRedirectTo: '/auth/callback', 
    },
  });

  if (error) {
    console.error("Erreur d'inscription Supabase:", error.message);
    return { error: error.message };
  }

  if (data.user) {
  
    return redirect('/dashboard');
  } else if (data.session === null && !error) {
    return { success: true, message: "Veuillez vérifier vos e-mails pour confirmer votre inscription." };
  }

  return { error: "Une erreur inconnue est survenue lors de l'inscription." };
}

export async function signInUser(values: z.infer<typeof SignInSchema>) {
  const cookieStore = cookies();
  const supabase = createSupabaseActionClient();

  const result = SignInSchema.safeParse(values);
  if (!result.success) {
    return { error: "Données invalides.", issues: result.error.issues };
  }

  const { email, password } = result.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Erreur de connexion Supabase:", error.message);
    if (error.message === 'Invalid login credentials') {
        return { error: "Identifiants invalides." };
    }
    return { error: error.message };
  }
  

  return redirect('/dashboard');
}

export async function signOutUser() {
  const cookieStore = cookies();
  const supabase = createSupabaseActionClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erreur de déconnexion Supabase:", error.message);
    return { error: error.message };
  }
  
  return redirect('/auth');
} 