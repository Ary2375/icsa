
# User Authentication Workflows

## User Registration Workflow

```mermaid
sequenceDiagram
    participant User as Browser/User
    participant RegisterServlet as RegisterServlet
    participant RegUtils as RegistrationUtils
    participant PasswordValidator as Nbvcxz Library
    participant Persistence as PersistenceLayer
    participant SqlData as SqlData
    participant DB as H2 Database

    User->>RegisterServlet: POST /demo/register (username, password)
    RegisterServlet->>RegUtils: registerUser(username, password, persistence)
    
    RegUtils->>PasswordValidator: calculate(password)
    PasswordValidator-->>RegUtils: PasswordResult (entropy, crack time)
    
    RegUtils->>RegUtils: isPasswordGood(result)
    
    alt Password is weak
        RegUtils-->>RegisterServlet: RegistrationResult.WEAK_PASSWORD
        RegisterServlet->>User: Forward to result.jsp (error message)
    else Password is strong
        RegUtils->>RegUtils: hashPassword(password) [SHA-256]
        RegUtils->>Persistence: saveUser(username, hashedPassword)
        
        Persistence->>SqlData: executeQuery("INSERT INTO USER...", params)
        SqlData->>DB: Execute SQL
        DB-->>SqlData: Success/Failure
        SqlData-->>Persistence: Result
        
        alt Database error
            Persistence-->>RegUtils: Exception
            RegUtils-->>RegisterServlet: RegistrationResult.DATABASE_ERROR
            RegisterServlet->>User: Forward to result.jsp (error)
        else Success
            Persistence-->>RegUtils: User ID
            RegUtils-->>RegisterServlet: RegistrationResult.SUCCESS
            RegisterServlet->>User: Forward to result.jsp (success)
        end
    end
```

## User Login Workflow

```mermaid
sequenceDiagram
    participant User as Browser/User
    participant LoginServlet as LoginServlet
    participant LoginUtils as LoginUtils
    participant Persistence as PersistenceLayer
    participant SqlData as SqlData
    participant DB as H2 Database

    User->>LoginServlet: POST /demo/login (username, password)
    LoginServlet->>LoginUtils: authenticateUser(username, password, persistence)
    
    LoginUtils->>Persistence: getUserByUsername(username)
    Persistence->>SqlData: executeQuery("SELECT * FROM USER WHERE name = ?", params)
    SqlData->>DB: Execute SQL
    DB-->>SqlData: User record or empty
    SqlData-->>Persistence: User object
    Persistence-->>LoginUtils: User (or Empty)
    
    alt User not found
        LoginUtils-->>LoginServlet: AuthenticationResult.USER_NOT_FOUND
        LoginServlet->>User: Forward to result.jsp (error)
    else User found
        LoginUtils->>LoginUtils: verifyPassword(inputPassword, storedHash)
        
        alt Password mismatch
            LoginUtils-->>LoginServlet: AuthenticationResult.INVALID_PASSWORD
            LoginServlet->>User: Forward to result.jsp (error)
        else Password matches
            LoginUtils-->>LoginServlet: AuthenticationResult.SUCCESS
            LoginServlet->>User: Set session attribute
            LoginServlet->>User: Forward to result.jsp (success)
        end
    end
```

# Library Management Workflows

## Book Lending Workflow

```mermaid
sequenceDiagram
    participant Librarian as Librarian UI
    participant LendServlet as LibraryLendServlet
    participant LibraryUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant SqlData as SqlData
    participant DB as H2 Database

    Librarian->>LendServlet: POST /demo/lend (bookId, borrowerId, date)
    LendServlet->>LibraryUtils: lendBook(bookId, borrowerId, date, persistence)
    
    LibraryUtils->>Persistence: getBookById(bookId)
    Persistence->>SqlData: executeQuery("SELECT * FROM BOOK WHERE id = ?", params)
    SqlData->>DB: Execute SQL
    DB-->>SqlData: Book record
    SqlData-->>Persistence: Book object
    Persistence-->>LibraryUtils: Book
    
    LibraryUtils->>Persistence: getBorrowerById(borrowerId)
    Persistence->>SqlData: executeQuery("SELECT * FROM BORROWER WHERE id = ?", params)
    SqlData->>DB: Execute SQL
    DB-->>SqlData: Borrower record
    SqlData-->>Persistence: Borrower object
    Persistence-->>LibraryUtils: Borrower
    
    LibraryUtils->>Persistence: getActiveLoansForBook(bookId)
    Persistence->>SqlData: executeQuery("SELECT * FROM LOAN WHERE book = ? AND return_date IS NULL", params)
    SqlData->>DB: Execute SQL
    DB-->>SqlData: Loan records
    SqlData-->>Persistence: List<Loan>
    Persistence-->>LibraryUtils: Active loans
    
    LibraryUtils->>LibraryUtils: validateLendingRules(book, borrower, activeLoans)
    
    alt Book already lent
        LibraryUtils-->>LendServlet: LibraryActionResult.BOOK_ALREADY_LENT
        LendServlet->>Librarian: Forward to restfulresult.jsp (error)
    else Validation passes
        LibraryUtils->>Persistence: createLoan(bookId, borrowerId, date)
        Persistence->>SqlData: executeQuery("INSERT INTO LOAN...", params)
        SqlData->>DB: Execute SQL
        DB-->>SqlData: Loan ID
        SqlData-->>Persistence: Result
        Persistence-->>LibraryUtils: Loan object
        LibraryUtils-->>LendServlet: LibraryActionResult.SUCCESS
        LendServlet->>Librarian: Forward to restfulresult.jsp (success)
    end
```

