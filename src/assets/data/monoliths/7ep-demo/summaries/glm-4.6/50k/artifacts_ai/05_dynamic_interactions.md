
## 1. User Registration Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant RegisterServlet
    participant RegistrationUtils
    participant PasswordValidator as Nbvcxz Library
    participant LoginUtils
    participant PersistenceLayer as IPersistenceLayer
    participant Database

    Browser->>RegisterServlet: POST /register<br/>(username, password)
    RegisterServlet->>RegistrationUtils: registerUser(username, password)
    
    RegistrationUtils->>PasswordValidator: estimate(password)
    PasswordValidator-->>RegistrationUtils: PasswordResult<br/>(entropy, timeToCrack)
    
    RegistrationUtils->>RegistrationUtils: validatePasswordPolicy()
    alt Password too weak
        RegistrationUtils-->>RegisterServlet: RegistrationResult.FAILURE
        RegisterServlet-->>Browser: Error response with validation details
    else Password valid
        RegistrationUtils->>RegistrationUtils: hashPassword(password)
        RegistrationUtils->>LoginUtils: userExists(username)
        LoginUtils->>PersistenceLayer: runSql("SELECT id FROM user WHERE username = ?")
        PersistenceLayer->>Database: Execute query
        Database-->>PersistenceLayer: ResultSet
        PersistenceLayer-->>LoginUtils: Optional<User>
        LoginUtils-->>RegistrationUtils: boolean exists
        
        alt Username already exists
            RegistrationUtils-->>RegisterServlet: RegistrationResult.DUPLICATE_USERNAME
            RegisterServlet-->>Browser: Error response
        else Username available
            RegistrationUtils->>PersistenceLayer: runSql("INSERT INTO user (username, password_hash) VALUES (?, ?)")
            PersistenceLayer->>Database: Execute insert
            Database-->>PersistenceLayer: Success
            PersistenceLayer-->>RegistrationUtils: Generated User ID
            RegistrationUtils-->>RegisterServlet: RegistrationResult.SUCCESS
            RegisterServlet-->>Browser: Success response
        end
    end
```

**Purpose**: New user account creation with secure password validation and duplicate prevention.  
**Triggers**: User submits registration form with username and password.  
**Communication Patterns**: Synchronous REST POST, database transactions, password hashing, validation via third-party library.

---

## 2. User Authentication Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant LoginServlet
    participant LoginUtils
    participant PersistenceLayer as IPersistenceLayer
    participant Database
    participant SessionManager as ServletContext

    Browser->>LoginServlet: POST /login<br/>(username, password)
    LoginServlet->>LoginUtils: authenticate(username, password)
    
    LoginUtils->>LoginUtils: validateInput(username, password)
    alt Invalid input
        LoginUtils-->>LoginServlet: false
        LoginServlet-->>Browser: "access denied" (invalid input)
    else Valid input
        LoginUtils->>PersistenceLayer: runSql("SELECT id, password_hash FROM user WHERE username = ?")
        PersistenceLayer->>Database: Execute query
        Database-->>PersistenceLayer: User record
        PersistenceLayer-->>LoginUtils: Optional<User>
        
        alt User not found
            LoginUtils-->>LoginServlet: false
            LoginServlet-->>Browser: "access denied" (user not found)
        else User found
            LoginUtils->>LoginUtils: verifyPassword(providedPassword, storedHash)
            alt Password mismatch
                LoginUtils-->>LoginServlet: false
                LoginServlet-->>Browser: "access denied" (invalid credentials)
            else Password matches
                LoginUtils->>SessionManager: createSession(user)
                SessionManager-->>LoginUtils: sessionId
                LoginUtils-->>LoginServlet: true
                LoginServlet-->>Browser: "access granted" with session cookie
            end
        end
    end
```

**Purpose**: User identity verification and session establishment.  
**Triggers**: User submits login credentials.  
**Communication Patterns**: Synchronous REST POST, database query, session management, password verification.

---

