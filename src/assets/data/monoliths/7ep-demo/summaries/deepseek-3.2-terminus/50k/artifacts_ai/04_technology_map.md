```markdown
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|---------------|----------|------------|----------|---------------|----------|
| Authentication Domain | Java | Java Servlets, JSP, Nbvcxz (password entropy) | H2 (AUTH.USER table) | HTTP (POST /login, POST /register) | Layered Architecture, Data Access Object, Template Method |
| Library Management Domain | Java | Java Servlets, JSP | H2 (LIBRARY.BOOK, LIBRARY.BORROWER, LIBRARY.LOAN tables) | HTTP (POST /registerbook, POST /registerborrower, POST /lend, GET /book, GET /borrower, GET /listavailable) | Domain-Driven Design, Data Access Object, Layered Architecture |
| Mathematics Domain | Java | Java Servlets, JSP | Stateless (no persistent storage) | HTTP (POST /math, POST /fibonacci, POST /ackermann) | Algorithm Strategy, Recursive/Iterative Patterns, Stateless Service |
| Expenses Module | Java | Java Servlets, JSP | Stateless (in-memory calculations) | HTTP (via Mathematics endpoints) | Business Logic Component, Calculation Engine |
| Cartesian Product Module | Java | Java Servlets, JSP | Stateless (set operations) | HTTP (via Mathematics endpoints) | Algorithm Component, Combinatorial Pattern |
| Auto Insurance Module | Java | Swing (UI), Socket Server | In-memory (policy calculations) | Socket (Port 8000, text protocol) | Desktop MVC, Client-Server, Business Rules Engine |
| Persistence Layer | Java | JDBC, Flyway, H2 JdbcConnectionPool | H2 Database (multiple schemas) | JDBC, Direct Method Calls | Data Access Object, Micro-ORM, Repository Pattern |
| Helper Utilities | Java | Apache Commons Lang, Log4j2, SLF4J | N/A | Direct Method Calls | Utility Pattern, Helper Classes, Cross-cutting Concerns |
| Web Infrastructure | Java | Tomcat (Servlet 2.4), JSP | N/A | HTTP, Server-Side Rendering | MVC, Front Controller (Servlets), Template View (JSP) |
| Testing Framework | Java, Python, C#, JavaScript | JUnit 4, TestNG, Mockito, Cucumber, Selenium, Mocha, NUnit | H2 (in-memory for tests) | HTTP, Direct Calls, Database Connections | BDD, Page Object Model, Integration Testing, Multi-language Test Suite |
```