## Book Registration and Search Workflow

```mermaid
sequenceDiagram
    participant User as Browser/User
    participant BookServlet as LibraryBookListSearchServlet
    participant Persistence as PersistenceLayer
    participant SqlData as SqlData
    participant DB as H2 Database

    alt Search Books (GET)
        User->>BookServlet: GET /demo/book?search=title
        BookServlet->>Persistence: searchBooksByTitle(searchTerm)
        Persistence->>SqlData: executeQuery("SELECT * FROM BOOK WHERE title LIKE ?", params)
        SqlData->>DB: Execute SQL
        DB-->>SqlData: Book records
        SqlData-->>Persistence: List<Book>
        Persistence-->>BookServlet: Book list
        BookServlet->>User: Forward to restfulresult.jsp (JSON list)
    else Register Book (POST)
        User->>BookServlet: POST /demo/book (title)
        BookServlet->>Persistence: saveBook(title)
        Persistence->>SqlData: executeQuery("INSERT INTO BOOK...", params)
        SqlData->>DB: Execute SQL
        DB-->>SqlData: Book ID
        SqlData-->>Persistence: Result
        Persistence-->>BookServlet: Book object
        BookServlet->>User: Forward to restfulresult.jsp (success)
    end
```

# Mathematics Service Workflow

```mermaid
sequenceDiagram
    participant Client as Browser/Client
    participant MathServlet as MathServlet
    participant Calculator as Calculator
    participant Fib as Fibonacci
    participant Ack as Ackermann

    Client->>MathServlet: POST /demo/math (operation, values, algorithm_choice)
    
    alt Operation is ADD, SUBTRACT, MULTIPLY, DIVIDE
        MathServlet->>Calculator: calculate(operation, values)
        Calculator->>Calculator: validateInputs(values)
        
        alt Invalid inputs
            Calculator-->>MathServlet: ValidationResult.INVALID
            MathServlet->>Client: Forward to result.jsp (error)
        else Valid inputs
            Calculator->>Calculator: performOperation(operation, values)
            Calculator-->>MathServlet: Result
            MathServlet->>Client: Forward to result.jsp (result)
        end
        
    else Operation is FIBONACCI
        MathServlet->>Fib: calculate(n, algorithm_choice)
        
        alt algorithm_choice = RECURSIVE
            Fib->>Fib: fibonacciRecursive(n)
        else algorithm_choice = ITERATIVE
            Fib->>Fib: fibonacciIterative(n)
        end
        
        Fib-->>MathServlet: Fibonacci number
        MathServlet->>Client: Forward to result.jsp (result)
        
    else Operation is ACKERMANN
        MathServlet->>Ack: calculate(m, n, algorithm_choice)
        
        alt algorithm_choice = RECURSIVE
            Ack->>Ack: ackermannRecursive(m, n)
        else algorithm_choice = ITERATIVE
            Ack->>Ack: ackermannIterative(m, n)
        end
        
        Ack-->>MathServlet: Ackermann result
        MathServlet->>Client: Forward to result.jsp (result)
    end
```

# Database Migration Workflow

```mermaid
sequenceDiagram
    participant Admin as Browser/Admin
    participant DbServlet as DbServlet
    participant Flyway as Flyway
    participant DataSource as JdbcConnectionPool
    participant DB as H2 Database

    Admin->>DbServlet: GET /demo/flyway?action=migrate
    DbServlet->>Flyway: configure()
    Flyway->>DataSource: getConnection()
    DataSource->>DB: Create connection
    DB-->>DataSource: Connection object
    DataSource-->>Flyway: Connection
    
    Flyway->>Flyway: loadMigrations()
    Flyway->>DB: CREATE TABLE IF NOT EXISTS flyway_schema_history
    
    loop For each pending migration
        Flyway->>DB: BEGIN TRANSACTION
        Flyway->>DB: Execute migration SQL (V1__, V2__, ...)
        Flyway->>DB: INSERT INTO flyway_schema_history (version, description, success)
        Flyway->>DB: COMMIT
    end
    
    Flyway-->>DbServlet: MigrationReport
    DbServlet->>Admin: Forward to result.jsp (migration status)
```

