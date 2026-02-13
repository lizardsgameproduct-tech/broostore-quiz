// ============================================
// COINS.JS - Gerenciamento de Moedas
// ============================================

const CoinsManager = {
  userId: null,
  profile: null,
  timerInterval: null,
  realtimeChannel: null,

  async init(userId) {
    this.userId = userId;
    await this.checkDailyRecharge();
    await this.loadProfile();
    this.startTimer();
    this.subscribeRealtime();
    this.updateUI();
  },

  async checkDailyRecharge() {
    try {
      const { data, error } = await supabase.rpc('verificar_recarga_diaria', {
        p_user_id: this.userId
      });

      if (error) throw error;
      if (data.recarregou) {
        Utils.toast(data.mensagem, 'success', 5000);
      }
      return data;
    } catch (err) {
      console.error('Erro recarga:', err);
    }
  },

  async loadProfile() {
    try {
      const { data, error } = await supabase
        .from('quiz_profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) throw error;
      this.profile = data;
      return data;
    } catch (err) {
      console.error('Erro carregar perfil:', err);
    }
  },

  updateUI() {
    if (!this.profile) return;

    const dailyEl = document.getElementById('daily-value');
    if (dailyEl) {
      dailyEl.textContent = `${this.profile.moedas_atuais}/${this.profile.moedas_maximas_diarias}`;
    }

    const boughtEl = document.getElementById('bought-value');
    if (boughtEl) {
      boughtEl.textContent = this.profile.moedas_compradas;
    }

    const totalEl = document.getElementById('total-coins');
    if (totalEl) {
      const total = this.profile.moedas_atuais + this.profile.moedas_compradas;
      totalEl.textContent = `🪙 ${total}`;
    }

    const nameEl = document.getElementById('user-name');
    if (nameEl) {
      nameEl.textContent = this.profile.nome?.split(' ')[0] || 'Jogador';
    }

    const seqEl = document.getElementById('user-sequence');
    if (seqEl && this.profile.sequencia_dias > 1) {
      seqEl.textContent = `🔥 ${this.profile.sequencia_dias} dias`;
    }
  },

  startTimer() {
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  },

  updateTimer() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const timerEl = document.getElementById('next-recharge');
    if (timerEl) {
      timerEl.textContent = `⏱️ Reseta em: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const waitEl = document.getElementById('wait-time');
    if (waitEl) {
      waitEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  },

  subscribeRealtime() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    this.realtimeChannel = supabase
      .channel(`profile-${this.userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quiz_profiles',
        filter: `id=eq.${this.userId}`
      }, (payload) => {
        this.profile = payload.new;
        this.updateUI();
      })
      .subscribe();
  },

  getTotalCoins() {
    if (!this.profile) return 0;
    return this.profile.moedas_atuais + this.profile.moedas_compradas;
  },

  hasEnoughCoins(cost = 10) {
    return this.getTotalCoins() >= cost;
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  unsubscribe() {
    this.stopTimer();
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }
};
