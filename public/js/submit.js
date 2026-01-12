// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Check if team has already submitted
function checkSubmissionStatus() {
    const hasSubmitted = localStorage.getItem('ftc_submitted');
    const teamNumber = localStorage.getItem('ftc_team_number');
    
    if (hasSubmitted === 'true') {
        const form = document.getElementById('scoutingForm');
        const message = document.getElementById('alreadySubmittedMessage');
        const teamDisplay = message?.querySelector('.submitted-team-number');
        
        if (form) form.style.display = 'none';
        if (message) {
            message.style.display = 'block';
            if (teamDisplay && teamNumber) {
                teamDisplay.textContent = `Team #${teamNumber}`;
            }
        }
    }
}

// Check on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSubmissionStatus);
} else {
    checkSubmissionStatus();
}

// Form elements
const form = document.getElementById('scoutingForm');
const submitStatus = document.getElementById('submitStatus');
const speedSlider = document.getElementById('robotSpeed');
const speedValue = document.getElementById('speedValue');

// Update speed display
if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', (e) => {
        speedValue.textContent = e.target.value;
    });
}

// Handle form submission
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            timestamp: new Date().toISOString(),
            scoutingTeam: formData.get('scoutingTeam'),
            scoutName: formData.get('scoutName'),
            matchNumber: parseInt(formData.get('matchNumber')),
            teamNumber: parseInt(formData.get('teamNumber')),
            alliance: formData.get('alliance'),
            auto: {
                moved: formData.get('autoMoved') === 'yes',
                samples: parseInt(formData.get('autoSamples')),
                specimens: parseInt(formData.get('autoSpecimens'))
            },
            teleop: {
                samples: parseInt(formData.get('teleopSamples')),
                specimens: parseInt(formData.get('teleopSpecimens')),
                defense: formData.get('teleopDefense')
            },
            endgame: {
                climb: formData.get('endgameClimb'),
                parked: formData.get('endgameParked') === 'yes'
            },
            robotSpeed: parseInt(formData.get('robotSpeed')),
            notes: formData.get('notes')
        };

        try {
            // Show loading
            showStatus('Submitting data...', 'info');
            
            const response = await fetch(`${API_URL}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Submission failed');
            }

            const result = await response.json();
            
            // Success
            showStatus('✓ Data submitted successfully!', 'success');
            
            // Mark as submitted in localStorage
            localStorage.setItem('ftc_submitted', 'true');
            localStorage.setItem('ftc_team_number', data.teamNumber);
            
            // Hide form and show thank you message
            form.style.display = 'none';
            const message = document.getElementById('alreadySubmittedMessage');
            const teamDisplay = message?.querySelector('.submitted-team-number');
            if (message) {
                message.style.display = 'block';
                if (teamDisplay) {
                    teamDisplay.textContent = `Team #${data.teamNumber}`;
                }
            }
            
            // Store in IndexedDB for offline sync
            await storeOfflineData(data);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Submission error:', error);
            
            // Store offline
            await storeOfflineData(data);
            
            if (!navigator.onLine) {
                showStatus('📱 Saved offline. Will sync when online.', 'info');
                form.reset();
                speedValue.textContent = '3';
            } else {
                showStatus('⚠ Submission failed. Saved locally for retry.', 'error');
            }
        }
    });
}

// Show status message
function showStatus(message, type) {
    submitStatus.textContent = message;
    submitStatus.className = `status-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            submitStatus.style.display = 'none';
        }, 5000);
    }
}

// IndexedDB for offline storage
let db;

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FTCScoutDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains('submissions')) {
                db.createObjectStore('submissions', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function storeOfflineData(data) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['submissions'], 'readwrite');
        const store = transaction.objectStore('submissions');
        const request = store.add({ ...data, synced: false });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Sync offline data when online
async function syncOfflineData() {
    if (!db) await initDB();
    
    const transaction = db.transaction(['submissions'], 'readwrite');
    const store = transaction.objectStore('submissions');
    const request = store.getAll();
    
    request.onsuccess = async () => {
        const submissions = request.result.filter(s => !s.synced);
        
        for (const submission of submissions) {
            try {
                const response = await fetch(`${API_URL}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submission)
                });
                
                if (response.ok) {
                    // Mark as synced
                    submission.synced = true;
                    const updateTx = db.transaction(['submissions'], 'readwrite');
                    updateTx.objectStore('submissions').put(submission);
                }
            } catch (error) {
                console.error('Sync failed for submission:', error);
            }
        }
    };
}

// Initialize and sync
initDB().then(() => {
    if (navigator.onLine) {
        syncOfflineData();
    }
});

window.addEventListener('online', syncOfflineData);
