```markdown
# Dynamic Interaction Flows and Sequence Diagrams

## Workflow 1: User Authentication Flow

### Description
Complete user authentication workflow including registration, login, and credential validation. This workflow demonstrates the password strength validation and secure authentication process.

### Communication Patterns
- Synchronous REST API calls
- Database transactions with JDBC
- SHA-256 password hashing
- Session management

```mermaid
sequenceDiagram
    participant User as Web User
    participant AuthServlet as AuthenticationServlet
    participant RegUtils as RegistrationUtils
    participant LoginUtils as LoginUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    Note over User,DB: User Registration Flow
    User->>AuthServlet: POST /demo/register (username, password)
    AuthServlet->>RegUtils: registerUser(username, password)
    RegUtils->>RegUtils: validatePassword(password)
    RegUtils->>RegUtils: calculatePasswordEntropy()
    RegUtils->>RegUtils: createHashedValueFromPassword(password)
    RegUtils->>Persistence: saveNewUser(username, hashedPassword)
    Persistence->>DB: INSERT INTO USER (name, password_hash)
    DB-->>Persistence: User ID
    Persistence-->>RegUtils: RegistrationResult
    RegUtils-->>AuthServlet: RegistrationResult
    AuthServlet-->>User: Registration Success/Failure

    Note over User,DB: User Login Flow
    User->>AuthServlet: POST /demo/login (username, password)
    AuthServlet->>LoginUtils: authenticateUser(username, password)
    LoginUtils->>LoginUtils: createHashedValueFromPassword(password)
    LoginUtils->>Persistence: areCredentialsValid(username, hashedPassword)
    Persistence->>DB: SELECT password_hash FROM USER WHERE name=?
    DB-->>Persistence: storedHash
    Persistence->>Persistence: compareHashes(storedHash, providedHash)
    Persistence-->>LoginUtils: boolean (valid/invalid)
    LoginUtils-->>AuthServlet: AuthenticationResult
    AuthServlet-->>User: Login Success/Failure with Session
```

## Workflow 2: Library Book Lending Process

### Description
Complete book lending workflow including book and borrower registration, availability checking, and loan creation. Demonstrates business rule enforcement and transaction management.

### Communication Patterns
- Synchronous REST API calls
- Database transactions with constraints
- Business logic validation
- JSON serialization for responses

```mermaid
sequenceDiagram
    participant Librarian as Librarian
    participant LibServlet as LibraryServlet
    participant LibUtils as LibraryUtils
    participant Persistence as PersistenceLayer
    participant DB as H2 Database

    Note over Librarian,DB: Book Registration
    Librarian->>LibServlet: POST /demo/registerbook (title)
    LibServlet->>LibUtils: registerBook(title)
    LibUtils->>Persistence: saveNewBook(title)
    Persistence->>DB: INSERT INTO BOOK (title)
    DB-->>Persistence: Book ID
    Persistence-->>LibUtils: BookRegistrationResult
    LibUtils-->>LibServlet: BookRegistrationResult
    LibServlet-->>Librarian: Book Registered Successfully

    Note over Librarian,DB: Borrower Registration
    Librarian->>LibServlet: POST /demo/registerborrower (name)
    LibServlet->>LibUtils: registerBorrower(name)
    LibUtils->>Persistence: saveNewBorrower(name)
    Persistence->>DB: INSERT INTO BORROWER (name)
    DB-->>Persistence: Borrower ID
    Persistence-->>LibUtils: BorrowerRegistrationResult
    LibUtils-->>LibServlet: BorrowerRegistrationResult
    LibServlet-->>Librarian: Borrower Registered Successfully

    Note over Librarian,DB: Book Lending
    Librarian->>LibServlet: POST /demo/lend (bookId, borrowerId)
    LibServlet->>LibUtils: lendBook(bookId, borrowerId)
    LibUtils->>Persistence: searchBooksById(bookId)
    Persistence->>DB: SELECT * FROM BOOK WHERE id=?
    DB-->>Persistence: Book record
    LibUtils->>Persistence: searchBorrowersById(borrowerId)
    Persistence->>DB: SELECT * FROM BORROWER WHERE id=?
    DB-->>Persistence: Borrower record
    
    LibUtils->>Persistence: isBookAvailable(bookId)
    Persistence->>DB: SELECT COUNT(*) FROM LOAN WHERE book=? AND active=true
    DB-->>Persistence: count (0 or 1)
    
    alt Book Available
        LibUtils->>Persistence: createLoan(book, borrower, currentDate)
        Persistence->>DB: INSERT INTO LOAN (book, borrower, borrow_date)
        DB-->>Persistence: Loan ID
        Persistence-->>LibUtils: LoanSuccess
        LibUtils-->>LibServlet: LendingSuccess
        LibServlet-->>Librarian: Book Lent Successfully
    else Book Not Available
        LibUtils-->>LibServlet: LendingFailure
        LibServlet-->>Librarian: Error - Book Not Available
    end
