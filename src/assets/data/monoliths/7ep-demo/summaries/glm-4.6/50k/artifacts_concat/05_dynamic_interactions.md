
## User Registration Workflow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant RegisterServlet
    participant RegistrationUtils
    participant IPersistenceLayer
    participant Database
    participant ResultJSP

    User->>Browser: Submits registration form
    Browser->>RegisterServlet: POST /register (username, password)
    
    activate RegisterServlet
    RegisterServlet->>RegistrationUtils: registerUser(username, password)
    
    activate RegistrationUtils
    RegistrationUtils->>RegistrationUtils: validatePasswordRequirements(password)
    alt Password validation fails
        RegistrationUtils-->>RegisterServlet: PasswordResult(ERROR, message)
        RegisterServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error response
        Browser->>User: Display validation error
    end
    
    RegistrationUtils->>IPersistenceLayer: checkUserExists(username)
    
    activate IPersistenceLayer
    IPersistenceLayer->>Database: SELECT * FROM USER WHERE name = ?
    Database-->>IPersistenceLayer: User record (or null)
    IPersistenceLayer-->>RegistrationUtils: Boolean result
    deactivate IPersistenceLayer
    
    alt User already exists
        RegistrationUtils-->>RegisterServlet: RegistrationResult(ERROR, "User exists")
        RegisterServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error response
    else User doesn't exist
        RegistrationUtils->>RegistrationUtils: calculatePasswordEntropy(password)
        RegistrationUtils->>IPersistenceLayer: saveUser(username, passwordHash)
        
        activate IPersistenceLayer
        IPersistenceLayer->>Database: INSERT INTO USER (name, password_hash) VALUES (?, ?)
        Database-->>IPersistenceLayer: Insert success
        IPersistenceLayer-->>RegistrationUtils: Success
        deactivate IPersistenceLayer
        
        RegistrationUtils-->>RegisterServlet: RegistrationResult(SUCCESS)
    end
    
    deactivate RegistrationUtils
    
    alt Registration successful
        RegisterServlet->>ResultJSP: Forward with success
        ResultJSP->>Browser: Render success page
        Browser->>User: Display confirmation
    end
    
    deactivate RegisterServlet
```

**Description:** The user registration workflow handles new user creation with password strength validation, duplicate checking, and secure password storage. The flow uses synchronous HTTP requests, validates input entropy requirements (12+ chars with complexity), checks for existing users in the database, and stores hashed passwords. Communication pattern: REST POST endpoint → Business validation → Database transaction → JSP response.

---

## User Authentication Workflow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant LoginServlet
    participant LoginUtils
    participant IPersistenceLayer
    participant Database
    participant ResultJSP

    User->>Browser: Submits login form
    Browser->>LoginServlet: POST /login (username, password)
    
    activate LoginServlet
    LoginServlet->>LoginUtils: authenticateUser(username, password)
    
    activate LoginUtils
    LoginUtils->>IPersistenceLayer: findUser(username)
    
    activate IPersistenceLayer
    IPersistenceLayer->>Database: SELECT id, name, password_hash FROM USER WHERE name = ?
    Database-->>IPersistenceLayer: User record
    IPersistenceLayer-->>LoginUtils: User object
    deactivate IPersistenceLayer
    
    alt User not found
        LoginUtils-->>LoginServlet: AuthenticationResult(ERROR, "User not found")
        LoginServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error page
        Browser->>User: Display login error
    else User found
        LoginUtils->>LoginUtils: verifyPassword(inputPassword, storedHash)
        alt Password mismatch
            LoginUtils-->>LoginServlet: AuthenticationResult(ERROR, "Invalid credentials")
            LoginServlet->>ResultJSP: Forward with error
            ResultJSP->>Browser: Render error page
            Browser->>User: Display login error
        else Password valid
            LoginUtils->>LoginServlet: AuthenticationResult(SUCCESS)
            LoginServlet->>LoginServlet: createSession(user)
            LoginServlet->>ResultJSP: Forward to dashboard
            ResultJSP->>Browser: Render authenticated page
            Browser->>User: Display logged-in interface
        end
    end
    
    deactivate LoginUtils
    deactivate LoginServlet
```

**Description:** Authentication workflow validates user credentials against stored hashes. Uses synchronous HTTP POST for login, retrieves user by username from database, verifies password hashes, creates HTTP session on success, and redirects to appropriate view. Communication pattern: REST POST → Database query → Password verification → Session management → JSP redirect.

---

## Book Lending Workflow

