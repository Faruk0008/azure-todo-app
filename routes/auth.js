/**
 * routes/auth.js — Microsoft Entra ID (Azure AD) authentication routes.
 *
 * Uses @azure/msal-node to perform the Authorization Code flow:
 *   GET  /auth/login    → redirects user to Microsoft login
 *   GET  /auth/callback → handles the redirect back from Azure AD
 *   GET  /auth/logout   → clears session and redirects home
 */

const express = require('express');
const msal = require('@azure/msal-node');
const router = express.Router();

// ── MSAL Configuration ─────────────────────────────────────────────────────

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback(logLevel, message) {
                // Uncomment the line below for debugging MSAL issues:
                // console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Warning
        }
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';
const SCOPES = ['user.read'];   // Basic profile info

// ── Login ───────────────────────────────────────────────────────────────────

router.get('/login', async (req, res) => {
    try {
        const authUrl = await cca.getAuthCodeUrl({
            scopes: SCOPES,
            redirectUri: REDIRECT_URI,
            prompt: 'select_account'   // Always show account picker
        });
        res.redirect(authUrl);
    } catch (err) {
        console.error('Error generating auth URL:', err);
        res.status(500).send('Authentication error. Please try again.');
    }
});

// ── Callback ────────────────────────────────────────────────────────────────

router.get('/callback', async (req, res) => {
    try {
        const tokenResponse = await cca.acquireTokenByCode({
            code: req.query.code,
            scopes: SCOPES,
            redirectUri: REDIRECT_URI
        });

        // Store user info in the session
        req.session.user = {
            name: tokenResponse.account.name,
            email: tokenResponse.account.username,
            homeAccountId: tokenResponse.account.homeAccountId
        };

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error acquiring token:', err);
        res.status(500).send('Login failed. Please try again.');
    }
});

// ── Logout ──────────────────────────────────────────────────────────────────

router.get('/logout', (req, res) => {
    const postLogoutUri = `${req.protocol}://${req.get('host')}/`;
    req.session.destroy(() => {
        // Redirect to Microsoft's logout endpoint, then back to our home page
        const logoutUrl =
            `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/logout` +
            `?post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}`;
        res.redirect(logoutUrl);
    });
});

module.exports = router;
