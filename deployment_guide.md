# 🌐 DashMile Deployment Guide

The application is pre-configured to be deployed as a single, self-contained project (where the Express server hosts both the API and serves the compiled React frontend assets). This avoids CORS issues and allows free-tier hosting on platforms like **Render** or **Railway**.

---

## Option 1: Deploying on Render (Recommended & Free)

Render is extremely simple and offers a free tier for Web Services.

### 1. Upload to GitHub
1. Create a new repository on your GitHub account.
2. Push your local repository to GitHub:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

### 2. Create Web Service on Render
1. Go to [Render](https://render.com/) and log in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `dashmile-logistics` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Select the region closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank (monorepo root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.

Render will automatically install the workspaces, build the React frontend, compile the backend server, generate the database, and host your application!

---

## Option 2: Deploying on Railway

Railway is another popular platform with fast deployments.

### 1. Link Repo on Railway
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repository**.
3. Select your repository.

### 2. Configure Settings
Railway automatically detects the root `package.json` scripts.
1. Go to the service **Settings** -> **Build & Deploy**.
2. Ensure the build command is: `npm install && npm run build`
3. Ensure the start command is: `npm start`
4. Add the following environment variable under the **Variables** tab:
   - `PORT`: `5000`
   - `JWT_SECRET`: a random secure string (e.g., `4a7b9c2d1e5f8a0b`)
5. Railway will automatically build and assign a public URL to your service.
