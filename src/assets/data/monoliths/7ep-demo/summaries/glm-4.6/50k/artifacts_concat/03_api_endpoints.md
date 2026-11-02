
| Component Name | HTTP Method | Endpoint Path | Brief Description |
|---------------|-------------|---------------|------------------|
| Authentication Service | POST | /login | User authentication |
| Authentication Service | POST | /register | New user registration |
| Library Service | POST | /registerbook | Book registration |
| Library Service | POST | /registerborrower | Borrower registration |
| Library Service | POST | /lend | Book checkout/loan |
| Library Service | GET | /library/book/list | Book catalog |
| Library Service | GET | /book | List/search books |
| Library Service | GET | /borrower | List/search borrowers |
| Library Service | GET | /listavailable | Available books |
| Mathematics Service | POST | /math | Integer addition |
| Mathematics Service | POST | /fibonacci | Fibonacci sequence |
| Mathematics Service | POST | /ackermann | Ackermann function |
| Persistence Layer | GET | /flyway | Database management (clean|migrate) |