
```mermaid
graph TB
    %% Web Layer
    Client --> WebLayer
    WebLayer --> AuthAPIs
    WebLayer --> LibraryAPIs
    WebLayer --> MathAPIs
    WebLayer --> AdminAPIs
    
    AuthAPIs[Auth APIs<br/>RegisterServlet<br/>LoginServlet] --> AuthUtils
    LibraryAPIs[Library APIs<br/>Register/Lend/Search Servlets] --> LibraryUtils
    MathAPIs[Math APIs<br/>MathServlet<br/>FibServlet<br/>AckServlet] --> MathUtils
    AdminAPIs[Admin APIs<br/>DbServlet] --> PersistenceLayer
    
    %% Business Logic Layer
    AuthUtils[Auth Utils<br/>RegistrationUtils<br/>LoginUtils] --> DomainObjects
    LibraryUtils[Library Utils<br/>LibraryUtils] --> DomainObjects
    MathUtils[Math Utils<br/>Calculator<br/>Fibonacci<br/>Ackermann] --> DomainObjects
    
    %% Data Layer
    AuthUtils --> PersistenceLayer
    LibraryUtils --> PersistenceLayer
    
    PersistenceLayer[Persistence Layer<br/>PersistenceLayer<br/>IPersistenceLayer] --> Database
    Database[(H2 Database)]
    
    %% External Integrations
    AuthUtils --> Nbvcxz[Nbvcxz<br/>Password Validation]
    AdminAPIs --> Flyway[FlywayDB<br/>Migration]
    WebLayer --> Tomcat[Tomcat Container]
    
    %% Domain Objects
    DomainObjects[Domain Objects<br/>User, Book, Borrower<br/>Loan, Results, etc.]
```

The component boundaries are organized following the layered architecture pattern, with clear separation between the presentation layer (servlets handling HTTP requests), business logic layer (utils containing domain rules), and persistence layer (database operations). Communication flows downward through the layers, with servlets delegating to appropriate utility classes, which in turn interact with the shared persistence layer for data operations, while external integrations provide specialized functionality like password validation and database migration.