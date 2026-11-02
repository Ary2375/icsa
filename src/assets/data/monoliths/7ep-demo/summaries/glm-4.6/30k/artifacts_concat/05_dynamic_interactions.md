
# User Registration Workflow
```mermaid
sequenceDiagram
    participant Client as Client (Browser)
    participant RegisterServlet as RegisterServlet
    participant RegistrationUtils as RegistrationUtils
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database
    participant Flyway as Flyway

    Client->>RegisterServlet: POST /register (username, password)
    
    RegisterServlet->>RegistrationUtils: validateUserInput(username, password)
    RegistrationUtils-->>RegisterServlet: validation result
    
    alt Password validation passes
        RegisterServlet->>RegistrationUtils: isPasswordGood(password)
        RegistrationUtils-->>RegisterServlet: PasswordResult(entropy, crackTime)
        
        alt Password strength acceptable
            RegisterServlet->>PersistenceLayer: checkUserExists(username)
            PersistenceLayer->>H2DB: SELECT * FROM USER WHERE name = ?
            H2DB-->>PersistenceLayer: user data
            PersistenceLayer-->>RegisterServlet: existence check result
            
            alt User does not exist
                RegisterServlet->>PersistenceLayer: createUser(username, hashedPassword)
                PersistenceLayer->>H2DB: INSERT INTO USER (name, password_hash) VALUES (?, ?)
                H2DB-->>PersistenceLayer: insertion result
                PersistenceLayer-->>RegisterServlet: success
                
                RegisterServlet-->>Client: 200 OK (RegistrationResult.SUCCESS)
            else User already exists
                RegisterServlet-->>Client: 400 Bad Request (RegistrationResult.USER_ALREADY_EXISTS)
            end
        else Password too weak
            RegisterServlet-->>Client: 400 Bad Request (RegistrationResult.WEAK_PASSWORD)
        end
    else Input validation fails
        RegisterServlet-->>Client: 400 Bad Request (RegistrationResult.INVALID_INPUT)
    end
```

## User Login Authentication Workflow
```mermaid
sequenceDiagram
    participant Client as Client (Browser)
    participant LoginServlet as LoginServlet
    participant LoginUtils as LoginUtils
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database
    participant LoginUtils as LoginUtils

    Client->>LoginServlet: POST /login (username, password)
    
    LoginServlet->>LoginUtils: areCredentialsValid(username, password)
    LoginUtils->>PersistenceLayer: getUserByUsername(username)
    PersistenceLayer->>H2DB: SELECT * FROM USER WHERE name = ?
    H2DB-->>PersistenceLayer: user record
    PersistenceLayer-->>LoginUtils: User object
    
    alt User found
        LoginUtils->>LoginUtils: verifyPassword(providedPassword, storedHash)
        alt Password matches
            LoginUtils-->>LoginServlet: true (authentication successful)
            LoginServlet-->>Client: 200 OK (Set auth cookie/session)
        else Password mismatch
            LoginUtils-->>LoginServlet: false
            LoginServlet-->>Client: 401 Unauthorized (Invalid credentials)
        end
    else User not found
        LoginUtils-->>LoginServlet: false
        LoginServlet-->>Client: 401 Unauthorized (Invalid credentials)
    end
```

