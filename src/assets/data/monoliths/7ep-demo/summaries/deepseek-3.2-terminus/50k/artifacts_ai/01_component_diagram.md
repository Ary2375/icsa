```markdown
1. ```mermaid
graph TB
    %% Client Layer
    WebClient[Web Client]
    DesktopClient[Desktop Client]
    
    %% Presentation Layer
    AuthServlets[Authentication Servlets<br/>LoginServlet, RegisterServlet]
    LibraryServlets[Library Servlets<br/>LibraryRegisterBookServlet,<br/>LibraryLendServlet, etc.]
    MathServlets[Mathematics Servlets<br/>MathServlet, FibServlet, AckServlet]
    SystemServlets[System Servlets<br/>DbServlet]
    
    %% Business Logic Layer
    AuthUtils[Authentication Utils<br/>LoginUtils, RegistrationUtils]
    LibraryUtils[Library Utils<br/>LibraryUtils]
    MathAlgos[Mathematics Algorithms<br/>Calculator, Fibonacci, Ackermann]
    InsuranceProcessor[Auto Insurance Processor]
    
    %% Specialized Modules
    ExpenseCalc[Expenses Module<br/>AlcoholCalculator]
    CartesianProduct[Cartesian Product Module]
    
    %% Infrastructure Layer
    PersistenceLayer[Persistence Layer<br/>PersistenceLayer]
    HelperUtils[Helper Utilities<br/>ServletUtils, StringUtils, CheckUtils]
    
    %% External Systems
    H2DB[(H2 Database)]
    SocketServer[Auto Insurance<br/>Socket Server]
    
    %% Client Interactions
    WebClient --> AuthServlets
    WebClient --> LibraryServlets
    WebClient --> MathServlets
    WebClient --> SystemServlets
    DesktopClient --> SocketServer
    
    %% Servlet to Business Logic
    AuthServlets --> AuthUtils
    LibraryServlets --> LibraryUtils
    MathServlets --> MathAlgos
    SocketServer --> InsuranceProcessor
    
    %% Business Logic to Persistence
    AuthUtils --> PersistenceLayer
    LibraryUtils --> PersistenceLayer
    
    %% Helper Dependencies
    AuthServlets --> HelperUtils
    LibraryServlets --> HelperUtils
    MathServlets --> HelperUtils
    SystemServlets --> HelperUtils
    
    %% Persistence to Database
    PersistenceLayer --> H2DB
    
    %% Specialized Calculations
    MathAlgos --> CartesianProduct
    MathAlgos --> ExpenseCalc

2. Component boundaries are organized by functional domains (Authentication, Library, Mathematics) with clear separation between presentation (Servlets), business logic (Utils), and persistence layers. Communication follows synchronous HTTP for web interfaces and direct method calls for internal business logic, with a dedicated socket protocol for desktop automation. The persistence layer serves as a shared infrastructure component accessed by multiple business domains through a unified interface.
```