```

## Workflow 3: Mathematical Calculation Pipeline

### Description
Mathematical operation workflow demonstrating different algorithm implementations and error handling for large number calculations. Shows both basic arithmetic and complex recursive functions.

### Communication Patterns
- Synchronous REST API calls
- Algorithm selection based on parameters
- BigInteger handling for overflow protection
- Stateless computation

```mermaid
sequenceDiagram
    participant User as Web User
    participant MathServlet as MathServlet
    participant FibServlet as FibServlet
    participant AckServlet as AckServlet
    participant Calculator as Calculator
    participant Fibonacci as Fibonacci
    participant Ackermann as Ackermann

    Note over User,Ackermann: Basic Arithmetic
    User->>MathServlet: POST /demo/math (a, b, operation)
    MathServlet->>Calculator: calculate(a, b, operation)
    Calculator->>Calculator: validateInputs(a, b)
    alt operation == "add"
        Calculator->>Calculator: addWithOverflowCheck(a, b)
    else operation == "subtract"
        Calculator->>Calculator: subtract(a, b)
    else operation == "multiply"
        Calculator->>Calculator: multiply(a, b)
    end
    Calculator-->>MathServlet: CalculationResult
    MathServlet-->>User: JSON Response with Result

    Note over User,Ackermann: Fibonacci Calculation
    User->>FibServlet: POST /demo/fibonacci (n, algorithm)
    FibServlet->>FibServlet: validateInput(n)
    alt algorithm == "recursive"
        FibServlet->>Fibonacci: calculateRecursive(n)
        Fibonacci->>Fibonacci: recursiveFibonacci(n)
    else algorithm == "iterative"
        FibServlet->>Fibonacci: calculateIterative(n)
        Fibonacci->>Fibonacci: iterativeFibonacci(n)
    else algorithm == "matrix"
        FibServlet->>Fibonacci: calculateMatrix(n)
        Fibonacci->>Fibonacci: matrixFibonacci(n)
    end
    Fibonacci-->>FibServlet: FibonacciResult (BigInteger)
    FibServlet-->>User: JSON Response with Fibonacci Number

    Note over User,Ackermann: Ackermann Function
    User->>Ackermann: POST /demo/ackermann (m, n)
    Ackermann->>Ackermann: validateInputs(m, n)
    Ackermann->>Ackermann: ackermann(m, n)
    Ackermann->>Ackermann: tailRecursiveAckermann(m, n)
    Ackermann-->>User: JSON Response with Ackermann Result
```

## Workflow 4: Database Migration and Backup Process

### Description
System administration workflow for database migrations, backups, and schema management using Flyway. Demonstrates database lifecycle management.

### Communication Patterns
- Synchronous REST API calls
- Flyway migration commands
- File system operations for backups
- Transactional schema updates

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant DbServlet as DbServlet
    participant FlywayServlet as FlywayServlet
    participant Persistence as PersistenceLayer
    participant Flyway as Flyway
    participant DB as H2 Database
    participant FS as File System

    Note over Admin,FS: Database Migration
    Admin->>FlywayServlet: GET /demo/flyway?action=migrate
    FlywayServlet->>Persistence: cleanAndMigrateDatabase()
    Persistence->>Flyway: configure().schemas().load()
    Flyway->>DB: SELECT version from flyway_schema_history
    DB-->>Flyway: current version
    Flyway->>DB: APPLY new migrations
    DB-->>Flyway: migration success
    Flyway-->>Persistence: migration result
    Persistence-->>FlywayServlet: MigrationComplete
    FlywayServlet-->>Admin: Migration Status

    Note over Admin,FS: Database Backup
    Admin->>DbServlet: POST /demo/backup (filename)
    DbServlet->>Persistence: runBackup(filename)
    Persistence->>DB: SCRIPT TO 'backup.sql'
    DB-->>Persistence: backup file created
    Persistence->>FS: write backup file
    FS-->>Persistence: file write success
    Persistence-->>DbServlet: BackupResult
    DbServlet-->>Admin: Backup Complete

    Note over Admin,FS: Database Restore
    Admin->>DbServlet: POST /demo/restore (filename)
    DbServlet->>Persistence: runRestore(filename)
    Persistence->>FS: read backup file
    FS-->>Persistence: file content
    Persistence->>DB: DROP ALL OBJECTS
    Persistence->>DB: RUNSCRIPT FROM 'backup.sql'
    DB-->>Persistence: restore complete
    Persistence-->>DbServlet: RestoreResult
    DbServlet-->>Admin: Restore Complete
```

