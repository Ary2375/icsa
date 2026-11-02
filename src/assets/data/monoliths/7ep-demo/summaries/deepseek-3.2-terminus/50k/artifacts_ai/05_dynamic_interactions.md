```markdown
# Dynamic Interaction Flows for Demo Application

## 1. User Registration Workflow

### Purpose & Triggers
New user registration through the registration form. Validates password strength, checks for existing users, and creates new user account.

### Communication Patterns
- Synchronous HTTP POST request
- Database transactions for user validation and creation
- Password entropy calculation service

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant RegisterServlet as RegisterServlet
    participant RegUtils as RegistrationUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    User->>RegisterServlet: POST /demo/register (username, password)
    RegisterServlet->>RegUtils: processRegistration(username, password)
    
    RegUtils->>RegUtils: validatePasswordStrength(password)
    RegUtils->>Persistence: isUserInDatabase(username)
    Persistence->>DB: SELECT FROM AUTH.USER WHERE name=?
    DB-->>Persistence: User record (if exists)
    Persistence-->>RegUtils: boolean exists
    
    alt User already exists
        RegUtils-->>RegisterServlet: RegistrationResult(ALREADY_REGISTERED)
    else Password validation failed
        RegUtils-->>RegisterServlet: RegistrationResult(BAD_PASSWORD)
    else Valid registration
        RegUtils->>Persistence: createUser(username, password_hash)
        Persistence->>DB: INSERT INTO AUTH.USER (name, password_hash)
        DB-->>Persistence: User ID
        Persistence-->>RegUtils: User object
        RegUtils-->>RegisterServlet: RegistrationResult(SUCCESSFULLY_REGISTERED)
    end
    
    RegisterServlet->>RegisterServlet: forward to RESULT_JSP
    RegisterServlet-->>User: Registration status page
```

## 2. User Authentication Workflow

### Purpose & Triggers
User login process validating credentials against stored user data.

### Communication Patterns
- Synchronous HTTP POST request
- Database query for credential validation
- SHA-256 password hash comparison

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant LoginServlet as LoginServlet
    participant LoginUtils as LoginUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    User->>LoginServlet: POST /demo/login (username, password)
    LoginServlet->>LoginUtils: isUserRegistered(username, password)
    
    LoginUtils->>Persistence: areCredentialsValid(username, password)
    Persistence->>DB: SELECT password_hash FROM AUTH.USER WHERE name=?
    DB-->>Persistence: stored_password_hash
    Persistence->>Persistence: hash(input_password) == stored_password_hash
    Persistence-->>LoginUtils: boolean isValid
    
    alt Valid credentials
        LoginUtils-->>LoginServlet: "access granted"
    else Invalid credentials
        LoginUtils-->>LoginServlet: "access denied"
    else Missing username/password
        LoginUtils-->>LoginServlet: "no username/password provided"
    end
    
    LoginServlet->>LoginServlet: forward to RESULT_JSP
    LoginServlet-->>User: Authentication result page
```

## 3. Book Lending Workflow

### Purpose & Triggers
Complete book lending process including availability checks, borrower validation, and loan creation.

### Communication Patterns
- Synchronous HTTP POST request
- Multiple database transactions
- Business logic validation for availability

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant LendServlet as LibraryLendServlet
    participant LibUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    User->>LendServlet: POST /demo/lend (book_title, borrower_name)
    LendServlet->>LibUtils: lendBook(book_title, borrower_name)
    
    LibUtils->>Persistence: searchForBookByTitle(book_title)
    Persistence->>DB: SELECT FROM LIBRARY.BOOK WHERE title=?
    DB-->>Persistence: Book record
    Persistence-->>LibUtils: Book object
    
    LibUtils->>Persistence: searchForBorrowerByName(borrower_name)
    Persistence->>DB: SELECT FROM LIBRARY.BORROWER WHERE name=?
    DB-->>Persistence: Borrower record
    Persistence-->>LibUtils: Borrower object
    
    alt Book not found
        LibUtils-->>LendServlet: LibraryActionResults(BOOK_NOT_REGISTERED)
    else Borrower not found
        LibUtils-->>LendServlet: LibraryActionResults(BORROWER_NOT_REGISTERED)
    else Book already checked out
        LibUtils->>Persistence: isBookAvailable(book)
        Persistence->>DB: SELECT FROM LIBRARY.LOAN WHERE book_id=? AND return_date IS NULL
        DB-->>Persistence: Active loan record
        Persistence-->>LibUtils: boolean available
        LibUtils-->>LendServlet: LibraryActionResults(BOOK_CHECKED_OUT)
    else Valid lending
        LibUtils->>Persistence: createLoan(book, borrower, current_date)
        Persistence->>DB: INSERT INTO LIBRARY.LOAN (book_id, borrower_id, checkout_date)
        DB-->>Persistence: Loan ID
        Persistence-->>LibUtils: Loan object
        LibUtils-->>LendServlet: LibraryActionResults(SUCCESS)
    end
    
    LendServlet->>LendServlet: forward to RESULT_JSP
    LendServlet-->>User: Lending result page
```

