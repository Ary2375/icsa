
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|---|---|---|---|---|---|
| Authentication Service | Java | Servlet API (Tomcat), Nbvcxz | H2 (auth.user table) | HTTP/REST (/login, /register) | Layered Architecture, DAO, Null Object |
| Library Management | Java | Servlet API (Tomcat) | H2 (library.book, borrower, loan) | HTTP/REST (/lend, /registerbook, /borrower, /book) | Layered Architecture, DAO, Transactional |
| Mathematics Service | Java | Servlet API (Tomcat) | None (stateless) | HTTP/REST (/math, /fibonacci, /ackermann) | Stateless, Algorithm Optimization, Functional |
| Persistence Layer | Java | H2, FlywayDB, JdbcConnectionPool | H2 (multi-schema) | JDBC/Internal | DAO, Micro-ORM, Template Method, Null Object |
| Administrative Service | Java | Servlet API (Tomcat), FlywayDB | H2 (flyway_schema_history) | HTTP/REST (/flyway) | Administrative Interface, Migration |
| Desktop Application | Java | Swing, Socket Server | H2 (file-based) | Socket (port 8000) | Desktop UI, Client-Server, Automation |