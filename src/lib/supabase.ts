import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

export interface Loan {
  id: string;
  book_id: string;
  member_id: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
}

export interface LoanWithDetails extends Loan {
  book: { title: string; author: string };
  member: { name: string; email: string };
}
