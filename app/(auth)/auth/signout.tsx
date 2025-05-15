import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignOutPage() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/auth');
  return null;
} 