
# User Registration Workflow
```mermaid
sequenceDiagram
    participant Client
    participant RegisterServlet as RegisterServlet
    participant RegistrationUtils as RegistrationUtils
    participant IPersistenceLayer as IPersistenceLayer
    participant PersistenceLayer as PersistenceLayer
    participant Database as H2 Database
    participant Nbvcxz as Nbvcxz Library

    Client->>RegisterServlet: POST /register (username, password)
    RegisterServlet->>RegistrationUtils: registerUser(username, password)
    
    RegistrationUtils->>IPersistenceLayer: userExists(username)
    IPersistenceLayer->>PersistenceLayer: userExists(username)
    PersistenceLayer->>Database: SELECT COUNT(*) FROM AUTH.USER WHERE NAME = ?
    Database-->>PersistenceLayer: count result
    PersistenceLayer-->>IPersistenceLayer: boolean result
    IPersistenceLayer-->>RegistrationUtils: exists flag
    
    alt User already exists
        RegistrationUtils-->>RegisterServlet: RegistrationResult(ALREADY_REGISTERED)
        RegisterServlet-->>Client: 200 OK - User already exists
    else User is new
        RegistrationUtils->>Nbvcxz: estimate(password)
        Nbvcxz-->>RegistrationUtils: entropy score and time-to-crack
        RegistrationUtils->>RegistrationUtils: hashPassword(password) [SHA-256]
        
        RegistrationUtils->>IPersistenceLayer: saveUser(name, hash)
        IPersistenceLayer->>PersistenceLayer: saveUser(name, hash)
        PersistenceLayer->>Database: INSERT INTO AUTH.USER (NAME, PASSWORD_HASH) VALUES (?, ?)
        Database-->>PersistenceLayer: success
        PersistenceLayer-->>IPersistenceLayer: User object
        IPersistenceLayer-->>RegistrationUtils: User object
        
        RegistrationUtils-->>RegisterServlet: RegistrationResult(SUCCESS, metrics)
        RegisterServlet-->>Client: 200 OK - Registration successful
    end
```

# User Login Workflow
```mermaid
sequenceDiagram
    participant Client
    participant LoginServlet as LoginServlet
    participant LoginUtils as LoginUtils
    participant IPersistenceLayer as IPersistenceLayer
    participant PersistenceLayer as PersistenceLayer
    participant Database as H2 Database

    Client->>LoginServlet: POST /login (username, password)
    LoginServlet->>LoginUtils: authenticateUser(username, password)
    
    LoginUtils->>IPersistenceLayer: findUserByName(username)
    IPersistenceLayer->>PersistenceLayer: findUserByName(username)
    PersistenceLayer->>Database: SELECT ID, NAME, PASSWORD_HASH FROM AUTH.USER WHERE NAME = ?
    Database-->>PersistenceLayer: User row
    PersistenceLayer-->>IPersistenceLayer: User object
    IPersistenceLayer-->>LoginUtils: User object
    
    alt User not found
        LoginUtils-->>LoginServlet: PasswordResult(USER_NOT_FOUND)
        LoginServlet-->>Client: 401 Unauthorized - User not found
    else User found
        LoginUtils->>LoginUtils: hashPassword(inputPassword)
        LoginUtils->>LoginUtils: verifyPassword(inputHash, storedHash)
        
        alt Password matches
            LoginUtils->>Nbvcxz: estimate(password)
            Nbvcxz-->>LoginUtils: PasswordResult(SUCCESS, metrics)
            LoginUtils-->>LoginServlet: PasswordResult(SUCCESS)
            LoginServlet-->>Client: 200 OK - Access granted
        else Password mismatch
            LoginUtils-->>LoginServlet: PasswordResult(INVALID_PASSWORD)
            LoginServlet-->>Client: 401 Unauthorized - Invalid password
        end
    end
```

