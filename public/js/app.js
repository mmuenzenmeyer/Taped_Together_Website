// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// API endpoint
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Login Modal Handler
const loginBtn = document.getElementById('teamLoginBtn');
const loginModal = document.getElementById('loginModal');
const modalClose = document.getElementById('modalClose');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'block';
        setTimeout(() => {
            document.getElementById('password').focus();
        }, 100);
    });
}

if (modalClose) {
    modalClose.addEventListener('click', () => {
        loginModal.style.display = 'none';
        document.getElementById('password').value = '';
        loginError.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        document.getElementById('password').value = '';
        loginError.style.display = 'none';
    }
});

// Handle login form
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
                sessionStorage.setItem('sessionToken', result.token);
                sessionStorage.setItem('userRole', result.role);
                
                // Redirect based on role
                if (result.role === 'dev') {
                    window.location.href = '/dev.html';
                } else {
                    // Regular team login goes to dashboard
                    window.location.href = '/dashboard.html';
                }
            } else {
                showLoginError('Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Login failed. Please try again.');
        }
    });
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.className = 'status-message error';
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 3000);
}

// Install prompt
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const installButton = document.getElementById('installButton');
const dismissButton = document.getElementById('dismissButton');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installPrompt) {
        installPrompt.style.display = 'block';
    }
});

if (installButton) {
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            installPrompt.style.display = 'none';
        }
    });
}

if (dismissButton) {
    dismissButton.addEventListener('click', () => {
        installPrompt.style.display = 'none';
        deferredPrompt = null;
    });
}

// Online/Offline status
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    if (statusElement) {
        if (navigator.onLine) {
            statusElement.textContent = '● Online';
            statusElement.className = 'status-online';
        } else {
            statusElement.textContent = '● Offline';
            statusElement.className = 'status-offline';
        }
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