```mermaid
sequenceDiagram
    participant Librarian
    participant Browser
    participant LibraryLendServlet
    participant LibraryUtils
    participant IPersistenceLayer
    participant Database
    participant ResultJSP

    Librarian->>Browser: Enters lending details
    Browser->>LibraryLendServlet: POST /lendbook (bookTitle, borrowerName, date)
    
    activate LibraryLendServlet
    LibraryLendServlet->>LibraryUtils: lendBook(bookTitle, borrowerName, date)
    
    activate LibraryUtils
    LibraryUtils->>IPersistenceLayer: findBookByTitle(bookTitle)
    
    activate IPersistenceLayer
    IPersistenceLayer->>Database: SELECT * FROM BOOK WHERE title = ?
    Database-->>IPersistenceLayer: Book record
    IPersistenceLayer-->>LibraryUtils: Book object
    deactivate IPersistenceLayer
    
    alt Book not found
        LibraryUtils-->>LibraryLendServlet: LibraryActionResults(ERROR, "Book not found")
        LibraryLendServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error page
        Browser->>Librarian: Display error message
    end
    
    LibraryUtils->>IPersistenceLayer: findBorrowerByName(borrowerName)
    
    activate IPersistenceLayer
    IPersistenceLayer->>Database: SELECT * FROM BORROWER WHERE name = ?
    Database-->>IPersistenceLayer: Borrower record
    IPersistenceLayer-->>LibraryUtils: Borrower object
    deactivate IPersistenceLayer
    
    alt Borrower not found
        LibraryUtils-->>LibraryLendServlet: LibraryActionResults(ERROR, "Borrower not found")
        LibraryLendServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error page
        Browser->>Librarian: Display error message
    end
    
    LibraryUtils->>IPersistenceLayer: searchForLoanByBook(bookId)
    
    activate IPersistenceLayer
    IPersistenceLayer->>Database: SELECT * FROM LOAN WHERE book = ?
    Database-->>IPersistenceLayer: Loan records
    IPersistenceLayer-->>LibraryUtils: List<Loan>
    deactivate IPersistenceLayer
    
    alt Book already lent
        LibraryUtils-->>LibraryLendServlet: LibraryActionResults(ERROR, "Book already checked out")
        LibraryLendServlet->>ResultJSP: Forward with error
        ResultJSP->>Browser: Render error page
        Browser->>Librarian: Display error message
    else Book available
        LibraryUtils->>IPersistenceLayer: createLoan(bookId, borrowerId, date)
        
        activate IPersistenceLayer
        IPersistenceLayer->>Database: BEGIN TRANSACTION
        IPersistenceLayer->>Database: INSERT INTO LOAN (book, borrower, borrow_date) VALUES (?, ?, ?)
        Database-->>IPersistenceLayer: Insert success
        IPersistenceLayer->>Database: COMMIT
        IPersistenceLayer-->>LibraryUtils: Loan object
        deactivate IPersistenceLayer
        
        LibraryUtils-->>LibraryLendServlet: LibraryActionResults(SUCCESS, "Book lent successfully")
        LibraryLendServlet->>ResultJSP: Forward with success
        ResultJSP->>Browser: Render confirmation page
        Browser->>Librarian: Display lending confirmation
    end
    
    deactivate LibraryUtils
    deactivate LibraryLendServlet
```

**Description:** The book lending workflow handles the checkout process with validation for book/borrower existence and availability. Uses synchronous HTTP POST, performs multiple database queries to validate entities, checks current loans to prevent duplicate lending, creates loan records within transactions, and provides detailed status feedback. Communication pattern: REST POST → Multiple DB queries → Transaction → JSP response.

---

## Fibonacci Computation Workflow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant FibServlet
    participant Fibonacci
    participant Calculator
    participant ResultJSP

    User->>Browser: Submits Fibonacci request
    Browser->>FibServlet: POST /fib (fib_param_n, algorithm)
    
    activate FibServlet
    FibServlet->>FibServlet: validateInput(fib_param_n)
    
    alt Invalid input
        FibServlet->>ResultJSP: Forward with error (non-positive integer)
        ResultJSP->>Browser: Render error page
        Browser->>User: Display validation error
    else Valid input
        alt algorithm = "recursive"
            FibServlet->>Fibonacci: recursiveFibonacci(n)
            activate Fibonacci
            Fibonacci->>Fibonacci: recursive calls
            Fibonacci-->>FibServlet: Long/BigInteger result
            deactivate Fibonacci
        else algorithm = "iterative"
            FibServlet->>Fibonacci: iterativeFibonacci(n)
            activate Fibonacci
            Fibonacci->>Calculator: performCalculations()
            Fibonacci-->>FibServlet: Long/BigInteger result
            deactivate Fibonacci
        end
        
        FibServlet->>ResultJSP: Forward with result
        ResultJSP->>Browser: Render result page
        Browser->>User: Display Fibonacci sequence value
    end
    
    deactivate FibServlet