# Book Lending Workflow
```mermaid
sequenceDiagram
    participant Client
    participant LibraryLendServlet as LibraryLendServlet
    participant LibraryUtils as LibraryUtils
    participant IPersistenceLayer as IPersistenceLayer
    participant PersistenceLayer as PersistenceLayer
    participant Database as H2 Database

    Client->>LibraryLendServlet: POST /lend (book, borrower)
    LibraryLendServlet->>LibraryUtils: lendBook(bookTitle, borrowerName)
    
    LibraryUtils->>IPersistenceLayer: findBookByTitle(bookTitle)
    IPersistenceLayer->>PersistenceLayer: findBookByTitle(bookTitle)
    PersistenceLayer->>Database: SELECT ID, TITLE FROM LIBRARY.BOOK WHERE TITLE = ?
    Database-->>PersistenceLayer: Book row
    PersistenceLayer-->>IPersistenceLayer: Book object
    IPersistenceLayer-->>LibraryUtils: Book object
    
    alt Book not found
        LibraryUtils-->>LibraryLendServlet: BOOK_NOT_REGISTERED
        LibraryLendServlet-->>Client: 400 Bad Request - Book not registered
    else Book found
        LibraryUtils->>IPersistenceLayer: findBorrowerByName(borrowerName)
        IPersistenceLayer->>PersistenceLayer: findBorrowerByName(borrowerName)
        PersistenceLayer->>Database: SELECT ID, NAME FROM LIBRARY.BORROWER WHERE NAME = ?
        Database-->>PersistenceLayer: Borrower row
        PersistenceLayer-->>IPersistenceLayer: Borrower object
        IPersistenceLayer-->>LibraryUtils: Borrower object
        
        alt Borrower not found
            LibraryUtils-->>LibraryLendServlet: BORROWER_NOT_REGISTERED
            LibraryLendServlet-->>Client: 400 Bad Request - Borrower not registered
        else Borrower found
            LibraryUtils->>IPersistenceLayer: isBookAvailable(bookId)
            IPersistenceLayer->>PersistenceLayer: isBookAvailable(bookId)
            PersistenceLayer->>Database: SELECT COUNT(*) FROM LIBRARY.LOAN WHERE BOOK = ? AND RETURN_DATE IS NULL
            Database-->>PersistenceLayer: count result
            PersistenceLayer-->>IPersistenceLayer: availability flag
            IPersistenceLayer-->>LibraryUtils: availability flag
            
            alt Book already checked out
                LibraryUtils-->>LibraryLendServlet: BOOK_CHECKED_OUT
                LibraryLendServlet-->>Client: 400 Bad Request - Book already checked out
            else Book available
                LibraryUtils->>IPersistenceLayer: saveLoan(book, borrower, currentDate)
                IPersistenceLayer->>PersistenceLayer: saveLoan(book, borrower, currentDate)
                PersistenceLayer->>Database: INSERT INTO LIBRARY.LOAN (BOOK, BORROWER, BORROW_DATE) VALUES (?, ?, ?)
                Database-->>PersistenceLayer: success
                PersistenceLayer-->>IPersistenceLayer: Loan object
                IPersistenceLayer-->>LibraryUtils: Loan object
                
                LibraryUtils-->>LibraryLendServlet: SUCCESS
                LibraryLendServlet-->>Client: 200 OK - Book lent successfully
            end
        end
    end
```

# Mathematical Calculation Workflow
```mermaid
sequenceDiagram
    participant Client
    participant MathServlet as MathServlet
    participant Calculator as Calculator

    Client->>MathServlet: POST /math (item_a, item_b)
    MathServlet->>MathServlet: parseInt(item_a, item_b)
    
    alt Invalid integer input
        MathServlet-->>Client: 400 Bad Request - Invalid integers
    else Valid integers
        MathServlet->>Calculator: add(a, b)
        Calculator->>Calculator: checkOverflow(a, b)
        
        alt Overflow detected (a + b > 2,147,483,647)
            Calculator-->>MathServlet: throw ArithmeticException
            MathServlet-->>Client: 400 Bad Request - Integer overflow
        else No overflow
            Calculator->>Calculator: perform addition
            Calculator-->>MathServlet: result sum
            MathServlet-->>Client: 200 OK - {result: sum}
        end
    end
```

# Fibonacci Calculation Workflow
```mermaid
sequenceDiagram
    participant Client
    participant FibServlet as FibServlet
    participant Fibonacci as Fibonacci (Recursive)
    participant FibonacciIterative as FibonacciIterative

    Client->>FibServlet: POST /fibonacci (fib_param_n, fib_algorithm_choice)
    FibServlet->>FibServlet: parseInt(fib_param_n)
    
    alt Invalid input
        FibServlet-->>Client: 400 Bad Request - Invalid input
    else Valid input
        alt algorithm_choice = "recursive"
            FibServlet->>Fibonacci: calculate(n)
            note over Fibonacci: Exponential time O(2^n)
            Fibonacci->>Fibonacci: recursive calls
            Fibonacci-->>FibServlet: fibonacci result
        else algorithm_choice = "iterative_log"
            FibServlet->>FibonacciIterative: fibonacciLogN(n)
            note over FibonacciIterative: Matrix exponentiation O(log n)
            FibonacciIterative-->>FibServlet: fibonacci result
        else algorithm_choice = "iterative_n"
            FibServlet->>FibonacciIterative: fibonacciLinear(n)
            note over FibonacciIterative: Dynamic programming O(n)
            FibonacciIterative-->>FibServlet: fibonacci result
        end
        
        FibServlet-->>Client: 200 OK - {result: fibonacci_number}
    end
```

