```markdown
# Dynamic Interaction Flows and Sequence Diagrams

## Workflow 1: User Registration

### Description
**Purpose**: Register a new user with password validation and duplicate checking
**Triggers**: HTTP POST request to `/register` endpoint with username and password
**Communication Patterns**: Synchronous HTTP, database transactions, password entropy analysis

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant RegisterServlet as RegisterServlet
    participant RegUtils as RegistrationUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database
    participant Auth as Password Validator

    Client->>RegisterServlet: POST /register (username, password)
    RegisterServlet->>RegUtils: processRegistration(username, password)
    
    RegUtils->>Persistence: isUserInDatabase(username)
    Persistence->>DB: SELECT FROM USERS WHERE username=?
    DB-->>Persistence: User exists? (true/false)
    
    alt User Already Exists
        Persistence-->>RegUtils: User exists
        RegUtils-->>RegisterServlet: RegistrationResult(ALREADY_REGISTERED)
        RegisterServlet-->>Client: Registration failed - user exists
    else New User
        RegUtils->>Auth: validatePassword(password)
        Auth-->>RegUtils: PasswordResult(entropy, strength)
        
        alt Weak Password
            RegUtils-->>RegisterServlet: RegistrationResult(BAD_PASSWORD)
            RegisterServlet-->>Client: Registration failed - weak password
        else Valid Password
            RegUtils->>Persistence: createUser(username, password_hash)
            Persistence->>DB: INSERT INTO USERS VALUES(?, SHA256(?))
            DB-->>Persistence: User created
            Persistence-->>RegUtils: User created successfully
            RegUtils-->>RegisterServlet: RegistrationResult(SUCCESSFULLY_REGISTERED)
            RegisterServlet-->>Client: Registration successful
        end
    end
```

## Workflow 2: Book Lending Process

### Description
**Purpose**: Lend a book to a registered borrower with availability validation
**Triggers**: HTTP POST request to `/lend` endpoint with book_id and borrower_id
**Communication Patterns**: Synchronous HTTP, database transactions, business rule validation

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant LendServlet as LibraryLendServlet
    participant LibUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    Client->>LendServlet: POST /lend (book_id, borrower_id)
    LendServlet->>LibUtils: lendBook(book_id, borrower_id)
    
    LibUtils->>Persistence: searchBooksById(book_id)
    Persistence->>DB: SELECT FROM BOOKS WHERE id=?
    DB-->>Persistence: Book record
    Persistence-->>LibUtils: Book object
    
    LibUtils->>Persistence: searchBorrowerDataById(borrower_id)
    Persistence->>DB: SELECT FROM BORROWERS WHERE id=?
    DB-->>Persistence: Borrower record
    Persistence-->>LibUtils: Borrower object
    
    alt Book Not Found
        LibUtils-->>LendServlet: LibraryActionResults(BOOK_NOT_REGISTERED)
        LendServlet-->>Client: Error - book not registered
    else Borrower Not Found
        LibUtils-->>LendServlet: LibraryActionResults(BORROWER_NOT_REGISTERED)
        LendServlet-->>Client: Error - borrower not registered
    else Both Found
        LibUtils->>Persistence: isBookAvailable(book_id)
        Persistence->>DB: SELECT FROM LOANS WHERE book_id=? AND return_date IS NULL
        DB-->>Persistence: Active loan exists? (true/false)
        Persistence-->>LibUtils: Availability status
        
        alt Book Checked Out
            LibUtils-->>LendServlet: LibraryActionResults(BOOK_CHECKED_OUT)
            LendServlet-->>Client: Error - book already lent
        else Book Available
            LibUtils->>Persistence: createLoan(book, borrower, current_date)
            Persistence->>DB: INSERT INTO LOANS VALUES(?, ?, ?, CURRENT_DATE)
            DB-->>Persistence: Loan created
            Persistence-->>LibUtils: Loan created successfully
            LibUtils-->>LendServlet: LibraryActionResults(SUCCESS)
            LendServlet-->>Client: Book successfully lent
        end
    end
