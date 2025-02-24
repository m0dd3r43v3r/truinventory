# TruInventory

A modern inventory management system built with Next.js, PostgreSQL, and Azure AD authentication.

## Features

- 🔐 Azure AD Authentication
- 📱 Responsive Design
- 🌓 Dark/Light Mode
- 📊 Role-Based Access Control
- 📝 Custom Fields
- 🏷️ QR Code Generation
- 📋 Audit Logging
- 🗂️ Category & Location Management

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Azure AD Account (for authentication)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/truinventory.git
   cd truinventory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Azure AD credentials and other environment variables

4. Start the PostgreSQL database:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio to manage the database

## Project Structure

```
truinventory/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── lib/          # Utility functions and configurations
│   └── styles/       # Global styles
├── prisma/           # Database schema and migrations
├── public/          # Static assets
└── docker-compose.yml # Docker configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
