# Deployment Guide - BPMETER

Complete guide to deploying BPMETER to various platforms.

## Prerequisites

- Node.js 18+ installed
- Project built successfully (`npm run build`)
- Git repository (recommended)

## Option 1: Vercel (Recommended)

**Why Vercel?**
- Optimized for Next.js
- Automatic HTTPS
- Edge network (fast globally)
- Zero configuration
- Free tier available

### Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /path/to/BPMETER
vercel

# Follow prompts:
# - Link to Vercel account
# - Set project name: bpmeter
# - Framework preset: Next.js
# - Deploy!

# For production
vercel --prod
```

### Deploy with GitHub

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/bpmeter.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Click "Deploy" (auto-detects Next.js)

**Custom Domain:** Add in Vercel dashboard → Settings → Domains

---

## Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy

# Production
netlify deploy --prod
```

**Or use Netlify UI:**
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. "New site from Git"
4. Select repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

---

## Option 3: Docker

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Build & Run

```bash
# Build image
docker build -t bpmeter .

# Run container
docker run -p 3000:3000 bpmeter

# Or with docker-compose
docker-compose up
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  bpmeter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Option 4: Traditional VPS (Linux)

### Setup on Ubuntu/Debian

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & build
git clone https://github.com/yourusername/bpmeter.git
cd bpmeter
npm install
npm run build

# Run with PM2 (process manager)
sudo npm install -g pm2
pm2 start npm --name "bpmeter" -- start
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name bpmeter.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d bpmeter.yourdomain.com
```

---

## Option 5: AWS Amplify

1. Push code to GitHub
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
3. "New app" → "Host web app"
4. Connect GitHub repository
5. Build settings (auto-detected for Next.js):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
6. Deploy

---

## Option 6: Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
npx @cloudflare/next-on-pages@latest
```

Or use GitHub integration:
1. Push to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. "Create a project"
4. Connect GitHub repo
5. Build settings:
   - Build command: `npm run build`
   - Output directory: `.next`

---

## Environment Variables

BPMETER doesn't require environment variables for basic operation, but you can add:

```bash
# Optional: Custom URL for PWA manifest
NEXT_PUBLIC_APP_URL=https://bpmeter.yourdomain.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

Add to `.env.local` for local dev, or platform settings for production.

---

## Post-Deployment Checklist

### Functionality
- [ ] App loads at deployed URL
- [ ] HTTPS is enabled
- [ ] Microphone permission prompt works
- [ ] BPM detection functions
- [ ] Tap Tempo works
- [ ] Settings panel opens and saves
- [ ] PWA manifest loads (check Network tab)
- [ ] Service worker registers

### PWA
- [ ] App can be installed (look for install icon in browser)
- [ ] Icon displays correctly on install
- [ ] App works offline (after first load)
- [ ] Standalone mode works (no browser UI)

### Performance
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Target: 90+ score on mobile & desktop
- [ ] Check Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### SEO
- [ ] `robots.txt` accessible
- [ ] Manifest accessible
- [ ] Metadata loads correctly (check `<head>`)

---

## Monitoring & Analytics

### Google Analytics (Optional)

1. Get GA tracking ID
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
3. Add to `app/layout.tsx`:
   ```typescript
   import Script from 'next/script'
   
   // In <head>:
   {process.env.NEXT_PUBLIC_GA_ID && (
     <>
       <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
       <Script id="google-analytics">
         {`
           window.dataLayer = window.dataLayer || [];
           function gtag(){dataLayer.push(arguments);}
           gtag('js', new Date());
           gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
         `}
       </Script>
     </>
   )}
   ```

### Error Tracking (Optional)

**Sentry Integration:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

---

## Troubleshooting

### Build Fails

**"Module not found":**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**"Out of memory":**
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Deployment Issues

**HTTPS required for microphone:**
- Ensure platform provides HTTPS (all options above do)
- Test with `https://` URL, not `http://`

**Service worker not registering:**
- Check browser console for errors
- Verify `/sw.js` is accessible at deployed URL
- Clear browser cache and reload

**App not installable:**
- Verify manifest at `/manifest.webmanifest`
- Check icon paths are correct
- HTTPS is required

### Performance Issues

**Slow load time:**
- Enable CDN/edge caching on platform
- Optimize images (not applicable for BPMETER)
- Check network tab for bottlenecks

**High CPU usage:**
- Check if multiple audio engines are running
- Verify AudioWorklet is used (not ScriptProcessor fallback)

---

## Domain Setup

### Custom Domain with Vercel

1. Go to Vercel dashboard → Project → Settings → Domains
2. Add your domain: `bpmeter.yourdomain.com`
3. Add DNS records (Vercel provides instructions):
   - Type: CNAME
   - Name: bpmeter
   - Value: cname.vercel-dns.com

### Custom Domain with Netlify

1. Go to Netlify dashboard → Domain settings
2. Add custom domain
3. Update DNS:
   - Type: CNAME
   - Name: bpmeter
   - Value: your-site.netlify.app

---

## Scaling & CDN

BPMETER is fully client-side, so scaling is automatic on platforms like Vercel/Netlify.

**For VPS:**
- Use Nginx caching for static assets
- Deploy behind Cloudflare CDN
- Use load balancer for multiple instances (overkill for this app)

---

## Backup & Version Control

**Recommended workflow:**
```bash
# Tag releases
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# Always test before deploying
npm run build
npm start
# Test locally at http://localhost:3000

# Deploy to staging first (if available)
vercel --prod

# Monitor for errors
# Check logs in platform dashboard
```

---

## Security Considerations

- ✅ No backend = no API vulnerabilities
- ✅ No user data stored = no GDPR issues
- ✅ No authentication = no auth vulnerabilities
- ✅ All processing client-side = privacy-first

**Optional hardening:**
- Add Content Security Policy (CSP) headers
- Enable HSTS (Strict-Transport-Security)
- Most platforms enable these by default

---

## Cost Estimates

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Vercel | 100 GB bandwidth/mo | $20/mo (Pro) |
| Netlify | 100 GB bandwidth/mo | $19/mo (Pro) |
| AWS Amplify | 15 GB bandwidth/mo | ~$0.15/GB |
| Cloudflare Pages | Unlimited | $20/mo (Pro) |
| VPS (DigitalOcean) | N/A | $6/mo (basic) |

**Recommendation:** Start with Vercel free tier. Upgrade only if traffic exceeds limits.

---

## Support & Maintenance

**Regular maintenance:**
- [ ] Update dependencies monthly: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Test BPM detection accuracy periodically
- [ ] Monitor platform status pages

**When to upgrade Node.js:**
- When current version reaches EOL
- When Next.js drops support for current version

---

**Questions?** See README.md or open an issue on GitHub.

**Happy deploying! 🚀**

