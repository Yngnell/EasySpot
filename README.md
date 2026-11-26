# EasySpot API

EasySpot is a parking space reservation system. Drivers can see which parking spaces are free in real time and reserve one before they arrive. Attendants check cars in and out, and admins manage users, parking lots and spaces.

This repository holds the **backend** (REST API) for the ITEC 116 Final Project: Systems Integration Backend Prototype.

- **Author:** Jonnel S. Dagohoy (BSIT 4B)
- **Course:** ITEC 116, IT Elective 4 (Systems Integration and Architecture 2)

## Tech stack

| Component | Technology |
|---|---|
| Backend framework | NestJS 12 (TypeScript) |
| ORM | TypeORM |
| Database | MySQL (XAMPP / phpMyAdmin) |
| Authentication | JWT (`@nestjs/jwt`) + bcrypt password hashing (`bcryptjs`) |
| Validation | `class-validator` / `class-transformer` |
| API testing | Postman (collection in [`postman/`](postman/)) |
| Unit tests | Vitest |

## Features

- **Authentication:** register, login (returns a JWT), profile. Every route is protected by default; only register, login and `GET /` are public.
- **Role-based access control:** `driver`, `attendant` and `admin` roles. A driver who calls an admin route gets `403 Forbidden`.
- **Users (admin):** full CRUD for user accounts.
- **Parking lots:** CRUD, search, and a list of each lot's spaces.
- **Parking spaces:** CRUD, filters, an available-spaces lookup, and a status update for attendants.
- **Reservations:** book, update, cancel, check-in, and complete (the fee is computed from the lot's hourly rate). Bookings run in a database transaction with a row lock, so two drivers can't book the same space at the same time.
- **Input validation and consistent errors:** `400` validation, `401` no or invalid token, `403` wrong role, `404` not found, `409` conflicts such as a duplicate email or a space that is already booked.

## Architecture

Each request goes through the same layers:

```
Client (Postman) -> Controller -> Service -> Repository (TypeORM) -> MySQL
Client (response) <- Controller <- Service <----------------------- +
```

- **Controller:** receives the HTTP request, validates it through DTOs, and applies the `@Roles()` and `@Public()` rules.
- **Service:** business logic, such as "space must be available" or computing the fee.
- **Repository / entity:** TypeORM maps the classes to MySQL tables.
- **Global guards:** `JwtAuthGuard` checks the token, then `RolesGuard` checks the role.

## Database

| Table | Main columns | Relationships |
|---|---|---|
| `users` | id (PK), full_name, email (unique), password (bcrypt hash), role, phone | 1 user has many reservations |
| `parking_lots` | id (PK), name (unique), address, latitude, longitude, opening_time, closing_time, hourly_rate | 1 lot has many spaces |
| `parking_spaces` | id (PK), lot_id (FK), code, type, status | many spaces belong to 1 lot (`ON DELETE CASCADE`), unique (lot_id, code) |
| `reservations` | id (PK), user_id (FK), space_id (FK), plate_number, start_time, end_time, status, checked_in_at, completed_at, total_fee | many reservations belong to 1 user and 1 space (`ON DELETE RESTRICT`) |

## REST API (31 endpoints)

Base URL: `http://localhost:3000`. Every protected route needs the header `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | API status |
| POST | `/auth/register` | Public | Register a driver account |
| POST | `/auth/login` | Public | Log in and receive `access_token` |
| GET | `/auth/profile` | Logged in | Current user's profile |
| GET | `/users` | Admin | List users |
| GET | `/users/:id` | Admin | Get a user |
| POST | `/users` | Admin | Create a user with any role |
| PATCH | `/users/:id` | Admin | Update a user |
| DELETE | `/users/:id` | Admin | Delete a user |
| GET | `/parking-lots?search=` | Logged in | List or search parking lots |
| GET | `/parking-lots/:id` | Logged in | Get a parking lot |
| GET | `/parking-lots/:lotId/spaces` | Logged in | Spaces of a lot |
| POST | `/parking-lots` | Admin | Create a parking lot |
| PATCH | `/parking-lots/:id` | Admin | Update a parking lot |
| DELETE | `/parking-lots/:id` | Admin | Delete a parking lot |
| GET | `/parking-spaces?lotId=&status=&type=` | Logged in | List or filter spaces |
| GET | `/parking-spaces/available?lotId=&type=` | Logged in | Spaces free right now |
| GET | `/parking-spaces/:id` | Logged in | Get a space |
| POST | `/parking-spaces` | Admin | Create a space |
| PATCH | `/parking-spaces/:id` | Admin | Update a space |
| PATCH | `/parking-spaces/:id/status` | Attendant, Admin | Set a space's status |
| DELETE | `/parking-spaces/:id` | Admin | Delete a space |
| GET | `/reservations?status=&spaceId=&userId=` | Attendant, Admin | List all reservations |
| GET | `/reservations/me` | Logged in | My reservations |
| GET | `/reservations/:id` | Owner, staff | Get a reservation |
| POST | `/reservations` | Driver | Reserve a space |
| PATCH | `/reservations/:id` | Owner, staff | Change plate or time |
| PATCH | `/reservations/:id/cancel` | Owner, staff | Cancel a reservation |
| PATCH | `/reservations/:id/check-in` | Attendant, Admin | Driver arrived |
| PATCH | `/reservations/:id/complete` | Attendant, Admin | Driver left; computes the fee |
| DELETE | `/reservations/:id` | Admin | Delete a reservation |

Example login:

```http
POST /auth/login
Content-Type: application/json

{ "email": "driver@easyspot.local", "password": "<your SEED_PASSWORD>" }
```

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "user": { "id": 3, "fullName": "Demo Driver", "email": "driver@easyspot.local", "role": "driver" }
}
```

## How to run locally

**Requirements:** Node.js 20.19+, 22.13+ or 24.11+, and XAMPP (or any MySQL 8 / MariaDB server).

1. **Start MySQL.** Open the XAMPP Control Panel and start **MySQL** (and **Apache** if you want phpMyAdmin).
2. **Create the database.** In phpMyAdmin (http://localhost/phpmyadmin), create a database named `easyspot_db`.
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env`. Set the DB user and password (the XAMPP default is `root` with an empty password), a long random `JWT_SECRET`, and a `SEED_PASSWORD` for the demo accounts. `.env` is ignored by git, so never commit it.
5. **Start the API.** With `DB_SYNC=true`, TypeORM creates the tables automatically:
   ```bash
   npm run start:dev
   ```
6. **Load demo data** (in a second terminal):
   ```bash
   npm run seed
   ```
   This creates `admin@easyspot.local`, `attendant@easyspot.local` and `driver@easyspot.local` (password = your `SEED_PASSWORD`), plus 2 parking lots and 10 spaces.

### Environment variables

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | MySQL server |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / *(empty)* | MySQL credentials |
| `DB_NAME` | `easyspot_db` | Database name |
| `DB_SYNC` | `true` | Auto-create tables (development only) |
| `JWT_SECRET` | *(long random string)* | Key used to sign tokens |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime |
| `SEED_PASSWORD` | *(your choice)* | Password for the seeded demo accounts |

## Testing

- **Postman:** import [`postman/EasySpot.postman_collection.json`](postman/EasySpot.postman_collection.json) and set the `seedPassword` collection variable to your `SEED_PASSWORD`. Then run the folders in order. The login requests save the JWT automatically, and every request has status-code tests.
- **Unit tests** (no database needed):
  ```bash
  npm test
  ```
- **End-to-end tests** (needs MySQL running):
  ```bash
  npm run test:e2e
  ```

## Project structure

```
src/
├── main.ts                  # bootstrap, global ValidationPipe and DB error filter
├── app.module.ts            # root module (config, TypeORM, feature modules)
├── config/                  # database connection settings from .env
├── common/                  # guards, decorators, enums, filters shared by all modules
├── auth/                    # register, login, profile, JWT setup
├── users/                   # users entity and admin CRUD
├── parking-lots/            # parking lots entity and CRUD
├── parking-spaces/          # parking spaces entity, CRUD, availability, status
├── reservations/            # reservations entity and booking life cycle
└── database/seed.ts         # demo data script
postman/                     # Postman collection
```
