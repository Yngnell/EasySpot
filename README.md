# EasySpot API

EasySpot is a parking space reservation system. Drivers can see which parking spaces are free and reserve one before they arrive, attendants check cars in and out, and admins manage users, parking lots and spaces. This repository is the backend (REST API) for the ITEC 116 Final Project, by Jonnel S. Dagohoy (BSIT 4B).

## Tech stack

- **NestJS** (TypeScript): backend framework
- **TypeORM**: ORM
- **MySQL** (XAMPP): database
- **JWT** + **bcrypt**: authentication and password hashing
- **Postman**: API testing (collection in `postman/`)

## How to run locally

Requirements: Node.js 20.19+ and XAMPP (MySQL).

1. Start **MySQL** in XAMPP and create a database named `easyspot_db` in phpMyAdmin.
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your own values (database user and password, `JWT_SECRET`, `SEED_PASSWORD`).
4. Start the API at http://localhost:3000. The tables are created automatically.
   ```bash
   npm run start:dev
   ```
5. Optional: load demo accounts, parking lots and spaces:
   ```bash
   npm run seed
   ```
6. Import `postman/EasySpot.postman_collection.json` into Postman and set the `seedPassword` variable to your `SEED_PASSWORD`.
