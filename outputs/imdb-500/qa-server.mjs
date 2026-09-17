// Isolated, disposable H2 database for browser verification. No PostgreSQL access.
import { spawn } from 'node:child_process'
import { openSync, closeSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js'
const project = fileURLToPath(new URL('../../', import.meta.url))
const log = openSync(new URL('qa-backend.log', import.meta.url), 'w')
const backend = spawn('./mvnw', ['spring-boot:run', '-Dspring-boot.run.useTestClasspath=true', '-Dspring-boot.run.profiles=test', '-Dspring-boot.run.arguments=--server.port=8081 --spring.datasource.url=jdbc:h2:mem:poster_qa --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password=qa --spring.jpa.hibernate.ddl-auto=create-drop --spring.sql.init.mode=never --spring.jpa.show-sql=false --app.admin.username=admin --app.admin.password=admin'], {
  cwd: `${project}/backend`, detached: true, stdio: ['ignore', log, log],
})
closeSync(log)
const server = await createServer({ root: `${project}/frontend`, server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy: { '/api': { target: 'http://localhost:8081', changeOrigin: true } } } })
await server.listen()
console.log('QA frontend: http://127.0.0.1:5174. Test backend: port 8081. Database: disposable in-memory H2.')
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await server.close()
  try { process.kill(-backend.pid, 'SIGTERM') } catch {}
  process.exit(0)
})
