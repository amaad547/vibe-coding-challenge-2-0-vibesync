# 🚀 SportSync Production Deployment Guide

This guide details the end-to-end production deployment process for the **SportSync - Dumka Sports Academy Management System** on **Vercel** with a managed **MongoDB Atlas** cluster.

---

## 1. Prerequisites Checklist

Before proceeding to deployment, ensure you have:
- [x] A Git repository hosting the project (GitHub, GitLab, or Bitbucket)
- [x] A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account and cluster created
- [x] A [Vercel](https://vercel.com) account linked to your Git provider
- [x] Node.js 18+ and pnpm / npm installed locally for builds and verification

---

## 2. Step 1: MongoDB Atlas Cluster Preparation

1. **Create Database User**:
   - Navigate to **Security > Database Access** in MongoDB Atlas.
   - Click **Add New Database User**.
   - Choose **Password** authentication.
   - Role: `readWriteAnyDatabase` or scoped to `dumka_desk`.
   - Store username and password securely.

2. **Configure Network Access (IP Whitelist)**:
   - Navigate to **Security > Network Access**.
   - Click **Add IP Address**.
   - For Vercel Serverless deployments, add `0.0.0.0/0` (Allow Access from Anywhere) with a description (e.g., *Vercel Serverless Functions*).
   - Alternatively, configure AWS Peering / Private Service Connect if using MongoDB Atlas Dedicated tier.

3. **Obtain Connection String**:
   - Go to **Database > Clusters > Connect**.
   - Choose **Drivers** (Node.js version 5.5 or later).
   - Copy the SRV URI:
     ```
     mongodb+srv://<username>:<password>@<cluster-hostname>.mongodb.net/dumka_desk?retryWrites=true&w=majority
     ```

4. **Verify Database Indexes**:
   SportSync models automatically define performance and constraint indexes:
   - `users`: `{ email: 1 }` (unique)
   - `players`: `{ name: 1, sport: 1 }`
   - `sessions`: `{ sport: 1, date: 1 }` (unique compound index prevents duplicate sessions)
   - `matches`: `{ sport: 1, date: 1 }`, `{ status: 1 }`, `{ "participants.playerId": 1 }`

---

## 3. Step 2: Environment Variables Configuration

In your Vercel Project Settings (**Settings > Environment Variables**), configure the following environment keys:

| Environment Variable | Description | Example / Required Format |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas SRV URI with database name | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/dumka_desk?retryWrites=true&w=majority` |
| `AUTH_SECRET` | 32+ character key for signing and encrypting JWT session cookies | Generated with `openssl rand -base64 32` |
| `APP_BASE_URL` | Production domain without trailing slash | `https://sportsync.yourdomain.com` or `https://<project>.vercel.app` |
| `NODE_ENV` | Environment identifier | `production` |
| `INITIAL_COACH_EMAIL` | Optional provisioning seed email | `coach@dumkasports.org` |
| `INITIAL_COACH_PASSWORD` | Initial coach password for seed script | `coach@dumka123` |
| `INITIAL_SCOUT_EMAIL` | Optional provisioning scout email | `scout@dumkasports.org` |
| `INITIAL_SCOUT_PASSWORD` | Initial scout password for seed script | `scout@sport123` |

> 🔒 **Security Warning**: Never paste live credentials in Git repositories or commit `.env.local` files.

---

## 4. Step 3: Vercel Project Setup & Build Settings

1. **Import Repository**:
   - In Vercel Dashboard, select **Add New > Project**.
   - Import your `SportSync` repository.

2. **Configure Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: Next.js default (`.next`)
   - **Install Command**: `npm install` (or `pnpm install`)

3. **Deploy Configuration (`vercel.json`)**:
   SportSync includes a tuned `vercel.json` providing HTTP security headers:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`

4. **Trigger Deployment**:
   - Click **Deploy**. Vercel will clone the repository, install dependencies, run Next.js compilation, and generate static/serverless routes.

---

## 5. Step 4: Post-Deployment Smoke Verification

Once the deployment URL is active (e.g., `https://sportsync.vercel.app`):

1. **Health Check**:
   - Open `GET https://sportsync.vercel.app/api/health`
   - Expected JSON response:
     ```json
     {
       "status": "healthy",
       "timestamp": "2026-11-05T...",
       "database": "connected",
       "uptime": 12.34
     }
     ```

2. **Initial Account Provisioning**:
   - Run the initial seed script from your secure terminal:
     ```bash
     npm run seed
     ```
   - Verify coach (`coach@dumkasports.org`) and scout (`scout@dumkasports.org`) accounts exist.

3. **Role Login Tests**:
   - Visit `/login` and test authentication as Coach (`coach@dumkasports.org`). Verify redirect to `/coach`.
   - Test authentication as Scout (`scout@dumkasports.org`). Verify redirect to `/scout`.
   - Test Athlete registration at `/register`. Verify account is placed into `PENDING` status.

4. **SSL / Custom Domain**:
   - Add your custom domain under **Vercel > Project > Settings > Domains**.
   - Configure DNS CNAME/A records as guided by Vercel for automatic Let's Encrypt SSL issuance.

