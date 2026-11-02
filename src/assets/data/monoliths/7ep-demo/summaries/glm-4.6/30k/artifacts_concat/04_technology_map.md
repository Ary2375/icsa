
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|----------------|----------|------------|----------|---------------|----------|
| Authentication System | Java | Java Servlets | H2 | HTTP POST (/login, /register) | Layered Architecture, Utility Classes |
| Library Management System | Java | Java Servlets | H2 | HTTP (/book, /borrower, /lend) | Layered Architecture, Domain Objects |
| Mathematics Service | Java | Java Servlets | None | HTTP POST (/demo/math, /demo/fib, /demo/ack) | Stateless Service, Algorithm Selection |
| Expense Calculation | Java | None | None | None | Utility Class Pattern |
| Desktop Application (Auto Insurance) | Java | Swing | None | Socket (port 8000) | Desktop UI, Event-Driven |
| Persistence Layer | Java | Flyway, H2 | H2 | JDBC | Repository Pattern, Interface-Based Design |
| Testing Infrastructure | Java, Python, C#, JavaScript | JUnit, Mockito, Selenium, Behave, Cucumber, pytest | H2 Test DB | HTTP, WebDriver Protocol | Test Pyramid, Page Object Model |
| API Layer | Java | Java Servlets | H2 | HTTP (GET/POST) | REST-like Endpoints |
| CI/CD Pipeline | Groovy | Jenkins, SonarQube, OWASP Dependency Check, JMeter | None | Git Hooks, HTTP APIs | Pipeline as Code, Quality Gates |
| UI Testing Infrastructure | Java, Python, C#, JavaScript | Selenium, Behave, Pytest | H2 | WebDriver Protocol | Cross-Language Testing, Page Object Model |