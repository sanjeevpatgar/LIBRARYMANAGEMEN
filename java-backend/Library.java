import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Library service demonstrating ENCAPSULATION at the system level:
 * - The internal collections (books, members, loans) are PRIVATE.
 * - Outsiders cannot add/remove from the lists directly; they must call
 *   the public methods, which enforce every business rule.
 */
public class Library {
    // Private internal state — the core of encapsulation
    private final List<Book> books = new ArrayList<>();
    private final List<Member> members = new ArrayList<>();
    private final List<Loan> loans = new ArrayList<>();

    // ---- Book management ----
    public void addBook(Book book) {
        findByIsbn(book.getIsbn()).ifPresent(existing -> {
            throw new IllegalArgumentException("ISBN already exists in catalog.");
        });
        books.add(book);
    }

    public Optional<Book> findByIsbn(String isbn) {
        return books.stream()
                .filter(b -> b.getIsbn().equals(isbn))
                .findFirst();
    }

    public List<Book> getAllBooks() {
        return new ArrayList<>(books); // defensive copy: callers can't mutate internals
    }

    // ---- Member management ----
    public void registerMember(Member member) {
        members.add(member);
    }

    public List<Member> getAllMembers() {
        return new ArrayList<>(members);
    }

    // ---- Lending workflow: rules live here, not in the caller ----
    public Loan checkoutBook(String isbn, Member member) {
        Book book = findByIsbn(isbn)
                .orElseThrow(() -> new IllegalArgumentException("Book not found: " + isbn));

        if (!member.canBorrow()) {
            throw new IllegalStateException("Member has reached the borrowing limit.");
        }
        if (!book.borrowCopy()) {
            throw new IllegalStateException("No copies of '" + book.getTitle() + "' available.");
        }

        member.registerBorrow();
        Loan loan = new Loan("LN-" + System.nanoTime(), book, member, LocalDate.now());
        loans.add(loan);
        return loan;
    }

    public boolean returnBook(Loan loan) {
        return loan.closeLoan(LocalDate.now());
    }

    public List<Loan> getActiveLoans() {
        List<Loan> active = new ArrayList<>();
        for (Loan loan : loans) {
            if (loan.isActive()) {
                active.add(loan);
            }
        }
        return active;
    }

    public List<Loan> getAllLoans() {
        return new ArrayList<>(loans);
    }
}
