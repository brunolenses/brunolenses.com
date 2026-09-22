const SUPABASE_URL = 'https://pqeqccbtqrmsvivnisuc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXFjY2J0cXJtc3Zpdm5pc3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODM0ODksImV4cCI6MjA4Nzk1OTQ4OX0.9AHXafOxSKYW0rtaXQcSoNakpM5cdf9bQ_P6d_5nhi0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabaseClient = supabase; // Expose for other scripts

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const path = window.location.pathname;
    const isLoginPage = path.includes('client-login.html');
    const isDashboardPage = path.includes('client-dashboard.html');
    
    if (session && isLoginPage) {
        window.location.href = 'client-dashboard.html';
    }
    
    if (!session && isDashboardPage) {
        window.location.href = 'client-login.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');
    const errorMsg = document.getElementById('errorMessage');

    if(btnText) btnText.style.display = 'none';
    if(spinner) spinner.style.display = 'block';
    if(errorMsg) errorMsg.style.display = 'none';

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        if(errorMsg) {
            errorMsg.textContent = 'Invalid login credentials.';
            errorMsg.style.display = 'block';
        }
        if(btnText) btnText.style.display = 'block';
        if(spinner) spinner.style.display = 'none';
    } else {
        window.location.href = 'client-dashboard.html';
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'client-login.html';
}
