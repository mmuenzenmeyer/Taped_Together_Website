const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;
const MATCH_DATA_FILE = path.join(__dirname, 'data', 'match-data.json');
const PIT_DATA_FILE = path.join(__dirname, 'data', 'pit-data.json');

// Password for viewing data - CHANGE THIS!
const VIEW_PASSWORD = process.env.VIEW_PASSWORD || '22351';
const DEV_PASSWORD = process.env.DEV_PASSWORD || 'dev22351admin';

// Firebase Configuration
const FIREBASE_ENABLED = process.env.FIREBASE_ENABLED === 'true';
let db = null;

if (FIREBASE_ENABLED) {
    try {
        // Initialize Firebase Admin SDK
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        
        db = admin.firestore();
        console.log('🔥 Firebase connected successfully!');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error.message);
        console.log('⚠️  Falling back to local JSON storage');
    }
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
}

// Initialize data files if they don't exist
if (!fs.existsSync(MATCH_DATA_FILE)) {
    fs.writeFileSync(MATCH_DATA_FILE, JSON.stringify([]));
    console.log('Created match-data.json file');
}
if (!fs.existsSync(PIT_DATA_FILE)) {
    fs.writeFileSync(PIT_DATA_FILE, JSON.stringify([]));
    console.log('Created pit-data.json file');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Disable caching for development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.use(express.static('public'));

// Helper functions
async function readData(filePath) {
    // Try Firebase first if enabled
    if (FIREBASE_ENABLED && db) {
        try {
            const collectionName = filePath.includes('pit-data') ? 'pit-data' : 'match-data';
            const snapshot = await db.collection(collectionName).get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            console.log(`📥 Loaded ${data.length} entries from Firebase (${collectionName})`);
            return data;
        } catch (error) {
            console.error('Error reading from Firebase, falling back to local:', error.message);
        }
    }
    
    // Fallback to local JSON
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
}

async function writeData(filePath, data) {
    // Write to Firebase if enabled
    if (FIREBASE_ENABLED && db) {
        try {
            const collectionName = filePath.includes('pit-data') ? 'pit-data' : 'match-data';
            const batch = db.batch();
            
            // For new entries, only add the last one (most recent)
            const latestEntry = data[data.length - 1];
            if (latestEntry && latestEntry.id) {
                const docRef = db.collection(collectionName).doc(latestEntry.id);
                batch.set(docRef, latestEntry);
            }
            
            await batch.commit();
            console.log(`📤 Synced to Firebase (${collectionName})`);
        } catch (error) {
            console.error('Firebase write error:', error.message);
        }
    }
    
    // Always write to local JSON as backup
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// Firebase helper function to clear collection (dev only)
async function clearFirebaseCollection(collectionName) {
    if (!FIREBASE_ENABLED || !db) return;
    
    try {
        const snapshot = await db.collection(collectionName).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🗑️  Cleared Firebase collection: ${collectionName}`);
    } catch (error) {
        console.error('Error clearing Firebase collection:', error);
    }
}

// Authentication middleware
function checkAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${VIEW_PASSWORD}` || authHeader === `Bearer ${DEV_PASSWORD}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Dev-only middleware
function checkDevAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${DEV_PASSWORD}`) {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden - Dev access required' });
    }
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === DEV_PASSWORD) {
        res.json({ success: true, token: DEV_PASSWORD, role: 'dev' });
    } else if (password === VIEW_PASSWORD) {
        res.json({ success: true, token: VIEW_PASSWORD, role: 'view' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

// API Routes

// Submit pit scouting data (public)
app.post('/api/submit-pit', async (req, res) => {
    try {
        const submission = req.body;
        
        console.log('🔧 Receiving pit data: Team', submission.teamNumber);
        
        if (!submission.teamNumber) {
            return res.status(400).json({ error: 'Missing team number' });
        }
        
        const data = await readData(PIT_DATA_FILE);
        const entry = {
            id: Date.now().toString(),
            ...submission,
            serverTimestamp: new Date().toISOString()
        };
        
        data.push(entry);
        
        if (await writeData(PIT_DATA_FILE, data)) {
            console.log('✅ Pit data saved! Total entries:', data.length);
            res.json({ success: true, message: 'Pit data submitted', id: entry.id });
        } else {
            res.status(500).json({ error: 'Failed to save pit data' });
        }
    } catch (error) {
        console.error('Error submitting pit data:', error);
        res.status(500).json({ error: 'Failed to save pit data' });
    }
});

// Submit match scouting data (requires auth)
app.post('/api/submit-match', checkAuth, async (req, res) => {
    try {
        const submission = req.body;
        
        console.log('🎮 Receiving match data: Team', submission.teamNumber, 'Match', submission.matchNumber);
        
        if (!submission.teamNumber || !submission.matchNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const data = await readData(MATCH_DATA_FILE);
        const entry = {
            id: Date.now().toString(),
            ...submission,
            serverTimestamp: new Date().toISOString()
        };
        
        data.push(entry);
        
        if (await writeData(MATCH_DATA_FILE, data)) {
            console.log('✅ Match data saved! Total entries:', data.length);
            res.json({ success: true, message: 'Match data submitted', id: entry.id });
        } else {
            res.status(500).json({ error: 'Failed to save match data' });
        }
    } catch (error) {
        console.error('Error submitting match data:', error);
        res.status(500).json({ error: 'Failed to save match data' });
    }
});

// Get pit data (protected)
app.get('/api/pit-data', checkAuth, async (req, res) => {
    try {
        const data = await readData(PIT_DATA_FILE);
        console.log('📊 Sending', data.length, 'pit entries to client');
        res.json(data);
    } catch (error) {
        console.error('Error reading pit data:', error);
        res.status(500).json({ error: 'Failed to retrieve pit data' });
    }
});

// Get match data (protected)
app.get('/api/match-data', checkAuth, async (req, res) => {
    try {
        const data = await readData(MATCH_DATA_FILE);
        console.log('📊 Sending', data.length, 'match entries to client');
        res.json(data);
    } catch (error) {
        console.error('Error reading match data:', error);
        res.status(500).json({ error: 'Failed to retrieve match data' });
    }
});

// Legacy endpoint - for backwards compatibility
app.post('/api/submit', (req, res) => {
    try {
        const submission = req.body;
        console.log('📝 Receiving submission (legacy)');
        
        const data = readData(MATCH_DATA_FILE);
        const entry = {
            id: Date.now().toString(),
            ...submission,
            serverTimestamp: new Date().toISOString()
        };
        
        data.push(entry);
        
        if (writeData(MATCH_DATA_FILE, data)) {
            res.json({ success: true, message: 'Data submitted successfully', id: entry.id });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Get all data (protected) - returns both match and pit data
app.get('/api/data', checkAuth, async (req, res) => {
    try {
        const matchData = await readData(MATCH_DATA_FILE);
        const pitData = await readData(PIT_DATA_FILE);
        console.log('📊 Sending combined data to client');
        res.json({ matchData, pitData });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// Get data by team (protected)
app.get('/api/data/team/:teamNumber', checkAuth, (req, res) => {
    try {
        const teamNumber = parseInt(req.params.teamNumber);
        const data = readData();
        const teamData = data.filter(entry => entry.teamNumber === teamNumber);
        res.json(teamData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to retrieve team data' });
    }
});

// Get data by match (protected)
app.get('/api/data/match/:matchNumber', checkAuth, (req, res) => {
    try {
        const matchNumber = parseInt(req.params.matchNumber);
        const data = readData();
        const matchData = data.filter(entry => entry.matchNumber === matchNumber);
        res.json(matchData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to retrieve match data' });
    }
});

// Delete specific entry (optional - for data management)
app.delete('/api/data/:id', checkDevAuth, (req, res) => {
    try {
        const id = req.params.id;
        const data = readData();
        const filteredData = data.filter(entry => entry.id !== id);
        
        if (writeData(filteredData)) {
            console.log('🗑️ Entry deleted by dev:', id);
            res.json({ 
                success: true, 
                message: 'Entry deleted successfully',
                remainingEntries: filteredData.length 
            });
        } else {
            res.status(500).json({ error: 'Failed to delete entry' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Clear all data (dev only)
app.delete('/api/data', checkDevAuth, (req, res) => {
    try {
        if (writeData([])) {
            console.log('🗑️ All data cleared by dev');
            res.json({ success: true, message: 'All data cleared' });
        } else {
            res.status(500).json({ error: 'Failed to clear data' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to clear data' });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    const matchData = await readData(MATCH_DATA_FILE);
    const pitData = await readData(PIT_DATA_FILE);
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        matchEntries: matchData.length,
        pitEntries: pitData.length,
        totalEntries: matchData.length + pitData.length,
        firebaseEnabled: FIREBASE_ENABLED
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🤖 FTC Scout server running on port ${PORT}`);
    console.log(`📊 Access the app at http://localhost:${PORT}`);
});
