
| Component Name | Responsibility | Interfaces (key endpoints or methods) | Depends On | Technologies |
|---|---|---|---|---|
| MathServlet | Handles mathematical operations | POST /math | Calculator | Servlet API, Tomcat 9 |
| Calculator | Basic arithmetic with overflow checking | add(int a, int b) | None | Java 11 |
| FibServlet | Handles Fibonacci calculations | POST /fibonacci | Fibonacci, FibonacciIterative | Servlet API, Tomcat 9 |
| Fibonacci | Recursive Fibonacci calculation | fibonacci(int n) | None | Java 11 |
| FibonacciIterative | Optimized Fibonacci implementations | fibonacciMatrixExponentiation(int n), fibonacciDynamicProgramming(int n) | None | Java 11 |
| AckServlet | Handles Ackermann function calculations | POST /ackermann | Ackermann, AckermannIterative | Servlet API, Tomcat 9 |
| Ackermann | Recursive Ackermann function implementation | ackermann(int m, int n) | None | Java 11 |
| AckermannIterative | Tail-recursive optimization for Ackermann | ackermannTailRecursive(int m, int n) | TailRecursive | Java 11 |
| TailRecursive | Generic tail recursion utility | apply(T input) | None | Java 11, Functional Interfaces |
| FunctionalField | Generic functional interface for enum-based field access | getField(E enum) | None | Java 11, Functional Interfaces |
| CartesianProduct | Utility for generating test case combinations | generate(List<List<T>> lists) | None | Java 11 |
| AlcoholCalculator | Restaurant bill splitting (food vs alcohol portions) | calculate(Bill bill) | None | Java 11 |
| LibraryLendServlet | Book lending endpoint | POST /lend | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryRegisterBookServlet | Book registration endpoint | POST /registerbook | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryRegisterBorrowerServlet | Borrower registration endpoint | POST /registerborrower | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryBookListSearchServlet | Book search/listing endpoint | GET /book | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryBookListAvailableServlet | Available books endpoint | GET /listavailable | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryBorrowerListSearchServlet | Borrower search/listing endpoint | GET /borrower | LibraryUtils | Servlet API, Tomcat 9 |
| LibraryUtils | Core business logic for book/borrower operations | lendBook(), registerBook(), registerBorrower() | IPersistenceLayer | Java 11 |
| LoginServlet | User authentication endpoint | POST /login | LoginUtils | Servlet API, Tomcat 9 |
| RegisterServlet | User registration endpoint | POST /register | RegistrationUtils | Servlet API, Tomcat 9 |
| LoginUtils | Authentication business logic | authenticate() | IPersistenceLayer | Java 11 |
| RegistrationUtils | Registration business logic with password validation | registerUser() | IPersistenceLayer, Nbvcxz library | Java 11 |
| DbServlet | Database management endpoint | GET /flyway | PersistenceLayer | Servlet API, Tomcat 9, FlywayDB |
| PersistenceLayer | Main database interaction class implementing CRUD operations | CRUD operations | IPersistenceLayer, SqlData | Java 11, H2 Database |
| IPersistenceLayer | Interface defining persistence contracts | CRUD method definitions | None | Java 11 |
| SqlData | Micro-ORM for SQL operations | executeQuery(), executeUpdate() | ParameterObject | Java 11, H2 Database |
| ParameterObject | Type-safe parameter container | addParameter(), getParameters() | None | Java 11 |
| EmptyDataSource | Null object for DataSource | getConnection() | None | Java 11, Null Object Pattern |
| AutoInsuranceProcessor | Premium calculation based on claims and age | calculatePremium() | None | Java 11 |
| AutoInsuranceScriptServer | Socket server for UI automation | startServer(int port) | None | Java 11, Swing, Sockets |
| AutoInsuranceScriptClient | Script client for UI automation | sendCommand(String command) | None | Java 11, Sockets |