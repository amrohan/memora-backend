# Memora Backend

**Memora Backend** is a modern, full-featured bookmark management API built with **Hono.js**, **Prisma ORM**, and **SQLite**. It powers the backend of Memora, a bookmark organizer application that supports user authentication, bookmark collections, tagging, and automated metadata extraction.

---

## 📚 Overview

Memora Backend enables users to securely manage bookmarks with advanced features:

- User authentication (JWT, bcrypt hashing, password reset via email)
- Hierarchical bookmark collections
- Flexible tagging system
- Automatic metadata extraction (titles, descriptions, images) from bookmarked URLs
- Duplicate URL prevention per user
- RESTful API with robust middleware for security, CORS, and logging

Built with TypeScript and Prisma ORM for type safety and developer productivity.

---

## 🔗 Frontend

Frontend repository:  
[https://github.com/amrohan/memora](https://github.com/amrohan/memora)

---

## 🛠️ Technology Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| Web Framework | Hono.js                 |
| ORM           | Prisma                  |
| Database      | SQLite                  |
| Language      | TypeScript              |
| Email Sending | Nodemailer + Gmail SMTP |

---

## ⚙️ Features

- Secure user management with JWT and bcrypt password hashing
- Bookmark CRUD operations with metadata enrichment via Cheerio
- Collections with hierarchical structure
- Tag management with duplicate prevention
- Middleware for logging, secure headers, CORS, and global error handling
- Email notifications using Gmail SMTP with app-specific password

---

## 📝 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or pnpm package manager

### Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# IMPORTANT: Replace with a strong, random secret
JWT_SECRET="your-strong-jwt-secret"

# Gmail SMTP Credentials for Email Notifications
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASS="your-gmail-app-password"

# Frontend Application URL (used in emails and redirects)
APP_URL="https://your-frontend-url.com"

# SQLite Database URL (usually defined in prisma/schema.prisma)
DATABASE_URL="file:./dev.db"
```

> **Note:** To enable email functionality, generate a **Gmail App Password** from your Google Account:
>
> Google Account > Security > App Passwords > Generate for this app

### Installation

```bash
git clone https://github.com/amrohan/memora-backend.git
cd memora-backend
npm install
# or
pnpm install
```

### Database Setup

Run migrations and generate Prisma client:

```bash
npm run prisma:migrate:dev
npm run prisma:generate
```

### Running the Server

- Development mode with hot reload:

  ```bash
  npm run dev
  ```

- Build and start production server:

  ```bash
  npm run build
  npm start
  ```

The API server will run by default on `http://localhost:3000`.

---

## 📂 Project Structure

- `src/index.ts` — Application entrypoint and server setup
- `src/routes.ts` — API route handlers
- `prisma/schema.prisma` — Database schema definition
- `.env` — Environment variables
- `package.json` — Scripts and dependencies

---

## 🔐 Authentication API

- User registration and login with secure password hashing
- JWT issuance and validation for protected routes
- Password reset functionality via secure token emailed to user

---

## 📑 Bookmark Management API

- Create, read, update, delete bookmarks with metadata (title, description, image)
- Query bookmarks by collections, tags, or search filters
- Pagination support for large bookmark sets
- Prevent duplicate URLs per user

---

## 🗂 Collection & Tag API

- Create and manage hierarchical collections
- Tag bookmarks flexibly with automatic cleanup of unused tags
- Enforce unique names within user scope to avoid conflicts

---

## ⚙️ Middleware & Security

- Secure headers to prevent web vulnerabilities
- CORS configuration supporting both wildcard and specific origins
- Structured logging for debugging and monitoring
- Global error handler with standardized JSON error responses
- Custom 404 handler for undefined routes

---

## 🚀 Deployment Notes

- Use environment-specific `.env` files for secrets and URLs
- Ensure Gmail App Password is set for email functionality
- Prisma migrations should be applied on deployment
- For scaling beyond SQLite, Prisma supports PostgreSQL and MySQL with minimal code changes
- Enable HTTPS and configure CORS appropriately in production

---

## 📖 Further Reading and References

- [Hono Framework Documentation](https://hono.dev/)
- [Prisma ORM Documentation](https://www.prisma.io/docs/)
- [SQLite Official Site](https://www.sqlite.org/index.html)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833?hl=en)

---

## 🧑‍💻 Contributing

Contributions and feedback are welcome! Please open issues or submit pull requests on GitHub.

---

## 📜 License

This project is licensed under the ISC License.

---

_Created by Rohan Salunkhe_
