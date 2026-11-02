
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|----------------|----------|------------|----------|---------------|----------|
| Authentication System | Java | Java Servlets, Nbvcxz | H2 (USER table) | HTTP Servlets (POST /login, /register) | Layered Architecture, Validation Patterns, SHA-256 Hashing |
| Library Management System | Java | Java Servlets | H2 (BOOK, BORROWER, LOAN tables) | HTTP Servlets (GET/POST /book, /borrower, /lend) | CRUD Operations, Domain-Driven Design, Foreign Key Relationships |
| Mathematics Service | Java | Java Servlets | None (stateless) | HTTP Servlets (POST /demo/math, /fib, /ack) | Algorithm Selection Pattern, Iterative/Recursive Variants |
| Expense Calculation | Java | None | None | Internal Component | Utility Pattern |
| Desktop Application (Auto Insurance) | Java | Swing, Sockets | None | Socket-based (Port 8000) | UI Pattern, Desktop Application, Event-driven |
| Database Migration Service | Java | FlywayDB, Java Servlets | H2 (Flyway schema history) | HTTP Servlets (GET /demo/flyway) | Migration Pattern, Version Control |
| Testing Infrastructure | Java, Python, C#, JavaScript | JUnit 5, Mockito, Selenium, Cucumber, Behave, Pytest, NUnit, Mocha | H2 (Test DB) | HTTP, WebDriver, Socket | Test Pyramid, Multi-language Testing, BDD |
| CI/CD Pipeline | Groovy (Jenkinsfile) | Jenkins, SonarQube, OWASP ZAP, JMeter | None | Git Hooks, HTTP Triggers | Pipeline as Code, Quality Gates |
| Frontend Components | JavaScript, HTML, CSS | Vanilla JS, JSP | None | HTTP Requests/Responses | SPA Pattern, Server-side Rendering |