/**
 * Firebase Cloud Messaging (FCM) & Firebase Auth Admin Service
 */

const path = require('path');
const fs = require('fs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');

let isInitialized = false;

function initFirebase() {
    if (isInitialized || getApps().length > 0) {
        isInitialized = true;
        return true;
    }

    try {
        const localServiceAccountPath = path.join(__dirname, '../config/firebase-service-account.json');

        if (fs.existsSync(localServiceAccountPath)) {
            const serviceAccount = require(localServiceAccountPath);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({
                credential: cert(serviceAccount)
            });
            isInitialized = true;
            console.log('✅ Firebase Admin SDK initialized from config/firebase-service-account.json');
            return true;
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(decoded);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({
                credential: cert(serviceAccount)
            });
            isInitialized = true;
            console.log('✅ Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_BASE64');
            return true;
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            let serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
            const serviceAccount = JSON.parse(serviceAccountRaw);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            initializeApp({
                credential: cert(serviceAccount)
            });
            isInitialized = true;
            console.log('✅ Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_JSON');
            return true;
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            initializeApp();
            isInitialized = true;
            console.log('✅ Firebase Admin SDK initialized from GOOGLE_APPLICATION_CREDENTIALS');
            return true;
        } else {
            console.log('⚠️ [FCM] No Firebase credentials found in env (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64). Push notifications will be simulated.');
            return false;
        }
    } catch (e) {
        console.error('❌ Firebase Admin SDK initialization error:', e.message);
        return false;
    }
}

// Auto-initialize on load
initFirebase();

class FCMService {
    /**
     * Send Push Notification to Topic (e.g. 'all_matches' or 'match_insights')
     */
    async sendMatchInsightNotification({ matchId, teamA, teamB, advantage, summary }) {
        initFirebase();
        const title = `🏏 ${teamA} vs ${teamB} - Match Insights Live!`;
        const body = advantage 
            ? `Astrological Advantage: ${advantage}. Key player analysis is now available.`
            : `KP Astrological Analysis has been published for ${teamA} vs ${teamB}. Check insights now!`;

        const payload = {
            topic: 'match_insights',
            notification: {
                title: title,
                body: body
            },
            data: {
                matchId: String(matchId || ''),
                type: 'MATCH_INSIGHT',
                teamA: String(teamA || ''),
                teamB: String(teamB || ''),
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
        };

        console.log(`[FCM Notification] Prepared topic notification:`, payload);

        if (getApps().length > 0) {
            try {
                const messaging = getMessaging();
                const response = await messaging.send(payload);
                console.log('✅ [FCM Notification] Successfully sent message:', response);
                return { success: true, messageId: response };
            } catch (error) {
                console.error('❌ [FCM Notification] Error sending notification:', error);
                return { success: false, error: error.message };
            }
        } else {
            console.log('ℹ️ [FCM Notification] Firebase Admin not configured. Notification simulated in local mode.');
            return { success: true, simulated: true };
        }
    }

    /**
     * Send direct message to a specific user FCM token
     */
    async sendDirectNotification(fcmToken, { title, body, data = {} }) {
        initFirebase();
        if (!fcmToken) return { success: false, error: 'Token required' };

        const message = {
            token: fcmToken,
            notification: { title, body },
            data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' }
        };

        if (getApps().length > 0) {
            try {
                const messaging = getMessaging();
                const response = await messaging.send(message);
                return { success: true, messageId: response };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        console.log(`[FCM Direct Notification] Simulated to ${fcmToken}:`, message);
        return { success: true, simulated: true };
    }

    /**
     * Verify Google ID Token
     */
    async verifyGoogleIdToken(idToken) {
        initFirebase();
        if (getApps().length > 0) {
            try {
                const auth = getAuth();
                const decodedToken = await auth.verifyIdToken(idToken);
                return { success: true, user: decodedToken };
            } catch (error) {
                console.error('❌ [Firebase Auth] Error verifying Google ID Token:', error.message);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Firebase Admin not initialized' };
    }

    getMessagingInstance() {
        initFirebase();
        return getApps().length > 0 ? getMessaging() : null;
    }

    getAuthInstance() {
        initFirebase();
        return getApps().length > 0 ? getAuth() : null;
    }
}

module.exports = new FCMService();