## 4. Fibonacci Calculation Workflow

### Purpose & Triggers
Mathematical computation of Fibonacci sequence with algorithm selection.

### Communication Patterns
- Synchronous HTTP POST request
- Stateless computation (no database interaction)
- Algorithm selection and execution

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant FibServlet as FibServlet
    participant Fibonacci as Fibonacci Class
    participant FibIterative as FibonacciIterative

    User->>FibServlet: POST /demo/fibonacci (fib_param_n, fib_algorithm_choice)
    FibServlet->>FibServlet: validateInput(n)
    
    alt Invalid input (n < 0)
        FibServlet-->>User: Error response
    else Recursive algorithm selected
        FibServlet->>Fibonacci: calculate(n)
        Fibonacci->>Fibonacci: recursive calculation
        Fibonacci-->>FibServlet: BigInteger result
    else Iterative algorithm 1 selected
        FibServlet->>FibIterative: fibAlgo1(n)
        FibIterative->>FibIterative: iterative calculation (O(log n))
        FibIterative-->>FibServlet: BigInteger result
    else Iterative algorithm 2 selected
        FibServlet->>FibIterative: fibAlgo2(n)
        FibIterative->>FibIterative: iterative calculation (linear)
        FibIterative-->>FibServlet: BigInteger result
    end
    
    FibServlet->>FibServlet: forward to RESULT_JSP
    FibServlet-->>User: Fibonacci result page
```

## 5. Book Search and Availability Workflow

### Purpose & Triggers
Search for books by title and check availability status.

### Communication Patterns
- Synchronous HTTP GET request
- Database queries with JOIN operations
- JSON response formatting

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant SearchServlet as LibraryBookListSearchServlet
    participant LibUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    User->>SearchServlet: GET /demo/book?title=search_term
    SearchServlet->>LibUtils: searchForBookByTitle(search_term)
    
    LibUtils->>Persistence: searchBooksByTitle(search_term)
    Persistence->>DB: SELECT b.* FROM LIBRARY.BOOK b WHERE b.title LIKE ?
    DB-->>Persistence: List<Book> books
    
    loop For each book
        LibUtils->>Persistence: isBookAvailable(book)
        Persistence->>DB: SELECT COUNT(*) FROM LIBRARY.LOAN l WHERE l.book_id=? AND l.return_date IS NULL
        DB-->>Persistence: availability status
        Persistence-->>LibUtils: boolean available
    end
    
    LibUtils-->>SearchServlet: List<Book> with availability
    SearchServlet->>SearchServlet: formatAsJSON(books)
    SearchServlet-->>User: JSON response with book details and availability
```

## 6. Auto Insurance Premium Calculation Workflow

### Purpose & Triggers
Desktop application insurance premium calculation via socket communication.

### Communication Patterns
- Socket-based TCP communication
- Text-based command/response protocol
- Business rule evaluation

### Sequence Diagram
```mermaid
sequenceDiagram
    participant DesktopUI as AutoInsuranceUI
    participant SocketServer as AutoInsuranceScriptServer
    participant Processor as AutoInsuranceProcessor

    DesktopUI->>SocketServer: connect(port 8000)
    DesktopUI->>SocketServer: "set age 25"
    SocketServer->>Processor: setAge(25)
    Processor-->>SocketServer: "OK"
    SocketServer-->>DesktopUI: "OK"
    
    DesktopUI->>SocketServer: "set claims 1"
    SocketServer->>Processor: setClaims(1)
    Processor-->>SocketServer: "OK"
    SocketServer-->>DesktopUI: "OK"
    
    DesktopUI->>SocketServer: "click calculate"
    SocketServer->>Processor: calculatePremium()
    Processor->>Processor: evaluate business rules
    Note over Processor: if (age 16-25 and claims==1)<br/>then premium=100, warning=LTR1
    Processor-->>SocketServer: AutoInsuranceAction(premium, warning)
    SocketServer-->>DesktopUI: "premium:100, warning:LTR1"
    
    DesktopUI->>SocketServer: "quit"
    SocketServer->>SocketServer: close connection
```

## 7. Database Migration Workflow

### Purpose & Triggers
Database schema updates and cleanup operations via Flyway migrations.

