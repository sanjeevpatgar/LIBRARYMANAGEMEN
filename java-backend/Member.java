/**
 * Member entity demonstrating ENCAPSULATION:
 * - Private fields with public accessors.
 * - Borrowing limits enforced inside the class, not by callers.
 */
public class Member {
    // Maximum books a member may have on loan — hidden constant
    private static final int MAX_BOOKS_ALLOWED = 5;

    // Private fields: data hiding
    private String id;
    private String name;
    private String email;
    private int booksCurrentlyBorrowed;

    public Member(String id, String name, String email) {
        this.id = id;
        setName(name);
        setEmail(email);
        this.booksCurrentlyBorrowed = 0;
    }

    // ---- Getters ----
    public String getId()      { return id; }
    public String getName()    { return name; }
    public String getEmail()   { return email; }
    public int getBooksCurrentlyBorrowed() { return booksCurrentlyBorrowed; }

    // ---- Setters with validation ----
    public void setName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Member name cannot be empty.");
        }
        this.name = name;
    }

    public void setEmail(String email) {
        if (email == null || !email.matches("^[\\w.+-]+@[\\w-]+\\.[\\w.]+$")) {
            throw new IllegalArgumentException("Invalid email address.");
        }
        this.email = email;
    }

    // ---- Encapsulated business rules ----

    /** Returns true when the member can borrow another book. */
    public boolean canBorrow() {
        return booksCurrentlyBorrowed < MAX_BOOKS_ALLOWED;
    }

    public void registerBorrow() {
        if (!canBorrow()) {
            throw new IllegalStateException(
                name + " has reached the limit of " + MAX_BOOKS_ALLOWED + " books.");
        }
        booksCurrentlyBorrowed++;
    }

    public void registerReturn() {
        if (booksCurrentlyBorrowed <= 0) {
            throw new IllegalStateException(name + " has no books to return.");
        }
        booksCurrentlyBorrowed--;
    }

    @Override
    public String toString() {
        return String.format("%s <%s> - %d book(s) borrowed", name, email, booksCurrentlyBorrowed);
    }
}
