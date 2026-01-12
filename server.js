const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// Password for viewing data - CHANGE THIS!
const VIEW_PASSWORD = process.env.VIEW_PASSWORD || '22351';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    console.log('Created submissions.json file');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Helper functions
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// Authentication middleware
function checkAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${VIEW_PASSWORD}`) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === VIEW_PASSWORD) {
        res.json({ success: true, token: VIEW_PASSWORD });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

// API Routes

// Submit scouting data
app.post('/api/submit', (req, res) => {
    try {
        const submission = req.body;
        
        console.log('📝 Receiving submission:', submission.teamNumber, 'Match', submission.matchNumber);
        
        // Validate required fields
        if (!submission.teamNumber || !submission.matchNumber) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Read existing data
        const data = readData();
        
        // Add new submission with server timestamp
        const entry = {
            id: Date.now().toString(),
            ...submission,
            serverTimestamp: new Date().toISOString()
        };
        
        data.push(entry);
        
        // Save to file
        if (writeData(data)) {
            console.log('✅ Data saved! Total entries:', data.length);
            res.json({ success: true, message: 'Data submitted successfully', id: entry.id });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Get all data (protected)
app.get('/api/data', checkAuth, (req, res) => {
    try {
        const data = readData();
        console.log('📊 Sending', data.length, 'entries to client');
        res.json(data);
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
app.delete('/api/data/:id', (req, res) => {
    try {
        const id = req.params.id;
        const data = readData();
        const filteredData = data.filter(entry => entry.id !== id);
        
        if (writeData(filteredData)) {
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        totalEntries: readData().length 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🤖 FTC Scout server running on port ${PORT}`);
    console.log(`📊 Access the app at http://localhost:${PORT}`);
});