# Ackermann Function Workflow
```mermaid
sequenceDiagram
    participant Client
    participant AckServlet as AckServlet
    participant Ackermann as Ackermann (Recursive)
    participant AckermannIterative as AckermannIterative

    Client->>AckServlet: POST /ackermann (ack_param_m, ack_param_n, algorithm)
    AckServlet->>AckServlet: parseInt(ack_param_m, ack_param_n)
    
    alt Invalid input
        AckServlet-->>Client: 400 Bad Request - Invalid input
    else Valid input
        alt algorithm = "regular"
            AckServlet->>Ackermann: ackermann(m, n)
            note over Ackermann: Standard recursion
            Ackermann->>Ackermann: recursive calls
            Ackermann-->>AckServlet: ackermann result
            
            alt Stack overflow
                AckServlet-->>Client: 500 Internal Server Error - Stack overflow
            else Success
                AckServlet-->>Client: 200 OK - {result: value}
            end
        else algorithm = "tail_recursive"
            AckServlet->>AckermannIterative: tailRecursiveAckermann(m, n)
            note over AckermannIterative: Tail recursion optimization
            AckermannIterative->>AckermannIterative: functional interface calls
            AckermannIterative-->>AckServlet: ackermann result
            AckServlet-->>Client: 200 OK - {result: value}
        end
    end
```

# Book Registration Workflow
```mermaid
sequenceDiagram
    participant Client
    participant LibraryRegisterBookServlet as LibraryRegisterBookServlet
    participant LibraryUtils as LibraryUtils
    participant IPersistenceLayer as IPersistenceLayer
    participant PersistenceLayer as PersistenceLayer
    participant Database as H2 Database

    Client->>LibraryRegisterBookServlet: POST /registerbook (book title)
    LibraryRegisterBookServlet->>LibraryUtils: registerBook(title)
    
    LibraryUtils->>IPersistenceLayer: findBookByTitle(title)
    IPersistenceLayer->>PersistenceLayer: findBookByTitle(title)
    PersistenceLayer->>Database: SELECT ID, TITLE FROM LIBRARY.BOOK WHERE TITLE = ?
    Database-->>PersistenceLayer: Book row or null
    PersistenceLayer-->>IPersistenceLayer: Book object or null
    IPersistenceLayer-->>LibraryUtils: Book object or null
    
    alt Book already exists
        LibraryUtils-->>LibraryRegisterBookServlet: ALREADY_REGISTERED_BOOK
        LibraryRegisterBookServlet-->>Client: 400 Bad Request - Book already registered
    else Book not exists
        LibraryUtils->>IPersistenceLayer: saveBook(title)
        IPersistenceLayer->>PersistenceLayer: saveBook(title)
        PersistenceLayer->>Database: INSERT INTO LIBRARY.BOOK (TITLE) VALUES (?)
        Database-->>PersistenceLayer: success
        PersistenceLayer-->>IPersistenceLayer: Book object
        IPersistenceLayer-->>LibraryUtils: Book object
        
        LibraryUtils-->>LibraryRegisterBookServlet: SUCCESS
        LibraryRegisterBookServlet-->>Client: 200 OK - Book registered successfully
    end
```

# Database Migration Workflow
```mermaid
sequenceDiagram
    participant Client
    participant DbServlet as DbServlet
    participant Flyway as Flyway API
    participant Database as H2 Database

    Client->>DbServlet: GET /flyway?action=clean
    DbServlet->>Flyway: clean()
    Flyway->>Database: DROP all objects
    Database-->>Flyway: success
    Flyway-->>DbServlet: clean completed
    DbServlet-->>Client: 200 OK - Database cleaned

    Client->>DbServlet: GET /flyway?action=migrate
    DbServlet->>Flyway: migrate()
    Flyway->>Flyway: load migration scripts
    note over Flyway: V1__Create_person_table.sql
    note over Flyway: V2__Rest_of_tables_for_auth_and_library.sql
    
    Flyway->>Database: Execute V1 migrations
    Database-->>Flyway: V1 completed
    Flyway->>Database: Execute V2 migrations
    Database-->>Flyway: V2 completed
    Flyway->>Database: Update FLYWAY_SCHEMA_HISTORY
    Database-->>Flyway: history updated
    Flyway-->>DbServlet: migration completed
    DbServlet-->>Client: 200 OK - Migration successful
```

