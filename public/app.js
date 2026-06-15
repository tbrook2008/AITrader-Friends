document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authView = document.getElementById('auth-view');
  const dashView = document.getElementById('dashboard-view');
  
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const authForm = document.getElementById('auth-form');
  const authSubmit = document.getElementById('auth-submit');
  const authError = document.getElementById('auth-error');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const navPortfolio = document.getElementById('nav-portfolio');
  const navSettings = document.getElementById('nav-settings');
  const navLogout = document.getElementById('nav-logout');
  
  const tabPortfolio = document.getElementById('tab-portfolio');
  const tabSettingsPane = document.getElementById('tab-settings');
  
  const keysForm = document.getElementById('keys-form');
  const alpacaKey = document.getElementById('alpaca-key');
  const alpacaSecret = document.getElementById('alpaca-secret');
  const keysMsg = document.getElementById('keys-msg');

  let currentAuthMode = 'login'; // 'login' or 'register'

  // Initialization
  checkAuth();

  // --- UI Interactions ---

  // Auth Tabs
  tabLogin.addEventListener('click', () => {
    currentAuthMode = 'login';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    authSubmit.textContent = 'Initialize Connection';
    authError.textContent = '';
  });

  tabRegister.addEventListener('click', () => {
    currentAuthMode = 'register';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    authSubmit.textContent = 'Apply for Syndicate';
    authError.textContent = '';
  });

  // Nav Tabs
  navPortfolio.addEventListener('click', () => {
    navPortfolio.classList.add('active');
    navSettings.classList.remove('active');
    tabPortfolio.classList.add('active');
    tabSettingsPane.classList.remove('active');
  });

  navSettings.addEventListener('click', () => {
    navSettings.classList.add('active');
    navPortfolio.classList.remove('active');
    tabSettingsPane.classList.add('active');
    tabPortfolio.classList.remove('active');
  });

  navLogout.addEventListener('click', () => {
    localStorage.removeItem('nexus_token');
    showAuth();
  });

  // --- API Integrations ---

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.value,
          password: passwordInput.value
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      
      if (currentAuthMode === 'register') {
        // Auto login after register
        currentAuthMode = 'login';
        authSubmit.click();
      } else {
        localStorage.setItem('nexus_token', data.token);
        showDashboard();
      }
    } catch (err) {
      authError.textContent = err.message;
    }
  });

  keysForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    keysMsg.textContent = 'Storing credentials securely...';
    // MOCK API UPDATE - You would build a POST /api/user/keys endpoint in index.js
    setTimeout(() => {
      keysMsg.textContent = 'Credentials successfully vaulted.';
      alpacaKey.value = '';
      alpacaSecret.value = '';
      setTimeout(() => keysMsg.textContent = '', 3000);
    }, 800);
  });

  // --- Helper Functions ---

  function checkAuth() {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      showDashboard();
    } else {
      showAuth();
    }
  }

  function showAuth() {
    authView.classList.add('active-view');
    dashView.classList.remove('active-view');
  }

  function showDashboard() {
    authView.classList.remove('active-view');
    dashView.classList.add('active-view');
    loadMockData(); // In reality, fetch from /api/user/portfolio
  }

  function loadMockData() {
    // Simulated fetching
    setTimeout(() => {
      document.getElementById('val-equity').textContent = '$10,000.00';
      document.getElementById('val-bp').textContent = '$40,000.00';
    }, 500);
  }
});