### Communication Patterns
- Synchronous HTTP GET request
- Flyway migration execution
- Database schema modifications

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant DbServlet as DbServlet
    participant Persistence as PersistenceLayer
    participant Flyway as Flyway
    participant DB as H2 Database

    Admin->>DbServlet: GET /demo/flyway?action=migrate
    DbServlet->>Persistence: migrateDatabase()
    
    Persistence->>Flyway: configure()
    Flyway->>Flyway: scan migration scripts
    Flyway->>DB: SELECT FROM ADMINISTRATIVE.flyway_schema_history
    DB-->>Flyway: migration history
    
    Flyway->>DB: Execute V1__Create_person_table.sql
    DB-->>Flyway: Success
    Flyway->>DB: Execute V2__Add_auth_library_tables.sql
    DB-->>Flyway: Success
    Flyway->>DB: UPDATE ADMINISTRATIVE.flyway_schema_history
    DB-->>Flyway: Success
    
    Flyway-->>Persistence: MigrationResult
    Persistence-->>DbServlet: Migration status
    DbServlet->>DbServlet: forward to RESULT_JSP
    DbServlet-->>Admin: Migration completion status
```

## 8. Error Handling and Recovery Pattern

### Purpose & Triggers
System-wide error handling for database failures and validation errors.

### Communication Patterns
- Exception propagation
- Transaction rollback
- Graceful degradation

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web Client
    participant Servlet as Any Servlet
    participant Business as Business Logic
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    User->>Servlet: HTTP Request
    Servlet->>Business: processRequest(data)
    Business->>Persistence: databaseOperation(data)
    Persistence->>DB: SQL Operation
    DB--x Persistence: DatabaseException (connection lost)
    
    Persistence--x Business: PersistenceException
    Business--x Servlet: BusinessLogicException
    
    alt Database connection failure
        Servlet->>Servlet: attemptReconnection()
        Servlet->>Persistence: cleanDatabase()
        Persistence->>DB: Reconnect and clean
        DB-->>Persistence: Success
        Persistence-->>Servlet: Recovery successful
        Servlet->>Servlet: retryOperation()
    else Validation error
        Servlet->>Servlet: formatErrorResponse(validation_message)
        Servlet-->>User: Error page with details
    else Unrecoverable error
        Servlet->>Servlet: logError(exception)
        Servlet-->>User: Generic error page
    end
```

## 9. Event-Driven Book Availability Notification

### Purpose & Triggers
Hypothetical event-driven extension for notifying when checked-out books become available.

### Communication Patterns
- Asynchronous event publication
- Database trigger simulation
- Event consumer processing

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Returning User
    participant ReturnServlet as BookReturnServlet
    participant LibUtils as LibraryUtils
    participant EventBus as Event Bus
    participant Notifier as NotificationService
    participant WaitList as Waiting List Service

    User->>ReturnServlet: POST /return (book_id)
    ReturnServlet->>LibUtils: returnBook(book_id)
    LibUtils->>Persistence: updateLoanReturnDate(book_id)
    
    LibUtils->>EventBus: publish BookReturnedEvent(book_id)
    
    EventBus->>WaitList: notify BookReturnedEvent
    WaitList->>WaitList: getUsersWaitingForBook(book_id)
    WaitList->>Notifier: sendNotifications(waiting_users, book_id)
    
    EventBus->>LibUtils: notify BookReturnedEvent
    LibUtils->>Persistence: updateBookAvailability(book_id, true)
    
    ReturnServlet-->>User: Return confirmation
    Notifier-->>WaitList Users: "Book [title] is now available"
```

## Communication Pattern Summary

| Workflow | Primary Pattern | Data Flow | Error Handling |
|----------|-----------------|-----------|----------------|
| User Registration | Synchronous HTTP + DB Transaction | Client → Servlet → Business → DB | Validation errors, duplicate user |
| Authentication | Synchronous HTTP + Credential Validation | Client → Servlet → Auth Logic → DB | Invalid credentials, missing data |
| Book Lending | Synchronous HTTP + Multi-Table Transaction | Client → Servlet → Library Logic → DB | Availability checks, validation |
| Fibonacci Calc | Stateless Computation | Client → Servlet → Algorithm | Input validation, overflow |
| Book Search | Query + Response | Client → Servlet → DB → JSON | Empty results, DB errors |
| Insurance Calc | Socket Protocol | Desktop → Socket Server → Business | Protocol errors, invalid data |
| DB Migration | Administrative Operation | Admin → Servlet → Flyway → DB | Migration failures, rollback |
| Error Recovery | Exception Propagation | All layers → Error handler | Reconnection, graceful degradation |
```