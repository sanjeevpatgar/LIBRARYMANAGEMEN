import java.time.LocalDate;

/**
 * Demo showing how encapsulation keeps the library system consistent:
 * callers never touch internal state directly — they go through methods
 * that enforce the rules.
 */
public class Main {
    public static void main(String[] args) {
        Library library = new Library();

        // Add books (validated inside Book)
        Book cleanCode = new Book("978-0132350884", "Clean Code", "Robert C. Martin", 2);
        Book dune = new Book("978-0441013593", "Dune", "Frank Herbert", 1);
        library.addBook(cleanCode);
        library.addBook(dune);

        // Register members (validated inside Member)
        Member alice = new Member("M-001", "Alice Johnson", "alice@example.com");
        Member bob = new Member("M-002", "Bob Smith", "bob@example.com");
        library.registerMember(alice);
        library.registerMember(bob);

        // Checkout: rules enforced by Library + Book + Member together
        Loan loan1 = library.checkoutBook("978-0132350884", alice);
        System.out.println("Checked out: " + loan1);

        Loan loan2 = library.checkoutBook("978-0441013593", bob);
        System.out.println("Checked out: " + loan2);

        // Attempting to borrow the last copy of Dune again fails safely
        try {
            library.checkoutBook("978-0441013593", alice);
        } catch (IllegalStateException e) {
            System.out.println("Blocked: " + e.getMessage());
        }

        // Return a book: copies and counters update inside the objects
        library.returnBook(loan2);
        System.out.println("Returned: " + loan2);

        // Final state
        System.out.println("\nCatalog:");
        library.getAllBooks().forEach(System.out::println);

        System.out.println("\nActive loans:");
        library.getActiveLoans().forEach(System.out::println);
    }
}
