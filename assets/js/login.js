/**
 * Chá Revelação - Login System
 * Secure authentication for admin panel access
 */

// Configurações de segurança
const LOGIN_CONFIG = {
    // Credenciais (em produção, use um sistema mais seguro)
    credentials: {
        username: 'admin',
        password: 'sirla8523' // Mude esta senha!
    },
    
    // Configurações de sessão
    sessionTimeout: 3600000, // 1 hora em milliseconds
    maxAttempts: 5,
    lockoutTime: 900000, // 15 minutos em milliseconds
    
    // Chaves do localStorage
    storageKeys: {
        authToken: 'cha_admin_token',
        loginAttempts: 'cha_login_attempts',
        lockoutTime: 'cha_lockout_time',
        logoutFlag: 'cha_logout_flag'
    }
};

/**
 * Login System Class
 */
class LoginSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        this.attempts = this.getStoredAttempts();
        this.isLocked = this.checkLockout();
        
        this.init();
    }
    
    /**
     * Initialize the login system
     */
    init() {
        this.setupEventListeners();
        this.createFloatingElements();
        this.checkExistingSession();
        this.updateUIState();
        this.clearLogoutFlag(); // Limpar flag de logout ao inicializar
        this.clearFormFields(); // Sempre limpar campos no início
        
        // Focus no primeiro campo
        setTimeout(() => {
            this.usernameInput.focus();
        }, 100);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Enter key handling
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin(e);
                }
            });
        });
        
        // Clear error on input
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('input', () => {
                this.clearError();
            });
        });
        
        // Prevent form auto-fill attacks
        this.form.addEventListener('input', () => {
            if (this.isLocked) {
                this.showError('Acesso temporariamente bloqueado. Tente novamente mais tarde.');
                this.usernameInput.value = '';
                this.passwordInput.value = '';
            }
        });
    }
    
    /**
     * Handle login attempt
     */
    async handleLogin(e) {
        e.preventDefault();
        
        if (this.isLocked) {
            this.showError('Acesso temporariamente bloqueado. Tente novamente mais tarde.');
            return;
        }
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        
        // Validação básica
        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos.');
            return;
        }
        
        this.setLoadingState(true);
        
        // Simula delay de rede para segurança
        await this.delay(1000 + Math.random() * 1000);
        
        try {
            if (this.validateCredentials(username, password)) {
                this.handleSuccessfulLogin();
            } else {
                this.handleFailedLogin();
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError('Erro interno. Tente novamente.');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Validate credentials
     */
    validateCredentials(username, password) {
        // Em produção, use hash e compare com backend
        return username === LOGIN_CONFIG.credentials.username && 
               password === LOGIN_CONFIG.credentials.password;
    }
    
    /**
     * Handle successful login
     */
    handleSuccessfulLogin() {
        // Limpar tentativas
        this.clearAttempts();
        
        // Criar token de sessão
        const token = this.generateSessionToken();
        this.storeAuthToken(token);
        
        // Feedback visual
        this.showSuccess('Login realizado com sucesso!');
        
        // Redirecionar após delay
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    }
    
    /**
     * Handle failed login
     */
    handleFailedLogin() {
        this.attempts++;
        this.storeAttempts();
        
        const remainingAttempts = LOGIN_CONFIG.maxAttempts - this.attempts;
        
        if (this.attempts >= LOGIN_CONFIG.maxAttempts) {
            this.lockAccount();
            this.showError('Muitas tentativas incorretas. Acesso bloqueado por 15 minutos.');
        } else {
            this.showError(`Credenciais incorretas. ${remainingAttempts} tentativa(s) restante(s).`);
        }
        
        // Limpar campos
        this.passwordInput.value = '';
        this.passwordInput.focus();
    }
    
    /**
     * Lock account temporarily
     */
    lockAccount() {
        this.isLocked = true;
        const lockoutEnd = Date.now() + LOGIN_CONFIG.lockoutTime;
        localStorage.setItem(LOGIN_CONFIG.storageKeys.lockoutTime, lockoutEnd.toString());
        this.updateUIState();
    }
    
    /**
     * Check if account is locked
     */
    checkLockout() {
        const lockoutEnd = localStorage.getItem(LOGIN_CONFIG.storageKeys.lockoutTime);
        if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
            return true;
        } else {
            localStorage.removeItem(LOGIN_CONFIG.storageKeys.lockoutTime);
            return false;
        }
    }
    
    /**
     * Generate session token
     */
    generateSessionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const data = `${timestamp}-${random}`;
        
        // Em produção, use uma biblioteca de JWT ou similar
        return btoa(data);
    }
    
    /**
     * Store authentication token
     */
    storeAuthToken(token) {
        const sessionData = {
            token,
            timestamp: Date.now(),
            expires: Date.now() + LOGIN_CONFIG.sessionTimeout
        };
        
        localStorage.setItem(LOGIN_CONFIG.storageKeys.authToken, JSON.stringify(sessionData));
    }
    
    /**
     * Check existing session
     */
    checkExistingSession() {
        // Verificar se há flag de logout explícito
        const logoutFlag = localStorage.getItem(LOGIN_CONFIG.storageKeys.logoutFlag);
        if (logoutFlag === 'true') {
            // Se houve logout explícito, não verificar sessão existente
            this.clearAllAuthData();
            this.showLogoutMessage();
            return;
        }
        
        const authData = localStorage.getItem(LOGIN_CONFIG.storageKeys.authToken);
        
        if (authData) {
            try {
                const session = JSON.parse(authData);
                
                if (Date.now() < session.expires) {
                    // Sessão válida, redirecionar
                    window.location.href = 'admin.html';
                    return;
                } else {
                    // Sessão expirada
                    this.clearAllAuthData();
                    this.showSessionExpiredMessage();
                }
            } catch (error) {
                this.clearAllAuthData();
            }
        }
    }
    
    /**
     * Storage methods for attempts
     */
    getStoredAttempts() {
        const stored = localStorage.getItem(LOGIN_CONFIG.storageKeys.loginAttempts);
        return stored ? parseInt(stored) : 0;
    }
    
    storeAttempts() {
        localStorage.setItem(LOGIN_CONFIG.storageKeys.loginAttempts, this.attempts.toString());
    }
    
    clearAttempts() {
        this.attempts = 0;
        localStorage.removeItem(LOGIN_CONFIG.storageKeys.loginAttempts);
    }
    
    /**
     * Clear logout flag
     */
    clearLogoutFlag() {
        localStorage.removeItem(LOGIN_CONFIG.storageKeys.logoutFlag);
    }
    
    /**
     * Set logout flag
     */
    setLogoutFlag() {
        localStorage.setItem(LOGIN_CONFIG.storageKeys.logoutFlag, 'true');
    }
    
    /**
     * Clear all authentication data
     */
    clearAllAuthData() {
        localStorage.removeItem(LOGIN_CONFIG.storageKeys.authToken);
        localStorage.removeItem(LOGIN_CONFIG.storageKeys.logoutFlag);
        // Não limpar tentativas e lockout por segurança
    }
    
    /**
     * Clear form fields
     */
    clearFormFields() {
        this.usernameInput.value = '';
        this.passwordInput.value = '';
        this.clearError();
    }
    
    /**
     * Show logout success message
     */
    showLogoutMessage() {
        const message = document.createElement('div');
        message.className = 'alert alert-success';
        message.style.cssText = `
            margin-bottom: 1rem;
            animation: slideDown 0.3s ease-out;
        `;
        message.innerHTML = '✅ Logout realizado com sucesso. Faça login novamente para acessar o painel.';
        
        const form = document.querySelector('.login-form');
        form.parentNode.insertBefore(message, form);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideUp 0.3s ease-out forwards';
                setTimeout(() => message.remove(), 300);
            }
        }, 5000);
    }
    
    /**
     * Show session expired message
     */
    showSessionExpiredMessage() {
        const message = document.createElement('div');
        message.className = 'alert alert-warning';
        message.style.cssText = `
            margin-bottom: 1rem;
            animation: slideDown 0.3s ease-out;
        `;
        message.innerHTML = '⏰ Sua sessão expirou. Faça login novamente para continuar.';
        
        const form = document.querySelector('.login-form');
        form.parentNode.insertBefore(message, form);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideUp 0.3s ease-out forwards';
                setTimeout(() => message.remove(), 300);
            }
        }, 5000);
    }
    
    /**
     * UI State management
     */
    updateUIState() {
        if (this.isLocked) {
            this.loginBtn.disabled = true;
            this.usernameInput.disabled = true;
            this.passwordInput.disabled = true;
            this.showError('Acesso temporariamente bloqueado. Tente novamente mais tarde.');
        }
    }
    
    setLoadingState(loading) {
        if (loading) {
            this.loginBtn.classList.add('loading');
            this.loginBtn.disabled = true;
            this.usernameInput.disabled = true;
            this.passwordInput.disabled = true;
        } else {
            this.loginBtn.classList.remove('loading');
            this.loginBtn.disabled = false;
            this.usernameInput.disabled = false;
            this.passwordInput.disabled = false;
        }
    }
    
    /**
     * Message handling
     */
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }
    
    showSuccess(message) {
        this.errorMessage.style.background = 'rgba(76, 175, 80, 0.1)';
        this.errorMessage.style.color = '#4CAF50';
        this.errorMessage.style.borderColor = 'rgba(76, 175, 80, 0.2)';
        this.errorText.textContent = message;
        this.errorMessage.classList.add('show');
    }
    
    clearError() {
        this.errorMessage.classList.remove('show');
        this.errorMessage.style.background = '';
        this.errorMessage.style.color = '';
        this.errorMessage.style.borderColor = '';
    }
    
    /**
     * Create floating background elements
     */
    createFloatingElements() {
        const container = document.querySelector('.floating-particles');
        if (!container) return;
        
        // Criar elementos flutuantes mais sutis para a tela de login
        const elements = ['🔒', '🔑', '🛡️', '⭐', '✨'];
        
        elements.forEach((emoji, index) => {
            for (let i = 0; i < 3; i++) {
                const element = document.createElement('div');
                element.className = 'heart';
                element.innerHTML = emoji;
                element.style.cssText = `
                    left: ${Math.random() * 100}%;
                    animation-duration: ${20 + Math.random() * 10}s;
                    animation-delay: ${index * 2 + Math.random() * 5}s;
                    font-size: ${1 + Math.random() * 0.5}rem;
                    opacity: 0.3;
                `;
                
                container.appendChild(element);
            }
        });
    }
    
    /**
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Global Functions
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
        toggleBtn.setAttribute('aria-label', 'Ocultar senha');
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
        toggleBtn.setAttribute('aria-label', 'Mostrar senha');
    }
}

/**
 * Auth validation function for admin panel
 */