```

## Workflow 3: Fibonacci Calculation with Algorithm Selection

### Description
**Purpose**: Calculate Fibonacci sequence using multiple algorithm implementations
**Triggers**: HTTP POST request to `/fibonacci` with parameter n and algorithm choice
**Communication Patterns**: Synchronous HTTP, computational algorithms, input validation

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant FibServlet as FibServlet
    participant Calculator as Fibonacci Calculator
    participant Iterative as FibonacciIterative
    participant Recursive as Fibonacci

    Client->>FibServlet: POST /fibonacci (fib_param_n, fib_algorithm_choice)
    FibServlet->>FibServlet: validateInput(fib_param_n)
    
    alt Invalid Input
        FibServlet-->>Client: Error - invalid input
    else Valid Input
        alt Algorithm Choice = "ITERATIVE_1"
            FibServlet->>Iterative: fibAlgo1(fib_param_n)
            Iterative->>Iterative: Calculate using O(log(n)) matrix method
            Iterative-->>FibServlet: BigInteger result
        else Algorithm Choice = "ITERATIVE_2"
            FibServlet->>Iterative: fibAlgo2(fib_param_n)
            Iterative->>Iterative: Calculate using linear iteration
            Iterative-->>FibServlet: BigInteger result
        else Default (Recursive)
            FibServlet->>Recursive: calculate(fib_param_n)
            Recursive->>Recursive: Recursive calculation with memoization
            Recursive-->>FibServlet: BigInteger result
        end
        
        FibServlet->>FibServlet: formatResult(result)
        FibServlet-->>Client: Fibonacci result
    end
```

## Workflow 4: Book Search and Availability Listing

### Description
**Purpose**: Search for books and list available books with filtering options
**Triggers**: HTTP GET requests to `/book`, `/borrower`, and `/listavailable` endpoints
**Communication Patterns**: Synchronous HTTP, database queries, JSON response formatting

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant SearchServlet as LibraryBookListSearchServlet
    participant AvailableServlet as LibraryBookListAvailableServlet
    participant LibUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    Client->>SearchServlet: GET /book?search_type=title&search_term=abc
    SearchServlet->>LibUtils: searchForBookByTitle("abc")
    LibUtils->>Persistence: searchBooksByTitle("abc")
    Persistence->>DB: SELECT FROM BOOKS WHERE title LIKE '%abc%'
    DB-->>Persistence: Book records
    Persistence-->>LibUtils: List<Book>
    LibUtils-->>SearchServlet: List<Book> (JSON formatted)
    SearchServlet-->>Client: JSON response with books
    
    Note over Client,DB: Available Books Workflow
    Client->>AvailableServlet: GET /listavailable
    AvailableServlet->>LibUtils: listAvailableBooks()
    LibUtils->>Persistence: listAllAvailableBooks()
    Persistence->>DB: SELECT b.* FROM BOOKS b LEFT JOIN LOANS l ON b.id=l.book_id WHERE l.id IS NULL
    DB-->>Persistence: Available book records
    Persistence-->>LibUtils: List<Book>
    LibUtils-->>AvailableServlet: List<Book> (JSON formatted)
    AvailableServlet-->>Client: JSON response with available books
```

## Workflow 5: Error Handling and Recovery Patterns

### Description
**Purpose**: Handle various error scenarios including database failures, validation errors, and business rule violations
**Triggers**: Exception conditions during normal workflow execution
**Communication Patterns**: Exception propagation, error response formatting, database rollback

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant Servlet as Any Servlet
    participant Business as Business Logic (Utils)
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    Client->>Servlet: HTTP Request
    Servlet->>Business: processRequest(parameters)
    Business->>Persistence: databaseOperation()
    Persistence->>DB: SQL Operation
    
    alt Database Connection Failure
        DB-->>Persistence: SQLException/Connection timeout
        Persistence-->>Business: PersistenceException
        Business-->>Servlet: BusinessLogicException
        Servlet->>Servlet: logError(exception)
        Servlet-->>Client: HTTP 500 - Service Unavailable
    else Validation Error
        Business->>Business: validateInput(parameters)
        Business-->>Servlet: ValidationException
        Servlet->>Servlet: formatErrorResponse(message)
        Servlet-->>Client: HTTP 400 - Bad Request
    else Business Rule Violation
        Business->>Business: checkBusinessRules()
        Business-->>Servlet: BusinessRuleException
        Servlet->>Servlet: formatErrorResponse(message)
        Servlet-->>Client: HTTP 422 - Unprocessable Entity
    else Success Case
        DB-->>Persistence: Success
        Persistence-->>Business: Success Result
        Business-->>Servlet: Success Response
        Servlet-->>Client: HTTP 200 - Success
    end
```

