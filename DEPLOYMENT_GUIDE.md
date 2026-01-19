# Deployment Guide - Forecast Platform

## 🚀 Steps to Go Live

### Step 1: Push Code to GitHub

1. **Check your remote repository:**
   ```bash
   git remote -v
   ```

2. **If you don't have a remote, create one:**
   - Go to https://github.com
   - Click "New repository"
   - Name it: `forecast-platform`
   - Keep it **Private**
   - Click "Create repository"

3. **Add the remote (if needed):**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/forecast-platform.git
   ```

4. **Push your code:**
   ```bash
   git push -u origin master
   ```

---

### Step 2: Deploy to Vercel

**Vercel is recommended** (made by the Next.js team, free tier available):

1. **Go to https://vercel.com**
2. **Sign up with GitHub** (easiest option)
3. **Click "Add New Project"**
4. **Import your `forecast-platform` repository**
5. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

6. **Add Environment Variables** (IMPORTANT!):
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

7. **Click "Deploy"**

8. **Wait 2-3 minutes** for deployment to complete

---

### Step 3: Your Production URLs

After deployment, Vercel gives you URLs like:

```
https://forecast-platform.vercel.app
```

Or you can use a custom domain!

**Your Portal URLs will be:**
- **Admin**: `https://forecast-platform.vercel.app/admin`
- **China**: `https://forecast-platform.vercel.app/submit/china`
- **Penang**: `https://forecast-platform.vercel.app/submit/penang`
- **Mexico**: `https://forecast-platform.vercel.app/submit/mexico`

---

### Step 4: Post-Deployment Tasks

#### ✅ Update Email Address

Currently, notifications go to `peter@ayertime.com`. 

**To change:**
1. Edit `app/api/notify/route.ts`
2. Change line 6: `const emailTo = "your-work-email@company.com";`
3. Commit and push
4. Vercel auto-deploys the update

#### ✅ Set Up Email Service (Optional but Recommended)

Right now, email notifications are only logged to console. To actually send emails:

**Option A: Resend (Easiest)**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get API key
3. Add to Vercel environment variables:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Uncomment email code in `app/api/notify/route.ts`

**Option B: SendGrid**
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key
3. Similar integration

#### ✅ Test Everything

1. **Visit each portal URL** and verify they load
2. **Submit test data** from each region
3. **Download Excel** from admin page
4. **Check email notifications** (console logs in Vercel dashboard)

---

### Step 5: Share URLs with Your Team

**Send each PM their specific URL:**

📧 **Email Template:**

```
Hi [PM Name],

You can now access the Forecast Platform at:
[THEIR PORTAL URL]

Instructions:
1. Click the link to access your regional portal
2. Enter forecast data for each product family
3. Click "Submit Data" when complete

Please bookmark this link for future use.

If you have any issues, let me know!

Best,
[Your Name]
```

---

## 🔒 Security Notes

✅ **What's Secure:**
- Each PM only gets their specific portal URL
- No "Back to Home" button - PMs can't navigate to other pages
- Supabase handles data storage securely
- HTTPS encryption (automatic with Vercel)

⚠️ **What's NOT Secure (Yet):**
- Anyone with the URL can access that portal
- No login/authentication required
- "Security by obscurity" (URLs are not guessable, but not protected)

💡 **For Future (if needed):**
- Add authentication (NextAuth.js, Clerk, Auth0)
- Password-protect admin page
- Add user roles and permissions

---

## 🔄 Making Updates After Deployment

**Vercel auto-deploys whenever you push to GitHub:**

1. Make changes locally
2. Test locally (`npm run dev`)
3. Commit: `git add . && git commit -m "Your message"`
4. Push: `git push`
5. Vercel automatically deploys in 2-3 minutes

---

## 💰 Cost Estimate

**Free Tier (Likely Sufficient):**
- Vercel: Free (Hobby plan)
- Supabase: Free (500 MB database, 2 GB bandwidth)
- Total: **$0/month**

**If You Exceed Free Tier:**
- Vercel Pro: $20/month (unlimited bandwidth)
- Supabase Pro: $25/month (8 GB database, 50 GB bandwidth)

For your use case (3 PMs submitting monthly), **free tier should be plenty**.

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs

---

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added to Vercel
- [ ] Deployment successful
- [ ] All portal URLs tested
- [ ] Excel export tested
- [ ] Email address updated (optional)
- [ ] URLs shared with PMs

---

**Ready to deploy? Follow the steps above and you'll be live in 10 minutes!** 🚀

*Last updated: January 18, 2026*