## Book Lending Workflow
```mermaid
sequenceDiagram
    participant Client as Client (Browser/UI)
    participant LibraryLendServlet as LibraryLendServlet
    participant LibraryUtils as LibraryUtils
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database

    Client->>LibraryLendServlet: POST /lend (bookId, borrowerId)
    
    LibraryLendServlet->>LibraryUtils: validateLendingRequest(bookId, borrowerId)
    
    LibraryUtils->>PersistenceLayer: getBookById(bookId)
    PersistenceLayer->>H2DB: SELECT * FROM BOOK WHERE id = ?
    H2DB-->>PersistenceLayer: Book object
    PersistenceLayer-->>LibraryUtils: Book
    
    LibraryUtils->>PersistenceLayer: getBorrowerById(borrowerId)
    PersistenceLayer->>H2DB: SELECT * FROM BORROWER WHERE id = ?
    H2DB-->>PersistenceLayer: Borrower object
    PersistenceLayer-->>LibraryUtils: Borrower
    
    LibraryUtils->>PersistenceLayer: findActiveLoanForBook(bookId)
    PersistenceLayer->>H2DB: SELECT * FROM LOAN WHERE book = ? AND return_date IS NULL
    H2DB-->>PersistenceLayer: Loan list
    PersistenceLayer-->>LibraryUtils: active loans
    
    alt Book available and borrower exists
        LibraryUtils->>PersistenceLayer: createLoan(bookId, borrowerId, currentDate)
        PersistenceLayer->>H2DB: INSERT INTO LOAN (book, borrower, borrow_date) VALUES (?, ?, ?)
        H2DB-->>PersistenceLayer: loan created
        PersistenceLayer-->>LibraryUtils: Loan object
        LibraryUtils-->>LibraryLendServlet: SUCCESS
        
        LibraryLendServlet-->>Client: 200 OK (Loan created)
    else Book already loaned
        LibraryUtils-->>LibraryLendServlet: BOOK_ALREADY_LOANED
        LibraryLendServlet-->>Client: 409 Conflict (Book already loaned)
    else Book/Borrower not found
        LibraryUtils-->>LibraryLendServlet: ENTITY_NOT_FOUND
        LibraryLendServlet-->>Client: 404 Not Found
    end
```

## Database Migration Workflow (Application Startup)
```mermaid
sequenceDiagram
    participant Tomcat as Tomcat Server
    participant WebAppListener as WebAppListener
    participant Flyway as Flyway
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database

    Note over Tomcat,H2DB: Application Startup
    
    Tomcat->>WebAppListener: contextInitialized()
    
    WebAppListener->>PersistenceLayer: initializeDataSource()
    PersistenceLayer->>H2DB: Create connection pool
    H2DB-->>PersistenceLayer: Connection ready
    PersistenceLayer-->>WebAppListener: DataSource ready
    
    WebAppListener->>Flyway: configure(dataSource)
    Flyway-->>WebAppListener: Flyway instance
    
    WebAppListener->>Flyway: clean()
    Flyway->>H2DB: Drop all tables
    H2DB-->>Flyway: Schema cleared
    
    WebAppListener->>Flyway: migrate()
    Flyway->>H2DB: Check flyway_schema_history
    H2DB-->>Flyway: Migration history
    
    loop For each pending migration
        Flyway->>H2DB: Execute migration script (V1__, V2__, etc.)
        H2DB-->>Flyway: Migration applied
        Flyway->>H2DB: Update flyway_schema_history
        H2DB-->>Flyway: History updated
    end
    
    Flyway-->>WebAppListener: Migration complete
    WebAppListener-->>Tomcat: Application ready
    
    Note over Tomcat,H2DB: Application serving requests
```

## Mathematical Calculation Workflow
```mermaid
sequenceDiagram
    participant Client as Client
    participant MathServlet as MathServlet
    participant Calculator as Calculator
    participant Fibonacci as Fibonacci
    participant Ackermann as Ackermann

    Client->>MathServlet: POST /demo/math (item_a, item_b, operation)
    
    alt Basic arithmetic
        MathServlet->>Calculator: add(item_a, item_b)
        Calculator-->>MathServlet: result
        MathServlet-->>Client: 200 OK (result)
    else Fibonacci calculation
        MathServlet->>Fibonacci: calculate(n, algorithm_choice)
        
        alt Iterative algorithm
            Fibonacci->>Fibonacci: calculateIterative(n)
            Fibonacci-->>MathServlet: fibonacciResult
        else Recursive algorithm
            Fibonacci->>Fibonacci: calculateRecursive(n)
            Fibonacci-->>MathServlet: fibonacciResult
        end
        
        MathServlet-->>Client: 200 OK (fibonacciResult)
    else Ackermann function
        MathServlet->>Ackermann: calculate(m, n, algorithm_choice)
        
        alt Iterative algorithm
            Ackermann->>Ackermann: calculateIterative(m, n)
            Ackermann-->>MathServlet: ackermannResult
        else Recursive algorithm
            Ackermann->>Ackermann: calculateRecursive(m, n)
            Ackermann-->>MathServlet: ackermannResult
        end
        
        MathServlet-->>Client: 200 OK (ackermannResult)
    else Invalid operation
        MathServlet-->>Client: 400 Bad Request (Invalid operation)
    end
```

