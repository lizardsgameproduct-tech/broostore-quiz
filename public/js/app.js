// ============================================
// APP.JS - Configurações Globais - Broostore Quiz
// ============================================

var CONFIG = {
  SUPABASE_URL: 'https://mumraedfftxriaalmlnk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bXJhZWRmZnR4cmlhYWxtbG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjEzMTAsImV4cCI6MjA4NjQ5NzMxMH0.iS0N6WCc9DYQ_N4JbxCYbDRmn_wgf6ZUW5G_qfZDv7Y',
  
  CUSTO_JOGO: 10,
  PREMIO_NIVEL_5: 10000,
  PREMIO_NIVEL_10: 100000,
  PREMIO_NIVEL_15: 1000000,
  MOEDAS_INICIAIS: 20,
  MAX_MOEDAS_DIARIAS: 50,
  TEMPO_PERGUNTA: 30,
};

// Inicializa Supabase (usando var para evitar redeclaração)
if (typeof window.supabaseClient === 'undefined') {
  window.supabaseClient = supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
  );
}

var supabase = window.supabaseClient;

// ============================================
// UTILITÁRIOS GLOBAIS (usando var)
// ============================================

var Utils = {
  formatMoedas: function(valor) {
    if (valor >= 1000000) return (valor / 1000000).toFixed(1) + 'M';
    if (valor >= 1000) return (valor / 1000).toFixed(1) + 'K';
    return valor.toString();
  },

  formatPhone: function(value) {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  },

  toast: function(mensagem, tipo, duracao) {
    tipo = tipo || 'info';
    duracao = duracao || 3000;
    
    var container = document.getElementById('toast-container');
    if (!container) return;
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + tipo;
    
    var icones = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = '<span>' + (icones[tipo] || 'ℹ️') + '</span><span>' + mensagem + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(function() { toast.remove(); }, 300);
    }, duracao);
  },

  setLoading: function(btn, loading) {
    loading = loading !== false;
    if (!btn) return;
    
    var text = btn.querySelector('.btn-text');
    var spinner = btn.querySelector('.btn-loading');
    
    btn.disabled = loading;
    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
  },

  redirectIfLogged: async function() {
    try {
      var result = await supabase.auth.getUser();
      if (result.data && result.data.user) {
        window.location.href = '/game.html';
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }
  },

  redirectIfNotLogged: async function() {
    try {
      var result = await supabase.auth.getUser();
      if (!result.data || !result.data.user) {
        window.location.href = '/index.html';
        return null;
      }
      return result.data.user;
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      window.location.href = '/index.html';
      return null;
    }
  }
};

console.log('🎮 Broostore Quiz iniciado');