# Insurance Processing Workflow (Desktop)
```mermaid
sequenceDiagram
    participant ScriptClient as Script Client
    participant ScriptServer as Script Server (Port 8000)
    participant InsuranceProcessor as AutoInsuranceProcessor
    participant DesktopUI as Desktop UI

    ScriptClient->>ScriptServer: Socket connection (port 8000)
    ScriptServer->>ScriptServer: accept connection
    ScriptClient->>ScriptServer: "CLAIMS:2" command
    ScriptServer->>InsuranceProcessor: processClaims(2)
    
    InsuranceProcessor->>InsuranceProcessor: calculatePremiumIncrease(claims, age)
    InsuranceProcessor->>InsuranceProcessor: determineWarningLetter(claims)
    
    alt claims = 0
        InsuranceProcessor->>InsuranceProcessor: setWarningLetter(NONE)
        InsuranceProcessor->>InsuranceProcessor: setPremiumIncrease(0)
    else claims = 1
        InsuranceProcessor->>InsuranceProcessor: setWarningLetter(LTR1)
        InsuranceProcessor->>InsuranceProcessor: setPremiumIncrease(100)
    else claims = 2
        InsuranceProcessor->>InsuranceProcessor: setWarningLetter(LTR2)
        InsuranceProcessor->>InsuranceProcessor: setPremiumIncrease(200)
    else claims >= 3
        InsuranceProcessor->>InsuranceProcessor: setWarningLetter(LTR3)
        InsuranceProcessor->>InsuranceProcessor: setPolicyCanceled(true)
    end
    
    InsuranceProcessor-->>ScriptServer: AutoInsuranceAction object
    ScriptServer->>ScriptClient: "PREMIUM_INCREASE:200,WARNING:LTR2,CANCELLED:FALSE"
    
    ScriptClient->>ScriptServer: "AGE:25" command
    ScriptServer->>InsuranceProcessor: processAge(25)
    InsuranceProcessor->>InsuranceProcessor: adjustPremiumForAge(25)
    InsuranceProcessor-->>ScriptServer: updated AutoInsuranceAction
    ScriptServer->>ScriptClient: "PREMIUM_INCREASE:180"
    
    ScriptClient->>ScriptServer: "EXECUTE" command
    ScriptServer->>DesktopUI: send commands via automation
    DesktopUI->>DesktopUI: update premium fields
    DesktopUI->>DesktopUI: show warning letter
    DesktopUI->>DesktopUI: enable/disable policy controls
    
    ScriptClient->>ScriptServer: close connection
    ScriptServer-->>ScriptClient: connection closed
```

# Book Search Workflow
```mermaid
sequenceDiagram
    participant Client
    participant LibraryBookListServlet as LibraryBookListServlet
    participant IPersistenceLayer as IPersistenceLayer
    participant PersistenceLayer as PersistenceLayer
    participant Database as H2 Database

    Client->>LibraryBookListServlet: GET /book (id?, title?)
    LibraryBookListServlet->>LibraryBookListServlet: parseParameters(id, title)
    
    alt Both id and title provided
        LibraryBookListServlet->>IPersistenceLayer: findBookById(id)
        IPersistenceLayer->>PersistenceLayer: findBookById(id)
        PersistenceLayer->>Database: SELECT ID, TITLE FROM LIBRARY.BOOK WHERE ID = ?
        Database-->>PersistenceLayer: Book row
        PersistenceLayer-->>IPersistenceLayer: Book object
        IPersistenceLayer-->>LibraryBookListServlet: Book object
        LibraryBookListServlet-->>Client: 200 OK - [Book JSON]
        
    else Only title provided
        LibraryBookListServlet->>IPersistenceLayer: findBooksByTitle(title)
        IPersistenceLayer->>PersistenceLayer: findBooksByTitle(title)
        PersistenceLayer->>Database: SELECT ID, TITLE FROM LIBRARY.BOOK WHERE TITLE LIKE ?
        Database-->>PersistenceLayer: List of Book rows
        PersistenceLayer-->>IPersistenceLayer: List of Book objects
        IPersistenceLayer-->>LibraryBookListServlet: List of Book objects
        LibraryBookListServlet-->>Client: 200 OK - [Books JSON array]
        
    else No parameters provided
        LibraryBookListServlet->>IPersistenceLayer: getAllBooks()
        IPersistenceLayer->>PersistenceLayer: getAllBooks()
        PersistenceLayer->>Database: SELECT ID, TITLE FROM LIBRARY.BOOK
        Database-->>PersistenceLayer: All Book rows
        PersistenceLayer-->>IPersistenceLayer: List of Book objects
        IPersistenceLayer-->>LibraryBookListServlet: List of Book objects
        LibraryBookListServlet-->>Client: 200 OK - [All Books JSON array]
    end
```