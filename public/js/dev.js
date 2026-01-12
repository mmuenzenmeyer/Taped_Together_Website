// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

let authToken = null;
let userRole = null;
let allData = [];
let deleteTargetId = null;
let autoRefreshInterval = null;

// Check authentication
window.addEventListener('load', () => {
    authToken = sessionStorage.getItem('authToken');
    userRole = sessionStorage.getItem('userRole');
    
    if (!authToken || userRole !== 'dev') {
        window.location.href = '/';
        return;
    }
    
    loadStats();
    loadRecentData();
    startAutoRefresh();
});

// Auto-refresh every 5 seconds
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        loadStats(true);
        loadRecentData(true);
    }, 5000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Logout
document.getElementById('logoutButton').addEventListener('click', () => {
    stopAutoRefresh();
    sessionStorage.clear();
    window.location.href = '/';
});

// Load statistics
async function loadStats(silent = false) {
    try {
        const response = await fetch(`${API_URL}/data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load data');
        
        allData = await response.json();
        
        // Calculate stats
        const totalEntries = allData.length;
        const uniqueTeams = new Set(allData.map(d => d.teamNumber)).size;
        const uniqueMatches = new Set(allData.map(d => d.matchNumber)).size;
        const lastEntry = allData.length > 0 ? new Date(allData[allData.length - 1].timestamp) : null;
        
        document.getElementById('totalEntries').textContent = totalEntries;
        document.getElementById('totalTeams').textContent = uniqueTeams;
        document.getElementById('totalMatches').textContent = uniqueMatches;
        document.getElementById('lastUpdate').textContent = lastEntry 
            ? lastEntry.toLocaleString() 
            : 'Never';
    } catch (error) {
        if (!silent) console.error('Error loading stats:', error);
    }
}

// Load recent data
async function loadRecentData(silent = false) {
    try {
        const response = await fetch(`${API_URL}/data`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load data');
        
        allData = await response.json();
        displayRecentData(allData.slice(-10).reverse()); // Last 10 entries
    } catch (error) {
        if (!silent) {
            console.error('Error loading data:', error);
            document.getElementById('dataPreview').innerHTML = 
                '<div class="no-data-message">⚠ Failed to load data</div>';
        }
    }
}

// Display data preview
function displayRecentData(data) {
    const container = document.getElementById('dataPreview');
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data-message">No data yet</div>';
        return;
    }
    
    container.innerHTML = data.map(entry => `
        <div class="data-card">
            <div class="data-card-header">
                <h3>Team ${entry.teamNumber} - Match ${entry.matchNumber}</h3>
                <button class="btn-delete" onclick="confirmDeleteEntry('${entry.id}')">🗑️</button>
            </div>
            <div class="data-card-body">
                <div class="data-field"><strong>Scout:</strong> ${entry.scoutName}</div>
                <div class="data-field"><strong>Alliance:</strong> ${entry.alliance}</div>
                <div class="data-field"><strong>Time:</strong> ${new Date(entry.timestamp).toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadStats();
    loadRecentData();
});

// View all data
document.getElementById('viewDataBtn').addEventListener('click', () => {
    window.location.href = '/view.html';
});

// Export data
document.getElementById('exportDataBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ftc-scout-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
});

// Clear all data
document.getElementById('clearDataBtn').addEventListener('click', () => {
    document.getElementById('clearAllModal').style.display = 'block';
    document.getElementById('confirmText').value = '';
});

document.getElementById('cancelClearAll').addEventListener('click', () => {
    document.getElementById('clearAllModal').style.display = 'none';
});

document.getElementById('confirmClearAll').addEventListener('click', async () => {
    const confirmText = document.getElementById('confirmText').value;
    
    if (confirmText === 'DELETE ALL') {
        try {
            const response = await fetch(`${API_URL}/data`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                alert('✅ All data cleared!');
                document.getElementById('clearAllModal').style.display = 'none';
                loadStats();
                loadRecentData();
            } else {
                alert('❌ Failed to clear data');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error clearing data');
        }
    } else {
        alert('❌ Incorrect confirmation text');
    }
});

// Delete single entry
window.confirmDeleteEntry = (id) => {
    deleteTargetId = id;
    document.getElementById('confirmModal').style.display = 'block';
};

document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
    deleteTargetId = null;
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!deleteTargetId) return;
    
    try {
        const response = await fetch(`${API_URL}/data/${deleteTargetId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            document.getElementById('confirmModal').style.display = 'none';
            loadStats();
            loadRecentData();
        } else {
            alert('❌ Failed to delete entry');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error deleting entry');
    }
    
    deleteTargetId = null;
});
