// ---------------------------
// Estado da aplicação
// ---------------------------
const state = {
    user: null,
    reserva: {
      data: null,
      adultoSeg: 0,
      adultoFds: 0,
      crianca: 0,
      quiosqueSeg: 0,
      quiosqueFds: 0
    }
  };
  
  // Preços
  const PRICES = {
    adultoSeg: 60,
    adultoFds: 70,
    crianca: 35,
    quiosqueSeg: 70,
    quiosqueFds: 80
  };
  
  // Imagens do Carrossel
  const carouselImages = ['piscina.PNG', 'pesca.PNG', 'infra.PNG'];
  const carouselCaptions = [
      'Piscinas para toda a família',
      'Relaxe em nossa área de pesca',
      'Infraestrutura completa para seu lazer'
  ];
  let currentImageIndex = 0;
  
  // Seletores úteis
  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item');
  const carouselImageEl = document.getElementById('carousel-image');
  const carouselCaptionEl = document.querySelector('.carousel .caption');
  
  function showScreen(name) {
    screens.forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    navItems.forEach(n => n.classList.toggle('active', n.dataset.target === name));
    const el = document.querySelector('.screen.active');
    if (el) el.scrollTop = 0;
  }
  
  function updateCarousel() {
      carouselImageEl.src = carouselImages[currentImageIndex];
      carouselCaptionEl.innerHTML = `<strong>${carouselCaptions[currentImageIndex]}</strong>`;
  }
  
  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    // Navegação
    navItems.forEach(n => n.addEventListener('click', () => showScreen(n.dataset.target)));
  
    // Botões principais
    document.getElementById('start-reserve').addEventListener('click', () => showScreen('cadastro'));
    document.getElementById('cancel-cadastro').addEventListener('click', () => showScreen('home'));
    document.getElementById('back-to-cadastro').addEventListener('click', () => showScreen('cadastro'));
    document.getElementById('show-my-reservations').addEventListener('click', () => {
      loadFromStorage();
      showScreen('selecao');
    });
  
    // Carrossel
    document.getElementById('next-btn').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % carouselImages.length;
        updateCarousel();
    });
    document.getElementById('prev-btn').addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + carouselImages.length) % carouselImages.length;
        updateCarousel();
    });
    setInterval(() => {
      document.getElementById('next-btn').click();
    }, 5000);
    updateCarousel();
  
  
    // Formulário de cadastro
    document.getElementById('form-cadastro').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      state.user = {
        nome: fd.get('nome') || '',
        cpf: fd.get('cpf') || '',
        telefone: fd.get('telefone') || '',
        email: fd.get('email') || ''
      };
      localStorage.setItem('userData', JSON.stringify(state.user));
      showScreen('selecao');
    });
  
    document.getElementById('limpar-cadastro').addEventListener('click', () => {
      document.getElementById('form-cadastro').reset();
      state.user = null;
      localStorage.removeItem('userData');
    });
  
    // Input de data
    const dataInput = document.getElementById('data');
    (function setMinDate() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dataInput.min = d.toISOString().split('T')[0];
    })();
    dataInput.addEventListener('change', () => {
      state.reserva.data = dataInput.value || null;
      refreshResumo();
    });
  
    // Contadores
    document.querySelectorAll('.btn-circle').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const key = btn.dataset.key;
        if (!key) return;
        if (action === 'inc') state.reserva[key] = Math.min((state.reserva[key] || 0) + 1, 50);
        if (action === 'dec') state.reserva[key] = Math.max((state.reserva[key] || 0) - 1, 0);
        updateCountersUI();
        refreshResumo();
      });
    });
  
    // Resetar seleção
    document.getElementById('reset-selecao').addEventListener('click', () => {
      state.reserva = { data: null, adultoSeg: 0, adultoFds: 0, crianca: 0, quiosqueSeg: 0, quiosqueFds: 0 };
      document.getElementById('data').value = '';
      updateCountersUI();
      refreshResumo();
    });
  
    // Finalizar
    document.getElementById('to-confirm').addEventListener('click', () => {
      if (!state.user) {
        alert('Preencha seus dados primeiro!');
        showScreen('cadastro');
        return;
      }
      if (!state.reserva.data) {
        alert('Selecione uma data para a reserva.');
        return;
      }
      localStorage.setItem('reservaData', JSON.stringify(state.reserva));
      renderConfirmation();
      showScreen('confirm');
    });
  
    // Botões da tela de confirmação
    document.getElementById('new-reservation').addEventListener('click', () => {
      state.user = null;
      state.reserva = { data: null, adultoSeg: 0, adultoFds: 0, crianca: 0, quiosqueSeg: 0, quiosqueFds: 0 };
      localStorage.clear();
      document.getElementById('form-cadastro').reset();
      document.getElementById('data').value = '';
      updateCountersUI();
      refreshResumo();
      showScreen('home');
    });
    document.getElementById('download-ticket').addEventListener('click', downloadTicketAsPNG);
  
    // Popula com dados fake e carrega o estado
    populateWithFakeData();
    loadFromStorage();
    updateCountersUI();
    refreshResumo();
  });
  
  // ---------------------------
  // Funções de UI
  // ---------------------------
  function updateCountersUI() {
    ['adultoSeg', 'adultoFds', 'crianca', 'quiosqueSeg', 'quiosqueFds'].forEach(key => {
      const el = document.getElementById('count-' + key);
      if (el) el.textContent = state.reserva[key] || 0;
    });
  
    document.getElementById('quick-adult').textContent = (state.reserva.adultoSeg || 0) + (state.reserva.adultoFds || 0);
    document.getElementById('quick-child').textContent = state.reserva.crianca || 0;
    document.getElementById('quick-quiosque').textContent = (state.reserva.quiosqueSeg || 0) + (state.reserva.quiosqueFds || 0);
  
    const total = calculateTotal();
    document.getElementById('quick-total').innerHTML = `Total: <strong>R$ ${total.toFixed(2).replace('.',',')}</strong>`;
    document.getElementById('to-confirm').disabled = total === 0 || !state.reserva.data;
  }
  
  function calculateTotal() {
    const r = state.reserva;
    let total = 0;
    total += (r.adultoSeg || 0) * PRICES.adultoSeg;
    total += (r.adultoFds || 0) * PRICES.adultoFds;
    total += (r.crianca || 0) * PRICES.crianca;
    total += (r.quiosqueSeg || 0) * PRICES.quiosqueSeg;
    total += (r.quiosqueFds || 0) * PRICES.quiosqueFds;
    return total;
  }
  
  function refreshResumo() {
    const el = document.getElementById('resumo-compra');
    const data = state.reserva.data;
    if (!data) {
      el.textContent = 'Selecione uma data para continuar.';
      updateCountersUI();
      return;
    }
    let html = `<strong>Data:</strong> ${formatDate(data)}<br>`;
    
    const total = calculateTotal();
    if (total > 0) {
      html += `<strong>Total: R$ ${total.toFixed(2).replace('.',',')}</strong>`;
    } else {
      html += 'Adicione ingressos ou extras.'
    }
  
    el.innerHTML = html;
    updateCountersUI();
  }
  
  function formatDate(d) {
    try {
      const date = new Date(d);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return d;
    }
  }
  
  // ---------------------------
  // Funções de Armazenamento e Dados
  // ---------------------------
  function populateWithFakeData() {
      if (localStorage.getItem('userData')) return;
  
      const fakeUser = {
          nome: "Ana Clara da Silva",
          cpf: "123.456.789-00",
          telefone: "11987654321",
          email: "ana.clara.silva@email.com"
      };
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const isWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
  
      const fakeReserva = {
          data: tomorrow.toISOString().split('T')[0],
          adultoSeg: isWeekend ? 0 : 2,
          adultoFds: isWeekend ? 2 : 0,
          crianca: 1,
          quiosqueSeg: 0,
          quiosqueFds: isWeekend ? 1 : 0,
      };
  
      localStorage.setItem('userData', JSON.stringify(fakeUser));
      localStorage.setItem('reservaData', JSON.stringify(fakeReserva));
  }
  
  
  function loadFromStorage() {
    const user = localStorage.getItem('userData');
    const reserva = localStorage.getItem('reservaData');
    if (user) state.user = JSON.parse(user);
    if (reserva) state.reserva = Object.assign(state.reserva, JSON.parse(reserva));
    
    if (state.user) {
      const f = document.getElementById('form-cadastro');
      if (f) {
        f.nome.value = state.user.nome || '';
        f.cpf.value = state.user.cpf || '';
        f.telefone.value = state.user.telefone || '';
        f.email.value = state.user.email || '';
      }
    }
    if (state.reserva && state.reserva.data) {
      document.getElementById('data').value = state.reserva.data;
    }
  }
  
  // ---------------------------
  // Confirmação e QR Code
  // ---------------------------
  function renderConfirmation() {
    const user = state.user || JSON.parse(localStorage.getItem('userData') || 'null');
    const reserva = state.reserva || JSON.parse(localStorage.getItem('reservaData') || '{}');
  
    document.getElementById('confirm-name').textContent = user ? user.nome : '—';
    document.getElementById('confirm-email').textContent = user ? user.email : '—';
    document.getElementById('confirm-date').textContent = reserva.data ? `Válido para: ${formatDate(reserva.data)}` : '—';
  
    const detailsEl = document.getElementById('confirm-details');
    const lines = [];
    if (reserva.adultoSeg) lines.push(`${reserva.adultoSeg} adulto(s) seg-sex`);
    if (reserva.adultoFds) lines.push(`${reserva.adultoFds} adulto(s) fds`);
    if (reserva.crianca) lines.push(`${reserva.crianca} criança(s)`);
    if (reserva.quiosqueSeg) lines.push(`${reserva.quiosqueSeg} quiosque(s) seg-sex`);
    if (reserva.quiosqueFds) lines.push(`${reserva.quiosqueFds} quiosque(s) fds`);
    detailsEl.innerHTML = (lines.length ? lines.join('<br>') : 'Nenhum ingresso selecionado') + `<br><br><strong>Total: R$ ${calculateTotal().toFixed(2).replace('.',',')}</strong>`;
  
    const qrRoot = document.getElementById('qrcode');
    qrRoot.innerHTML = `<img src="qrcode.png" alt="QR Code" style="width: 200px; height: 200px; border-radius: 12px;" onerror="this.style.display='none'">`;
  }
  
  function downloadTicketAsPNG() {
    const qrImageEl = document.querySelector('#qrcode img');
    if (!qrImageEl || !qrImageEl.src) {
      alert('QR Code não encontrado para download.');
      return;
    }
  
    const user = state.user || {};
    const reserva = state.reserva || {};
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 350;
    canvas.height = 450;
  
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#e0f7fa');
    gradient.addColorStop(1, '#b2ebf2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Textos
    ctx.fillStyle = '#005662';
    ctx.font = 'bold 22px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('Pesque Floresta Park', canvas.width / 2, 40);
    
    ctx.font = '16px Poppins';
    ctx.textAlign = 'left';
    ctx.fillText(`Nome: ${user.nome || ''}`, 25, 90);
    ctx.fillText(`Data: ${formatDate(reserva.data) || ''}`, 25, 115);
    ctx.font = 'bold 16px Poppins';
    ctx.fillText(`Total: R$ ${calculateTotal().toFixed(2).replace('.',',')}`, 25, 140);
    
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => {
      ctx.drawImage(img, (canvas.width - 180) / 2, 170, 180, 180);
      
      ctx.font = '12px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText('Apresente este ingresso na entrada.', canvas.width / 2, 380);
  
      const link = document.createElement('a');
      link.download = `ingresso_${(user.nome || 'reserva').split(' ')[0].toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.onerror = () => {
      alert("Erro ao carregar a imagem do QR Code para gerar o ingresso. Tente novamente.");
    };
    img.src = qrImageEl.src;
  }
  
  