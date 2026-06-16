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
    
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: alpacaKey.value,
          secret: alpacaSecret.value
        })
      });
      
      if (!res.ok) throw new Error('Failed to update keys');
      
      keysMsg.textContent = 'Credentials successfully vaulted.';
      alpacaKey.value = '';
      alpacaSecret.value = '';
      setTimeout(() => keysMsg.textContent = '', 3000);
      
      // Refresh portfolio to show new data
      loadRealData();
    } catch (err) {
      keysMsg.textContent = 'Error saving credentials.';
    }
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
    loadRealData();
  }

  async function loadRealData() {
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/user/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.connected) {
        document.getElementById('val-equity').textContent = '$' + parseFloat(data.equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('val-bp').textContent = '$' + parseFloat(data.buying_power).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      } else {
        document.getElementById('val-equity').textContent = 'Needs API Keys';
        document.getElementById('val-bp').textContent = 'Needs API Keys';
      }
    } catch (err) {
      console.error(err);
      document.getElementById('val-equity').textContent = 'Error';
      document.getElementById('val-bp').textContent = 'Error';
    }
  }
});
