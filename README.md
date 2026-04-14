# NRT Rules Automation

A modern web application for automating the NRT Rules framework, transitioning from Excel macro-based processes to a streamlined web interface that integrates with Siebel CRM.

## 🚀 Features

- **Teambox Assignment Management**: Automate teambox mapping based on specific codes
- **XML File Generation**: Generate XML files with release and environment support
- **GIT Integration**: Automatic commit and push workflow with diff preview
- **Siebel Deployment**: Seamless deployment to Siebel CRM
- **User Management**: Role-based access control and authentication
- **Notifications**: Configurable email notifications
- **Analytics**: Performance metrics and usage tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI Library**: shadcn/ui components
- **Backend**: Next.js API routes + Python services
- **Storage**: File-based JSON data under `data/` (NRT-Regeln); **PostgreSQL** für Auth/RBAC/Audit (IPA ab Sprint 2)
- **Deployment**: Vercel
- **Excel Integration**: Python (openpyxl/xlwings)
- **GIT Integration**: simple-git library
- **Authentication**: NextAuth.js

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nrt-rules-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# DATABASE_URL für PostgreSQL setzen (siehe unten)
```

4. **Datenbank (IPA-201):** PostgreSQL starten, Migrationen und optional Seed ausführen:
```bash
docker compose up -d
npx prisma migrate deploy
npm run db:seed
```
Details und ER-Diagramm: [docs/DATENMODELL_IPA-201.md](./docs/DATENMODELL_IPA-201.md). Nach Schema-Erweiterungen immer `npx prisma migrate deploy` ausführen.

Sign-up (IPA-202): [docs/SIGNUP_IPA-202.md](./docs/SIGNUP_IPA-202.md) — API `POST /api/auth/register`, Test-UI `/register`.

Admin-Freigabe (IPA-203): [docs/APPROVAL_IPA-203.md](./docs/APPROVAL_IPA-203.md) — `JWT_SECRET` in `.env` setzen, Demo-Admin nach Seed (`npm run db:seed`), Test-UI `/admin/registrations`, APIs unter `/api/admin/registration-requests`.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Application Configuration
NEXT_PUBLIC_APP_NAME=NRT Rules Automation
NEXT_PUBLIC_APP_VERSION=1.0.0

# Excel Integration
EXCEL_MACRO_PATH=/path/to/excel/files
EXCEL_TEMPLATE_PATH=/path/to/excel/templates

# GIT Configuration
GIT_REPOSITORY_URL=your_git_repository_url_here
GIT_BRANCH=main

# Deployment Configuration
DEPLOYMENT_SCRIPT_PATH=/app/sbl/sblhome/deploy/NRT_import.sh
SIEBEL_ENVIRONMENT=development
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── excel/             # Excel integration
│   ├── git/               # GIT integration
│   └── deployment/        # Deployment utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
└── constants/             # Application constants
```

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📚 Documentation

- [API Documentation](./docs/api.md) (coming soon)
- [User Guide](./docs/user-guide.md) (coming soon)
- [Developer Guide](./docs/developer-guide.md) (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

- [ ] Excel macro integration
- [ ] Advanced XML generation features
- [ ] Enhanced deployment options
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Multi-tenant support

---

Built with ❤️ using Next.js and shadcn/ui# config-change-website
