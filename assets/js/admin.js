/**
 * Chá Revelação - Admin Panel JavaScript
 * Advanced admin functionality for baby shower reveal site
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

// Authentication check
function checkAuthentication() {
    const authData = localStorage.getItem('cha_admin_token');
    
    if (!authData) {
        redirectToLogin();
        return false;
    }
    
    try {
        const session = JSON.parse(authData);
        if (Date.now() >= session.expires) {
            localStorage.removeItem('cha_admin_token');
            redirectToLogin();
            return false;
        }
        return true;
    } catch {
        localStorage.removeItem('cha_admin_token');
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

// Check authentication before initializing
if (!checkAuthentication()) {
    // Stop execution if not authenticated
    throw new Error('Access denied - redirecting to login');
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/**
 * Admin Panel Class
 */
class AdminPanel {
    constructor() {
        this.guestsData = [];
        this.stats = {};
        this.currentSection = 'overview';
        
        this.init();
    }
    
    /**
     * Initialize the admin panel
     */
    init() {
        this.loadData();
        this.setupEventListeners();
        this.startAutoRefresh();
        this.startSessionMonitoring();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for real-time updates
        database.ref('convidados').on('value', (snapshot) => {
            this.handleDataUpdate(snapshot);
        });
        
        // Handle navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-item')) {
                e.preventDefault();
                this.updateNavigation(e.target);
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportData();
                        break;
                }
            }
        });
    }
    
    /**
     * Handle real-time data updates
     */
    handleDataUpdate(snapshot) {
        const data = snapshot.val();
        this.guestsData = data ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
        })) : [];
        
        this.calculateStats();
        this.updateUI();
        
        // Show notification for new entries
        if (this.lastUpdateCount && this.guestsData.length > this.lastUpdateCount) {
            this.showNotification('Nova confirmação recebida!', 'success');
        }
        this.lastUpdateCount = this.guestsData.length;
    }
    
    /**
     * Load initial data
     */
    async loadData() {
        try {
            const snapshot = await database.ref('convidados').once('value');
            this.handleDataUpdate(snapshot);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar dados', 'error');
        }
    }
    
    /**
     * Calculate statistics
     */
    calculateStats() {
        const total = this.guestsData.length;
        const confirmed = this.guestsData.filter(guest => guest.confirmacao === 'Sim').length;
        const declined = this.guestsData.filter(guest => guest.confirmacao === 'Não').length;
        const totalPeople = this.guestsData
            .filter(guest => guest.confirmacao === 'Sim')
            .reduce((sum, guest) => sum + parseInt(guest.pessoas || 1), 0);
        
        // Count diapers by size
        const diaperCounts = {};
        this.guestsData
            .filter(guest => guest.confirmacao === 'Sim' && guest.fralda && guest.fralda !== '')
            .forEach(guest => {
                diaperCounts[guest.fralda] = (diaperCounts[guest.fralda] || 0) + 1;
            });
        
        this.stats = {
            total,
            confirmed,
            declined,
            totalPeople,
            diaperCounts,
            totalDiapers: Object.values(diaperCounts).reduce((sum, count) => sum + count, 0),
            confirmationRate: total > 0 ? Math.round((confirmed / total) * 100) : 0
        };
    }
    
    /**
     * Update UI with current data
     */
    updateUI() {
        this.updateStats();
        this.updateRecentActivity();
        this.updateGuestsList();
        this.updateMessagesList();
    }
    
    /**
     * Update statistics display
     */
    updateStats() {
        document.getElementById('totalConfirmations').textContent = this.stats.total;
        document.getElementById('confirmedCount').textContent = this.stats.confirmed;
        document.getElementById('declinedCount').textContent = this.stats.declined;
        document.getElementById('diapersCount').textContent = this.stats.totalDiapers;
        
        // Update change indicators
        document.getElementById('totalChange').textContent = `${this.stats.totalPeople} pessoas no total`;
        document.getElementById('confirmedChange').textContent = `${this.stats.confirmationRate}% de confirmação`;
        document.getElementById('declinedChange').textContent = `${this.stats.declined} recusas`;
        document.getElementById('diapersChange').textContent = 'Fraldas prometidas';
    }
    
    /**
     * Update recent activity
     */
    updateRecentActivity() {
        const container = document.getElementById('recentActivity');
        
        if (this.guestsData.length === 0) {
            container.innerHTML = this.getEmptyState('📭', 'Nenhuma atividade ainda', 'As confirmações aparecerão aqui conforme chegarem.');
            return;
        }
        
        // Sort by timestamp (most recent first)
        const recentGuests = [...this.guestsData]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        
        const html = `
            <div class="activity-list">
                ${recentGuests.map(guest => `
                    <div class="activity-item">
                        <div class="activity-info">
                            <strong>${this.escapeHtml(guest.nome)}</strong>
                            <span class="status ${guest.confirmacao === 'Sim' ? 'confirmed' : 'declined'}">
                                ${guest.confirmacao === 'Sim' ? '✅ Confirmou' : '❌ Recusou'}
                            </span>
                        </div>
                        <div class="activity-meta">
                            ${this.formatDate(guest.timestamp)} • ${guest.pessoas || 1} pessoa(s)
                            ${guest.fralda ? ` • Fralda ${guest.fralda}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update guests list
     */
    updateGuestsList() {
        const container = document.getElementById('guestsTable');
        
        if (this.guestsData.length === 0) {
            container.innerHTML = this.getEmptyState('👥', 'Nenhum convidado ainda', 'As confirmações aparecerão aqui conforme chegarem.');
            return;
        }
        
        const html = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Pessoas</th>
                            <th>Fralda</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.guestsData.map(guest => `
                            <tr>
                                <td>
                                    <strong>${this.escapeHtml(guest.nome)}</strong>
                                </td>
                                <td>
                                    <span class="status ${guest.confirmacao === 'Sim' ? 'confirmed' : 'declined'}">
                                        ${guest.confirmacao === 'Sim' ? 'Confirmado' : 'Recusou'}
                                    </span>
                                </td>
                                <td>${guest.pessoas || 1}</td>
                                <td>${guest.fralda || 'Não informado'}</td>
                                <td>${this.formatDate(guest.timestamp)}</td>
                                <td>
                                    <button class="btn btn-secondary" onclick="adminPanel.viewGuestDetails('${guest.id}')">
                                        👁️ Ver
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update messages list
     */
    updateMessagesList() {
        const container = document.getElementById('messagesList');
        const messagesWithContent = this.guestsData.filter(guest => 
            guest.mensagem && 
            guest.mensagem.trim() !== '' && 
            guest.mensagem !== 'Nenhuma mensagem deixada'
        );
        
        if (messagesWithContent.length === 0) {
            container.innerHTML = this.getEmptyState('💌', 'Nenhuma mensagem ainda', 'As mensagens dos convidados aparecerão aqui.');
            return;
        }
        
        const html = `
            <div class="messages-list">
                ${messagesWithContent.map(guest => `
                    <div class="message-card">
                        <div class="message-header">
                            <strong>${this.escapeHtml(guest.nome)}</strong>
                            <span class="message-date">${this.formatDate(guest.timestamp)}</span>
                        </div>
                        <div class="message-content">
                            "${this.escapeHtml(guest.mensagem)}"
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Refresh data manually
     */
    async refreshData() {
        this.showNotification('Atualizando dados...', 'info');
        await this.loadData();
        this.showNotification('Dados atualizados!', 'success');
    }
    
    /**
     * Export data in selected format
     */
    exportData() {
        const format = document.getElementById('exportFormat').value;
        const includeGuests = document.getElementById('exportGuests').checked;
        const includeMessages = document.getElementById('exportMessages').checked;
        const includeStats = document.getElementById('exportStats').checked;
        
        let data = {};
        
        if (includeStats) {
            data.statistics = this.stats;
        }
        
        if (includeGuests) {
            data.guests = this.guestsData;
        }
        
        if (includeMessages) {
            data.messages = this.guestsData
                .filter(guest => guest.mensagem && guest.mensagem !== 'Nenhuma mensagem deixada')
                .map(guest => ({
                    nome: guest.nome,
                    mensagem: guest.mensagem,
                    timestamp: guest.timestamp
                }));
        }
        
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `cha-revelacao-${timestamp}`;
        
        switch (format) {
            case 'csv':
                this.exportAsCSV(data.guests || [], filename);
                break;
            case 'json':
                this.exportAsJSON(data, filename);
                break;
            case 'txt':
                this.exportAsText(data, filename);
                break;
        }
        
        this.showNotification('Dados exportados com sucesso!', 'success');
    }
    
    /**
     * Export as CSV
     */
    exportAsCSV(data, filename) {
        if (!data.length) return;
        
        const headers = ['Nome', 'Confirmação', 'Pessoas', 'Fralda', 'Mensagem', 'Data'];
        const csvContent = [
            headers.join(','),
            ...data.map(guest => [
                `"${guest.nome}"`,
                guest.confirmacao,
                guest.pessoas || 1,
                `"${guest.fralda || ''}"`,
                `"${guest.mensagem || ''}"`,
                this.formatDate(guest.timestamp)
            ].join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    }
    
    /**
     * Export as JSON
     */
    exportAsJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
    }
    
    /**
     * Export as text
     */
    exportAsText(data, filename) {
        let content = `RELATÓRIO DO CHÁ REVELAÇÃO\n`;
        content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
        
        if (data.statistics) {
            content += `ESTATÍSTICAS:\n`;
            content += `- Total de confirmações: ${data.statistics.total}\n`;
            content += `- Confirmados: ${data.statistics.confirmed}\n`;
            content += `- Recusaram: ${data.statistics.declined}\n`;
            content += `- Total de pessoas: ${data.statistics.totalPeople}\n`;
            content += `- Taxa de confirmação: ${data.statistics.confirmationRate}%\n\n`;
        }
        
        if (data.guests) {
            content += `LISTA DE CONVIDADOS:\n`;
            data.guests.forEach(guest => {
                content += `\n- ${guest.nome}\n`;
                content += `  Status: ${guest.confirmacao}\n`;
                content += `  Pessoas: ${guest.pessoas || 1}\n`;
                if (guest.fralda) content += `  Fralda: ${guest.fralda}\n`;
                if (guest.mensagem && guest.mensagem !== 'Nenhuma mensagem deixada') {
                    content += `  Mensagem: ${guest.mensagem}\n`;
                }
                content += `  Data: ${this.formatDate(guest.timestamp)}\n`;
            });
        }
        
        this.downloadFile(content, `${filename}.txt`, 'text/plain');
    }
    
    /**
     * Download file
     */
    downloadFile(content, filename, mimeType) {
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
    
    /**
     * View guest details
     */
    viewGuestDetails(guestId) {
        const guest = this.guestsData.find(g => g.id === guestId);
        if (!guest) return;
        
        const details = `
            DETALHES DO CONVIDADO
            
            Nome: ${guest.nome}
            Status: ${guest.confirmacao}
            Pessoas: ${guest.pessoas || 1}
            Fralda: ${guest.fralda || 'Não informado'}
            Data: ${this.formatDate(guest.timestamp)}
            
            Mensagem:
            ${guest.mensagem || 'Nenhuma mensagem deixada'}
        `;
        
        alert(details);
    }
    
    /**
     * Navigation functions
     */
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        document.getElementById(`${sectionName}-section`).style.display = 'block';
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        event.target.classList.add('active');
        this.currentSection = sectionName;
    }
    
    /**
     * Update navigation
     */
    updateNavigation(clickedItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        clickedItem.classList.add('active');
    }
    
    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        // Refresh every 30 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.loadData();
            }
        }, 30000);
    }
    
    /**
     * Start session monitoring
     */
    startSessionMonitoring() {
        // Check session every 5 minutes
        setInterval(() => {
            if (!checkAuthentication()) {
                return; // Will redirect to login
            }
            
            // Refresh session on activity
            refreshSession();
        }, 300000);
        
        // Refresh session on any user activity
        ['click', 'keydown', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => {
                refreshSession();
            }, { passive: true });
        });
    }
    
    /**
     * Utility functions
     */
    formatDate(timestamp) {
        if (!timestamp) return 'Data não informada';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }
}

