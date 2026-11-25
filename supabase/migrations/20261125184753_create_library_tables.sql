/*
# Library Management System tables

1. New Tables
- `books`: catalog of books
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `author` (text, not null)
  - `isbn` (text, unique, not null)
  - `total_copies` (integer, not null, default 1)
  - `available_copies` (integer, not null, default 1)
  - `created_at` (timestamp)
- `members`: library members
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, unique, not null)
  - `joined_at` (timestamp)
- `loans`: borrow records linking books and members
  - `id` (uuid, primary key)
  - `book_id` (uuid, foreign key to books, on delete cascade)
  - `member_id` (uuid, foreign key to members, on delete cascade)
  - `borrowed_at` (timestamp, default now)
  - `due_at` (timestamp, not null)
  - `returned_at` (timestamp, null while the loan is active)
2. Security
- Single-tenant app with no sign-in, so RLS is enabled and all policies
  target `anon` and `authenticated` with USING/WITH CHECK (true) because
  the data is intentionally shared/public.
- Grants for SELECT, INSERT, UPDATE, DELETE to anon + authenticated on all
  three tables so the Data API can reach them.
3. Notes
- Availability is tracked via `available_copies` on books: borrowing
  decrements it, returning increments it. The app keeps it in sync.
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE NOT NULL,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  borrowed_at timestamptz DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON books, members, loans TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_books" ON books;
CREATE POLICY "public_select_books" ON books FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_books" ON books;
CREATE POLICY "public_insert_books" ON books FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_books" ON books;
CREATE POLICY "public_update_books" ON books FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_books" ON books;
CREATE POLICY "public_delete_books" ON books FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_members" ON members;
CREATE POLICY "public_select_members" ON members FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_members" ON members;
CREATE POLICY "public_insert_members" ON members FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_members" ON members;
CREATE POLICY "public_update_members" ON members FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_members" ON members;
CREATE POLICY "public_delete_members" ON members FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_loans" ON loans;
CREATE POLICY "public_select_loans" ON loans FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_loans" ON loans;
CREATE POLICY "public_insert_loans" ON loans FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_loans" ON loans;
CREATE POLICY "public_update_loans" ON loans FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_loans" ON loans;
CREATE POLICY "public_delete_loans" ON loans FOR DELETE
TO anon, authenticated USING (true);