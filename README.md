# Pipe Supply Company Website

A modern, full-stack e-commerce website for industrial pipe suppliers. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **Product Catalog**: Browse pipes by category, size, brand, and material with advanced filtering
- **Quote System**: Request quotes for specific products and quantities
- **Admin Dashboard**: Manage products, quotes, media, and company information
- **Authentication**: Secure admin access with NextAuth.js
- **Media Management**: Upload and organize product images and technical documents
- **Responsive Design**: Mobile-first design that works on all devices
- **Property-Based Testing**: Comprehensive test coverage with 165+ tests

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Testing**: Jest, React Testing Library, fast-check (PBT)
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🏃 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/h-sane/pipe_company.git
   cd pipe_company
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL and secrets:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pipe_supply_db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run deploy:full` | Full deployment pipeline |

## 🗂️ Project Structure

```
pipe_company/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and helpers
│   └── types/           # TypeScript type definitions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── docs/                # Documentation
├── scripts/             # Deployment and utility scripts
└── public/              # Static assets
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm test
```

Test coverage includes:
- Unit tests for all utilities and components
- Integration tests for API routes
- Property-based tests for business logic
- End-to-end user workflow tests

**Current Status**: 165/168 tests passing (98.2%)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_URL` - Your production URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### Other Platforms

See [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) for detailed deployment guides for:
- Docker
- Traditional VPS/Dedicated servers
- Other cloud platforms

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_SUMMARY.md) - Complete deployment instructions
- [Deployment Details](./docs/DEPLOYMENT.md) - Advanced deployment configuration
- [Backup & Recovery](./docs/BACKUP_RECOVERY.md) - Backup procedures
- [Performance Optimization](./docs/PERFORMANCE_OPTIMIZATION.md) - Performance tuning

## 🔒 Security

- Secure authentication with NextAuth.js
- Input sanitization and XSS prevention
- SQL injection protection with Prisma
- CSRF protection
- Rate limiting
- Encrypted sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**h-sane**
- GitHub: [@h-sane](https://github.com/h-sane)

## 🙏 Acknowledgments

Built with modern web technologies and best practices for industrial e-commerce.