## Book Registration Workflow
```mermaid
sequenceDiagram
    participant Client as Client (Browser)
    participant LibraryRegisterBookServlet as LibraryRegisterBookServlet
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database
    participant LibraryUtils as LibraryUtils

    Client->>LibraryRegisterBookServlet: POST /registerbook (title)
    
    LibraryRegisterBookServlet->>LibraryUtils: validateBookTitle(title)
    LibraryUtils-->>LibraryRegisterBookServlet: validation result
    
    alt Title validation passes
        LibraryRegisterBookServlet->>PersistenceLayer: saveBook(title)
        PersistenceLayer->>H2DB: INSERT INTO BOOK (title) VALUES (?)
        H2DB-->>PersistenceLayer: Book created with ID
        PersistenceLayer-->>LibraryRegisterBookServlet: Book object
        
        LibraryRegisterBookServlet-->>Client: 201 Created (Book details with ID)
    else Title validation fails
        LibraryRegisterBookServlet-->>Client: 400 Bad Request (Invalid title)
    end
```

## Database Maintenance via HTTP API
```mermaid
sequenceDiagram
    participant Admin as Admin/User
    participant DbServlet as DbServlet
    participant Flyway as Flyway
    participant H2DB as H2 Database

    Admin->>DbServlet: GET /demo/flyway?action=clean
    
    DbServlet->>Flyway: clean()
    Flyway->>H2DB: DROP all objects
    H2DB-->>Flyway: Database cleaned
    
    Flyway-->>DbServlet: Clean complete
    DbServlet-->>Admin: 200 OK (Database cleaned)

    Admin->>DbServlet: GET /demo/flyway?action=migrate
    
    DbServlet->>Flyway: migrate()
    Flyway->>H2DB: Check migration history
    
    loop For each pending migration
        Flyway->>H2DB: Execute migration SQL
        H2DB-->>Flyway: Migration applied
    end
    
    Flyway-->>DbServlet: Migration complete
    DbServlet-->>Admin: 200 OK (Database migrated)
```

## Full Library Search and Lend Workflow
```mermaid
sequenceDiagram
    participant UI as Web UI (JS)
    participant Client as Browser
    participant LibraryBookListServlet as LibraryBookListServlet
    participant LibraryLendServlet as LibraryLendServlet
    participant LibraryUtils as LibraryUtils
    participant PersistenceLayer as PersistenceLayer
    participant H2DB as H2 Database

    UI->>Client: User searches for books
    Client->>LibraryBookListServlet: GET /book?search=query
    
    LibraryBookListServlet->>PersistenceLayer: searchBooks(query)
    PersistenceLayer->>H2DB: SELECT * FROM BOOK WHERE title LIKE ?
    H2DB-->>PersistenceLayer: Book list
    PersistenceLayer-->>LibraryBookListServlet: Book objects
    LibraryBookListServlet-->>Client: JSON book list
    Client-->>UI: Render book options
    
    UI->>Client: User selects book to lend
    Client->>LibraryLendServlet: POST /lend (bookId, borrowerId)
    
    LibraryLendServlet->>LibraryUtils: lendBook(bookId, borrowerId)
    
    LibraryUtils->>PersistenceLayer: getBookAvailability(bookId)
    PersistenceLayer->>H2DB: SELECT * FROM LOAN WHERE book = ? AND return_date IS NULL
    H2DB-->>PersistenceLayer: Active loans
    PersistenceLayer-->>LibraryUtils: Available status
    
    alt Book available
        LibraryUtils->>PersistenceLayer: createLoan(bookId, borrowerId)
        PersistenceLayer->>H2DB: INSERT INTO LOAN (book, borrower, borrow_date) VALUES (?, ?, CURRENT_DATE)
        H2DB-->>PersistenceLayer: Loan created
        PersistenceLayer-->>LibraryUtils: Success
        LibraryUtils-->>LibraryLendServlet: SUCCESS
        LibraryLendServlet-->>Client: 200 OK (Loan confirmed)
    else Book unavailable
        LibraryUtils-->>LibraryLendServlet: BOOK_ALREADY_LOANED
        LibraryLendServlet-->>Client: 409 Conflict
    end
    
    Client-->>UI: Update UI with lending result
```