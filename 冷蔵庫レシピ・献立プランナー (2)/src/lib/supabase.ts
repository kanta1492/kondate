/// <reference types="vite/client" />

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase client integration utility.
 */

import { createClient } from '@supabase/supabase-js';
import { User as UserType } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase keys are provided and valid
const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-public-key'
);

// Graceful Lazy initialization to prevent application crashes on startup if keys are not provided yet.
let supabaseClientInstance: any = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
    }
  }
  return supabaseClientInstance;
}

// Global supabase helper instance
export const supabase = getSupabase();

/**
 * Saves/Upserts a user account to Supabase (re-synchronizes the registry)
 */
export async function syncUserToDb(user: UserType): Promise<void> {
  const client = getSupabase();
  if (!client) {
    console.warn("Supabase is not fully configured yet. User synced in local storage only.");
    return;
  }

  try {
    const { error } = await client
      .from('shufu_users')
      .upsert({
        id: user.id || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'member',
        password: user.password || '',
        face_photo: user.facePhoto || ''
      }, { onConflict: 'id' });

    if (error) {
      // If the table doesn't exist yet, we can't write, but we should log clearly
      if (error.code === 'PGRST116' || error.message.includes('relation "public.shufu_users" does not exist')) {
        console.warn('Supabase "shufu_users" table does not exist yet. Please run SQL setup: \n\n' + getTableSQLInstructions());
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Supabase write integration error:', error);
  }
}

/**
 * Retrieve all registered users synced in Supabase
 */
export async function getAllUsersFromDb(): Promise<UserType[]> {
  const client = getSupabase();
  if (!client) {
    console.warn("Supabase is not fully configured yet. Loading from local cache instead.");
    return [];
  }

  try {
    const { data, error } = await client
      .from('shufu_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.message.includes('relation "public.shufu_users" does not exist')) {
        console.warn('Supabase "shufu_users" table does not exist yet. Please run SQL setup.');
        return [];
      }
      throw error;
    }

    if (data) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        password: row.password,
        facePhoto: row.face_photo
      }));
    }
    return [];
  } catch (error) {
    console.error('Supabase select integration error:', error);
    return [];
  }
}

/**
 * Removes a user document from Supabase
 */
export async function deleteUserFromDb(userId: string): Promise<void> {
  const client = getSupabase();
  if (!client) {
    console.warn("Supabase is not fully configured yet. Action ignored.");
    return;
  }

  try {
    const { error } = await client
      .from('shufu_users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Supabase delete integration error:', error);
  }
}

/**
 * SQL Setup DDL for Supabase SQL Editor
 */
export function getTableSQLInstructions(): string {
  return `
-- Create shufu_users table
create table if not exists public.shufu_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'member',
  password text,
  face_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Optional, can be disabled or custom rules set)
alter table public.shufu_users enable row level security;

-- Create policy allowing public access for demo (or select, insert, update policies)
create policy "Allow public access" on public.shufu_users
  for all using (true) with check (true);
`;
}