/**
 * Global Functions
 */
function showSection(sectionName) {
    if (window.adminPanel) {
        window.adminPanel.showSection(sectionName);
    }
}

function refreshData() {
    if (window.adminPanel) {
        window.adminPanel.refreshData();
    }
}

function refreshGuestList() {
    if (window.adminPanel) {
        window.adminPanel.updateGuestsList();
    }
}

function refreshMessages() {
    if (window.adminPanel) {
        window.adminPanel.updateMessagesList();
    }
}

function exportGuestList() {
    if (window.adminPanel) {
        window.adminPanel.exportAsCSV(window.adminPanel.guestsData, 'lista-convidados');
    }
}

function exportMessages() {
    const messages = window.adminPanel.guestsData
        .filter(guest => guest.mensagem && guest.mensagem !== 'Nenhuma mensagem deixada')
        .map(guest => ({
            nome: guest.nome,
            mensagem: guest.mensagem,
            timestamp: guest.timestamp
        }));
    
    window.adminPanel.exportAsJSON({ messages }, 'mensagens-convidados');
}

function exportData() {
    if (window.adminPanel) {
        window.adminPanel.exportData();
    }
}

/**
 * Logout function
 */
function logout() {
    if (confirm('Tem certeza que deseja sair do painel administrativo?')) {
        // Definir flag de logout explícito
        localStorage.setItem('cha_logout_flag', 'true');
        
        // Limpar dados de autenticação
        localStorage.removeItem('cha_admin_token');
        
        // Redirecionar para login
        window.location.href = 'login.html';
    }
}