## 3. Book Registration Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant LibraryRegisterBookServlet
    participant LibraryUtils
    participant PersistenceLayer as IPersistenceLayer
    participant Database

    Browser->>LibraryRegisterBookServlet: POST /registerbook<br/>(title)
    LibraryRegisterBookServlet->>LibraryUtils: registerBook(title)
    
    LibraryUtils->>LibraryUtils: validateBookTitle(title)
    alt Invalid title
        LibraryUtils-->>LibraryRegisterBookServlet: LibraryActionResults.INVALID_INPUT
        LibraryRegisterBookServlet-->>Browser: Error response
    else Valid title
        LibraryUtils->>LibraryUtils: sanitizeTitle(title)
        LibraryUtils->>PersistenceLayer: runSql("INSERT INTO book (title, created_at) VALUES (?, CURRENT_TIMESTAMP)")
        PersistenceLayer->>Database: Execute insert with prepared statement
        Database-->>PersistenceLayer: Generated book ID
        PersistenceLayer-->>LibraryUtils: Success with bookId
        LibraryUtils->>LibraryUtils: createBookObject(bookId, title)
        LibraryUtils-->>LibraryRegisterBookServlet: LibraryActionResults.SUCCESS
        LibraryRegisterBookServlet-->>Browser: Success response with book details
    end
```

**Purpose**: Adding new books to the library catalog.  
**Triggers**: Librarian submits book registration form.  
**Communication Patterns**: Synchronous REST POST, database transaction, input validation and sanitization.

---

## 4. Book Lending Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant LibraryLendServlet
    participant LibraryUtils
    participant PersistenceLayer as IPersistenceLayer
    participant Database

    Browser->>LibraryLendServlet: POST /lend<br/>(bookId, borrowerId, checkoutDate)
    LibraryLendServlet->>LibraryUtils: lendBook(bookId, borrowerId, checkoutDate)
    
    LibraryUtils->>LibraryUtils: validateLendingParameters()
    alt Invalid parameters
        LibraryUtils-->>LibraryLendServlet: LibraryActionResults.INVALID_INPUT
        LibraryLendServlet-->>Browser: Error response
    else Valid parameters
        LibraryUtils->>PersistenceLayer: runSql("SELECT id FROM loan WHERE book = ? AND return_date IS NULL")
        PersistenceLayer->>Database: Check if book is already loaned
        Database-->>PersistenceLayer: ResultSet
        PersistenceLayer-->>LibraryUtils: Optional<Loan>
        
        alt Book already loaned
            LibraryUtils-->>LibraryLendServlet: LibraryActionResults.BOOK_NOT_AVAILABLE
            LibraryLendServlet-->>Browser: Error: Book already loaned
        else Book available
            LibraryUtils->>PersistenceLayer: runSql("INSERT INTO loan (book, borrower, checkout_date) VALUES (?, ?, ?)")
            PersistenceLayer->>Database: Execute loan creation
            Database-->>PersistenceLayer: Generated loan ID
            PersistenceLayer-->>LibraryUtils: Success with loanId
            
            LibraryUtils->>LibraryUtils: updateBookAvailability(bookId, false)
            LibraryUtils->>PersistenceLayer: runSql("UPDATE book SET available = false WHERE id = ?")
            PersistenceLayer->>Database: Update book status
            Database-->>PersistenceLayer: Success
            
            LibraryUtils-->>LibraryLendServlet: LibraryActionResults.SUCCESS
            LibraryLendServlet-->>Browser: Success response with loan details
        end
    end
```

**Purpose**: Processing book checkout with availability verification and loan tracking.  
**Triggers**: Librarian processes book checkout for a borrower.  
**Communication Patterns**: Synchronous REST POST, multiple database transactions, consistency checks.

---