function isAuthenticated() {
    const authData = localStorage.getItem(LOGIN_CONFIG.storageKeys.authToken);
    
    if (!authData) return false;
    
    try {
        const session = JSON.parse(authData);
        return Date.now() < session.expires;
    } catch {
        localStorage.removeItem(LOGIN_CONFIG.storageKeys.authToken);
        return false;
    }
}

/**
 * Logout function
 */
function logout() {
    // Definir flag de logout explícito
    localStorage.setItem(LOGIN_CONFIG.storageKeys.logoutFlag, 'true');
    
    // Limpar dados de autenticação
    localStorage.removeItem(LOGIN_CONFIG.storageKeys.authToken);
    
    // Redirecionar para login
    window.location.href = 'login.html';
}

/**
 * Security monitoring
 */
function setupSecurityMonitoring() {
    // Detectar tentativas de manipulação do console
    let devtools = false;
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
            if (!devtools) {
                devtools = true;
                console.clear();
                console.warn('🛡️ Sistema de segurança ativo. Acesso monitorado.');
            }
        } else {
            devtools = false;
        }
    }, 1000);
    
    // Bloquear F12, Ctrl+Shift+I, etc.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            console.clear();
            return false;
        }
    });
    
    // Desabilitar click direito
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
}

// Initialize login system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
    setupSecurityMonitoring();
    
    // Limpar console periodicamente
    setInterval(() => {
        console.clear();
    }, 30000);
    
    // Verificar se chegou aqui por logout e garantir limpeza
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
        localStorage.setItem('cha_logout_flag', 'true');
        localStorage.removeItem('cha_admin_token');
        
        // Limpar URL sem recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LoginSystem, isAuthenticated, logout };
}

// Debug functions (remove in production)
window.debugAuth = {
    checkSession: () => {
        const token = localStorage.getItem('cha_admin_token');
        const logoutFlag = localStorage.getItem('cha_logout_flag');
        console.log('🔍 Session status:');
        console.log('Token:', token ? 'exists' : 'none');
        console.log('Logout flag:', logoutFlag);
        console.log('Is authenticated:', isAuthenticated());
    },
    
    clearAll: () => {
        localStorage.clear();
        console.log('🧹 All localStorage cleared');
    },
    
    forceLogout: () => {
        localStorage.setItem('cha_logout_flag', 'true');
        localStorage.removeItem('cha_admin_token');
        console.log('🚪 Forced logout flag set');
    }
};