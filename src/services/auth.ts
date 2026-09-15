import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase';

export const usernameToEmail = (username: string): string =>
  `${String(username).trim().toLowerCase()}@nippon-sale.local`;

export const validUsername = (username: string): boolean =>
  /^[a-z0-9][a-z0-9._-]{2,31}$/i.test(String(username || '').trim());

export async function resolveEmail(username: string): Promise<string> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client.rpc('resolve_login_email', { p_username: username });
    if (!error && data) return data;
  } catch (e) {
    // fallback
  }
  return usernameToEmail(username);
}

export async function checkSession(): Promise<{ user: User | null; session: Session | null }> {
  const client = getSupabaseClient();
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      return { user: null, session: null };
    }
    return { user: data.session.user, session: data.session };
  } catch (e) {
    return { user: null, session: null };
  }
}

export async function signInWithUsername(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!validUsername(cleanUsername)) {
    return {
      success: false,
      error: 'Username ต้องขึ้นต้นด้วย A-Z, 0-9 ความยาว 3-32 ตัวอักษร',
    };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' };
  }

  const client = getSupabaseClient();
  try {
    const email = await resolveEmail(cleanUsername);
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: 'Username หรือ Password ไม่ถูกต้อง' };
    }
    return { success: true, user: data.user || undefined };
  } catch (e: any) {
    return { success: false, error: e.message || 'เข้าสู่ระบบไม่สำเร็จ' };
  }
}

export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  try {
    await client.auth.signOut();
  } catch (e) {
    console.error('Sign out error:', e);
  }
}

export function extractUsername(user: User | null): string {
  if (!user || !user.email) return 'ผู้ดูแลระบบ';
  return user.email.split('@')[0] || 'ผู้ดูแลระบบ';
}
