/**
 * Book entity demonstrating ENCAPSULATION:
 * - All fields are private (data hiding).
 * - Access is only through public getters/setters with validation.
 */
public class Book {
    // Private fields: cannot be accessed directly from outside this class
    private String isbn;
    private String title;
    private String author;
    private int totalCopies;
    private int availableCopies;

    public Book(String isbn, String title, String author, int totalCopies) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        if (totalCopies < 1) {
            throw new IllegalArgumentException("A book must have at least 1 copy.");
        }
        this.totalCopies = totalCopies;
        this.availableCopies = totalCopies;
    }

    // ---- Getters: read-only access to private state ----
    public String getIsbn()          { return isbn; }
    public String getTitle()         { return title; }
    public String getAuthor()        { return author; }
    public int getTotalCopies()      { return totalCopies; }
    public int getAvailableCopies()  { return availableCopies; }

    // ---- Setters with validation: controlled mutation of private state ----
    public void setTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title cannot be empty.");
        }
        this.title = title;
    }

    public void setAuthor(String author) {
        if (author == null || author.isBlank()) {
            throw new IllegalArgumentException("Author cannot be empty.");
        }
        this.author = author;
    }

    // ---- Business rules enforced INSIDE the object (the point of encapsulation) ----

    /**
     * Decrements available copies. Returns false if no copy is free,
     * so invalid state can never be reached from outside.
     */
    public boolean borrowCopy() {
        if (availableCopies <= 0) {
            return false;
        }
        availableCopies--;
        return true;
    }

    /**
     * Increments available copies, never exceeding total copies.
     */
    public void returnCopy() {
        if (availableCopies < totalCopies) {
            availableCopies++;
        }
    }

    public void addCopies(int count) {
        if (count < 0) {
            throw new IllegalArgumentException("Cannot add a negative number of copies.");
        }
        totalCopies += count;
        availableCopies += count;
    }

    @Override
    public String toString() {
        return String.format("'%s' by %s [ISBN: %s] - %d/%d available",
                title, author, isbn, availableCopies, totalCopies);
    }
}
