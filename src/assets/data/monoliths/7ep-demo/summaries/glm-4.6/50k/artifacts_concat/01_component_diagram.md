
```mermaid
graph TB
    %% Client Layer
    Client[Client/Browser] --> WebInfra[Web Infrastructure]
    AutoClient[Auto Insurance Client] --> DesktopUI[Desktop Application Module]
    
    %% Web Infrastructure
    WebInfra --> |HTTP Requests| AuthServlet[Authentication Servlets]
    WebInfra --> |HTTP Requests| LibraryServlet[Library Servlets]
    WebInfra --> |HTTP Requests| MathServlet[Mathematics Servlets]
    WebInfra --> |HTTP Requests| DbServlet[Database Servlet]
    WebInfra --> ServletUtils[ServletUtils]
    WebInfra --> WebAppListener[WebAppListener]
    
    %% Authentication Service
    AuthServlet --> LoginUtils[LoginUtils]
    AuthServlet --> RegistrationUtils[RegistrationUtils]
    LoginUtils --> Persistence[Persistence Layer]
    RegistrationUtils --> Persistence
    RegistrationUtils --> Nbvcxz[Nbvcxz Password Lib]
    
    %% Library Service
    LibraryServlet --> LibraryUtils[LibraryUtils]
    LibraryUtils --> Persistence
    LibraryUtils --> DateUtils[DateUtils]
    
    %% Mathematics Service
    MathServlet --> Calculator[Calculator]
    MathServlet --> Fibonacci[Fibonacci]
    MathServlet --> Ackermann[Ackermann]
    
    %% Desktop Application Module
    DesktopUI --> AutoInsuranceProcessor[AutoInsurance Processor]
    DesktopUI --> AutoInsuranceScriptServer[Socket Server :8000]
    
    %% Persistence Layer
    Persistence --> SqlData[SqlData]
    Persistence --> ParameterObject[ParameterObject]
    SqlData --> H2DB[(H2 Database)]
    DbServlet --> Flyway[Flyway Migrations]
    Flyway --> H2DB
    
    %% Shared Utilities
    ServletUtils --> StringUtils[StringUtils]
    LibraryUtils --> CheckUtils[CheckUtils]
    LoginUtils --> StringUtils
    
    %% JSP Rendering
    ServletUtils --> ResultJSP[result.jsp]
    ServletUtils --> RestJSP[restfulresult.jsp]
    
    %% Define Subgraphs for Clarity
    subgraph "Web Layer"
        AuthServlet
        LibraryServlet
        MathServlet
        DbServlet
        ServletUtils
        WebAppListener
    end
    
    subgraph "Business Services"
        LoginUtils
        RegistrationUtils
        LibraryUtils
        Calculator
        Fibonacci
        Ackermann
        AutoInsuranceProcessor
    end
    
    subgraph "Data Layer"
        Persistence
        SqlData
        ParameterObject
        H2DB
        Flyway
    end
    
    subgraph "Shared Components"
        StringUtils
        CheckUtils
        DateUtils
        Nbvcxz
    end
```

The component boundaries are organized by domain responsibility with clear separation between web handling, business logic, and data persistence. Communication follows a layered pattern where servlets handle HTTP requests and delegate to service utilities for business operations, which in turn interact with the centralized persistence layer. The architecture uses synchronous request/response flows with the persistence layer as the only shared dependency across services, making it a natural extraction point for microservice decomposition.