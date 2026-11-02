```markdown
# Dynamic Interaction Flows - Coveros Demo Application

## Workflow 1: User Registration and Authentication

### Description
Complete user registration and authentication workflow including password validation, secure storage, and credential verification. Demonstrates the security domain with password strength analysis using entropy calculations.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Web User
    participant RS as RegisterServlet
    participant RU as RegistrationUtils
    participant PL as PersistenceLayer
    participant DB as H2 Database
    participant Auth as Nbvcxz Library
    
    Note over User,DB: Registration Phase
    User->>RS: POST /demo/register (username, password)
    RS->>RU: registerUser(username, password)
    RU->>Auth: isPasswordGood(password)
    Auth-->>RU: PasswordResult (entropy, crack time)
    
    alt Password Weak
        RU-->>RS: RegistrationResult(success=false, WEAK_PASSWORD)
        RS-->>User: HTTP 400 - Password too weak
    else Password Strong
        RU->>RU: createHashedValueFromPassword(password)
        RU->>PL: saveNewUser(username, password_hash)
        PL->>DB: INSERT INTO AUTH.USER (name, password_hash)
        DB-->>PL: Generated User ID
        PL-->>RU: User ID
        RU-->>RS: RegistrationResult(success=true)
        RS-->>User: HTTP 200 - Registration successful
    end
    
    Note over User,DB: Authentication Phase
    User->>RS: POST /demo/login (username, password)
    RS->>RU: loginUser(username, password)
    RU->>RU: createHashedValueFromPassword(password)
    RU->>PL: areCredentialsValid(username, hashedPassword)
    PL->>DB: SELECT password_hash FROM AUTH.USER WHERE name=?
    DB-->>PL: stored_hash
    PL->>PL: compare hashes (SHA-256)
    
    alt Credentials Valid
        PL-->>RU: true
        RU-->>RS: LoginResult(success=true)
        RS-->>User: HTTP 200 - Login successful
    else Credentials Invalid
        PL-->>RU: false
        RU-->>RS: LoginResult(success=false)
        RS-->>User: HTTP 401 - Invalid credentials
    end
```

## Workflow 2: Library Book Lending Process

### Description
Complete book lending workflow demonstrating library management domain interactions. Shows book availability checking, borrower validation, and loan creation with business rule enforcement.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Librarian as Librarian User
    participant LS as LendServlet
    participant LU as LibraryUtils
    participant PL as PersistenceLayer
    participant DB as H2 Database
    
    Librarian->>LS: POST /demo/lend (bookId, borrowerId)
    LS->>LU: lendBook(bookId, borrowerId)
    
    Note over LU,DB: Validate Book Existence
    LU->>PL: getBook(bookId)
    PL->>DB: SELECT * FROM LIBRARY.BOOK WHERE id=?
    DB-->>PL: Book record
    alt Book Not Found
        PL-->>LU: Optional.empty()
        LU-->>LS: LibraryActionResult(FAILED, "Book not found")
        LS-->>Librarian: HTTP 404 - Book not found
    else Book Found
        PL-->>LU: Book object
    end
    
    Note over LU,DB: Validate Borrower Existence
    LU->>PL: getBorrower(borrowerId)
    PL->>DB: SELECT * FROM LIBRARY.BORROWER WHERE id=?
    DB-->>PL: Borrower record
    alt Borrower Not Found
        PL-->>LU: Optional.empty()
        LU-->>LS: LibraryActionResult(FAILED, "Borrower not found")
        LS-->>Librarian: HTTP 404 - Borrower not found
    else Borrower Found
        PL-->>LU: Borrower object
    end
    
    Note over LU,DB: Check Book Availability
    LU->>PL: isBookAvailable(bookId)
    PL->>DB: SELECT COUNT(*) FROM LIBRARY.LOAN WHERE book=? AND return_date IS NULL
    DB-->>PL: active_loans_count
    alt Book Not Available
        PL-->>LU: false
        LU-->>LS: LibraryActionResult(FAILED, "Book already loaned")
        LS-->>Librarian: HTTP 409 - Book not available
    else Book Available
        PL-->>LU: true
    end
    
    Note over LU,DB: Create Loan Record
    LU->>PL: createLoan(book, borrower, currentDate)
    PL->>DB: INSERT INTO LIBRARY.LOAN (book, borrower, borrow_date)
    DB-->>PL: Generated Loan ID
    PL-->>LU: Loan ID
    LU-->>LS: LibraryActionResult(SUCCESS, loanDetails)
    LS-->>Librarian: HTTP 200 - Loan created successfully