## 5. Fibonacci Calculation Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant FibServlet
    participant Fibonacci as Fibonacci Algorithm
    participant FibonacciIterative as Iterative Implementation
    participant CheckUtils

    Browser->>FibServlet: POST /fibonacci<br/>(n, algorithm)
    FibServlet->>CheckUtils: checkIntInput(n)
    alt Invalid input
        CheckUtils-->>FibServlet: IllegalArgumentException
        FibServlet-->>Browser: Error response with validation message
    else Valid input
        FibServlet->>FibServlet: parseAlgorithmType(algorithm)
        
        alt Recursive algorithm
            FibServlet->>Fibonacci: calculateRecursive(n)
            activate Fibonacci
            Fibonacci->>Fibonacci: fibonacci(n-1) + fibonacci(n-2)
            note right of Fibonacci: Recursive calls until base case
            Fibonacci-->>FibServlet: BigInteger result
            deactivate Fibonacci
        else Iterative algorithm
            FibServlet->>FibonacciIterative: calculateIterative(n)
            activate FibonacciIterative
            note right of FibonacciIterative: Loop from 0 to n
            FibonacciIterative-->>FibServlet: BigInteger result
            deactivate FibonacciIterative
        end
        
        FibServlet->>FibServlet: validateResultBounds()
        FibServlet-->>Browser: JSON response with result
    end
```

**Purpose**: Computing Fibonacci sequence using user-selected algorithm.  
**Triggers**: User requests Fibonacci calculation with parameters.  
**Communication Patterns**: Synchronous REST POST, algorithm selection, input validation, big integer arithmetic.

---

## 6. Database Migration and Persistence Workflow

```mermaid
sequenceDiagram
    participant WebAppListener
    participant Flyway
    participant PersistenceLayer as IPersistenceLayer
    participant SqlData
    participant Database
    participant DbServlet
    participant Browser

    %% Startup Migration
    WebAppListener->>Flyway: configure(databaseUrl)
    WebAppListener->>Flyway: migrate()
    Flyway->>Database: Check migration history
    Database-->>Flyway: Current version
    alt New migrations available
        Flyway->>Database: Execute V1__Create_person_table.sql
        Flyway->>Database: Execute V2__Rest_of_tables_for_auth_and_library.sql
        Database-->>Flyway: Migration success
    end
    Flyway-->>WebAppListener: Migration complete
    
    %% Runtime Database Operation
    Browser->>DbServlet: GET /flyway?action=backup
    DbServlet->>PersistenceLayer: backupDatabase()
    PersistenceLayer->>SqlData: runScript("BACKUP TO...")
    SqlData->>Database: Execute backup command
    Database-->>SqlData: Backup file created
    SqlData-->>PersistenceLayer: Backup success
    PersistenceLayer-->>DbServlet: Backup result
    DbServlet-->>Browser: Backup status
    
    %% Example CRUD Operation
    note over PersistenceLayer, Database: Example: User registration
    PersistenceLayer->>SqlData: runSql("INSERT INTO user (username, password_hash) VALUES (?, ?)")
    SqlData->>SqlData: createParameterObject(username, passwordHash)
    SqlData->>Database: Execute prepared statement
    Database-->>SqlData: Generated keys
    SqlData-->>PersistenceLayer: Execution result with ID
