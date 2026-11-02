
| Component Name | HTTP Method | Endpoint Path | Brief Description |
|----------------|-------------|---------------|-------------------|
| Authentication Service | POST | /login | User authentication with username and password validation |
| Authentication Service | POST | /register | New user registration with password policy enforcement |
| Library Management Service | POST | /registerbook | Book registration with title parameter |
| Library Management Service | POST | /registerborrower | Borrower registration with name parameter |
| Library Management Service | POST | /lend | Book checkout with book, borrower, and date parameters |
| Library Management Service | POST | /lendbook | Alternative book checkout endpoint |
| Library Management Service | GET | /book | Book search by ID or title with optional parameters |
| Library Management Service | GET | /borrower | Borrower search by ID or name with optional parameters |
| Library Management Service | GET | /listavailable | Listing of all available books for lending |
| Mathematics Service | POST | /math | Integer addition with item_a and item_b parameters |
| Mathematics Service | POST | /fibonacci | Fibonacci sequence calculation with n and algorithm selection |
| Mathematics Service | POST | /ackermann | Ackermann function computation with m, n, and algorithm selection |
| Persistence Layer | POST | /flyway | Database management endpoint for Flyway migrations |