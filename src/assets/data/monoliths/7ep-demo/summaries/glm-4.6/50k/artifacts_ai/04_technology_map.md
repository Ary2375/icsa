
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|---|---|---|---|---|---|
| Authentication Service | Java | Servlet API | H2 Database | HTTP Servlet (POST) | MVC, Session Management |
| Library Management Service | Java | Servlet API | H2 Database | HTTP Servlet (GET/POST), JSON | MVC, Repository Pattern |
| Mathematics Service | Java | Servlet API | None (stateless) | HTTP Servlet (POST) | Strategy Pattern, MVC |
| Desktop Application Module | Java | Java Swing | None | Socket (port 8000) | MVC, Client-Server |
| Persistence Layer | Java | Flyway, H2 | H2 Database | JDBC | DAO, Micro-ORM, Abstract Factory |
| Web Infrastructure | Java | Servlet API, JSP | None | HTTP | MVC, Front Controller |
| Testing Architecture | Java, Python, JavaScript | JUnit 5, Mockito, Cucumber, Behave, pytest, Selenium | H2 (in-memory) | HTTP, Selenium Grid | Test Pyramid, Page Object Model, BDD |
| CI/CD Pipeline | Groovy | Jenkins, Gradle, SonarQube, OWASP DependencyCheck, JMeter, PITest | None | Jenkins API, HTTP | Pipeline as Code, Quality Gates |