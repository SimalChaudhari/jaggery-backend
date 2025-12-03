# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Files Created
- [x] `api/index.ts` - Vercel serverless function handler
- [x] `vercel.json` - Vercel configuration
- [x] `.vercelignore` - Files to exclude from deployment
- [x] `VERCEL_DEPLOYMENT.md` - Deployment guide

### Configuration Check
- [x] `@vercel/node` package is in dependencies
- [x] Express app is properly exported from `src/app.ts`
- [x] MongoDB connection handles serverless environment
- [x] All routes are properly configured

### Environment Variables Required

Add these in Vercel Dashboard → Project Settings → Environment Variables:

#### Required:
- [ ] `DATABASE_URL` - MongoDB connection string
- [ ] `JWT_SECRET` - JWT token secret
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret

#### Optional:
- [ ] `SMTP_USER` - Email service username
- [ ] `SMTP_PASS` - Email service password
- [ ] `SKIP_DB_CONNECTION` - Set to `true` to skip DB (testing only)

### MongoDB Atlas Setup
- [ ] MongoDB Atlas cluster is running
- [ ] Network Access allows Vercel IPs (0.0.0.0/0 for development)
- [ ] Database user has proper permissions
- [ ] Connection string is correct

### Deployment Steps
1. [ ] Push code to Git repository
2. [ ] Import project in Vercel dashboard
3. [ ] Set root directory to `backend`
4. [ ] Add all environment variables
5. [ ] Deploy project
6. [ ] Test health endpoint: `https://your-project.vercel.app/health`
7. [ ] Test API endpoint: `https://your-project.vercel.app/api/ping`

### Post-Deployment Testing
- [ ] Health check endpoint works
- [ ] API ping endpoint works
- [ ] MongoDB connection is successful
- [ ] Authentication endpoints work
- [ ] File uploads work (Cloudinary)
- [ ] All API routes are accessible

## Common Issues

### MongoDB Connection Fails
- **Solution**: Add Vercel IP ranges to MongoDB Atlas Network Access
- Go to MongoDB Atlas → Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0)

### Build Fails
- **Solution**: Check TypeScript compilation errors
- Ensure all dependencies are in `package.json`
- Check `tsconfig.json` configuration

### Environment Variables Not Working
- **Solution**: Verify variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Cold Start Issues
- **Solution**: This is normal for serverless
- First request may take 1-3 seconds
- Subsequent requests will be faster

## Quick Deploy Command

```bash
cd backend
vercel --prod
```

## Support

If you encounter issues:
1. Check Vercel function logs in dashboard
2. Check MongoDB Atlas logs
3. Review `VERCEL_DEPLOYMENT.md` for detailed instructions

