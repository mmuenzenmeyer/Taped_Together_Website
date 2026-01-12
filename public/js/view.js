// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Elements
const loginSection = document.getElementById('loginSection');
const dataSection = document.getElementById('dataSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');
const dataContainer = document.getElementById('dataContainer');
const searchTeam = document.getElementById('searchTeam');
const filterMatch = document.getElementById('filterMatch');
const refreshButton = document.getElementById('refreshData');
const exportCSVButton = document.getElementById('exportCSV');
const exportJSONButton = document.getElementById('exportJSON');
const totalEntries = document.getElementById('totalEntries');
const lastUpdated = document.getElementById('lastUpdated');

let allData = [];
let filteredData = [];
let authToken = null;
let userRole = null;
let autoRefreshInterval = null;

// Check for stored auth token
window.addEventListener('load', () => {
    authToken = sessionStorage.getItem('authToken');
    userRole = sessionStorage.getItem('userRole');
    if (authToken) {
        showDataSection();
        loadData();
        startAutoRefresh();
    }
});

// Auto-refresh every 5 seconds
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        loadData(true); // Silent refresh
    }, 5000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Login form handler
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                authToken = result.token;
                userRole = result.role;
                sessionStorage.setItem('authToken', authToken);
                sessionStorage.setItem('userRole', userRole);
                showDataSection();
                loadData();
                startAutoRefresh();
            } else {
                showLoginError('Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Login failed. Please try again.');
        }
    });
}

// Logout handler
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        stopAutoRefresh();
        sessionStorage.removeItem('authToken');
        authToken = null;
        loginSection.style.display = 'block';
        dataSection.style.display = 'none';
        document.getElementById('password').value = '';
    });
}

function showDataSection() {
    loginSection.style.display = 'none';
    dataSection.style.display = 'block';
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.className = 'status-message error';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 3000);
}

// Refresh button
if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        loadData();
    });
}

// Search functionality
if (searchTeam) {
    searchTeam.addEventListener('input', () => {
        filterData();
    });
}

// Match filter
if (filterMatch) {
    filterMatch.addEventListener('change', () => {
        filterData();
    });
}

// Load data from API
async function loadData(silent = false) {
    try {
        if (!silent) {
            dataContainer.innerHTML = '<div class="loading-message">Loading data...</div>';
        }
        
        const response = await fetch(`${API_URL}/data`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 401) {
            // Unauthorized - clear token and show login
            sessionStorage.removeItem('authToken');
            authToken = null;
            stopAutoRefresh();
            loginSection.style.display = 'block';
            dataSection.style.display = 'none';
            showLoginError('Session expired. Please login again.');
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        const newData = await response.json();
        
        // Only update if data changed
        if (JSON.stringify(newData) !== JSON.stringify(allData)) {
            allData = newData;
            filteredData = allData;
            
            // Update stats
            totalEntries.textContent = `${allData.length} entries`;
            lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            
            // Populate match filter
            populateMatchFilter();
            
            // Display data
            displayData(filteredData);
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        if (!silent) {
            dataContainer.innerHTML = '<div class="no-data-message">⚠ Failed to load data. Please check your connection.</div>';
        }
    }
}

// Populate match filter dropdown
function populateMatchFilter() {
    const matches = [...new Set(allData.map(d => d.matchNumber))].sort((a, b) => a - b);
    
    filterMatch.innerHTML = '<option value="">All Matches</option>';
    matches.forEach(match => {
        const option = document.createElement('option');
        option.value = match;
        option.textContent = `Match ${match}`;
        filterMatch.appendChild(option);
    });
}

// Filter data based on search and filters
function filterData() {
    const searchValue = searchTeam.value.toLowerCase();
    const matchValue = filterMatch.value;
    
    filteredData = allData.filter(entry => {
        const matchesSearch = !searchValue || 
            entry.teamNumber.toString().includes(searchValue) ||
            entry.scoutName.toLowerCase().includes(searchValue);
        
        const matchesFilter = !matchValue || 
            entry.matchNumber.toString() === matchValue;
        
        return matchesSearch && matchesFilter;
    });
    
    displayData(filteredData);
    totalEntries.textContent = `${filteredData.length} entries`;
}

// Display data cards
function displayData(data) {
    if (data.length === 0) {
        dataContainer.innerHTML = '<div class="no-data-message">📊 No data found. Submit some scouting data to get started!</div>';
        return;
    }
    
    dataContainer.innerHTML = data.map(entry => createDataCard(entry)).join('');
}

// Create individual data card
function createDataCard(entry) {
    const date = new Date(entry.timestamp);
    const allianceColor = entry.alliance === 'red' ? '#e94560' : '#4a90e2';
    
    return `
        <div class="data-card">
            <div class="data-card-header">
                <h3>Team ${entry.teamNumber}</h3>
                <span style="color: ${allianceColor}; font-weight: bold;">${entry.alliance.toUpperCase()}</span>
            </div>
            <div class="data-card-body">
                <div class="data-field">
                    <strong>Match Number</strong>
                    <span>${entry.matchNumber}</span>
                </div>
                <div class="data-field">
                    <strong>Scout</strong>
                    <span>${entry.scoutName}</span>
                </div>
                <div class="data-field">
                    <strong>Date/Time</strong>
                    <span>${date.toLocaleString()}</span>
                </div>
                <div class="data-field">
                    <strong>Auto Samples</strong>
                    <span>${entry.auto.samples}</span>
                </div>
                <div class="data-field">
                    <strong>Auto Specimens</strong>
                    <span>${entry.auto.specimens}</span>
                </div>
                <div class="data-field">
                    <strong>Teleop Samples</strong>
                    <span>${entry.teleop.samples}</span>
                </div>
                <div class="data-field">
                    <strong>Teleop Specimens</strong>
                    <span>${entry.teleop.specimens}</span>
                </div>
                <div class="data-field">
                    <strong>Climb Status</strong>
                    <span>${entry.endgame.climb}</span>
                </div>
                <div class="data-field">
                    <strong>Robot Speed</strong>
                    <span>${entry.robotSpeed}/5</span>
                </div>
                ${entry.notes ? `
                <div class="data-field" style="grid-column: 1 / -1;">
                    <strong>Notes</strong>
                    <span>${entry.notes}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Export to CSV
if (exportCSVButton) {
    exportCSVButton.addEventListener('click', () => {
        const csv = convertToCSV(filteredData);
        downloadFile(csv, 'ftc-scout-data.csv', 'text/csv');
    });
}

// Export to JSON
if (exportJSONButton) {
    exportJSONButton.addEventListener('click', () => {
        const json = JSON.stringify(filteredData, null, 2);
        downloadFile(json, 'ftc-scout-data.json', 'application/json');
    });
}

// Convert data to CSV
function convertToCSV(data) {
    if (data.length === 0) return '';
    
    const headers = [
        'Timestamp', 'Scout', 'Match', 'Team', 'Alliance',
        'Auto Moved', 'Auto Samples', 'Auto Specimens',
        'Teleop Samples', 'Teleop Specimens', 'Teleop Defense',
        'Climb', 'Parked', 'Robot Speed', 'Notes'
    ];
    
    const rows = data.map(entry => [
        entry.timestamp,
        entry.scoutName,
        entry.matchNumber,
        entry.teamNumber,
        entry.alliance,
        entry.auto.moved,
        entry.auto.samples,
        entry.auto.specimens,
        entry.teleop.samples,
        entry.teleop.specimens,
        entry.teleop.defense,
        entry.endgame.climb,
        entry.endgame.parked,
        entry.robotSpeed,
        entry.notes || ''
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
}

// Download file
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