```

## Workflow 3: Fibonacci Calculation with Multiple Algorithms

### Description
Mathematical computation workflow showing three different Fibonacci algorithm implementations with performance characteristics. Demonstrates algorithm selection and large number handling with BigInteger.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as Math User
    participant FS as FibServlet
    participant FIB as Fibonacci
    participant FIB_I as FibonacciIterative
    participant FIB_M as FibonacciMatrix
    participant CALC as Calculator
    
    User->>FS: POST /demo/fibonacci (number, algorithm)
    FS->>FS: validateInput(number)
    
    alt Invalid Input
        FS-->>User: HTTP 400 - Invalid input
    else Valid Input
        FS->>CALC: convertToBigInteger(number)
        CALC-->>FS: BigInteger value
        
        Note over FS,FIB_M: Algorithm Selection
        alt algorithm = "recursive"
            FS->>FIB: calculate(number)
            FIB->>FIB: recursiveFibonacci(n)
            FIB-->>FS: BigInteger result
        else algorithm = "iterative"
            FS->>FIB_I: calculate(number)
            FIB_I->>FIB_I: iterativeFibonacci(n)
            FIB_I-->>FS: BigInteger result
        else algorithm = "matrix" (default)
            FS->>FIB_M: calculate(number)
            FIB_M->>FIB_M: matrixPower(n)
            FIB_M->>FIB_M: matrixMultiply()
            FIB_M-->>FS: BigInteger result
        end
        
        FS->>CALC: formatResultForDisplay(result)
        CALC-->>FS: Formatted string
        FS-->>User: HTTP 200 - Fibonacci result
    end
```

## Workflow 4: Database Migration and Backup Process

### Description
Database management workflow showing Flyway migration execution and database backup operations. Demonstrates application lifecycle management and persistence layer coordination.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant DS as DbServlet
    participant PL as PersistenceLayer
    participant FL as Flyway
    participant DB as H2 Database
    participant FS as File System
    
    Note over Admin,DB: Database Migration
    Admin->>DS: GET /demo/flyway?action=migrate
    DS->>PL: cleanAndMigrateDatabase()
    PL->>FL: migrate()
    FL->>DB: SELECT version from flyway_schema_history
    DB-->>FL: current version
    FL->>FL: find pending migrations
    loop Each Pending Migration
        FL->>DB: Execute migration SQL
        DB-->>FL: Migration result
        FL->>DB: INSERT INTO flyway_schema_history
    end
    FL-->>PL: Migration completed
    PL-->>DS: Success response
    DS-->>Admin: HTTP 200 - Migration complete
    
    Note over Admin,FS: Database Backup
    Admin->>DS: POST /demo/backup (backupFileName)
    DS->>PL: runBackup(backupFileName)
    PL->>DB: SCRIPT TO 'backupFileName.sql'
    DB->>FS: Write backup file
    FS-->>DB: File write confirmation
    DB-->>PL: Backup completed
    PL-->>DS: Backup success
    DS-->>Admin: HTTP 200 - Backup created
