# Azure To-Do App — Full Deployment Walkthrough (GUI)

This is a complete, start-to-finish guide to deploy your To-Do App using the **Azure Portal GUI**. Every step uses the portal — no CLI commands needed. Perfect for a live presentation.

---

## Prerequisites Checklist

Before you begin, make sure you have ALL of the following ready:

| # | Prerequisite | How to Get It |
|---|---|---|
| 1 | **Node.js 18+** installed on your PC | Download from [nodejs.org](https://nodejs.org/) → choose "LTS". After installing, open a terminal and run `node --version` to verify. |
| 2 | **npm** (comes with Node.js) | Installed automatically with Node.js. Verify with `npm --version`. |
| 3 | **Git** installed on your PC | Download from [git-scm.com](https://git-scm.com/). Verify with `git --version`. |
| 4 | **A GitHub account** | Sign up free at [github.com](https://github.com/). |
| 5 | **Your project pushed to GitHub** | You've already done this ✅ |
| 6 | **An Azure account** (Student) | Sign up at [Azure for Students](https://azure.microsoft.com/en-us/free/students/). You get **$100 credit** — no credit card needed. |
| 7 | **A web browser** (Edge/Chrome) | For accessing the Azure Portal at [portal.azure.com](https://portal.azure.com/). |

> [!IMPORTANT]
> **Azure for Students tenant issue:** When you sign in to the Azure Portal with your university email, you may land in your **university's Azure AD tenant** where you do NOT have permission to create App Registrations. If you get "Insufficient privileges" errors, click your **profile icon** (top-right) → **Switch directory** → select your **Default Directory** (the one where YOU are the admin). All steps below should be done in that directory.

---

## Phase 1: Register the App in Microsoft Entra ID

This creates the identity that allows your app to use "Sign in with Microsoft".

### Step 1.1 — Navigate to Entra ID

1. Open [portal.azure.com](https://portal.azure.com/) and sign in with your student account.
2. In the **top search bar**, type **Microsoft Entra ID** and click on it.
3. In the left sidebar, click **App registrations**.

### Step 1.2 — Create a New App Registration

1. Click the **+ New registration** button at the top.
2. Fill in the form:
   - **Name:** `Todo App` (or any name you like)
   - **Supported account types:** Select **Accounts in this organizational directory only (Single tenant)**
   - **Redirect URI:**
     - Platform dropdown: Select **Web**
     - URI field: Enter `http://localhost:3000/auth/callback`
3. Click **Register**.

### Step 1.3 — Copy Your Application IDs

After registration, you'll be taken to the app's **Overview** page. Copy these two values — you'll need them later:

| Value to Copy | Where to Find It | What It's Called in `.env` |
|---|---|---|
| **Application (client) ID** | Overview page, top section | `CLIENT_ID` |
| **Directory (tenant) ID** | Overview page, top section | `TENANT_ID` |

> [!TIP]
> Click the small **copy icon** next to each value to copy it to your clipboard. Paste them somewhere safe (e.g., Notepad) for now.

### Step 1.4 — Create a Client Secret

1. In the left sidebar of your app registration, click **Certificates & secrets**.
2. Click the **Client secrets** tab (should already be selected).
3. Click **+ New client secret**.
4. Fill in:
   - **Description:** `todo-app-secret` (or anything you want)
   - **Expires:** Choose **6 months** (or whatever you prefer)
5. Click **Add**.
6. **IMMEDIATELY copy the "Value" column** (NOT the "Secret ID") — this is your `CLIENT_SECRET`.

> [!CAUTION]
> The secret value is shown **only once**. If you navigate away without copying it, you'll have to delete and create a new one. Copy it NOW.

---

## Phase 2: Configure and Run Locally

### Step 2.1 — Install Dependencies

Open a terminal/command prompt in your project folder and run:

```bash
npm install
```

This downloads all the required packages: `express`, `express-session`, `@azure/msal-node`, and `dotenv`.

### Step 2.2 — Fill in the `.env` File

Open the `.env` file in your project and replace the placeholder values with the real ones you copied from Phase 1:

```env
# Microsoft Entra ID (Azure AD) App Registration
CLIENT_ID=paste-your-application-client-id-here
TENANT_ID=paste-your-directory-tenant-id-here
CLIENT_SECRET=paste-your-client-secret-value-here

# Redirect URI — must match the one registered in Azure AD
REDIRECT_URI=http://localhost:3000/auth/callback

# Session secret — use a strong random string
SESSION_SECRET=any-random-string-you-like-here

# Port
PORT=3000
```

### Step 2.3 — Start the App

In the same terminal, run:

```bash
npm start
```

You should see:

```
✅ To-Do app running at http://localhost:3000
```

### Step 2.4 — Test It

1. Open `http://localhost:3000` in your browser.
2. You should see the **login page** with a "Sign in with Microsoft" button.
3. Click it — you'll be redirected to the Microsoft login page.
4. Sign in with your Microsoft account (the same one linked to your Azure tenant).
5. After signing in, you'll land on the **Dashboard** where you can add, complete, and delete to-do items.
6. Your name and email should appear on the dashboard.

> [!NOTE]
> If you see an error like "AADSTS50011: The redirect URI does not match", double-check that the `REDIRECT_URI` in your `.env` file is **exactly** `http://localhost:3000/auth/callback` and that it matches what you entered in the Entra ID App Registration.

---

## Phase 3: Create an Azure App Service (Free Tier)

### Step 3.1 — Navigate to App Services

1. Go to the [Azure Portal](https://portal.azure.com/).
2. In the **top search bar**, type **App Services** and click on it.
3. Click the **+ Create** button → select **Web App**.

### Step 3.2 — Configure the Basics Tab

Fill in the form on the **Basics** tab:

| Field | Value |
|---|---|
| **Subscription** | Your "Azure for Students" subscription |
| **Resource Group** | Click **Create new** → name it `todo-app-rg` → click OK |
| **Name** | Enter a **globally unique** name, e.g., `xamir-todo-app`. This becomes your URL: `https://xamir-todo-app.azurewebsites.net` |
| **Publish** | **Code** |
| **Runtime stack** | **Node 18 LTS** (or Node 20 LTS) |
| **Operating System** | **Windows** |
| **Region** | Pick the **closest** region to you (e.g., `UK South`, `East US`, `Central India`) |

For the **Pricing plan** section:
1. Click **Explore pricing plans** or the plan dropdown.
2. Select **Free F1** — this costs **$0/month** and does NOT use your student credits.

### Step 3.3 — Skip the Other Tabs

- **Database** tab: Skip (we don't need one — app uses in-memory storage).
- **Deployment** tab: We'll configure this separately in the next phase.
- **Networking** tab: Keep defaults.
- **Monitoring** tab: Keep defaults (you can disable Application Insights to keep it simple).
- **Tags** tab: Skip.

### Step 3.4 — Create the App Service

1. Click **Review + create**.
2. Wait for validation to pass (green checkmark).
3. Click **Create**.
4. Wait for deployment to complete (usually 1–2 minutes).
5. Click **Go to resource**.

> [!TIP]
> Bookmark this page — you'll come back to it multiple times.

---

## Phase 4: Deploy Code from GitHub

This is the most impressive part for a presentation — it shows automatic CI/CD deployment.

### Step 4.1 — Open Deployment Center

1. On your App Service page, scroll down the **left sidebar**.
2. Under the **Deployment** section, click **Deployment Center**.

### Step 4.2 — Connect to GitHub

1. In the **Source** dropdown, select **GitHub**.
2. If prompted, click **Authorize** to connect your GitHub account to Azure. A popup will appear — sign in to GitHub and grant access.
3. Once authorized, fill in:
   - **Organization:** Your GitHub username
   - **Repository:** Select your repository
   - **Branch:** `main`
4. Leave the **Workflow Option** on the default (GitHub Actions or Basic).
5. Click **Save** at the top of the page.

### Step 4.3 — Wait for Deployment

- Azure will automatically pull your code from GitHub and deploy it.
- You can watch the progress under the **Logs** tab in Deployment Center.
- The first deployment usually takes 2–5 minutes.
- You'll see a green checkmark ✅ when it's done.

---

## Phase 5: Set Environment Variables in Azure

Your app needs the same `.env` values in the cloud. Azure calls these **Application Settings**.

### Step 5.1 — Navigate to Environment Variables

1. On your App Service page, scroll down the **left sidebar**.
2. Under **Settings**, click **Environment variables** (on older UI, this may be called **Configuration**).

### Step 5.2 — Add Each Variable

Click the **App settings** tab, then click **+ Add** for each of the following:

| Name | Value |
|---|---|
| `CLIENT_ID` | Same Application (client) ID from Phase 1 |
| `TENANT_ID` | Same Directory (tenant) ID from Phase 1 |
| `CLIENT_SECRET` | Same client secret value from Phase 1 |
| `SESSION_SECRET` | Any strong random string |
| `REDIRECT_URI` | `https://YOUR-APP-NAME.azurewebsites.net/auth/callback` |

> [!WARNING]
> The `REDIRECT_URI` value here must use **`https://`** (not `http://`) and must use your **actual Azure app name** (e.g., `https://xamir-todo-app.azurewebsites.net/auth/callback`). This is different from the `localhost` one you used locally.

### Step 5.3 — Save and Restart

1. Click **Apply** at the bottom.
2. Click **Confirm** when it warns about restarting the app.
3. The app will restart with the new settings.

---

## Phase 6: Update Entra ID Redirect URI for Production

Right now, Entra ID only knows about `http://localhost:3000/auth/callback`. You must add the production Azure URL too.

### Step 6.1 — Go Back to Your App Registration

1. In the **top search bar**, type **Microsoft Entra ID** → click it.
2. Click **App registrations** in the left sidebar.
3. Click on your **Todo App** registration.

### Step 6.2 — Add the Production Redirect URI

1. In the left sidebar, click **Authentication**.
2. Under the **Web** platform section, you'll see your localhost URI.
3. Click **Add URI**.
4. Enter: `https://YOUR-APP-NAME.azurewebsites.net/auth/callback`
5. Click **Save** at the bottom.

> [!TIP]
> Keep the `http://localhost:3000/auth/callback` URI in place — it lets you continue local development.

---

## Phase 7: Test Your Live Application

1. Go back to your **App Service** in the Azure Portal.
2. On the **Overview** page, find the **Default domain** link.
3. Click it — your app should load in a new tab.
4. Click **Sign in with Microsoft**.
5. Log in with your Microsoft account.
6. You should land on the **Dashboard** — try adding, completing, and deleting to-do items.

🎉 **Your app is now live on Azure!**

---

## Phase 8: Assign RBAC Roles (For Presentation)

To demonstrate Azure's **Role-Based Access Control (RBAC)** during your presentation:

### Step 8.1 — Navigate to Access Control

1. Go to your **App Service** in the Azure Portal.
2. In the left sidebar, click **Access control (IAM)**.

### Step 8.2 — Add a Role Assignment

1. Click **+ Add** → **Add role assignment**.
2. Under the **Role** tab, search for and select one:
   - **Reader** — view-only access to the App Service resource
   - **Contributor** — full management access (deploy, configure, restart)
3. Click **Next**.
4. Under the **Members** tab:
   - **Assign access to:** Select **User, group, or service principal**
   - Click **+ Select members**
   - Search for a classmate's name or email and select them.
5. Click **Select** → **Next** → **Review + assign** → **Review + assign**.

### Step 8.3 — Verify Roles

1. Still on the **Access control (IAM)** page, click the **Role assignments** tab.
2. You'll see a table listing all users and their roles — great for showing in a presentation.

| Role | What the User Can Do |
|---|---|
| **Reader** | View the App Service, its settings, and logs (read-only) |
| **Contributor** | Full management: deploy, configure, restart, etc. |
| **Owner** | Everything Contributor can do + assign roles to others |

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---|---|
| **"Insufficient privileges" creating App Registration** | Switch to your **Default Directory** (profile icon → Switch directory) |
| **"AADSTS50011: Redirect URI does not match"** | Ensure the URI in Entra ID → Authentication **exactly** matches what's in `.env` / Azure App Settings |
| **"AADSTS700016: Application not found"** | Check that `CLIENT_ID` and `TENANT_ID` are correct and you're in the right directory |
| **App shows blank page or 500 error** | Go to App Service → **Log stream** (under Monitoring) to see real-time error logs |
| **Login works locally but not on Azure** | Did you add the `https://...azurewebsites.net/auth/callback` URI in Phase 6? |
| **"Application error" on Azure** | Go to **Configuration** → **General settings** → set **Startup Command** to `node app.js` |
| **Session lost after Azure restart** | This is expected — sessions are stored in-memory. For production, use Azure Redis Cache |

---


