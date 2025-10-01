/**
 * Chá Revelação - Main JavaScript
 * Enhanced functionality for baby shower reveal site
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjV8eAK679i4rPABYh6FgYxwsMaXfJ-4E",
    authDomain: "cha-revelacao-c436f.firebaseapp.com",
    projectId: "cha-revelacao-c436f",
    storageBucket: "cha-revelacao-c436f.firebasestorage.app",
    messagingSenderId: "279890578009",
    appId: "1:279890578009:web:7d24db4e75493b8ba43f48"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/**
 * Main App Class
 */
class ChaRevelacaoApp {
    constructor() {
        this.form = document.getElementById('presenceForm');
        this.submitButton = document.getElementById('submitButton');
        this.messageDiv = document.getElementById('message');
        this.isSubmitting = false;
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.createFloatingElements();
        this.setupFormValidation();
        this.preloadImages();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // Add input validation listeners
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
        
        // Add escape key listener for closing messages
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.messageDiv.textContent) {
                this.clearMessage();
            }
        });
    }
    
    /**
     * Setup form validation
     */
    setupFormValidation() {
        // Nome validation
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.addEventListener('input', (e) => {
                // Remove caracteres especiais, mantém apenas letras, espaços e acentos
                e.target.value = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            });
        }
        
        // Pessoas validation
        const pessoasInput = document.getElementById('pessoas');
        if (pessoasInput) {
            pessoasInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value > 10) {
                    e.target.value = 10;
                }
                if (value < 1) {
                    e.target.value = 1;
                }
            });
        }
    }
    
    /**
     * Validate individual field
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        switch (field.id) {
            case 'nome':
                if (!value) {
                    errorMessage = 'Nome é obrigatório';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Nome deve ter pelo menos 2 caracteres';
                    isValid = false;
                } else if (value.length > 100) {
                    errorMessage = 'Nome muito longo (máximo 100 caracteres)';
                    isValid = false;
                }
                break;
                
            case 'pessoas':
                const num = parseInt(value);
                if (!value || isNaN(num)) {
                    errorMessage = 'Número de pessoas é obrigatório';
                    isValid = false;
                } else if (num < 1) {
                    errorMessage = 'Deve ter pelo menos 1 pessoa';
                    isValid = false;
                } else if (num > 10) {
                    errorMessage = 'Máximo 10 pessoas por confirmação';
                    isValid = false;
                }
                break;
                
            case 'mensagem':
                if (value.length > 500) {
                    errorMessage = 'Mensagem muito longa (máximo 500 caracteres)';
                    isValid = false;
                }
                break;
        }
        
        this.showFieldError(field, errorMessage);
        return isValid;
    }
    
    /**
     * Show field error
     */
    showFieldError(field, message) {
        // Remove existing error
        this.clearFieldError(field);
        
        if (message) {
            field.style.borderColor = 'var(--primary-pink)';
            field.style.boxShadow = '0 0 0 3px rgba(233, 30, 99, 0.1)';
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.cssText = `
                color: var(--primary-pink);
                font-size: 0.75rem;
                margin-top: 0.25rem;
                font-weight: 500;
            `;
            errorDiv.textContent = message;
            
            field.parentNode.appendChild(errorDiv);
        }
    }
    
    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate all fields
        const inputs = this.form.querySelectorAll('input[required], select[required], textarea[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            this.showMessage('Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        this.isSubmitting = true;
        this.setLoadingState(true);
        this.showMessage('Enviando confirmação...', 'info');
        
        try {
            const formData = this.getFormData();
            await this.saveToDatabase(formData);
            
            this.showMessage('Confirmação enviada com sucesso! Obrigado! 💕', 'success');
            this.form.reset();
            
            // Trigger celebration animation
            this.celebrateSubmission();
            
        } catch (error) {
            console.error('Erro ao enviar confirmação:', error);
            this.showMessage('Erro ao enviar confirmação. Tente novamente.', 'error');
        } finally {
            this.isSubmitting = false;
            this.setLoadingState(false);
        }
    }
    
    /**
     * Get form data
     */
    getFormData() {
        const nome = document.getElementById('nome').value.trim();
        const pessoas = parseInt(document.getElementById('pessoas').value);
        const confirmacao = document.getElementById('confirmacao').value;
        const fralda = document.getElementById('fralda').value;
        const mensagem = document.getElementById('mensagem').value.trim();
        
        return {
            nome,
            pessoas,
            confirmacao,
            fralda,
            mensagem: mensagem || 'Nenhuma mensagem deixada',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: this.getUserIP()
        };
    }
    
    /**
     * Get user IP (simplified)
     */
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Não disponível';
        }
    }
    
    /**
     * Save data to Firebase
     */
    async saveToDatabase(data) {
        return database.ref('convidados').push(data);
    }
    
    /**
     * Set loading state
     */
    setLoadingState(loading) {
        if (loading) {
            this.submitButton.classList.add('btn-loading');
            this.submitButton.disabled = true;
            this.submitButton.textContent = '';
        } else {
            this.submitButton.classList.remove('btn-loading');
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Confirmar Presença ✨';
        }
    }
    
    /**
     * Show message
     */
    showMessage(text, type = 'info') {
        this.messageDiv.className = `message message-${type}`;
        this.messageDiv.textContent = text;
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => this.clearMessage(), 5000);
        }
    }
    
    /**
     * Clear message
     */
    clearMessage() {
        this.messageDiv.textContent = '';
        this.messageDiv.className = '';
    }
    
    /**
     * Celebrate successful submission
     */
    celebrateSubmission() {
        // Create temporary hearts
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createCelebrationHeart();
            }, i * 100);
        }
    }
    
    /**
     * Create celebration heart
     */
    createCelebrationHeart() {
        const heart = document.createElement('div');
        heart.innerHTML = '💕';
        heart.style.cssText = `
            position: fixed;
            font-size: 2rem;
            pointer-events: none;
            z-index: 1000;
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight}px;
            animation: celebrateFloat 3s ease-out forwards;
        `;
        
        document.body.appendChild(heart);
        
        // Remove after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 3000);
    }
    
    /**
     * Create floating background elements
     */
    createFloatingElements() {
        const container = document.querySelector('.floating-particles');
        if (!container) return;
        
        const particles = [
            { emoji: '💕', count: 8 },
            { emoji: '💙', count: 8 },
            { emoji: '🎀', count: 6 },
            { emoji: '👶', count: 4 },
            { emoji: '✨', count: 10 }
        ];
        
        particles.forEach(({ emoji, count }) => {
            for (let i = 0; i < count; i++) {
                this.createFloatingElement(emoji, container);
            }
        });
        
        // Create geometric particles
        for (let i = 0; i < 20; i++) {
            this.createGeometricParticle(container);
        }
    }
    
    /**
     * Create floating element
     */
    createFloatingElement(emoji, container) {
        const element = document.createElement('div');
        element.className = 'heart';
        element.innerHTML = emoji;
        element.style.cssText = `
            left: ${Math.random() * 100}%;
            animation-duration: ${15 + Math.random() * 10}s;
            animation-delay: ${Math.random() * 5}s;
            font-size: ${1.2 + Math.random() * 0.8}rem;
        `;
        
        container.appendChild(element);
    }
    
    /**
     * Create geometric particle
     */
    createGeometricParticle(container) {
        const particle = document.createElement('div');
        const size = 4 + Math.random() * 8;
        const colors = ['particle-pink', 'particle-blue', 'particle-gold'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.className = `particle ${color}`;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            animation-duration: ${10 + Math.random() * 15}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        container.appendChild(particle);
    }
    
    /**
     * Preload images
     */
    preloadImages() {
        const images = ['foto.png'];
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

/**
 * Utility Functions
 */

// Add celebration animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes celebrateFloat {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add smooth scroll behavior
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main app
    new ChaRevelacaoApp();
    
    // Add loading states for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            console.warn(`Falha ao carregar imagem: ${this.src}`);
        });
    });
    
    // Add page visibility API for performance
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animations when page is hidden
            document.documentElement.style.setProperty('--animation-play-state', 'paused');
        } else {
            // Resume animations when page is visible
            document.documentElement.style.setProperty('--animation-play-state', 'running');
        }
    });
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChaRevelacaoApp;
}