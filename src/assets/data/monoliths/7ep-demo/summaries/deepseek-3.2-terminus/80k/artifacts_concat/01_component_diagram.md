```mermaid
graph TB
    %% Web Application Components
    WebApp[Web Application<br/>Tomcat Servlet Container]
    
    %% Presentation Layer
    AuthServlets[Authentication Servlets<br/>LoginServlet/RegisterServlet]
    LibraryServlets[Library Servlets<br/>Library*Servlet classes]
    MathServlets[Mathematics Servlets<br/>MathServlet/FibServlet/AckServlet]
    DbServlet[Database Servlet<br/>DbServlet]
    
    %% Business Logic Layer
    AuthLogic[Authentication Logic<br/>LoginUtils/RegistrationUtils]
    LibraryLogic[Library Logic<br/>LibraryUtils]
    MathLogic[Mathematics Logic<br/>Fibonacci/Ackermann/Algorithms]
    InsuranceLogic[Insurance Logic<br/>AutoInsuranceProcessor]
    
    %% Persistence Layer
    Persistence[Persistence Layer<br/>PersistenceLayer/IPersistenceLayer]
    
    %% Database
    DB[(H2 Database<br/>USER/BOOK/BORROWER/LOAN)]
    
    %% Desktop Application
    Desktop[Desktop Application<br/>AutoInsuranceUI]
    SocketServer[Socket Server<br/>AutoInsuranceScriptServer]
    
    %% Testing Infrastructure
    Tests[Testing Infrastructure<br/>Unit/Integration/BDD/UI Tests]
    
    %% Interactions
    WebApp --> AuthServlets
    WebApp --> LibraryServlets
    WebApp --> MathServlets
    WebApp --> DbServlet
    
    AuthServlets --> AuthLogic
    LibraryServlets --> LibraryLogic
    MathServlets --> MathLogic
    
    AuthLogic --> Persistence
    LibraryLogic --> Persistence
    MathLogic --> Persistence
    InsuranceLogic --> Persistence
    
    Persistence --> DB
    
    Desktop --> SocketServer
    SocketServer --> InsuranceLogic
    
    Tests -.-> WebApp
    Tests -.-> Desktop
```

The component boundaries follow a classic layered architecture with clear separation between presentation (Servlets), business logic (Utils classes), and data access (PersistenceLayer) layers. Communication patterns are primarily synchronous HTTP for web interactions and direct method calls within the JVM, with the persistence layer serving as a shared dependency across all business domains. The desktop application communicates via socket connections to the insurance processing logic, while comprehensive testing infrastructure validates all components independently.