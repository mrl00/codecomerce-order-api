# POST /auth/login — valid credentials
POST http://localhost:3000/auth/login
Content-Type: application/json
{"username": "admin", "password": "password"}

HTTP 201
[Asserts]
jsonpath "$.access_token" exists

# POST /auth/login — invalid credentials
POST http://localhost:3000/auth/login
Content-Type: application/json
{"username": "admin", "password": "wrong"}

HTTP 401
