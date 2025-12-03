# Vercel Deployment Guide

This guide explains how to deploy the backend to Vercel.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account with database URL
3. Cloudinary account credentials

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Configure Environment Variables

In Vercel dashboard, add these environment variables:

**Required:**
- `DATABASE_URL` - MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
- `JWT_SECRET` - Secret key for JWT token signing
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

**Optional:**
- `PORT` - Server port (default: 3000, not needed for Vercel)
- `SMTP_USER` - Email service username
- `SMTP_PASS` - Email service password
- `SKIP_DB_CONNECTION` - Set to `true` to skip DB connection (for testing)

### 3. MongoDB Atlas IP Whitelist

**Important:** Add Vercel's IP ranges to MongoDB Atlas Network Access:

1. Go to https://cloud.mongodb.com/
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere** (0.0.0.0/0) for development
   - Or add specific Vercel IP ranges for production

### 4. Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **Add New Project**
3. Import your Git repository
4. Set **Root Directory** to `backend`
5. Set **Build Command** to `npm run build` (optional, Vercel will auto-detect)
6. Set **Output Directory** to `dist` (optional)
7. Add environment variables
8. Click **Deploy**

#### Option B: Using Vercel CLI

```bash
cd backend
vercel
```

Follow the prompts. For production deployment:

```bash
vercel --prod
```

### 5. Verify Deployment

After deployment, test these endpoints:

- Health check: `https://your-project.vercel.app/health`
- API ping: `https://your-project.vercel.app/api/ping`

## Project Structure

```
backend/
├── api/
│   └── index.ts          # Vercel serverless function handler
├── src/
│   ├── app.ts            # Express app setup
│   ├── main.ts           # Local development entry point
│   └── ...               # Other source files
├── vercel.json           # Vercel configuration
└── package.json
```

## Important Notes

1. **MongoDB Connection**: The connection is reused across serverless invocations for better performance.

2. **Cold Starts**: First request may be slower due to serverless cold starts. Subsequent requests will be faster.

3. **File Uploads**: File uploads are handled via Cloudinary, so no local storage is needed.

4. **Environment Variables**: Never commit `.env` files. Always use Vercel's environment variables.

5. **Build Output**: Vercel will automatically build TypeScript files. The `dist/` folder is not needed for deployment.

## Troubleshooting

### MongoDB Connection Issues

- Check MongoDB Atlas IP whitelist includes Vercel IPs
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check MongoDB Atlas cluster is running

### Build Errors

- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors
- Verify `tsconfig.json` is properly configured

### Runtime Errors

- Check Vercel function logs in dashboard
- Verify all environment variables are set
- Check MongoDB connection string format

## Local Development

For local development, use:

```bash
npm run dev
```

This uses `src/main.ts` which starts a regular Express server.

## Production vs Development

- **Development**: Uses `src/main.ts` with `app.listen()`
- **Production (Vercel)**: Uses `api/index.ts` as serverless function

Both use the same `createApp()` function from `src/app.ts`, ensuring consistency.

