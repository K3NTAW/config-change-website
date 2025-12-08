# Deployment Guide

## Repository Architecture

This application uses a two-repository architecture:

1. **Website Repository**: Contains the Next.js application code
2. **XML Files Repository**: Contains generated NRT ruleset XML and Excel files

## Environment Variables for Vercel

Add these environment variables in your Vercel dashboard:

### Required for XML Files Repository (Environment-Specific)
```
GITHUB_TOKEN=your_github_personal_access_token_here

# Environment-specific XML repositories
XML_REPO_URL_PROD=https://github.com/K3NTAW/xml-prod.git
XML_REPO_URL_DEV=https://github.com/K3NTAW/xml-dev.git
XML_REPO_URL_DEFAULT=https://github.com/K3NTAW/xml-test-repo.git
```

### Other Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## GitHub Personal Access Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with these permissions:
   - `repo` (Full control of private repositories) - **This is the most important one**
   - `workflow` (Update GitHub Action workflows)
   - Make sure to select **"All repositories"** or specifically select your XML repository
3. Copy the token and add it as `GITHUB_TOKEN` in Vercel

## XML Files Repository Setup

Create separate repositories for each environment:

1. **Production**: Create `xml-prod` repository
2. **Development**: Create `xml-dev` repository
3. **Default**: Create `xml-test-repo` repository (fallback)

For each repository:
- Initialize with a README.md
- Copy the repository URL
- Set the corresponding environment variable (e.g., `XML_REPO_URL_PROD`)

The application will automatically push XML files to the correct repository based on the selected environment.

## How It Works

1. User uploads Excel file on the website
2. Application generates XML file
3. Both files are pushed to `xml-test-repo` using GitHub API
4. User receives confirmation with commit details

## Testing Locally

1. Copy `.env.local` and add the GitHub token
2. Run `npm run dev`
3. Test the file upload functionality