## Workflow 6: Desktop Application Automation

### Description
**Purpose**: Automate desktop insurance application through socket-based command protocol
**Triggers**: Socket connection on port 8000 with text commands
**Communication Patterns**: Socket communication, synchronous command/response, UI automation

```mermaid
sequenceDiagram
    participant Client as Automation Client
    participant Server as AutoInsuranceScriptServer
    participant Processor as AutoInsuranceProcessor
    participant UI as AutoInsuranceUI

    Client->>Server: Socket connect (port 8000)
    Server-->>Client: Connection established
    
    loop Command Processing
        Client->>Server: "set age 25"
        Server->>Processor: setAge(25)
        Processor->>UI: Update age field in Swing UI
        UI-->>Processor: Field updated
        Processor-->>Server: Age set successfully
        Server-->>Client: "OK"
        
        Client->>Server: "set claims 1"
        Server->>Processor: setClaims(1)
        Processor->>UI: Update claims field
        UI-->>Processor: Field updated
        Processor-->>Server: Claims set successfully
        Server-->>Client: "OK"
        
        Client->>Server: "click calculate"
        Server->>Processor: clickCalculate()
        Processor->>UI: Trigger calculate button
        UI->>Processor: Calculate premium based on business rules
        Processor->>Processor: applyInsuranceRules(age, claims)
        alt Young driver with 1 claim
            Processor-->>Server: AutoInsuranceAction(100, LTR1, false, false)
        else Other scenarios
            Processor-->>Server: AutoInsuranceAction(premium, warning, cancelled, surcharged)
        end
        Server-->>Client: "Premium: 100, Warning: LTR1, Cancelled: false, Surcharged: false"
    end
    
    Client->>Server: "quit"
    Server->>Server: Cleanup resources
    Server-->>Client: Connection closed
```

## Workflow 7: Database Migration and Maintenance

### Description
**Purpose**: Manage database schema migrations and maintenance operations
**Triggers**: HTTP GET request to `/flyway` endpoint with operation parameter
**Communication Patterns**: Synchronous HTTP, Flyway migration tool, database DDL operations

```mermaid
sequenceDiagram
    participant Client as Web Client/Admin
    participant DbServlet as DbServlet
    participant Flyway as Flyway Migration
    participant DB as H2 Database

    Client->>DbServlet: GET /flyway?operation=migrate
    DbServlet->>Flyway: migrate()
    Flyway->>DB: Check migration history (ADMINISTRATIVE table)
    DB-->>Flyway: Current schema version
    
    alt Migration Needed
        Flyway->>DB: Execute V1__Create_person_table.sql
        DB-->>Flyway: Table created
        Flyway->>DB: Execute V2__Add_auth_library_tables.sql
        DB-->>Flyway: Tables created
        Flyway->>DB: Update migration history
        DB-->>Flyway: History updated
        Flyway-->>DbServlet: Migration successful
        DbServlet-->>Client: Database migrated to latest version
    else Already Current
        Flyway-->>DbServlet: Already at latest version
        DbServlet-->>Client: Database already current
    end
    
    Note over Client,DB: Clean Operation
    Client->>DbServlet: GET /flyway?operation=clean
    DbServlet->>Flyway: clean()
    Flyway->>DB: Drop all tables (USERS, BOOKS, BORROWERS, LOANS)
    DB-->>Flyway: Tables dropped
    Flyway-->>DbServlet: Clean successful
    DbServlet-->>Client: Database cleaned
```