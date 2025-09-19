# Project Context

## Repository Structure

├── apps/
│   ├── client/       # React frontend
│   ├── fanuc/        # C# fanuc adapter (DO NOT TOUCH)
│   └── server/       # Node backend

## Tech Stack

- Frameworks: Vite (client), Express (server)
- Language: Typescript
- Package Manager: npm
- Database: Postgres w/ Prisma ORM
- Styling: Tailwind CSS

## Notes

- When building & styling components and pages in client, always reference the theme within src/index.css
- Only use status colors (error, success, warning, info) when appropriate, these should never be used for non-status elements