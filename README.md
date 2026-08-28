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
    http://localhost:5173/ — accessible only from your Mac. Use this normally.
    http://10.0.120.218:5173/ — your Mac’s local network address. Other devices on the same Wi-Fi/LAN may use it.
    http://198.18.0.1:5173/ — a virtual network interface, commonly created by a VPN, VM, container, or development tool. You can usually ignore it.
```

Open `http://localhost:5173`.

### Stop the backend when port 8080 is already in use

Only one process can listen on port 8080. If Spring Boot reports `Port 8080
was already in use`, find the process that currently owns the port:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

The output includes a PID, for example:

```text
COMMAND   PID      USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
java    22856  username   93u  IPv6  ...         0t0  TCP *:8080 (LISTEN)
```

Stop that exact process with a normal termination signal:

```bash
kill 22856
```

Replace `22856` with the PID shown on your computer. Confirm that the port is
free before restarting the backend:

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

No output means the port is free. You can then run:

```bash
cd backend
./mvnw spring-boot:run
```

If the process does not stop after a few seconds, use `kill -9 <PID>` only as a
last resort because it prevents the application from shutting down cleanly.
Also check that the backend is not running simultaneously from both IntelliJ
and a terminal.

The login page uses the initial administrator account below:

```text
username: admin
password: admin
```

The password is stored in PostgreSQL as a BCrypt hash. Before deploying a new
database, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the runtime environment;
do not expose the default password on a public deployment. Set
`SESSION_COOKIE_SECURE=true` when the application is served over HTTPS.

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
