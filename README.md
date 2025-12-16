# NRT Rules Automation

A modern web application for automating the NRT Rules framework, transitioning from Excel macro-based processes to a streamlined web interface that integrates with Siebel CRM.

## 🚀 Features

- **Teambox Assignment Management**: Automate teambox mapping based on specific codes
- **XML File Generation**: Generate XML files with release and environment support
- **GIT Integration**: Automatic version control with audit trails
- **Siebel Deployment**: Seamless deployment to Siebel CRM
- **User Management**: Role-based access control and authentication
- **Audit Logging**: Complete audit trail for all operations
- **Notifications**: Configurable email notifications
- **Analytics**: Performance metrics and usage tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **UI Library**: shadcn/ui components
- **Backend**: Next.js API routes + Python services
- **Database**: Supabase (PostgreSQL)
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
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

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

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations (coming soon)
3. Configure authentication providers
4. Set up Row Level Security (RLS) policies

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── features/          # Feature-specific components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase client configuration
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
