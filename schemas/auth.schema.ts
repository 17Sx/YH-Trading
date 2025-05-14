import { z } from 'zod';

export const EmailSchema = z.string().email({ message: "Veuillez entrer une adresse e-mail valide." });

export const PasswordSchema = z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." });

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: PasswordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"], 
});

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema, 
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>; 