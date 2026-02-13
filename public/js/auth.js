// ============================================
// AUTH.JS - Autenticação de Usuários
// ============================================

const Auth = {
  init() {
    this.bindEvents();
    this.checkSession();
  },

  bindEvents() {
    document.getElementById('show-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleSection('register-section');
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleSection('login-section');
    });

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    document.getElementById('resend-email')?.addEventListener('click', () => {
      this.resendConfirmation();
    });

    const phoneInput = document.getElementById('register-phone');
    phoneInput?.addEventListener('input', (e) => {
      e.target.value = Utils.formatPhone(e.target.value);
    });
  },

  toggleSection(sectionId) {
    document.querySelectorAll('.auth-section').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('active');
    });
    
    const section = document.getElementById(sectionId);
    section.classList.remove('hidden');
    section.classList.add('active');
  },

  async checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = '/game.html';
    }
  },

  async handleLogin() {
    const btn = document.querySelector('#login-form button[type="submit"]');
    Utils.setLoading(btn, true);

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      Utils.toast('Login realizado! Redirecionando...', 'success');
      setTimeout(() => {
        window.location.href = '/game.html';
      }, 1000);

    } catch (error) {
      Utils.toast(this.getErrorMessage(error), 'error');
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  async handleRegister() {
    const btn = document.querySelector('#register-form button[type="submit"]');
    Utils.setLoading(btn, true);

    const nome = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
            telefone: phone
          }
        }
      });

      if (error) throw error;

      document.getElementById('verify-email').textContent = email;
      this.toggleSection('verify-section');
      Utils.toast('Conta criada! Verifique seu email.', 'success');

    } catch (error) {
      Utils.toast(this.getErrorMessage(error), 'error');
    } finally {
      Utils.setLoading(btn, false);
    }
  },

  async resendConfirmation() {
    const email = document.getElementById('verify-email').textContent;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) throw error;
      Utils.toast('Email reenviado!', 'success');
    } catch (error) {
      Utils.toast('Erro ao reenviar. Tente novamente.', 'error');
    }
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  },

  getErrorMessage(error) {
    const messages = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'User already registered': 'Este email já está cadastrado',
      'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
      'Unable to validate email address: invalid format': 'Email inválido'
    };
    
    return messages[error.message] || error.message || 'Erro desconhecido';
  }
};

if (document.getElementById('login-form')) {
  Auth.init();
}
