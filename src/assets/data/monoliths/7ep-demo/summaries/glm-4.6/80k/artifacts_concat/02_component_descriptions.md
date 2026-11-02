
| Component Name | Responsibility | Interfaces (key endpoints or methods) | Depends On | Technologies |
|---|---|---|---|---|
| RegisterServlet | Handles user registration with validation | POST /register | RegistrationUtils, ServletUtils | Java Servlet, Tomcat 9 |
| LoginServlet | Manages user authentication | POST /login | LoginUtils, ServletUtils | Java Servlet, Tomcat 9 |
| RegistrationUtils | User registration workflow with password validation | registerUser(), validatePassword() | IPersistenceLayer, Nbvcxz library | Java, H2, SHA-256 hashing |
| LoginUtils | Credential validation and session management | validateCredentials() | IPersistenceLayer | Java, H2 |
| LibraryRegisterBookServlet | Registers new books in the system | POST /registerbook | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryRegisterBorrowerServlet | Registers new borrowers | POST /registerborrower | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryLendServlet | Processes book loans with availability checks | POST /lend | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryBookListSearchServlet | Lists all books or searches by criteria | GET /book | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryBookListAvailableServlet | Lists only available books | GET /listavailable | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryBorrowerListSearchServlet | Lists all borrowers or searches by criteria | GET /borrower | LibraryUtils | Java Servlet, Tomcat 9 |
| LibraryUtils | Core library business logic for book/borrower management | registerBook(), registerBorrower(), lendBook() | IPersistenceLayer | Java, H2 |
| MathServlet | Performs integer addition with overflow checks | POST /math | Calculator | Java Servlet, Tomcat 9 |
| FibServlet | Calculates Fibonacci numbers | POST /fibonacci | Fibonacci, FibonacciIterative | Java Servlet, Tomcat 9 |
| AckServlet | Calculates Ackermann function | POST /ackermann | Ackermann, AckermannIterative | Java Servlet, Tomcat 9 |
| Calculator | Safe arithmetic operations with overflow protection | add(), checkOverflow() | - | Java |
| Fibonacci | Fibonacci sequence calculations | calculate() | - | Java |
| Ackermann | Recursive Ackermann function implementation | calculate() | - | Java |
| PersistenceLayer | Main database interaction layer | CRUD operations for all entities | IPersistenceLayer, H2 JdbcConnectionPool | Java, H2, JDBC, FlywayDB |
| IPersistenceLayer | Interface defining persistence contracts | Interface definitions | - | Java, Interface pattern |
| DbServlet | Triggers database migration and management | GET /flyway | PersistenceLayer | Java Servlet, Tomcat 9, FlywayDB |
| AutoInsuranceProcessor | Desktop app for insurance premium calculations | processClaims(), determineWarning() | - | Java, Swing |
| ServletUtils | Common servlet utilities | handleResponse(), parseParameters() | - | Java Servlet |
| User | Authentication domain object | User data structure | - | Java, Immutable pattern |
| Book | Library domain object | Book data structure | - | Java, Immutable pattern |
| Borrower | Library domain object | Borrower data structure | - | Java, Immutable pattern |
| Loan | Library domain object representing book loans | Loan data structure | - | Java, Immutable pattern |