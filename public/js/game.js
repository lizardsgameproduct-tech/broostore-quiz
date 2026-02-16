// ============================================
// GAME.JS - Lógica principal do jogo
// ============================================

const Game = {
  user: null,
  gameId: null,
  currentQuestion: null,
  currentLevel: 1,
  timer: null,
  timeLeft: 30,
  isProcessing: false,
  selectedAnswer: null,
  helps: {
    skip: 3,
    cards: 1,
    audience: 1,
    chart: 1
  },

  async init() {
    // Mostra loading
    document.getElementById('loading-screen').classList.remove('hidden');

    // Verifica login
    const user = await Utils.redirectIfNotLogged();
    this.user = user;

    // Inicializa moedas
    await CoinsManager.init(user.id);

    // Esconde loading
    document.getElementById('loading-screen').classList.add('hidden');

    // Bind events
    this.bindEvents();
    
    // Mostra tela inicial
    this.showStartScreen();
  },

  bindEvents() {
    // Menu
    document.getElementById('btn-menu')?.addEventListener('click', () => this.openMenu());
    document.getElementById('btn-close-menu')?.addEventListener('click', () => this.closeMenu());
    document.getElementById('menu-overlay')?.addEventListener('click', () => this.closeMenu());
    
    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());
    
    // Loja
    document.getElementById('btn-store')?.addEventListener('click', () => {
      window.location.href = '/store.html';
    });
    
    // Começar jogo
    document.getElementById('btn-start-game')?.addEventListener('click', () => this.startGame());
    
    // Respostas
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectAnswer(e));
    });
    
    // Ajudas
    document.getElementById('help-skip')?.addEventListener('click', () => this.useSkip());
    document.getElementById('help-cards')?.addEventListener('click', () => this.useCards());
    document.getElementById('help-audience')?.addEventListener('click', () => this.useAudience());
    document.getElementById('help-chart')?.addEventListener('click', () => this.useChart());
    
    // Parar
    document.getElementById('btn-stop')?.addEventListener('click', () => this.stopGame());
    
    // Modais
    document.getElementById('btn-continue')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('btn-exit')?.addEventListener('click', () => this.exitGame());
    document.getElementById('btn-go-store')?.addEventListener('click', () => {
      window.location.href = '/store.html';
    });
    document.getElementById('btn-wait')?.addEventListener('click', () => {
      document.getElementById('no-coins-modal').classList.add('hidden');
    });
    
    // Confirmação
    document.getElementById('confirm-yes')?.addEventListener('click', () => this.confirmAnswer(true));
    document.getElementById('confirm-no')?.addEventListener('click', () => this.confirmAnswer(false));
    
    // Fechar modais
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.add('hidden');
      });
    });
  },

  openMenu() {
    document.getElementById('side-menu').classList.add('open');
    document.getElementById('menu-overlay').classList.add('show');
  },

  closeMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.getElementById('menu-overlay').classList.remove('show');
  },

  showStartScreen() {
    document.getElementById('game-start').classList.remove('hidden');
    document.getElementById('game-play').classList.add('hidden');
    
    // Atualiza pirâmide
    this.updatePyramid();
  },

  updatePyramid() {
    // Destaca níveis de segurança (5, 10, 15)
    document.querySelectorAll('.level').forEach(el => {
      const level = parseInt(el.dataset.level);
      if (level === 5 || level === 10 || level === 15) {
        el.classList.add('safety');
      }
    });
  },

  async startGame() {
    if (!CoinsManager.hasEnoughCoins(10)) {
      document.getElementById('no-coins-modal').classList.remove('hidden');
      return;
    }

    // Gasta moedas
    const { data: spendData, error: spendError } = await supabase.rpc('gastar_moedas', {
      p_user_id: this.user.id,
      p_quantidade: 10,
      p_descricao: 'Custo para iniciar jogo'
    });

    if (spendError || !spendData.sucesso) {
      Utils.toast('Erro ao gastar moedas', 'error');
      return;
    }

    // Cria jogo no banco
    const { data: gameData, error: gameError } = await supabase
      .from('quiz_games')
      .insert({
        user_id: this.user.id,
        custo_moedas: 10,
        status: 'jogando',
        nivel_atual: 1
      })
      .select()
      .single();

    if (gameError) {
      Utils.toast('Erro ao criar jogo', 'error');
      return;
    }

    this.gameId = gameData.id;
    this.currentLevel = 1;
    this.helps = { skip: 3, cards: 1, audience: 1, chart: 1 };

    // Mostra tela do jogo
    document.getElementById('game-start').classList.add('hidden');
    document.getElementById('game-play').classList.remove('hidden');

    // Carrega primeira pergunta
    this.loadQuestion();
  },

  async loadQuestion() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Busca pergunta do nível atual
      const { data: question, error } = await supabase.rpc('buscar_pergunta', {
        p_nivel: this.currentLevel
      });

      if (error || !question.sucesso) {
        Utils.toast('Erro ao carregar pergunta', 'error');
        return;
      }

      this.currentQuestion = question;
      this.selectedAnswer = null;

      // Atualiza UI
      this.updateQuestionUI();
      
      // Reseta timer
      this.startTimer();

    } catch (err) {
      console.error('Erro:', err);
      Utils.toast('Erro ao carregar pergunta', 'error');
    } finally {
      this.isProcessing = false;
    }
  },

  updateQuestionUI() {
    const q = this.currentQuestion;
    
    // Categoria e prêmio
    document.getElementById('question-category').textContent = q.categoria;
    document.getElementById('current-prize').textContent = this.getPrizeText();
    
    // Texto da pergunta
    document.getElementById('question-text').textContent = q.pergunta;
    
    // ✅ CORRIGIDO: Usa alternativas direto (já é array)
    const alternatives = q.alternativas;
    document.querySelectorAll('.answer-btn').forEach((btn, index) => {
      btn.classList.remove('selected', 'correct', 'wrong', 'eliminated');
      btn.disabled = false;
      btn.querySelector('.answer-text').textContent = alternatives[index] || '';
    });
    
    // Progresso
    document.getElementById('current-level').textContent = this.currentLevel;
    document.getElementById('progress-fill').style.width = `${(this.currentLevel / 15) * 100}%`;
    
    // Botão parar
    document.getElementById('stop-prize').textContent = this.getPrizeText();
    
    // Ajudas
    this.updateHelpsUI();
  },

  getPrizeText() {
    const prizes = [0, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000, 50000, 100000, 300000, 500000, 1000000];
    return `R$ ${prizes[this.currentLevel].toLocaleString()}`;
  },

  startTimer() {
    this.timeLeft = 30;
    this.updateTimerBar();
    
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerBar();
      
      if (this.timeLeft <= 0) {
        this.timeOut();
      }
    }, 1000);
  },

  updateTimerBar() {
    const pct = (this.timeLeft / 30) * 100;
    document.getElementById('timer-bar').style.width = `${pct}%`;
    document.getElementById('timer-text').textContent = `${this.timeLeft}s`;
    
    // Muda cor quando está acabando
    const bar = document.getElementById('timer-bar');
    if (this.timeLeft <= 10) {
      bar.style.background = 'var(--error)';
    } else if (this.timeLeft <= 20) {
      bar.style.background = 'var(--warning)';
    } else {
      bar.style.background = 'linear-gradient(90deg, var(--success), var(--warning), var(--error))';
    }
  },

  timeOut() {
    clearInterval(this.timer);
    this.gameOver(false, 'Tempo esgotado!');
  },

  selectAnswer(e) {
    if (this.isProcessing) return;
    
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    
    // Remove seleção anterior
    document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
    
    // Seleciona
    btn.classList.add('selected');
    
    // ✅ CORRIGIDO: Usa this.currentQuestion em vez de q
    const alternatives = this.currentQuestion.alternativas;
    const letra = String.fromCharCode(65 + index); // A, B, C, D
    const texto = alternatives[index] || '';
    
    document.getElementById('confirm-answer').textContent = `${letra}) ${texto}`;
    document.getElementById('confirm-overlay').classList.remove('hidden');
    
    this.selectedAnswer = index;
  },

  async confirmAnswer(confirmed) {
    document.getElementById('confirm-overlay').classList.add('hidden');
    
    if (!confirmed) {
      document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
      this.selectedAnswer = null;
      return;
    }

    // ✅ CORRIGIDO: Verifica se resposta foi selecionada
    if (this.selectedAnswer === null || this.selectedAnswer === undefined) {
      Utils.toast('Selecione uma resposta!', 'warning');
      return;
    }

    this.isProcessing = true;
    clearInterval(this.timer);

    try {
      console.log('Enviando resposta:', this.selectedAnswer);
      console.log('Game ID:', this.gameId);
      console.log('Question ID:', this.currentQuestion.id);

      // Verifica resposta
      const { data: result, error } = await supabase.rpc('verificar_resposta', {
        p_game_id: this.gameId,
        p_question_id: this.currentQuestion.id,
        p_resposta: this.selectedAnswer,
        p_tempo_gasto: 30 - this.timeLeft
      });

      if (error) {
        console.error('Erro Supabase:', error);
        throw error;
      }

      console.log('Resultado:', result);

      // Mostra resultado visual
      await this.showAnswerResult(result);

      if (!result.correta) {
        // Errou
        setTimeout(() => this.gameOver(false, 'Que pena! Você errou.'), 2000);
      } else if (this.currentLevel >= 15) {
        // Ganhou o jogo!
        setTimeout(() => this.gameWon(), 2000);
      } else {
        // Acertou, continua
        setTimeout(() => this.showNextModal(), 2000);
      }

    } catch (err) {
      console.error('Erro completo:', err);
      Utils.toast('Erro ao verificar: ' + (err.message || 'Tente novamente'), 'error');
      this.isProcessing = false;
    }
  },

  async showAnswerResult(result) {
    const buttons = document.querySelectorAll('.answer-btn');
    
    // Marca a correta em verde
    if (result.resposta_correta !== undefined && buttons[result.resposta_correta]) {
      buttons[result.resposta_correta].classList.add('correct');
    }
    
    // Se errou, marca a selecionada em vermelho
    if (!result.correta && this.selectedAnswer !== null && buttons[this.selectedAnswer]) {
      buttons[this.selectedAnswer].classList.add('wrong');
    }
    
    // Desabilita todos os botões
    buttons.forEach(btn => btn.disabled = true);
  },

  showNextModal() {
    const modal = document.getElementById('result-modal');
    document.getElementById('result-icon').textContent = '✅';
    document.getElementById('result-title').textContent = 'Correto!';
    document.getElementById('result-message').textContent = `Você passou para o nível ${this.currentLevel + 1}`;
    document.getElementById('result-coins').textContent = this.getPrizeText();
    document.getElementById('btn-continue').textContent = 'Próxima Pergunta';
    
    modal.classList.remove('hidden');
    this.isProcessing = false;
  },

  async nextQuestion() {
    document.getElementById('result-modal').classList.add('hidden');
    this.currentLevel++;
    await this.loadQuestion();
  },

  async gameWon() {
    // Calcula prêmio baseado no nível
    let prize = 0;
    if (this.currentLevel >= 15) prize = 1000000;
    else if (this.currentLevel >= 10) prize = 100000;
    else if (this.currentLevel >= 5) prize = 10000;
    
    try {
      await supabase.rpc('premiar_jogador', {
        p_game_id: this.gameId,
        p_quantidade: prize
      });
    } catch (err) {
      console.error('Erro ao premiar:', err);
    }

    const modal = document.getElementById('result-modal');
    document.getElementById('result-icon').textContent = '🏆';
    document.getElementById('result-title').textContent = 'PARABÉNS!';
    document.getElementById('result-message').textContent = `Você conquistou ${this.getPrizeText()}!`;
    document.getElementById('result-coins').textContent = `+${prize.toLocaleString()} 🪙`;
    document.getElementById('btn-continue').textContent = 'Jogar Novamente';
    
    modal.classList.remove('hidden');
    this.isProcessing = false;
  },

  gameOver(won, message) {
    const modal = document.getElementById('result-modal');
    document.getElementById('result-icon').textContent = won ? '🎉' : '😢';
    document.getElementById('result-title').textContent = won ? 'Vitória!' : 'Game Over';
    document.getElementById('result-message').textContent = message;
    document.getElementById('result-coins').textContent = won ? this.getPrizeText() : 'Tente novamente!';
    document.getElementById('btn-continue').textContent = 'Jogar Novamente';
    
    modal.classList.remove('hidden');
    this.isProcessing = false;
  },

  async stopGame() {
    if (!confirm('Deseja parar e ficar com o prêmio atual?')) return;
    
    clearInterval(this.timer);
    
    // Finaliza jogo
    try {
      await supabase
        .from('quiz_games')
        .update({ status: 'finalizado', parou: true, tempo_fim: new Date().toISOString() })
        .eq('id', this.gameId);
    } catch (err) {
      console.error('Erro ao parar:', err);
    }
    
    this.gameOver(true, `Você parou com ${this.getPrizeText()}`);
  },

  exitGame() {
    document.getElementById('result-modal').classList.add('hidden');
    this.showStartScreen();
  },

  // Ajudas
  useSkip() {
    if (this.helps.skip <= 0) return;
    this.helps.skip--;
    this.updateHelpsUI();
    this.loadQuestion();
    Utils.toast('Pergunta pulada!', 'info');
  },

  useCards() {
    if (this.helps.cards <= 0) return;
    
    // Elimina 2 alternativas erradas
    const correta = this.currentQuestion.correta;
    const eliminar = [];
    
    for (let i = 0; i < 4; i++) {
      if (i !== correta && eliminar.length < 2) {
        eliminar.push(i);
      }
    }
    
    eliminar.forEach(idx
