import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Loan entity demonstrating ENCAPSULATION:
 * - Dates and status are private and immutable after creation.
 * - Fine calculation logic is owned by the class.
 */
public class Loan {
    // Standard loan period in days — hidden constant
    private static final int LOAN_PERIOD_DAYS = 14;
    private static final double FINE_PER_DAY = 0.50;

    // Private fields
    private final String id;
    private final Book book;      // composition: Loan HAS-A Book
    private final Member member;  // composition: Loan HAS-A Member
    private final LocalDate borrowedAt;
    private final LocalDate dueAt;
    private LocalDate returnedAt; // null while the loan is active

    public Loan(String id, Book book, Member member, LocalDate borrowedAt) {
        this.id = id;
        this.book = book;
        this.member = member;
        this.borrowedAt = borrowedAt;
        this.dueAt = borrowedAt.plusDays(LOAN_PERIOD_DAYS);
        this.returnedAt = null;
    }

    // ---- Getters (no setters for immutable fields) ----
    public String getId()        { return id; }
    public Book getBook()        { return book; }
    public Member getMember()    { return member; }
    public LocalDate getBorrowedAt() { return borrowedAt; }
    public LocalDate getDueAt()      { return dueAt; }
    public LocalDate getReturnedAt() { return returnedAt; }

    /** Derived state: computed from private fields, not stored. */
    public boolean isActive() {
        return returnedAt == null;
    }

    public boolean isOverdue() {
        return isActive() && LocalDate.now().isAfter(dueAt);
    }

    /**
     * Closes the loan. Coordinates with encapsulated Book and Member
     * objects so every invariant stays consistent.
     */
    public boolean closeLoan(LocalDate returnDate) {
        if (!isActive()) {
            return false;
        }
        this.returnedAt = returnDate;
        this.book.returnCopy();
        this.member.registerReturn();
        return true;
    }

    /** Fine owed, in currency units, computed inside the class. */
    public double calculateFine() {
        if (isActive()) {
            return isOverdue()
                    ? ChronoUnit.DAYS.between(dueAt, LocalDate.now()) * FINE_PER_DAY
                    : 0.0;
        }
        long lateDays = ChronoUnit.DAYS.between(dueAt, returnedAt);
        return Math.max(0, lateDays) * FINE_PER_DAY;
    }

    @Override
    public String toString() {
        String status = isActive() ? (isOverdue() ? "OVERDUE" : "ACTIVE") : "RETURNED";
        return String.format("Loan %s: '%s' -> %s [%s, fine: %.2f]",
                id, book.getTitle(), member.getName(), status, calculateFine());
    }
}