## Workflow 5: Insurance Processing Desktop Application

### Description
Desktop application workflow for insurance premium calculation and policy management. Demonstrates Swing UI interactions with backend business logic.

### Communication Patterns
- Swing UI event handling
- In-process method calls
- Business logic computation
- File I/O for document generation

```mermaid
sequenceDiagram
    participant Customer as Customer
    participant UI as AutoInsuranceUI
    participant Processor as AutoInsuranceProcessor
    participant ScriptServer as ScriptServer
    participant FS as File System

    Note over Customer,FS: Premium Calculation
    Customer->>UI: Enter customer details (age, claims, etc.)
    UI->>Processor: calculatePremium(age, claimsHistory)
    Processor->>Processor: applyAgeMultiplier(age)
    Processor->>Processor: applyClaimsPenalty(claims)
    Processor->>Processor: calculateBasePremium()
    Processor-->>UI: premiumAmount
    UI-->>Customer: Display Premium Quote

    Note over Customer,FS: Policy Generation
    Customer->>UI: Click "Generate Policy"
    UI->>Processor: generatePolicy(customerData)
    Processor->>Processor: createPolicyDocument()
    Processor->>FS: write policy document
    FS-->>Processor: file created
    Processor-->>UI: PolicyGenerated
    UI-->>Customer: Policy Document Ready

    Note over Customer,FS: Warning Letter Generation
    UI->>Processor: generateWarningLetter(customerId)
    Processor->>Processor: checkClaimThreshold(claims)
    alt claims > threshold
        Processor->>Processor: createWarningContent()
        Processor->>FS: write warning letter
        FS-->>Processor: letter created
        Processor-->>UI: WarningLetterGenerated
    else
        Processor-->>UI: NoWarningNeeded
    end

    Note over Customer,FS: UI Automation
    ScriptServer->>UI: simulateUserAction(buttonClick)
    UI->>Processor: processAutomatedRequest(data)
    Processor-->>UI: processingResult
    UI-->>ScriptServer: automationResponse
```

## Workflow 6: Error Handling and Recovery Patterns

### Description
Comprehensive error handling workflow showing exception propagation, validation failures, and recovery mechanisms across different domains.

### Communication Patterns
- Exception propagation
- Validation error responses
- Transaction rollback
- Graceful degradation

```mermaid
sequenceDiagram
    participant User as User
    participant Servlet as AnyServlet
    participant Utils as BusinessUtils
    participant Persistence as PersistenceLayer
    participant DB as Database

    Note over User,DB: Validation Error Flow
    User->>Servlet: POST with invalid data
    Servlet->>Utils: processRequest(invalidData)
    Utils->>Utils: validateInput(invalidData)
    Utils-->>Servlet: ValidationException
    Servlet-->>User: HTTP 400 - Validation Error

    Note over User,DB: Database Constraint Violation
    User->>Servlet: POST with duplicate data
    Servlet->>Utils: processRequest(duplicateData)
    Utils->>Persistence: saveData(duplicateData)
    Persistence->>DB: INSERT (violates constraint)
    DB-->>Persistence: SQLException
    Persistence-->>Utils: PersistenceException
    Utils-->>Servlet: BusinessLogicException
    Servlet-->>User: HTTP 409 - Conflict

    Note over User,DB: Database Connection Failure
    User->>Servlet: POST request
    Servlet->>Utils: processRequest(data)
    Utils->>Persistence: saveData(data)
    Persistence->>DB: INSERT
    DB-->>Persistence: ConnectionTimeout
    Persistence-->>Utils: DatabaseUnavailableException
    Utils->>Utils: retryWithBackoff()
    Utils->>Persistence: saveData(data)
    Persistence->>DB: INSERT
    DB-->>Persistence: Success
    Persistence-->>Utils: SaveResult
    Utils-->>Servlet: SuccessResponse
    Servlet-->>User: HTTP 200 - Success

    Note over User,DB: Algorithm Overflow Protection
    User->>Servlet: POST /fibonacci with large n
    Servlet->>Utils: calculateFibonacci(largeN)
    Utils->>Utils: checkInputBounds(largeN)
    alt n > safe_limit
        Utils-->>Servlet: OverflowWarning
        Servlet-->>User: HTTP 422 - Input too large
    else
        Utils->>Utils: calculateWithBigInteger(n)
        Utils-->>Servlet: CalculationResult
        Servlet-->>User: HTTP 200 - Success
    end
```