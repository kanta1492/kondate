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

// Helper to validate if URL is a valid HTTP or HTTPS URL
const isValidURL = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Check if Supabase keys are provided and valid
const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  isValidURL(supabaseUrl) &&
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseUrl !== 'your-supabase-url' &&
  !supabaseAnonKey.includes('your-anon-public-key') &&
  supabaseAnonKey !== 'your-anon-key'
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
 * Saves/Upserts fine-grained user data structures (fridge items, shopping lists, meal plans, etc.) in Supabase
 */
export async function syncUserStatesToDb(
  userId: string,
  states: {
    fridge_items?: any[];
    shopping_items?: any[];
    planned_meals?: any[];
    notifications?: any[];
    user_item_history?: any[];
    recipes?: any[];
  }
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    const payload: any = { user_id: userId, updated_at: new Date().toISOString() };
    if (states.fridge_items !== undefined) payload.fridge_items = states.fridge_items;
    if (states.shopping_items !== undefined) payload.shopping_items = states.shopping_items;
    if (states.planned_meals !== undefined) payload.planned_meals = states.planned_meals;
    if (states.notifications !== undefined) payload.notifications = states.notifications;
    if (states.user_item_history !== undefined) payload.user_item_history = states.user_item_history;
    if (states.recipes !== undefined) payload.recipes = states.recipes;

    const { error } = await client
      .from('shufu_user_states')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.shufu_user_states" does not exist')) {
        console.warn('Supabase "shufu_user_states" table does not exist yet. Please run SQL setup:\n\n' + getTableSQLInstructions());
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Supabase write states integration error:', error);
  }
}

/**
 * Retrieve a specific user's synced states (fridge, shopping, plan, history) from Supabase
 */
export async function getUserStatesFromDb(userId: string): Promise<any> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('shufu_user_states')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.message.includes('relation "public.shufu_user_states" does not exist')) {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Supabase select states integration error:', error);
    return null;
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
 * Removes a user document from Supabase and cascade deletes their state row
 */
export async function deleteUserFromDb(userId: string): Promise<void> {
  const client = getSupabase();
  if (!client) {
    console.warn("Supabase is not fully configured yet. Action ignored.");
    return;
  }

  try {
    // Delete state first (clean cascade helper in case there is no DB-level foreign cascade setup)
    await client.from('shufu_user_states').delete().eq('user_id', userId);

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
 * Transfers/Migrates user profile and states to a new User ID in Supabase DB safely
 */
export async function migrateUserIdInDb(oldUserId: string, newUser: UserType): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    // 1. Get complete current user states from the old ID
    const oldStates = await getUserStatesFromDb(oldUserId);

    // 2. Insert/Upsert the new user record (lower-cased ID matches user registry standard)
    const newId = newUser.id.trim().toLowerCase();
    const { error: userError } = await client
      .from('shufu_users')
      .upsert({
        id: newId,
        name: newUser.name || '',
        email: newUser.email || '',
        role: newUser.role || 'member',
        password: newUser.password || '',
        face_photo: newUser.facePhoto || ''
      }, { onConflict: 'id' });

    if (userError) {
      throw userError;
    }

    // 3. Replicate states to the new user state record if they exist
    if (oldStates) {
      const { error: stateError } = await client
        .from('shufu_user_states')
        .upsert({
          user_id: newId,
          fridge_items: oldStates.fridge_items || [],
          shopping_items: oldStates.shopping_items || [],
          planned_meals: oldStates.planned_meals || [],
          notifications: oldStates.notifications || [],
          user_item_history: oldStates.user_item_history || [],
          recipes: oldStates.recipes || [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (stateError) {
        console.error('Failed to replicate user states during migration:', stateError);
      }
    }

    // 4. Safely clean up the old user and states records to avoid duplicated entries
    if (oldUserId.toLowerCase() !== newId) {
      await client.from('shufu_user_states').delete().eq('user_id', oldUserId);
      await client.from('shufu_users').delete().eq('id', oldUserId);
    }
  } catch (error) {
    console.error('Supabase user ID replication/migration error:', error);
    throw error;
  }
}

/**
 * SQL Setup DDL for Supabase SQL Editor
 */
export function getTableSQLInstructions(): string {
  return `
-- 1. Create shufu_users table
create table if not exists public.shufu_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'member',
  password text,
  face_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for shufu_users
alter table public.shufu_users enable row level security;

-- Create policy allowing public access for demo
create policy "Allow public access for shufu_users" on public.shufu_users
  for all using (true) with check (true);

-- 2. Create shufu_user_states table
create table if not exists public.shufu_user_states (
  user_id text primary key references public.shufu_users(id) on delete cascade,
  fridge_items jsonb default '[]'::jsonb,
  shopping_items jsonb default '[]'::jsonb,
  planned_meals jsonb default '[]'::jsonb,
  notifications jsonb default '[]'::jsonb,
  user_item_history jsonb default '[]'::jsonb,
  recipes jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for shufu_user_states
alter table public.shufu_user_states enable row level security;

-- Create policy allowing public access
create policy "Allow public access for shufu_user_states" on public.shufu_user_states
  for all using (true) with check (true);
`;
}
