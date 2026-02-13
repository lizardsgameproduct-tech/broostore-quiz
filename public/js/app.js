// ============================================
// APP.JS - Configurações Globais - Broostore Quiz
// ============================================

const CONFIG = {
  SUPABASE_URL: 'https://mumraedfftxriaalmlnk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bXJhZWRmZnR4cmlhYWxtbG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjEzMTAsImV4cCI6MjA4NjQ5NzMxMH0.iS0N6WCc9DYQ_N4JbxCYbDRmn_wgf6ZUW5G_qfZDv7Y',
  
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
// UTILITÁRIOS GLOBAIS
// ============================================

const Utils = {
  // Formata número de moedas (1K, 1M)
  formatMoedas: (valor) => {
    if (valor >= 1000000) return (valor / 1000000).toFixed(1) + 'M';
    if (valor >= 1000) return (valor / 1000).toFixed(1) + 'K';
    return valor.toString();
  },

  // Formata telefone (11) 99999-9999
  formatPhone: (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  },

  // Toast notification
  toast: (mensagem, tipo = 'info', duracao = 3000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
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

  // Loading state em botões
  setLoading: (btn, loading = true) => {
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    
    btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  },

  // Redireciona se já estiver logado
  redirectIfLogged: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = '/game.html';
    }
  },

  // Redireciona se NÃO estiver logado (retorna user se logado)
  redirectIfNotLogged: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/index.html';
      return null;
    }
    return user;
  }
};

// Log de inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Broostore Quiz iniciado');
  console.log('📡 Supabase conectado:', CONFIG.SUPABASE_URL);
});
