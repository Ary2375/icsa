
# Component Architecture Diagram

```mermaid
graph TB
    %% Client Layer
    Client[Client Browser] --> WebServer[Tomcat Web Server]
    DesktopClient[Desktop App Client] --> SocketServer[Socket Server:8000]
    
    %% Web Layer - Servlet Controllers
    WebServer --> AuthServlets[Authentication Servlets<br/>LoginServlet<br/>RegisterServlet]
    WebServer --> LibraryServlets[Library Servlets<br/>LibraryLendServlet<br/>LibraryRegisterBookServlet<br/>LibraryRegisterBorrowerServlet<br/>LibraryBookListSearchServlet<br/>LibraryBookListAvailableServlet<br/>LibraryBorrowerListSearchServlet]
    WebServer --> MathServlets[Mathematical Servlets<br/>MathServlet<br/>FibServlet<br/>AckServlet]
    WebServer --> DbServlet[DbServlet<br/>Flyway Migrations]
    WebServer --> Console[H2 Console]
    
    %% Business Logic Layer - Utils
    AuthServlets --> AuthUtils[Authentication Utils<br/>LoginUtils<br/>RegistrationUtils]
    LibraryServlets --> LibraryUtils[LibraryUtils<br/>Business Logic]
    MathServlets --> MathServices[Mathematical Services<br/>Calculator<br/>Fibonacci<br/>Ackermann<br/>TailRecursive]
    
    %% Persistence Layer
    AuthUtils --> PersistenceLayer[Persistence Layer]
    LibraryUtils --> PersistenceLayer
    PersistenceLayer --> IPersistenceLayer[IPersistenceLayer Interface]
    IPersistenceLayer --> SqlData[SqlData<br/>Micro-ORM]
    IPersistenceLayer --> ParameterObject[ParameterObject]
    
    %% Database Layer
    SqlData --> Database[(H2 Database<br/>AUTH Schema<br/>LIBRARY Schema<br/>ADMINISTRATIVE Schema)]
    
    %% Desktop Application Components
    SocketServer --> AutoInsuranceProcessor[AutoInsuranceProcessor<br/>Premium Calculation]
    
    %% External Integrations
    AuthUtils --> Nbvcxz[Nbvcxz<br/>Password Validation]
    WebServer -.-> ZAP[OWASP ZAP Proxy:8888]
    
    %% Security & Infrastructure
    Database --> Flyway[FlywayDB<br/>Schema Migrations]
    
    %% Testing Infrastructure (dashed for non-runtime)
    classDef testing fill:#e1f5fe,stroke:#01579b,stroke-dasharray: 5 5
    Testing[Testing Infrastructure<br/>JUnit/Mockito<br/>Cucumber<br/>Selenium<br/>JMeter]:::testing
    Testing -.-> WebServer
    Testing -.-> Database
    Testing -.-> DesktopClient
```

## Rationale

The architecture follows a layered pattern with clear separation of concerns: presentation layer (servlets) handles HTTP requests, business logic layer (utils) contains domain-specific operations, and persistence layer manages data access through a DAO pattern. Communication flows vertically from client to database, with horizontal integration through external security and testing components, while the desktop application uses socket-based communication to maintain independence from the web tier.