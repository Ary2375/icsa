
| Component Name | Language | Frameworks | Database | Communication | Patterns |
|---|---|---|---|---|---|
| Authentication Service | Java 11 | Servlets, Tomcat 9, JSP | H2 | HTTP (Servlets/JSP) | Layered Architecture, Domain-Driven Design, Service Locator |
| Library Service | Java 11 | Servlets, Tomcat 9, JSP | H2 | HTTP (Servlets/JSP) | Layered Architecture, Domain-Driven Design, Service Locator |
| Mathematics Service | Java 11 | Servlets, Tomcat 9, JSP | None | HTTP (Servlets/JSP) | Stateless Service, Layered Architecture |
| Persistence Layer | Java 11 | Flyway, JDBC (Micro-ORM) | H2 | Java API (IPersistenceLayer) | Repository Pattern, DAO, Micro-ORM |
| Desktop Application Module | Java 11 | Swing, Server Sockets | None | Sockets (Port 8000) | Desktop Application, Server-Client |
| Web Application Core | Java, HTML, CSS, JS | Tomcat 9, JSP, Log4j2, Gradle | N/A | HTTP | Model-View-Controller (MVC), Front Controller, Listener Pattern |