```mermaid
graph TB
    %% Web Layer Components
    WebClient[Web Client]
    DesktopClient[Desktop Client]
    
    %% Servlet Endpoints
    AuthServlet[Authentication Servlets<br/>/login, /register]
    LibraryServlet[Library Servlets<br/>/registerbook, /lend, etc.]
    MathServlet[Mathematics Servlets<br/>/math, /fib, /ackermann]
    DbServlet[Database Servlet<br/>/flyway, /db]
    
    %% Business Logic Layer
    AuthUtils[Authentication Utils<br/>LoginUtils, RegistrationUtils]
    LibraryUtils[Library Utils<br/>LibraryUtils]
    MathUtils[Mathematics Utils<br/>Calculator, Fibonacci, Ackermann]
    ExpensesUtils[Expenses Utils<br/>AlcoholCalculator]
    CartesianUtils[Cartesian Product Utils]
    
    %% Persistence Layer
    Persistence[Persistence Layer<br/>IPersistenceLayer]
    Database[(H2 Database)]
    
    %% Desktop Application
    AutoInsuranceUI[AutoInsurance UI]
    AutoInsuranceProcessor[AutoInsurance Processor]
    AutoInsuranceServer[AutoInsurance Server<br/>Port 8000]
    
    %% Helper Components
    ServletUtils[Servlet Utils]
    StringUtils[String Utils]
    CheckUtils[Check Utils]
    
    %% Interactions
    WebClient --> AuthServlet
    WebClient --> LibraryServlet
    WebClient --> MathServlet
    WebClient --> DbServlet
    
    AuthServlet --> AuthUtils
    LibraryServlet --> LibraryUtils
    MathServlet --> MathUtils
    DbServlet --> Persistence
    
    AuthUtils --> Persistence
    LibraryUtils --> Persistence
    MathUtils --> Persistence
    
    Persistence --> Database
    
    DesktopClient --> AutoInsuranceServer
    AutoInsuranceUI --> AutoInsuranceProcessor
    AutoInsuranceServer --> AutoInsuranceProcessor
    
    %% Cross-cutting dependencies
    AuthUtils --> ServletUtils
    LibraryUtils --> ServletUtils
    MathUtils --> ServletUtils
    
    AuthUtils --> StringUtils
    LibraryUtils --> StringUtils
```

The component boundaries follow a classic layered architecture with clear separation between presentation (Servlets), business logic (Utils classes), and data access (PersistenceLayer) layers. Communication patterns are primarily synchronous HTTP for web interactions and direct method calls between layers, with the persistence layer serving as a shared dependency across all business domains. The desktop application operates independently with its own socket-based communication protocol.