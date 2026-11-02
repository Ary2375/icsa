```markdown
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|----------------|----------|------------|----------|---------------|----------|
| Main Web Application | Java 11 | Java Servlets, JSP, Flyway, Log4j2 | H2 Database (in-memory/file) | HTTP/REST, JDBC | Layered Architecture, MVC, Domain-Driven Design, Dependency Injection |
| Authentication Domain | Java 11 | Java Servlets, Nbvcxz (password strength) | H2 Database (AUTH schema) | HTTP/REST, JDBC | Business Logic Layer, Immutable Objects, Constructor Injection |
| Library Management Domain | Java 11 | Java Servlets | H2 Database (LIBRARY schema) | HTTP/REST, JDBC | CRUD Operations, Domain Models, Data Access Object (DAO) |
| Mathematics Domain | Java 11 | Java Servlets | None (stateless) | HTTP/REST | Algorithm Patterns, Functional Programming, Tail Recursion |
| Persistence Layer | Java 11 | Flyway Migrations, H2 JDBC | H2 Database (multiple schemas) | JDBC | Data Access Object (DAO), Repository Pattern, Connection Pooling |
| Desktop Application | Java 11 | Swing UI | None | Socket Communication | MVC, Client-Server, Business Logic Layer |
| Testing Infrastructure | Java 11, Python 3.7+, C#, JavaScript | JUnit, Mockito, Cucumber, Selenium, Behave | H2 (test instances) | HTTP, WebDriver, Direct Calls | TDD/BDD, Page Object Model, Multi-language Testing |
| Build & Deployment | Groovy (Gradle) | Gradle Wrapper, Tomcat 9, Jenkins | N/A | File System, HTTP | CI/CD Pipeline, Multi-project Build, Containerization |
| Mathematics Service (Potential) | Java 11 | REST API | None | HTTP/REST | Stateless Service, Algorithm Optimization, BigInteger Handling |
| Library Service (Potential) | Java 11 | REST API | H2/PostgreSQL | HTTP/REST | Domain Service, Business Rules Enforcement, CRUD Operations |
| Authentication Service (Potential) | Java 11 | REST API | H2/PostgreSQL | HTTP/REST | Security Service, Password Hashing, Credential Validation |
```