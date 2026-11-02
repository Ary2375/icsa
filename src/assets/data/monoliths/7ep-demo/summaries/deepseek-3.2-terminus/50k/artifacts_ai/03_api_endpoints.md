| Component Name | HTTP Method | Endpoint Path | Brief Description |
|----------------|-------------|---------------|-------------------|
| Authentication | POST | `/demo/login` | User authentication with username and password |
| Authentication | POST | `/demo/register` | User registration with password validation |
| Library Management | POST | `/demo/registerbook` | Register a new book in the library |
| Library Management | POST | `/demo/registerborrower` | Register a new library borrower |
| Library Management | POST | `/demo/lend` | Lend a book to a borrower |
| Library Management | GET | `/demo/book` | Search for books by ID, title, or list all books |
| Library Management | GET | `/demo/borrower` | Search for borrowers by ID, name, or list all borrowers |
| Library Management | GET | `/demo/listavailable` | List all available books (not currently loaned) |
| Mathematics | POST | `/demo/math` | Perform basic arithmetic operations (addition) |
| Mathematics | POST | `/demo/fibonacci` | Calculate Fibonacci sequence with algorithm choice |
| Mathematics | POST | `/demo/ackermann` | Compute Ackermann function with algorithm choice |
| System Management | GET | `/demo/flyway` | Trigger database migrations and clean operations |
| System Management | GET | `/demo/db` | Perform database operations |
| System Management | GET | `/demo/console/*` | Access H2 database console for database inspection |