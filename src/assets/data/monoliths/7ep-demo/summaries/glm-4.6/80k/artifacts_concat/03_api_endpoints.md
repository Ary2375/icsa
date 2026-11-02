
| Component Name | HTTP Method | Endpoint Path | Brief Description |
|---|---|---|---|
| Authentication | POST | /register | Handles user registration |
| Authentication | POST | /login | Handles user authentication |
| Library | POST | /registerbook | Registers new books in the system |
| Library | POST | /registerborrower | Registers new borrowers |
| Library | POST | /lend | Processes book loans |
| Library | GET | /book | Lists all books or searches by id/title |
| Library | GET | /listavailable | Lists only available books |
| Library | GET | /borrower | Lists all borrowers or searches by id/name |
| Mathematics | POST | /math | Adds two integers |
| Mathematics | POST | /fibonacci | Calculates Fibonacci numbers |
| Mathematics | POST | /ackermann | Calculates Ackermann function |
| Administrative | GET | /flyway | Triggers database migration/backup |