```

**Description:** Stateless mathematical computation workflow that calculates Fibonacci sequences using either recursive or iterative algorithms. Validates integer input bounds (32-bit limits), delegates to appropriate algorithm implementation, uses BigInteger for large results, and renders results via JSP. Communication pattern: REST POST → Input validation → Algorithm execution → Direct response (no DB).

---

## Database Migration Workflow

```mermaid
sequenceDiagram
    participant Admin
    participant Browser
    participant DbServlet
    participant Flyway
    participant IPersistenceLayer
    participant Database

    Admin->>Browser: Requests migration
    Browser->>DbServlet: GET /flyway?action=migrate
    
    activate DbServlet
    DbServlet->>DbServlet: validateAction("migrate")
    
    alt Invalid action
        DbServlet->>Browser: Return error response
    else Valid action
        DbServlet->>Flyway: configure()
        activate Flyway
        Flyway->>IPersistenceLayer: getDataSource()
        
        activate IPersistenceLayer
        IPersistenceLayer-->>Flyway: DataSource
        deactivate IPersistenceLayer
        
        Flyway->>Flyway: loadMigrations()
        Note over Flyway: Loads V1__Create_person_table.sql<br/>V2__Rest_of_tables_for_auth_and_library.sql
        
        Flyway->>Database: BEGIN MIGRATION
        loop For each pending migration
            Flyway->>Database: Execute migration SQL
            Database-->>Flyway: Migration result
            Flyway->>Database: Update schema history
        end
        Flyway->>Database: COMMIT MIGRATION
        Flyway-->>DbServlet: MigrationReport
        deactivate Flyway
        
        DbServlet->>Browser: Return migration status
    end
    
    deactivate DbServlet
```

**Description:** Database migration workflow managed by Flyway for schema versioning. Triggered via HTTP GET with action parameter, validates migration state, applies pending SQL scripts in order, updates schema history table, and provides migration feedback. Communication pattern: HTTP GET → Flyway orchestration → Sequential SQL execution → Status response. Error handling includes transaction rollback on failure.

---

## Book Search Workflow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant LibraryBookListServlet
    participant LibraryUtils
    participant IPersistenceLayer
    participant Database
    participant ResultJSP

    User->>Browser: Searches for books
    Browser->>LibraryBookListServlet: GET /book?search=<term>
    
    activate LibraryBookListServlet
    LibraryBookListServlet->>LibraryUtils: searchBooks(searchTerm)
    
    activate LibraryUtils
    alt Search term is numeric ID
        LibraryUtils->>IPersistenceLayer: findBookById(id)
        
        activate IPersistenceLayer
        IPersistenceLayer->>Database: SELECT * FROM BOOK WHERE id = ?
        Database-->>IPersistenceLayer: Book record
        IPersistenceLayer-->>LibraryUtils: Book object
        deactivate IPersistenceLayer
        
    else Search term is text
        LibraryUtils->>IPersistenceLayer: findBooksByTitle(titlePattern)
        
        activate IPersistenceLayer
        IPersistenceLayer->>Database: SELECT * FROM BOOK WHERE title LIKE ?
        Database-->>IPersistenceLayer: List<Book>
        IPersistenceLayer-->>LibraryUtils: Book list
        deactivate IPersistenceLayer
    else No search term (list all)
        LibraryUtils->>IPersistenceLayer: getAllBooks()
        
        activate IPersistenceLayer
        IPersistenceLayer->>Database: SELECT * FROM BOOK
        Database-->>IPersistenceLayer: List<Book>
        IPersistenceLayer-->>LibraryUtils: Book list
        deactivate IPersistenceLayer
    end
    
    LibraryUtils-->>LibraryBookListServlet: SearchResult<Book>
    deactivate LibraryUtils
    
    alt JSON request detected
        LibraryBookListServlet->>ResultJSP: Forward to restfulresult.jsp
    else Regular request
        LibraryBookListServlet->>ResultJSP: Forward to result.jsp
    end
    
    ResultJSP->>Browser: Render book list (HTML or JSON)
    Browser->>User: Display search results
    
    deactivate LibraryBookListServlet
```

**Description:** Book search workflow supporting ID lookup, title search, and full listing with dual response formats. Handles different search patterns (exact ID, title contains, all books), uses parameterized SQL queries, detects request type for HTML/JSON responses via different JSPs, and returns structured book data. Communication pattern: HTTP GET → Conditional DB queries → Flexible rendering.