```

## Workflow 5: Auto Insurance Processing (Desktop Application)

### Description
Desktop application workflow showing Swing UI interactions with business logic processing and socket-based automation. Demonstrates multi-tier desktop application architecture.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant Customer as Insurance Customer
    participant UI as AutoInsuranceUI
    participant PROC as AutoInsuranceProcessor
    participant SOCK as AutoInsuranceScriptServer
    participant TEST as Test Script
    
    Note over Customer,PROC: User Interface Interaction
    Customer->>UI: Enter customer data (age, claims history)
    UI->>PROC: calculatePremium(customerData)
    PROC->>PROC: applyBusinessRules()
    PROC->>PROC: calculateRiskFactor()
    PROC-->>UI: Premium amount
    UI->>UI: updateDisplay(premium)
    
    Note over TEST,SOCK: Automation Testing
    TEST->>SOCK: Connect to localhost:port
    SOCK-->>TEST: Connection established
    TEST->>SOCK: Send test commands (JSON)
    SOCK->>UI: simulateUserInput(commands)
    UI->>PROC: processAutomatedRequest()
    PROC-->>UI: processingResult
    UI->>SOCK: returnResult()
    SOCK-->>TEST: JSON response
    TEST->>TEST: validateResults()
    
    Note over PROC,PROC: Business Logic Processing
    alt High Risk Customer
        PROC->>PROC: generateWarningLetter()
        PROC->>PROC: applySurcharge()
    else Policy Cancellation
        PROC->>PROC: checkCancellationCriteria()
        PROC->>PROC: processCancellation()
    end
```

## Workflow 6: Error Handling and Recovery Patterns

### Description
Comprehensive error handling workflow showing exception propagation, database constraint violations, and recovery mechanisms across different domains.

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User as End User
    participant SERV as Any Servlet
    participant UTIL as Business Logic
    participant PL as PersistenceLayer
    participant DB as H2 Database
    participant LOG as Log4j2
    
    User->>SERV: HTTP Request
    SERV->>UTIL: processRequest(data)
    UTIL->>PL: databaseOperation(data)
    PL->>DB: Execute SQL
    
    alt Database Constraint Violation
        DB-->>PL: SQLException (unique constraint)
        PL->>LOG: error("Constraint violation", exception)
        PL-->>UTIL: PersistenceException
        UTIL->>UTIL: handleConstraintViolation()
        UTIL-->>SERV: BusinessException("Duplicate entry")
        SERV->>SERV: createErrorResponse()
        SERV-->>User: HTTP 409 - Conflict
    else Database Connection Issue
        DB-->>PL: SQLException (connection)
        PL->>LOG: error("Connection failed", exception)
        PL->>PL: attemptReconnection()
        alt Reconnection Successful
            PL->>DB: Retry operation
            DB-->>PL: Success
            PL-->>UTIL: Result
            UTIL-->>SERV: Success
            SERV-->>User: HTTP 200 - Success (retried)
        else Reconnection Failed
            PL-->>UTIL: PersistenceException
            UTIL-->>SERV: ServiceUnavailableException
            SERV-->>User: HTTP 503 - Service unavailable
        end
    else Business Rule Violation
        UTIL->>UTIL: validateBusinessRules()
        UTIL-->>SERV: BusinessException("Invalid operation")
        SERV->>SERV: createErrorResponse()
        SERV-->>User: HTTP 422 - Unprocessable entity
    else Success Case
        DB-->>PL: Success
        PL-->>UTIL: Result
        UTIL-->>SERV: Success
        SERV-->>User: HTTP 200 - Success
    end
    
    Note over SERV,LOG: Logging and Monitoring
    SERV->>LOG: info("Request processed", status, duration)
```

## Communication Patterns Summary

### Synchronous Communication
- **REST API Calls**: HTTP requests between clients and servlets
- **Database Transactions**: JDBC calls with immediate responses
- **Direct Method Calls**: Within JVM for business logic
- **Socket Communication**: Desktop automation with request-response

### Asynchronous Patterns
- **Event-Driven UI**: Swing event handling
- **Background Processing**: Insurance calculation threads
- **Database Migrations**: Flyway execution during startup

### Data Flow Characteristics
- **Request-Response**: Most web interactions
- **CRUD Operations**: Library and authentication domains
- **Computational Intensive**: Mathematical algorithms
- **Batch Processing**: Database backups and migrations
```