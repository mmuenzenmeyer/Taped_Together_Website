// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Check if team has already submitted
function checkSubmissionStatus() {
    const hasSubmitted = localStorage.getItem('ftc_pit_submitted');
    const teamNumber = localStorage.getItem('ftc_pit_team_number');
    
    if (hasSubmitted === 'true') {
        const form = document.getElementById('pitScoutingForm');
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
const form = document.getElementById('pitScoutingForm');
const submitStatus = document.getElementById('submitStatus');

// Handle form submission
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const data = {
            type: 'pit',
            timestamp: new Date().toISOString(),
            teamNumber: formData.get('teamNumber'),
            teamName: formData.get('teamName'),
            scoutName: formData.get('scoutName'),
            drivetrainType: formData.get('drivetrainType'),
            driveMotors: parseInt(formData.get('driveMotors')),
            robotWeight: formData.get('robotWeight'),
            robotDimensions: formData.get('robotDimensions'),
            canScoreSamples: formData.get('canScoreSamples'),
            canScoreSpecimens: formData.get('canScoreSpecimens'),
            intakeType: formData.get('intakeType'),
            canClimb: formData.get('canClimb'),
            canPark: formData.get('canPark'),
            hasAutonomous: formData.get('hasAutonomous'),
            autoCapabilities: formData.get('autoCapabilities'),
            strengths: formData.get('strengths'),
            weaknesses: formData.get('weaknesses'),
            preferredRole: formData.get('preferredRole'),
            notes: formData.get('notes')
        };

        try {
            // Show loading
            showStatus('Submitting pit data...', 'info');
            
            const response = await fetch(`${API_URL}/submit-pit`, {
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
            showStatus('✓ Pit data submitted successfully!', 'success');
            
            // Mark as submitted in localStorage
            localStorage.setItem('ftc_pit_submitted', 'true');
            localStorage.setItem('ftc_pit_team_number', data.teamNumber);
            
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

        } catch (error) {
            console.error('Submission error:', error);
            showStatus('✗ Submission failed. Please try again.', 'error');
        }
    });
}

// Status message helper
function showStatus(message, type) {
    if (!submitStatus) return;
    
    submitStatus.textContent = message;
    submitStatus.className = `status-message status-${type}`;
    submitStatus.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            submitStatus.style.display = 'none';
        }, 5000);
    }
}
