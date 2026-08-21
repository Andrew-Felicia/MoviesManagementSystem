![banner](ascii-art-text.png)


# Test
```bash
    1.run tests locally:
    cd backend
    ./mvnw test
    
    2.check test report:
    cd backend
    ./mvnw verify
    open:/movie-library/backend/target/site/jacoco/index.html
```

## Frontend

The React frontend is in `frontend/`. During development, Vite forwards
`/api` requests to the Spring Boot application on port 8080.

```bash
    # terminal 1
    cd backend
    ./mvnw spring-boot:run
    
    # terminal 2
    cd frontend
    npm ci
    npm run dev
```

Open `http://localhost:5173`.

Run the frontend checks with:

```bash
    cd frontend
    npm test
    npm run build
```

The production container builds both projects and serves the frontend and API
from the same Spring Boot application:

```bash
  docker build -f backend/Dockerfile -t movie-library .
```
