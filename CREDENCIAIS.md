# 🔒 Configuração de Segurança - Chá Revelação

## Credenciais de Acesso

### 👤 **Usuário:** `admin`
### 🔑 **Senha:** `''`

---

## ⚠️ **IMPORTANTE - LEIA ANTES DE USAR**

### 🔄 **Como Alterar a Senha:**

1. **Abra o arquivo:** `assets/js/login.js`
2. **Procure a linha 8:** `password: 'cha2025!'`
3. **Substitua** `cha2025!` pela sua senha personalizada
4. **Salve o arquivo**

### 🛡️ **Recomendações de Segurança:**

- ✅ **MUDE A SENHA IMEDIATAMENTE** antes de colocar online
- ✅ Use uma senha forte (mínimo 8 caracteres, letras, números e símbolos)
- ✅ Não compartilhe as credenciais
- ✅ Acesse o painel apenas de dispositivos confiáveis
- ✅ Sempre faça logout após usar

### 🔐 **Funcionalidades de Segurança Implementadas:**

- 🚫 **Limite de tentativas:** 5 tentativas incorretas
- ⏰ **Bloqueio temporário:** 15 minutos após exceder tentativas
- 🕐 **Sessão temporária:** 1 hora de validade
- 🔄 **Renovação automática:** Sessão se renova com atividade
- 🛡️ **Proteção contra:** Manipulação de console, F12, click direito
- 📊 **Monitoramento:** Tentativas de acesso são registradas

### 🌐 **Para Produção (Recomendações Avançadas):**

1. **Use HTTPS** sempre
2. **Implemente autenticação 2FA** se necessário
3. **Configure backup** do Firebase regularmente
4. **Monitore logs** de acesso
5. **Use senhas únicas** para cada ambiente

### 🆘 **Recuperação de Acesso:**

Se esquecer a senha ou ficar bloqueado:

1. **Limpe o localStorage** do navegador:
   - F12 → Console → Digite: `localStorage.clear()`
   - Ou use modo privado/incógnito

2. **Altere a senha** no arquivo `login.js`

### 📞 **Suporte:**

Em caso de problemas, consulte:
- 📖 README.md (documentação completa)
- 🐛 Console do navegador (F12) para erros
- 🔍 Logs do Firebase

---

## 🎯 **Acesso Rápido:**

1. **Site Principal:** `index.html`
2. **Login Admin:** `login.html`
3. **Painel Admin:** `admin.html` (após login)

---

**⚡ Pronto para usar! Lembre-se de alterar a senha antes do deploy!**