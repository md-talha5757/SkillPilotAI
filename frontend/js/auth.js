// Handles the login/signup form on login.html

const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const authToggleText = document.getElementById('auth-toggle-text');
const authTitle = document.getElementById('auth-title');
const nameField = document.getElementById('name-field');
const submitBtn = document.getElementById('auth-submit');

let mode = 'login'; // 'login' or 'signup'

function switchMode(newMode) {
  mode = newMode;
  authError.textContent = '';

  if (mode === 'signup') {
    authTitle.textContent = 'Create your account';
    submitBtn.textContent = 'Sign up';
    nameField.style.display = 'block';
    authToggleText.innerHTML = `Already have an account? <a href="#" id="toggle-link">Log in</a>`;
  } else {
    authTitle.textContent = 'Welcome back';
    submitBtn.textContent = 'Log in';
    nameField.style.display = 'none';
    authToggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-link">Sign up</a>`;
  }

  // re-attach click listener since we replaced the link's HTML
  document.getElementById('toggle-link').addEventListener('click', (e) => {
    e.preventDefault();
    switchMode(mode === 'login' ? 'signup' : 'login');
  });
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    let result;
    if (mode === 'signup') {
      const name = document.getElementById('name').value.trim();
      if (!name) {
        authError.textContent = 'Please enter your name';
        return;
      }
      result = await apiPost('/auth/register', { name, email, password });
    } else {
      result = await apiPost('/auth/login', { email, password });
    }

    // Save the token + user info so the rest of the app can use them
    localStorage.setItem('skillpilot_token', result.token);
    localStorage.setItem('skillpilot_user', JSON.stringify(result.user));

    // Go to the dashboard, and tell index.html to auto-open the app view
    window.location.href = 'index.html?enter=true';
  } catch (err) {
    authError.textContent = err.message;
  }
});

// Set up the initial toggle link listener
document.getElementById('toggle-link').addEventListener('click', (e) => {
  e.preventDefault();
  switchMode('signup');
});
