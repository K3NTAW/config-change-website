# Deployment Guide

## Repository Architecture

This application uses a two-repository architecture:

1. **Website Repository**: Contains the Next.js application code
2. **XML Files Repository**: Contains generated NRT ruleset XML and Excel files

## Environment Variables for Vercel

Add these environment variables in your Vercel dashboard:

### Required for XML Files Repository
```
GITHUB_TOKEN=your_github_personal_access_token_here
XML_REPO_OWNER=K3NTAW
XML_REPO_NAME=xml-test-repo
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
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and add it as `GITHUB_TOKEN` in Vercel

## XML Files Repository Setup

1. Create a new repository named `xml-test-repo`
2. Initialize with a README.md
3. The application will automatically push XML files to this repository

## How It Works

1. User uploads Excel file on the website
2. Application generates XML file
3. Both files are pushed to `xml-test-repo` using GitHub API
4. User receives confirmation with commit details

## Testing Locally

1. Copy `.env.local` and add the GitHub token
2. Run `npm run dev`
3. Test the file upload functionality
