// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Check authentication on page load
const sessionToken = sessionStorage.getItem('sessionToken');
if (!sessionToken) {
    window.location.href = '/pit-scout.html';
}

// Theme toggle
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('sessionToken');
        sessionStorage.removeItem('userRole');
        window.location.href = '/pit-scout.html';
    });
}

// Tab Navigation
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Load data for specific tabs
        if (tabName === 'pit-data') loadPitData();
        if (tabName === 'match-data') loadMatchData();
        if (tabName === 'analytics') loadAnalytics();
        if (tabName === 'tools') loadToolsData();
    });
});

// Game Scouting Form
const gameForm = document.getElementById('gameScoutingForm');
const speedSlider = document.getElementById('robotSpeed');
const speedValue = document.getElementById('speedValue');

if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', (e) => {
        speedValue.textContent = e.target.value;
    });
}

if (gameForm) {
    gameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(gameForm);
        const data = {
            type: 'match',
            timestamp: new Date().toISOString(),
            matchNumber: parseInt(formData.get('matchNumber')),
            teamNumber: parseInt(formData.get('teamNumber')),
            alliance: formData.get('alliance'),
            scoutName: formData.get('scoutName'),
            autoMoved: formData.get('autoMoved'),
            autoSamples: parseInt(formData.get('autoSamples')),
            autoSpecimens: parseInt(formData.get('autoSpecimens')),
            teleopSamples: parseInt(formData.get('teleopSamples')),
            teleopSpecimens: parseInt(formData.get('teleopSpecimens')),
            teleopDefense: formData.get('teleopDefense'),
            endgameClimb: formData.get('endgameClimb'),
            endgameParked: formData.get('endgameParked'),
            robotSpeed: parseInt(formData.get('robotSpeed')),
            notes: formData.get('notes')
        };

        try {
            showGameStatus('Submitting match data...', 'info');
            
            const response = await fetch(`${API_URL}/submit-match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Submission failed');

            showGameStatus('✓ Match data submitted!', 'success');
            gameForm.reset();
            speedValue.textContent = '3';
            
        } catch (error) {
            console.error('Submission error:', error);
            showGameStatus('✗ Submission failed', 'error');
        }
    });
}

function showGameStatus(message, type) {
    const status = document.getElementById('gameScoutStatus');
    if (!status) return;
    
    status.textContent = message;
    status.className = `status-message status-${type}`;
    status.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => status.style.display = 'none', 5000);
    }
}

// Pit Data Tab
let pitDataCache = [];

async function loadPitData() {
    const listEl = document.getElementById('pitDataList');
    if (!listEl) return;
    
    try {
        const response = await fetch(`${API_URL}/pit-data`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load pit data');
        
        pitDataCache = await response.json();
        displayPitData(pitDataCache);
        
    } catch (error) {
        console.error('Error loading pit data:', error);
        listEl.innerHTML = '<p class="error">Failed to load pit data</p>';
    }
}

function displayPitData(data) {
    const listEl = document.getElementById('pitDataList');
    if (!data || data.length === 0) {
        listEl.innerHTML = '<p class="no-data">No pit scouting data yet</p>';
        return;
    }
    
    listEl.innerHTML = data.map(entry => `
        <div class="data-card">
            <div class="data-header">
                <h3>Team ${entry.teamNumber}</h3>
                <span class="data-date">${new Date(entry.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="data-body">
                <p><strong>Team Name:</strong> ${entry.teamName || 'N/A'}</p>
                <p><strong>Drivetrain:</strong> ${entry.drivetrainType}</p>
                <p><strong>Samples:</strong> ${entry.canScoreSamples}, <strong>Specimens:</strong> ${entry.canScoreSpecimens}</p>
                <p><strong>Climb:</strong> ${entry.canClimb}</p>
                <p><strong>Autonomous:</strong> ${entry.hasAutonomous}</p>
                ${entry.strengths ? `<p><strong>Strengths:</strong> ${entry.strengths}</p>` : ''}
                <p class="scout-name">Scout: ${entry.scoutName}</p>
            </div>
        </div>
    `).join('');
}

// Pit data search
const pitSearchInput = document.getElementById('pitSearchInput');
if (pitSearchInput) {
    pitSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = pitDataCache.filter(entry => 
            entry.teamNumber.toString().includes(searchTerm) ||
            (entry.teamName && entry.teamName.toLowerCase().includes(searchTerm))
        );
        displayPitData(filtered);
    });
}

// Match Data Tab
let matchDataCache = [];
let filteredMatchData = [];

async function loadMatchData() {
    const listEl = document.getElementById('matchDataList');
    if (!listEl) return;
    
    try {
        const response = await fetch(`${API_URL}/match-data`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load match data');
        
        matchDataCache = await response.json();
        filteredMatchData = [...matchDataCache];
        displayMatchData(filteredMatchData);
        
    } catch (error) {
        console.error('Error loading match data:', error);
        listEl.innerHTML = '<p class="error">Failed to load match data</p>';
    }
}

function displayMatchData(data) {
    const listEl = document.getElementById('matchDataList');
    if (!data || data.length === 0) {
        listEl.innerHTML = '<p class="no-data">No match data yet</p>';
        return;
    }
    
    listEl.innerHTML = data.map(entry => {
        const totalScore = calculateScore(entry);
        return `
            <div class="data-card match-card ${entry.alliance}">
                <div class="data-header">
                    <div>
                        <h3>Match ${entry.matchNumber} - Team ${entry.teamNumber}</h3>
                        <span class="alliance-badge ${entry.alliance}">${entry.alliance.toUpperCase()}</span>
                    </div>
                    <div class="score-display">${totalScore} pts</div>
                </div>
                <div class="data-body">
                    <div class="score-breakdown">
                        <div class="score-section">
                            <h4>Auto</h4>
                            <p>Samples: ${entry.autoSamples}</p>
                            <p>Specimens: ${entry.autoSpecimens}</p>
                        </div>
                        <div class="score-section">
                            <h4>Teleop</h4>
                            <p>Samples: ${entry.teleopSamples}</p>
                            <p>Specimens: ${entry.teleopSpecimens}</p>
                            <p>Defense: ${entry.teleopDefense}</p>
                        </div>
                        <div class="score-section">
                            <h4>Endgame</h4>
                            <p>Climb: ${entry.endgameClimb}</p>
                            <p>Parked: ${entry.endgameParked}</p>
                        </div>
                    </div>
                    ${entry.notes ? `<p class="notes"><strong>Notes:</strong> ${entry.notes}</p>` : ''}
                    <p class="scout-name">Scout: ${entry.scoutName} | Speed: ${entry.robotSpeed}/5</p>
                    <p class="data-date">${new Date(entry.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `;
    }).join('');
}

function calculateScore(entry) {
    // Simplified scoring - adjust based on actual game rules
    let score = 0;
    score += entry.autoSamples * 6;
    score += entry.autoSpecimens * 10;
    score += entry.teleopSamples * 4;
    score += entry.teleopSpecimens * 6;
    if (entry.endgameClimb === 'low') score += 5;
    if (entry.endgameClimb === 'high') score += 15;
    if (entry.endgameParked === 'yes') score += 3;
    return score;
}

// Filtering
function applyFilters() {
    const teamFilter = document.getElementById('teamFilter').value;
    const matchFilter = document.getElementById('matchFilter').value;
    const allianceFilter = document.getElementById('allianceFilter').value;
    
    filteredMatchData = matchDataCache.filter(entry => {
        if (teamFilter && entry.teamNumber.toString() !== teamFilter) return false;
        if (matchFilter && entry.matchNumber.toString() !== matchFilter) return false;
        if (allianceFilter && entry.alliance !== allianceFilter) return false;
        return true;
    });
    
    displayMatchData(filteredMatchData);
}

function clearFilters() {
    document.getElementById('teamFilter').value = '';
    document.getElementById('matchFilter').value = '';
    document.getElementById('allianceFilter').value = '';
    filteredMatchData = [...matchDataCache];
    displayMatchData(filteredMatchData);
}

function sortMatchData() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredMatchData.sort((a, b) => {
        switch(sortBy) {
            case 'timestamp':
                return new Date(b.timestamp) - new Date(a.timestamp);
            case 'teamNumber':
                return a.teamNumber - b.teamNumber;
            case 'matchNumber':
                return a.matchNumber - b.matchNumber;
            case 'totalScore':
                return calculateScore(b) - calculateScore(a);
            default:
                return 0;
        }
    });
    
    displayMatchData(filteredMatchData);
}

// Analytics Tab
async function loadAnalytics() {
    calculateQuickStats();
    generateRankings();
}

function calculateQuickStats() {
    const totalTeams = new Set(matchDataCache.map(e => e.teamNumber)).size;
    const totalMatches = matchDataCache.length;
    const avgScore = totalMatches > 0 
        ? Math.round(matchDataCache.reduce((sum, e) => sum + calculateScore(e), 0) / totalMatches)
        : 0;
    
    // Find top team
    const teamScores = {};
    matchDataCache.forEach(entry => {
        if (!teamScores[entry.teamNumber]) {
            teamScores[entry.teamNumber] = { total: 0, count: 0 };
        }
        teamScores[entry.teamNumber].total += calculateScore(entry);
        teamScores[entry.teamNumber].count += 1;
    });
    
    let topTeam = '-';
    let topAvg = 0;
    for (const [team, data] of Object.entries(teamScores)) {
        const avg = data.total / data.count;
        if (avg > topAvg) {
            topAvg = avg;
            topTeam = team;
        }
    }
    
    document.getElementById('totalTeams').textContent = totalTeams;
    document.getElementById('totalMatches').textContent = totalMatches;
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('topTeam').textContent = topTeam;
}

function generateRankings() {
    const teamStats = {};
    
    matchDataCache.forEach(entry => {
        if (!teamStats[entry.teamNumber]) {
            teamStats[entry.teamNumber] = {
                teamNumber: entry.teamNumber,
                matches: 0,
                totalScore: 0,
                avgScore: 0,
                autoTotal: 0,
                teleopTotal: 0,
                climbs: 0
            };
        }
        
        const stats = teamStats[entry.teamNumber];
        stats.matches++;
        stats.totalScore += calculateScore(entry);
        stats.autoTotal += entry.autoSamples + entry.autoSpecimens;
        stats.teleopTotal += entry.teleopSamples + entry.teleopSpecimens;
        if (entry.endgameClimb === 'low' || entry.endgameClimb === 'high') stats.climbs++;
    });
    
    // Calculate averages
    Object.values(teamStats).forEach(stats => {
        stats.avgScore = Math.round(stats.totalScore / stats.matches);
    });
    
    // Sort by average score
    const rankings = Object.values(teamStats).sort((a, b) => b.avgScore - a.avgScore);
    
    const rankingsEl = document.getElementById('teamRankings');
    if (rankings.length === 0) {
        rankingsEl.innerHTML = '<p class="no-data">No data for rankings yet</p>';
        return;
    }
    
    rankingsEl.innerHTML = `
        <div class="rankings-table">
            <div class="rankings-header">
                <span>Rank</span>
                <span>Team</span>
                <span>Matches</span>
                <span>Avg Score</span>
                <span>Auto</span>
                <span>Teleop</span>
                <span>Climbs</span>
            </div>
            ${rankings.map((stats, index) => `
                <div class="rankings-row">
                    <span class="rank">#${index + 1}</span>
                    <span class="team">${stats.teamNumber}</span>
                    <span>${stats.matches}</span>
                    <span class="score">${stats.avgScore}</span>
                    <span>${Math.round(stats.autoTotal / stats.matches)}</span>
                    <span>${Math.round(stats.teleopTotal / stats.matches)}</span>
                    <span>${stats.climbs}/${stats.matches}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function compareTeams() {
    const team1 = document.getElementById('compareTeam1').value;
    const team2 = document.getElementById('compareTeam2').value;
    const team3 = document.getElementById('compareTeam3').value;
    
    if (!team1 || !team2) {
        alert('Please enter at least 2 teams to compare');
        return;
    }
    
    const teams = [team1, team2];
    if (team3) teams.push(team3);
    
    const comparison = teams.map(teamNum => {
        const teamMatches = matchDataCache.filter(e => e.teamNumber.toString() === teamNum);
        if (teamMatches.length === 0) return null;
        
        const totalScore = teamMatches.reduce((sum, e) => sum + calculateScore(e), 0);
        return {
            teamNumber: teamNum,
            matches: teamMatches.length,
            avgScore: Math.round(totalScore / teamMatches.length),
            autoAvg: Math.round(teamMatches.reduce((sum, e) => sum + e.autoSamples + e.autoSpecimens, 0) / teamMatches.length),
            teleopAvg: Math.round(teamMatches.reduce((sum, e) => sum + e.teleopSamples + e.teleopSpecimens, 0) / teamMatches.length),
            climbRate: Math.round((teamMatches.filter(e => e.endgameClimb === 'low' || e.endgameClimb === 'high').length / teamMatches.length) * 100)
        };
    }).filter(t => t !== null);
    
    const resultsEl = document.getElementById('comparisonResults');
    if (comparison.length === 0) {
        resultsEl.innerHTML = '<p class="error">No data found for these teams</p>';
        return;
    }
    
    resultsEl.innerHTML = `
        <div class="comparison-table">
            <div class="comparison-header">
                <span>Metric</span>
                ${comparison.map(t => `<span>Team ${t.teamNumber}</span>`).join('')}
            </div>
            <div class="comparison-row">
                <span>Matches</span>
                ${comparison.map(t => `<span>${t.matches}</span>`).join('')}
            </div>
            <div class="comparison-row">
                <span>Avg Score</span>
                ${comparison.map(t => `<span class="score">${t.avgScore}</span>`).join('')}
            </div>
            <div class="comparison-row">
                <span>Auto Avg</span>
                ${comparison.map(t => `<span>${t.autoAvg}</span>`).join('')}
            </div>
            <div class="comparison-row">
                <span>Teleop Avg</span>
                ${comparison.map(t => `<span>${t.teleopAvg}</span>`).join('')}
            </div>
            <div class="comparison-row">
                <span>Climb Rate</span>
                ${comparison.map(t => `<span>${t.climbRate}%</span>`).join('')}
            </div>
        </div>
    `;
}

// Tools Tab
async function loadToolsData() {
    loadScoutActivity();
    loadComments();
}

function loadScoutActivity() {
    const scouts = {};
    
    [...matchDataCache, ...pitDataCache].forEach(entry => {
        if (!scouts[entry.scoutName]) {
            scouts[entry.scoutName] = { match: 0, pit: 0 };
        }
        if (entry.type === 'match' || entry.matchNumber) {
            scouts[entry.scoutName].match++;
        } else {
            scouts[entry.scoutName].pit++;
        }
    });
    
    const activityEl = document.getElementById('scoutActivity');
    if (Object.keys(scouts).length === 0) {
        activityEl.innerHTML = '<p class="no-data">No scout activity yet</p>';
        return;
    }
    
    activityEl.innerHTML = Object.entries(scouts).map(([name, counts]) => `
        <div class="activity-card">
            <h4>${name}</h4>
            <p>Match Scouting: ${counts.match} | Pit Scouting: ${counts.pit}</p>
        </div>
    `).join('');
}

// Comments system (simplified)
let comments = JSON.parse(localStorage.getItem('teamComments') || '[]');

function loadComments() {
    const commentsEl = document.getElementById('commentsDisplay');
    if (comments.length === 0) {
        commentsEl.innerHTML = '<p class="no-data">No comments yet</p>';
        return;
    }
    
    commentsEl.innerHTML = comments.map((c, i) => `
        <div class="comment-card">
            <h4>Team ${c.team}</h4>
            <p>${c.text}</p>
            <small>${new Date(c.timestamp).toLocaleString()}</small>
        </div>
    `).join('');
}

function addComment() {
    const team = document.getElementById('commentTeam').value;
    const text = document.getElementById('commentText').value;
    
    if (!team || !text) {
        alert('Please enter team number and comment');
        return;
    }
    
    comments.push({
        team: parseInt(team),
        text: text,
        timestamp: new Date().toISOString(),
        author: 'Team 22351'
    });
    
    localStorage.setItem('teamComments', JSON.stringify(comments));
    document.getElementById('commentTeam').value = '';
    document.getElementById('commentText').value = '';
    loadComments();
    alert('Comment added!');
}

// QR Code generation
function generateQR() {
    const url = window.location.origin + '/pit-scout.html';
    const qrDisplay = document.getElementById('qrCodeDisplay');
    qrDisplay.innerHTML = `
        <div class="qr-section">
            <p>Share this URL:</p>
            <input type="text" value="${url}" readonly class="url-display">
            <p style="margin-top: 15px;">Or scan with QR app to generate QR code for: <code>${url}</code></p>
        </div>
    `;
}

// Export functions
function exportMatchData() {
    const csv = convertToCSV(filteredMatchData);
    downloadCSV(csv, 'match-data.csv');
}

function exportPitData() {
    const csv = convertToCSV(pitDataCache);
    downloadCSV(csv, 'pit-data.csv');
}

function exportAllCSV() {
    exportMatchData();
    setTimeout(() => exportPitData(), 500);
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(entry => 
        headers.map(header => JSON.stringify(entry[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function backupData() {
    const backup = {
        matchData: matchDataCache,
        pitData: pitDataCache,
        comments: comments,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftc-backup-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert('Backup downloaded!');
}

// Auto-refresh for real-time updates
setInterval(() => {
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
        if (activeTab.id === 'match-data') loadMatchData();
        if (activeTab.id === 'pit-data') loadPitData();
    }
}, 5000);

// Initial load
loadMatchData();
