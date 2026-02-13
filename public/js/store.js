// ============================================
// STORE.JS - Loja de Moedas
// ============================================

const Store = {
  user: null,
  selectedPackage: null,

  async init() {
    this.user = await Utils.redirectIfNotLogged();
    if (!this.user) return;

    await CoinsManager.init(this.user.id);
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const amount = e.target.dataset.amount;
        const price = e.target.dataset.price;
        this.openPaymentModal(amount, price);
      });
    });

    document.getElementById('btn-cancel-payment')?.addEventListener('click', () => {
      document.getElementById('payment-modal').classList.add('hidden');
    });

    document.getElementById('btn-copy-pix')?.addEventListener('click', () => {
      const input = document.getElementById('pix-code');
      input.select();
      document.execCommand('copy');
      Utils.toast('Código PIX copiado!', 'success');
    });
  },

  openPaymentModal(amount, price) {
    this.selectedPackage = { amount, price };
    
    document.getElementById('payment-coins').textContent = amount;
    document.getElementById('payment-total').textContent = `R$ ${price}`;
    document.getElementById('payment-modal').classList.remove('hidden');
    
    // Aqui você integraria com o Pagleve para gerar QR Code
    // Por enquanto, simulamos
    this.generatePixCode(amount, price);
  },

  generatePixCode(amount, price) {
    // TODO: Integrar com Pagleve aqui
    // Por enquanto, mostra um código fictício
    const pixCode = `00020126580014BR.GOV.BCB.PIX0136broostore@email.com520400005303986540${price.replace('.', '')}5802BR5925Broostore Quiz6009SAO PAULO62140510MOEDAS${amount}6304`;
    
    document.getElementById('pix-code').value = pixCode;
    
    // Simula geração de QR
    setTimeout(() => {
      document.getElementById('qr-code').innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 80px; margin: 0;">📱</p>
          <p style="font-size: 12px; margin-top: 10px;">QR Code PIX</p>
        </div>
      `;
    }, 1000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.store-container')) {
    Store.init();
  }
});
