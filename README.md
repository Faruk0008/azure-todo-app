# Azure To-Do App

A full-stack **To-Do / Notes** web application built with **Node.js (Express)** and plain **HTML/CSS/Vanilla JS**, secured with **Microsoft Entra ID (Azure AD)** authentication. Designed for deployment on **Azure App Service (Free tier F1)**.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Azure](https://img.shields.io/badge/Azure-App%20Service-blue?logo=microsoftazure)
![Auth](https://img.shields.io/badge/Auth-Microsoft%20Entra%20ID-purple?logo=microsoft)

---

## Features

- ✅ **Add, view, complete, and delete** to-do items
- 🔐 **Microsoft Entra ID** (Azure AD) login — only authenticated users can access the dashboard
- 👤 Displays the **logged-in user's name and email**
- 🎨 Premium **dark-mode UI** with glassmorphism and micro-animations
- ☁️ **Azure App Service**–ready (`process.env.PORT`, `web.config` included)
- 🗂️ In-memory storage (no database required)

---

## Project Structure

```
Azure_Project_CA2/
├── app.js                  # Express entry point
├── routes/
│   ├── auth.js             # Microsoft Entra ID login/callback/logout
│   └── todos.js            # CRUD API for to-do items (protected)
├── views/
│   ├── login.html          # Login page (unauthenticated users)
│   └── dashboard.html      # To-do dashboard (authenticated users)
├── public/
│   ├── style.css           # Global stylesheet
│   └── dashboard.js        # Client-side JavaScript
├── web.config              # IIS config for Azure App Service
├── .env.example            # Required environment variables template
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js 18+** installed locally
- An **Azure account** (free tier is fine)
- A **Microsoft Entra ID (Azure AD) tenant** (comes with any Azure subscription)

---

## 1. Local Development Setup

### 1.1 Clone and Install

```bash
git clone <your-repo-url>
cd Azure_Project_CA2
npm install
```

### 1.2 Register the App in Microsoft Entra ID

1. Go to the **Azure Portal** → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Set the following:
   - **Name**: `Todo App` (or any name you prefer)
   - **Supported account types**: *Accounts in this organizational directory only* (Single tenant)
   - **Redirect URI**: Select **Web** and enter `http://localhost:3000/auth/callback`
3. Click **Register**
4. From the app's **Overview** page, copy:
   - **Application (client) ID** → this is your `CLIENT_ID`
   - **Directory (tenant) ID** → this is your `TENANT_ID`
5. Go to **Certificates & secrets** → **New client secret**
   - Add a description, choose an expiry, and click **Add**
   - Copy the **Value** immediately (it won't be shown again) → this is your `CLIENT_SECRET`

### 1.3 Configure Environment Variables

```bash
# Copy the template
cp .env.example .env

# Edit .env with your actual values:
CLIENT_ID=<your-application-client-id>
TENANT_ID=<your-directory-tenant-id>
CLIENT_SECRET=<your-client-secret-value>
REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=<any-random-string>
PORT=3000
```

### 1.4 Run Locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You'll see the login page. Click **Sign in with Microsoft** to authenticate.

---

## 2. Deploy to Azure App Service

### 2.1 Create an App Service (Free Tier)

#### Option A — Azure Portal

1. Go to **Azure Portal** → **App Services** → **Create**
2. Configure:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `your-todo-app` (must be globally unique)
   - **Publish**: Code
   - **Runtime stack**: Node 18 LTS (or 20 LTS)
   - **Operating System**: Windows
   - **Region**: Choose the closest region
   - **Pricing Plan**: **Free F1**
3. Click **Review + create** → **Create**

#### Option B — Azure CLI

```bash
# Login to Azure
az login

# Create a resource group
az group create --name todo-rg --location eastus

# Create an App Service plan (Free tier)
az appservice plan create \
  --name todo-plan \
  --resource-group todo-rg \
  --sku F1 \
  --is-linux false

# Create the web app
az webapp create \
  --name your-todo-app \
  --resource-group todo-rg \
  --plan todo-plan \
  --runtime "NODE:18-lts"
```

### 2.2 Set Environment Variables in Azure

Go to **Azure Portal** → your App Service → **Configuration** → **Application settings** → **New application setting**. Add each:

| Name            | Value                                                  |
| --------------- | ------------------------------------------------------ |
| `CLIENT_ID`     | Your Application (client) ID                           |
| `TENANT_ID`     | Your Directory (tenant) ID                             |
| `CLIENT_SECRET` | Your client secret value                               |
| `REDIRECT_URI`  | `https://your-todo-app.azurewebsites.net/auth/callback` |
| `SESSION_SECRET` | A strong random string                                |

> ⚠️ **Important**: Update the `REDIRECT_URI` to use your Azure App Service URL (HTTPS), and add the same URI in your Entra ID App Registration → **Authentication** → **Redirect URIs**.

Or use the CLI:

```bash
az webapp config appsettings set \
  --name your-todo-app \
  --resource-group todo-rg \
  --settings \
    CLIENT_ID="<your-client-id>" \
    TENANT_ID="<your-tenant-id>" \
    CLIENT_SECRET="<your-client-secret>" \
    REDIRECT_URI="https://your-todo-app.azurewebsites.net/auth/callback" \
    SESSION_SECRET="<random-string>"
```

### 2.3 Deploy the Code

#### Option A — Local Git Deployment

```bash
# Configure local Git deployment
az webapp deployment source config-local-git \
  --name your-todo-app \
  --resource-group todo-rg

# The command outputs a Git URL. Add it as a remote:
git remote add azure <deployment-git-url>

# Push to Azure
git push azure main
```

#### Option B — ZIP Deploy

```bash
# Create a zip of your project (excluding node_modules and .env)
# On Windows PowerShell:
Compress-Archive -Path .\* -DestinationPath deploy.zip -Force

# Deploy
az webapp deploy \
  --name your-todo-app \
  --resource-group todo-rg \
  --src-path deploy.zip \
  --type zip
```

#### Option C — VS Code Azure Extension

1. Install the **Azure App Service** extension in VS Code
2. Sign in to Azure
3. Right-click your App Service → **Deploy to Web App**
4. Select the project folder

### 2.4 Verify Deployment

Visit `https://your-todo-app.azurewebsites.net` — you should see the login page.

### Startup Command (if needed)

If Azure doesn't start the app automatically, go to **Configuration** → **General settings** → **Startup Command** and enter:

```
node app.js
```

---

## 3. Update Entra ID Redirect URI for Production

After deploying, you must add the production redirect URI to your app registration:

1. Go to **Azure Portal** → **Microsoft Entra ID** → **App registrations** → your app
2. Go to **Authentication** → **Platform configurations**
3. Under **Web**, click **Add URI**
4. Add: `https://your-todo-app.azurewebsites.net/auth/callback`
5. Click **Save**

> You can keep the `http://localhost:3000/auth/callback` URI for local development.

---

## 4. Azure RBAC — Assigning Roles to Other Users

Azure **Role-Based Access Control (RBAC)** lets you manage who can access and manage your Azure resources. Here's how to assign the **Reader** or **Contributor** role on your App Service:

### What the Roles Mean

| Role            | What the user can do                                                     |
| --------------- | ------------------------------------------------------------------------ |
| **Reader**      | View the App Service resource, its settings, and logs (read-only)        |
| **Contributor** | Full management of the App Service (deploy, configure, restart, etc.)    |
| **Owner**       | Everything Contributor can do + assign roles to others                   |

### How to Assign a Role (Portal)

1. Go to **Azure Portal** → **App Services** → your app
2. In the left menu, click **Access control (IAM)**
3. Click **+ Add** → **Add role assignment**
4. Select the role (e.g., **Reader** or **Contributor**)
5. Click **Next**
6. Click **+ Select members** → search for the user's name or email
7. Select the user → click **Select**
8. Click **Review + assign** → **Review + assign**

### How to Assign a Role (CLI)

```bash
# Assign "Reader" role to a user on the App Service
az role assignment create \
  --assignee user@example.com \
  --role "Reader" \
  --scope /subscriptions/<sub-id>/resourceGroups/todo-rg/providers/Microsoft.Web/sites/your-todo-app

# Assign "Contributor" role
az role assignment create \
  --assignee user@example.com \
  --role "Contributor" \
  --scope /subscriptions/<sub-id>/resourceGroups/todo-rg/providers/Microsoft.Web/sites/your-todo-app
```

### Verify Assigned Roles

```bash
az role assignment list \
  --scope /subscriptions/<sub-id>/resourceGroups/todo-rg/providers/Microsoft.Web/sites/your-todo-app \
  --output table
```

### Why RBAC Matters

- **Principle of Least Privilege**: Only grant the minimum permissions a user needs.
- **Auditability**: Azure logs all role assignments and access changes.
- **Separation of Duties**: Developers might get Contributor, while a manager only needs Reader.

---

## 5. Environment Variables Reference

| Variable         | Description                                    | Required |
| ---------------- | ---------------------------------------------- | -------- |
| `CLIENT_ID`      | Entra ID Application (client) ID              | ✅        |
| `TENANT_ID`      | Entra ID Directory (tenant) ID                | ✅        |
| `CLIENT_SECRET`  | Entra ID client secret value                  | ✅        |
| `REDIRECT_URI`   | OAuth callback URL                             | ✅        |
| `SESSION_SECRET`  | Secret for signing session cookies            | ✅        |
| `PORT`           | Server port (set automatically by Azure)       | ❌        |

---

## Troubleshooting

| Issue                          | Solution                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| "Authentication error" on login| Check `CLIENT_ID`, `TENANT_ID`, `CLIENT_SECRET` are correct     |
| Redirect loop after login      | Ensure `REDIRECT_URI` matches *exactly* in `.env` and Entra ID  |
| App won't start on Azure       | Check **Log stream** in Azure Portal; set startup command        |
| Session lost after restart     | Expected — sessions are in-memory; consider Azure Redis for prod |

---

## License

This project is for educational purposes (Cloud Architecture CA2).
