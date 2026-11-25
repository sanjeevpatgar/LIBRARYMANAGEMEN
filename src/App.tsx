import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, BookOpen, BookUp, CheckCircle2, Loader2, Plus,
  RotateCcw, Search, Trash2, Users,
} from 'lucide-react';
import { supabase, type Book, type LoanWithDetails, type Member } from '@/lib/supabase';

type Tab = 'books' | 'members' | 'loans';

interface Stats {
  titles: number;
  copiesAvailable: number;
  members: number;
  activeLoans: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [showBookForm, setShowBookForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [booksRes, membersRes, loansRes] = await Promise.all([
      supabase.from('books').select('*').order('title'),
      supabase.from('members').select('*').order('name'),
      supabase.from('loans')
        .select('*, book:books(title, author), member:members(name, email)')
        .order('borrowed_at', { ascending: false }),
    ]);
    if (booksRes.error || membersRes.error || loansRes.error) {
      setError('Could not load library data. Please try again.');
      setLoading(false);
      return;
    }
    setBooks((booksRes.data ?? []) as Book[]);
    setMembers((membersRes.data ?? []) as Member[]);
    setLoans((loansRes.data ?? []) as unknown as LoanWithDetails[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const { error: err } = await supabase.from('books').insert({
      title: String(data.get('title')).trim(),
      author: String(data.get('author')).trim(),
      isbn: String(data.get('isbn')).trim(),
      total_copies: Number(data.get('copies')) || 1,
      available_copies: Number(data.get('copies')) || 1,
    });
    if (err) {
      setError(err.message.includes('duplicate')
        ? 'A book with this ISBN already exists.'
        : 'Could not add the book. Please try again.');
      return;
    }
    form.reset();
    setShowBookForm(false);
    setNotice('Book added to the catalog.');
    loadAll();
  };

  const addMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const { error: err } = await supabase.from('members').insert({
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim().toLowerCase(),
    });
    if (err) {
      setError(err.message.includes('duplicate')
        ? 'A member with this email already exists.'
        : 'Could not add the member. Please try again.');
      return;
    }
    form.reset();
    setShowMemberForm(false);
    setNotice('Member registered.');
    loadAll();
  };

  const borrow = async (bookId: string) => {
    setError(null);
    const book = books.find((b) => b.id === bookId);
    if (!book || book.available_copies <= 0) return;
    if (members.length === 0) {
      setError('Register a member first to borrow books.');
      setTab('members');
      setShowMemberForm(true);
      return;
    }
    const memberId = members[0].id;
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const { error: err } = await supabase.from('loans').insert({
      book_id: bookId,
      member_id: memberId,
      due_at: due.toISOString(),
    });
    if (err) { setError('Could not create the loan. Please try again.'); return; }
    const { error: updErr } = await supabase.from('books')
      .update({ available_copies: book.available_copies - 1 })
      .eq('id', bookId);
    if (updErr) { setError('Could not update availability. Please try again.'); return; }
    setNotice(`"${book.title}" borrowed by ${members[0].name}. Due back in 14 days.`);
    loadAll();
  };

  const returnLoan = async (loan: LoanWithDetails) => {
    setError(null);
    const { error: err } = await supabase.from('loans')
      .update({ returned_at: new Date().toISOString() })
      .eq('id', loan.id);
    if (err) { setError('Could not return the book. Please try again.'); return; }
    const book = books.find((b) => b.id === loan.book_id);
    if (book && book.available_copies < book.total_copies) {
      await supabase.from('books')
        .update({ available_copies: book.available_copies + 1 })
        .eq('id', loan.book_id);
    }
    setNotice('Book returned. Thanks!');
    loadAll();
  };

  const deleteBook = async (book: Book) => {
    if (!window.confirm(`Remove "${book.title}" from the catalog?`)) return;
    const { error: err } = await supabase.from('books').delete().eq('id', book.id);
    if (err) { setError('Could not remove the book. Please try again.'); return; }
    setNotice('Book removed.');
    loadAll();
  };

  const deleteMember = async (member: Member) => {
    if (!window.confirm(`Remove member "${member.name}"? Their loans will be removed too.`)) return;
    const { error: err } = await supabase.from('members').delete().eq('id', member.id);
    if (err) { setError('Could not remove the member. Please try again.'); return; }
    setNotice('Member removed.');
    loadAll();
  };

  const stats: Stats = {
    titles: books.length,
    copiesAvailable: books.reduce((sum, b) => sum + b.available_copies, 0),
    members: members.length,
    activeLoans: loans.filter((l) => !l.returned_at).length,
  };

  const q = search.trim().toLowerCase();
  const filteredBooks = books.filter((b) =>
    !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q));
  const filteredMembers = members.filter((m) =>
    !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Lumen Library</h1>
            <p className="text-xs text-stone-500">Library Management System</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Titles" value={stats.titles} />
          <StatCard icon={<BookUp className="h-5 w-5" />} label="Copies available" value={stats.copiesAvailable} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Members" value={stats.members} />
          <StatCard icon={<RotateCcw className="h-5 w-5" />} label="Active loans" value={stats.activeLoans} />
        </section>

        <nav className="mt-8 flex gap-1 rounded-xl bg-stone-100 p-1">
          {([['books', 'Books', <BookOpen key="b" className="h-4 w-4" />],
             ['members', 'Members', <Users key="m" className="h-4 w-4" />],
             ['loans', 'Loans', <RotateCcw key="l" className="h-4 w-4" />]] as const).map(
            ([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id as Tab)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {icon}
                {label}
              </button>
            ),
          )}
        </nav>

        {notice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-16 flex items-center justify-center text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'books' && (
              <section className="mt-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, author, or ISBN"
                      className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <button
                    onClick={() => setShowBookForm((v) => !v)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Add book
                  </button>
                </div>

                {showBookForm && (
                  <form onSubmit={addBook} className="mb-4 grid gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 sm:grid-cols-2">
                    <input name="title" required placeholder="Title" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <input name="author" required placeholder="Author" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <input name="isbn" required placeholder="ISBN" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <input name="copies" type="number" min={1} defaultValue={1} placeholder="Copies" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">Save book</button>
                      <button type="button" onClick={() => setShowBookForm(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredBooks.length === 0 && (
                    <p className="col-span-full rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200/70">
                      No books found. Add your first book to get started.
                    </p>
                  )}
                  {filteredBooks.map((book) => (
                    <article key={book.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold tracking-tight">{book.title}</h3>
                          <p className="text-sm text-stone-500">{book.author}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          book.available_copies > 0
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                        }`}>
                          {book.available_copies > 0 ? `${book.available_copies} available` : 'All out'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">ISBN {book.isbn}</p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          onClick={() => borrow(book.id)}
                          disabled={book.available_copies <= 0}
                          className="flex-1 rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Borrow
                        </button>
                        <button
                          onClick={() => deleteBook(book)}
                          aria-label={`Remove ${book.title}`}
                          className="rounded-xl p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {tab === 'members' && (
              <section className="mt-6">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search members"
                      className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <button
                    onClick={() => setShowMemberForm((v) => !v)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Add member
                  </button>
                </div>

                {showMemberForm && (
                  <form onSubmit={addMember} className="mb-4 grid gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70 sm:grid-cols-2">
                    <input name="name" required placeholder="Full name" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <input name="email" type="email" required placeholder="Email" className="rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">Save member</button>
                      <button type="button" onClick={() => setShowMemberForm(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredMembers.length === 0 && (
                    <p className="col-span-full rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200/70">
                      No members yet. Register your first member.
                    </p>
                  )}
                  {filteredMembers.map((member) => {
                    const borrowedCount = loans.filter((l) => l.member_id === member.id && !l.returned_at).length;
                    return (
                      <article key={member.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-stone-500">{member.email}</p>
                            <p className="text-xs text-stone-400">{borrowedCount} book(s) borrowed</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMember(member)}
                          aria-label={`Remove ${member.name}`}
                          className="rounded-xl p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === 'loans' && (
              <section className="mt-6">
                <h2 className="mb-4 text-sm font-medium text-stone-500">All borrowing activity</h2>
                {loans.length === 0 ? (
                  <p className="rounded-2xl bg-white p-8 text-center text-sm text-stone-500 ring-1 ring-stone-200/70">
                    No loans yet. Borrow a book from the Books tab.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {loans.map((loan) => {
                      const overdue = !loan.returned_at && new Date(loan.due_at) < new Date();
                      return (
                        <li key={loan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
                          <div>
                            <h3 className="font-medium">{loan.book?.title ?? 'Unknown book'}</h3>
                            <p className="text-sm text-stone-500">
                              {loan.member?.name ?? 'Unknown member'} · borrowed {formatDate(loan.borrowed_at)}
                            </p>
                            <p className="text-xs text-stone-400">Due {formatDate(loan.due_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                              loan.returned_at
                                ? 'bg-stone-100 text-stone-600 ring-stone-200'
                                : overdue
                                  ? 'bg-red-50 text-red-700 ring-red-200'
                                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            }`}>
                              {loan.returned_at ? `Returned ${formatDate(loan.returned_at)}` : overdue ? 'Overdue' : 'Active'}
                            </span>
                            {!loan.returned_at && (
                              <button
                                onClick={() => returnLoan(loan)}
                                className="rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-stone-700 active:scale-[0.98]"
                              >
                                Return
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
