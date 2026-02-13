// ============================================
// APP.JS - Configurações Globais
// ============================================

const CONFIG = {
  // SUBSTITUA COM SUAS CREDENCIAIS DO SUPABASE
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_ANON_KEY: 'SUA-CHAVE-ANON-AQUI',
  
  // Custos do jogo
  CUSTO_JOGO: 10,
  PREMIO_NIVEL_5: 10000,
  PREMIO_NIVEL_10: 100000,
  PREMIO_NIVEL_15: 1000000,
  
  // Limites
  MOEDAS_INICIAIS: 20,
  MAX_MOEDAS_DIARIAS: 50,
  
  // Tempo
  TEMPO_PERGUNTA: 30,
};

// Inicializa Supabase
const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

// ============================================
// UTILITÁRIOS
// ============================================

const Utils = {
  formatMoedas: (valor) => {
    if (valor >= 1000000) return (valor / 1000000).toFixed(1) + 'M';
    if (valor >= 1000) return (valor / 1000).toFixed(1) + 'K';
    return valor.toString();
  },

  formatPhone: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  },

  toast: (mensagem, tipo = 'info', duracao = 3000) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icones = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <span>${icones[tipo] || 'ℹ️'}</span>
      <span>${mensagem}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duracao);
  },

  setLoading: (btn, loading = true) => {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    
    btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  },

  redirectIfLogged: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = '/game.html';
    }
  },

  redirectIfNotLogged: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/index.html';
      return null;
    }
    return user;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Broostore Quiz iniciado');
});
