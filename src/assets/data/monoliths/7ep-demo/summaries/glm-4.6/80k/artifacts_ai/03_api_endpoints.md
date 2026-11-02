
| Component Name | HTTP Method | Endpoint Path | Brief Description |
|---|---|---|---|
| MathServlet | POST | /math | Calculator service for adding two integers with overflow checking |
| FibServlet | POST | /fibonacci | Fibonacci number calculation with algorithm choice |
| AckServlet | POST | /ackermann | Ackermann function calculation with regular/tail recursive options |
| LibraryLendServlet | POST | /lend | Book lending service that links books to borrowers |
| LibraryRegisterBookServlet | POST | /registerbook | Book registration service with duplicate checking |
| LibraryRegisterBorrowerServlet | POST | /registerborrower | Borrower registration service with duplicate checking |
| LibraryBookListSearchServlet | GET | /book | Book search and listing service by ID or title |
| LibraryBookListAvailableServlet | GET | /listavailable | Lists only available books for lending |
| LibraryBorrowerListSearchServlet | GET | /borrower | Borrower search and listing service by ID or name |
| LoginServlet | POST | /login | User authentication service |
| RegisterServlet | POST | /register | User registration with password validation |
| DbServlet | GET | /flyway | Database migration management (clean/migrate operations) |
| H2 Console | GET | /console | Web-based database administration interface |