/**
 * Logout and go to index function
 */
function logoutAndGoToIndex() {
    // Definir flag de logout explícito (sem confirmação)
    localStorage.setItem('cha_logout_flag', 'true');
    
    // Limpar dados de autenticação
    localStorage.removeItem('cha_admin_token');
    
    // Redirecionar para index
    window.location.href = 'index.html';
}

/**
 * Session management
 */
function refreshSession() {
    const authData = localStorage.getItem('cha_admin_token');
    if (authData) {
        try {
            const session = JSON.parse(authData);
            // Extend session by 30 minutes on activity
            session.expires = Date.now() + 1800000;
            localStorage.setItem('cha_admin_token', JSON.stringify(session));
        } catch (error) {
            console.error('Error refreshing session:', error);
            logout();
        }
    }
}

/**
 * Add styles for dynamic content
 */
const dynamicStyles = `
    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .activity-item {
        padding: 1rem;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        background: var(--gray-50);
    }
    
    .activity-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .activity-meta {
        font-size: 0.875rem;
        color: var(--gray-600);
    }
    
    .messages-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .message-card {
        padding: 1rem;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        background: var(--white);
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }
    
    .message-date {
        color: var(--gray-500);
        font-size: 0.75rem;
    }
    
    .message-content {
        font-style: italic;
        color: var(--gray-700);
        line-height: 1.5;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Add dynamic styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);

// Initialize admin panel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});