```

**Purpose**: Database schema management, migration execution, and persistence operations.  
**Triggers**: Application startup (migrations), admin operations (backup/restore), CRUD operations.  
**Communication Patterns**: Database transactions, schema migrations, prepared statements, connection management.

---

## 7. Book Search and Catalog Browsing Workflow

```mermaid
sequenceDiagram
    participant Browser
    participant LibraryBookListSearchServlet
    participant LibraryUtils
    participant PersistenceLayer as IPersistenceLayer
    participant Database

    Browser->>LibraryBookListSearchServlet: GET /book?id={id}&title={title}
    LibraryBookListSearchServlet->>LibraryUtils: searchBooks(id, title)
    
    alt Search by ID
        LibraryUtils->>PersistenceLayer: runSql("SELECT * FROM book WHERE id = ?")
        PersistenceLayer->>Database: Execute query with ID
        Database-->>PersistenceLayer: Book record
        PersistenceLayer-->>LibraryUtils: Optional<Book>
        LibraryUtils-->>LibraryBookListSearchServlet: Single book result
    else Search by title (contains)
        LibraryUtils->>PersistenceLayer: runSql("SELECT * FROM book WHERE title LIKE ?")
        PersistenceLayer->>Database: Execute query with LIKE pattern
        Database-->>PersistenceLayer: List<Book>
        PersistenceLayer-->>LibraryUtils: Paginated results
        LibraryUtils-->>LibraryBookListSearchServlet: Book list
    else List all books
        LibraryUtils->>PersistenceLayer: runSql("SELECT * FROM book ORDER BY title LIMIT ? OFFSET ?")
        PersistenceLayer->>Database: Execute paginated query
        Database-->>PersistenceLayer: List<Book>
        PersistenceLayer-->>LibraryUtils: Paginated results
        LibraryUtils-->>LibraryBookListSearchServlet: Book list
    end
    
    LibraryBookListSearchServlet->>LibraryBookListSearchServlet: formatResults(JSON/HTML)
    LibraryBookListSearchServlet-->>Browser: Search results
```

**Purpose**: Searching and browsing the library catalog with multiple search criteria.  
**Triggers**: User performs book search or browses catalog.  
**Communication Patterns**: Synchronous REST GET, database queries with pagination, flexible search criteria.

---

## 8. Error Handling and Recovery Workflow

```mermaid
sequenceDiagram
    participant Client
    participant Servlet as AnyServlet
    participant ErrorHandler
    participant PersistenceLayer as IPersistenceLayer
    participant Database
    participant Logger as SLF4J

    Client->>Servlet: HTTP Request
    Servlet->>Servlet: validateInput()
    alt Input validation error
        Servlet->>ErrorHandler: handleValidationError(exception)
        ErrorHandler->>Logger: logError("Validation failed", exception)
        ErrorHandler-->>Servlet: ErrorResponse(400)
        Servlet-->>Client: 400 Bad Request with details
    else Valid input
        Servlet->>PersistenceLayer: runSql(operation)
        PersistenceLayer->>Database: Execute query
        
        alt Database constraint violation
            Database-->>PersistenceLayer: SQLException
            PersistenceLayer->>ErrorHandler: handleDatabaseError(exception)
            ErrorHandler->>Logger: logError("Database constraint violated", exception)
            ErrorHandler-->>PersistenceLayer: ErrorResponse
            PersistenceLayer-->>Servlet: DatabaseException
            Servlet->>ErrorHandler: handleDatabaseException(exception)
            ErrorHandler-->>Servlet: ErrorResponse(409)
            Servlet-->>Client: 409 Conflict with explanation
        else Database connection error
            Database-->>PersistenceLayer: ConnectionException
            PersistenceLayer->>ErrorHandler: handleConnectionError(exception)
            ErrorHandler->>Logger: logError("Database connection failed", exception)
            ErrorHandler->>PersistenceLayer: Retry(3 attempts)
            
            alt Retry successful
                PersistenceLayer->>Database: Re-execute query
                Database-->>PersistenceLayer: Success
                PersistenceLayer-->>Servlet: Success result
                Servlet-->>Client: 200 OK
            else Retry failed
                ErrorHandler-->>PersistenceLayer: Give up
                PersistenceLayer-->>Servlet: DatabaseException
                Servlet->>ErrorHandler: handleCriticalError(exception)
                ErrorHandler-->>Servlet: ErrorResponse(503)
                Servlet-->>Client: 503 Service Unavailable
            end
        else Successful operation
            Database-->>PersistenceLayer: Success
            PersistenceLayer-->>Servlet: Result
            Servlet-->>Client: 200 OK with response
        end
    end
```

**Purpose**: Centralized error handling with logging, retry mechanisms, and appropriate HTTP status codes.  
**Triggers**: Any system error or exception during request processing.  
**Communication Patterns**: Exception handling, retry logic, error logging, user-friendly error responses.