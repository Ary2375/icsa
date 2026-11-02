
| Component Name | Responsibility | Interfaces (key endpoints or methods) | Depends On | Technologies (frameworks, DBs, patterns) |
|---|---|---|---|---|
| Authentication Service | User identity management, credential validation, password policy enforcement. | `POST /login`, `POST /register` | Persistence Layer, Shared Utilities | Java Servlets, JSP, Nbvcxz, H2, Flyway |
| Library Management Service | Book and borrower lifecycle management, loan tracking, catalog operations. | `POST /registerbook`, `POST /registerborrower`, `POST /lend`, `GET /book`, `GET /borrower`, `GET /listavailable` | Persistence Layer, Shared Utilities | Java Servlets, JSP, H2, Flyway |
| Mathematics Service | Mathematical computations with multiple algorithm implementations. | `POST /math`, `POST /fibonacci`, `POST /ackermann` | Shared Utilities | Java Servlets, JSP, BigInteger |
| Desktop Application Module | Auto insurance premium calculation and UI automation. | Swing UI, Socket Server (port 8000) | (None - standalone) | Java Swing, Socket Programming |
| Persistence Layer | Database abstraction, query execution, result set processing, data migration. | `IPersistenceLayer`, `SqlData`, `ParameterObject`, `GET /flyway` | H2 Database, Flyway | H2 Database, Flyway, Micro-ORM, Connection Pooling |
| Shared Utilities | Common functions for string manipulation, input validation, date operations, servlet forwarding. | `StringUtils`, `CheckUtils`, `DateUtils`, `ServletUtils` | (None - utility library) | Java Standard Library |