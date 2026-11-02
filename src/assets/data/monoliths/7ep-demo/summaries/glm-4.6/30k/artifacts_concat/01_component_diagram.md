
```mermaid
graph TB
    %% Frontend Layer
    UI[Static HTML/CSS/JS<br/>library.js, catalog.js] --> WebLayer
    JSP[JSP Templates<br/>result.jsp, restfulresult.jsp] --> WebLayer
    DesktopUI[Swing Desktop UI<br/>AutoInsuranceUI] --> DesktopService
    
    %% Web Layer (Servlets)
    subgraph "Web Layer (Servlets)"
        WebLayer
        AuthServlets[Authentication Servlets<br/>LoginServlet, RegisterServlet]
        LibraryServlets[Library Servlets<br/>LibraryLendServlet, LibraryBookListServlet, etc.]
        MathServlets[Math Servlets<br/>MathServlet, FibServlet, AckServlet]
        DbServlet[Database Servlet<br/>DbServlet, WebAppListener]
    end
    
    %% Business Logic Layer
    subgraph "Business Logic Layer"
        AuthUtils[Authentication Utils<br/>LoginUtils, RegistrationUtils]
        LibraryUtils[Library Utils<br/>LibraryUtils]
        MathService[Math Service<br/>Calculator, Fibonacci, Ackermann]
        OtherServices[Specialized Services<br/>AlcoholCalculator, AutoInsuranceProcessor]
    end
    
    %% Domain Objects
    subgraph "Domain Objects"
        AuthDomain[Auth Domain<br/>User, RegistrationResult, PasswordResult]
        LibraryDomain[Library Domain<br/>Book, Borrower, Loan, LibraryActionResults]
        MathDomain[Math Domain<br/>Calculation Results]
        InsuranceDomain[Insurance Domain<br/>AutoInsuranceAction, WarningLetterEnum]
    end
    
    %% Persistence Layer
    subgraph "Persistence Layer"
        PersistenceInterface[IPersistenceLayer Interface]
        PersistenceImpl[PersistenceLayer Implementation]
        SqlLayer[SQL Execution Layer<br/>SqlData, ParameterObject]
    end
    
    %% Database Layer
    subgraph "Database"
        H2DB[(H2 Database<br./build/db/training)]
        Flyway[Flyway Migrations<br/>V1__*, V2__*]
    end
    
    %% Connections
    AuthServlets --> AuthUtils
    LibraryServlets --> LibraryUtils
    MathServlets --> MathService
    DbServlet --> PersistenceInterface
    
    AuthUtils --> AuthDomain
    LibraryUtils --> LibraryDomain
    MathService --> MathDomain
    OtherServices --> InsuranceDomain
    
    AuthUtils --> PersistenceInterface
    LibraryUtils --> PersistenceInterface
    MathService --> AuthDomain
    
    PersistenceInterface --> PersistenceImpl
    PersistenceImpl --> SqlLayer
    SqlLayer --> H2DB
    
    Flyway --> H2DB
    DbServlet --> Flyway
```

The architecture follows a layered pattern with clear separation between web presentation, business logic, and data persistence. Component boundaries align with business domains (authentication, library management, mathematics), each with dedicated servlets, utilities, and domain objects. Communication flows synchronously from servlets through business logic to the persistence layer, with the database abstracted behind an interface that enables clean separation of concerns.