# Error Handling and Recovery Patterns

## Database Error Handling Pattern

```mermaid
sequenceDiagram
    participant Client as Servlet/Client
    participant Persistence as PersistenceLayer
    participant SqlData as SqlData
    participant DB as H2 Database
    participant ErrorHandler as Error Handler

    Client->>Persistence: executeDataOperation()
    Persistence->>SqlData: executeQuery(sql, params)
    SqlData->>DB: Execute SQL
    
    alt SQL Exception
        DB--x SqlData: SQLException
        SqlData->>ErrorHandler: logError(exception)
        ErrorHandler->>ErrorHandler: formatError()
        SqlData--x Persistence: DataAccessException
        Persistence->>ErrorHandler: logError(exception)
        Persistence--x Client: Error page
        Client->>Client: Display error.jsp with error details
        
    else Connection Timeout
        DB--x SqlData: TimeoutException
        SqlData->>ErrorHandler: logRetry()
        SqlData->>SqlData: retryWithBackoff()
        alt Retry successful
            SqlData->>DB: Re-execute SQL
            DB-->>SqlData: Result
            SqlData-->>Persistence: Result
            Persistence-->>Client: Success response
        else Max retries exceeded
            SqlData--x Persistence: MaxRetriesExceededException
            Persistence--x Client: Error page with timeout message
        end
    else Success
        DB-->>SqlData: Result
        SqlData-->>Persistence: Result
        Persistence-->>Client: Success response
    end
```

## Validation Error Pattern

```mermaid
sequenceDiagram
    participant User as Browser/User
    participant Servlet as Request Servlet
    participant Validator as Validation Utils
    participant ErrorHandler as Error Handler

    User->>Servlet: POST request with form data
    Servlet->>Validator: validateInput(data)
    
    alt Validation failures
        Validator->>Validator: checkNulls()
        Validator->>Validator: checkFormats()
        Validator->>Validator: checkBusinessRules()
        Validator-->>Servlet: ValidationResult with errors
        Servlet->>ErrorHandler: formatValidationErrors(errors)
        ErrorHandler-->>Servlet: Error messages
        Servlet->>User: Forward to form page with error messages
        User->>User: Display validation errors
        
    else Validation passes
        Validator-->>Servlet: ValidationResult.SUCCESS
        Servlet->>Servlet: processBusinessLogic()
        Servlet->>User: Forward to success page
    end
```

# Cross-Cutting Communication Patterns

## Synchronous REST Communication Pattern

```mermaid
sequenceDiagram
    participant Client as Frontend (JS/JSP)
    participant Servlet as Request Servlet
    participant Service as Business Service
    participant Persistence as PersistenceLayer
    participant DB as Database

    Client->>Servlet: HTTP POST/GET request
    activate Servlet
    Servlet->>Service: businessMethod(params)
    activate Service
    Service->>Persistence: dataOperation(params)
    activate Persistence
    Persistence->>DB: SQL Query
    activate DB
    DB-->>Persistence: Result
    deactivate DB
    Persistence-->>Service: Data Object
    deactivate Persistence
    Service->>Service: business logic processing
    Service-->>Servlet: Business Result
    deactivate Service
    Servlet->>Servlet: Prepare response
    Servlet-->>Client: HTTP Response (JSON/JSP)
    deactivate Servlet
```

## Application Initialization and Startup Pattern

```mermaid
sequenceDiagram
    participant Tomcat as Tomcat Server
    participant WebListener as WebAppListener
    participant Flyway as Flyway
    participant DataSource as JdbcConnectionPool
    participant DB as H2 Database

    Tomcat->>WebListener: contextInitialized()
    activate WebListener
    WebListener->>DataSource: initialize("jdbc:h2:./build/db/training")
    activate DataSource
    DataSource->>DB: Test connection
    DB-->>DataSource: Connection OK
    deactivate DataSource
    WebListener->>Flyway: cleanAndMigrateDatabase(dataSource)
    activate Flyway
    Flyway->>Flyway: clean()
    Flyway->>Flyway: migrate()
    Flyway->>DB: Execute migrations
    DB-->>Flyway: Migration complete
    deactivate Flyway
    WebListener-->>Tomcat: Initialization complete
    deactivate WebListener
    Tomcat->>Tomcat: Start accepting requests
```