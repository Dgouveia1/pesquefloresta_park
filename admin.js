document.addEventListener('DOMContentLoaded', function() {
    // --- SELETORES ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const modal = document.getElementById('details-modal');
    const modalCloseBtns = [document.getElementById('modal-close-btn'), document.getElementById('modal-cancel-btn')];
    const menuToggle = document.getElementById('menu-toggle');
    const adminLayout = document.querySelector('.admin-layout');
    const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
    const pageTitle = document.getElementById('page-title');

    // --- NAVEGAÇÃO ---
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            // Troca de página
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Atualiza link ativo
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            // Atualiza título do header mobile
            if(pageTitle) {
                pageTitle.textContent = link.textContent.trim();
            }

            // Fecha o menu lateral no mobile após clicar
            if (window.innerWidth <= 820) {
                adminLayout.classList.remove('sidebar-open');
            }
        });
    });

    // --- MENU LATERAL MOBILE ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            adminLayout.classList.toggle('sidebar-open');
        });
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', () => {
            adminLayout.classList.remove('sidebar-open');
        });
    }
    
    // --- DADOS FAKE AMPLIADOS ---
    const today = new Date();
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    const createFakeDate = (daysToAdd) => {
        const date = new Date();
        date.setDate(today.getDate() + daysToAdd);
        return date;
    };

    const firstNames = ["Carlos", "Mariana", "Juliano", "Beatriz", "Fernando", "Letícia", "Ricardo", "Camila", "Lucas", "Amanda", "Guilherme", "Sofia"];
    const lastNames = ["Pereira", "Costa", "Alves", "Lima", "Dias", "Oliveira", "Santos", "Souza", "Rodrigues", "Ferreira"];
    const generateRandomName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    
    const fakeReservations = [];
    for (let i = 0; i < 25; i++) {
        const daysDiff = Math.floor(Math.random() * 10) - 4;
        const date = createFakeDate(daysDiff);
        const adultos = Math.floor(Math.random() * 4) + 1;
        const criancas = Math.floor(Math.random() * 3);
        const quiosques = Math.random() > 0.6 ? 1 : 0;
        
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const total = (adultos * (isWeekend ? 70 : 60)) + (criancas * 35) + (quiosques * (isWeekend ? 80 : 70));
        
        let status;
        if (daysDiff < 0) {
           status = Math.random() > 0.1 ? 'Checked-in' : 'Cancelado';
        } else if (Math.random() > 0.85) {
            status = 'Cancelado';
        } else if (Math.random() > 0.7) {
            status = 'Pendente';
        } else {
            status = 'Confirmado';
        }

        fakeReservations.push({ 
            id: `RVT-${821 + i}`, 
            nome: generateRandomName(), 
            cpf: `${Math.floor(Math.random()*1000)}.XXX.XXX-XX`,
            data: formatDate(date),
            dateObj: date,
            itens: { adultos, criancas, quiosques },
            total: total, 
            status: status
        });
    }

    // --- DASHBOARD ---
    function loadDashboard() {
        const todayStr = formatDate(today);
        const reservationsToday = fakeReservations.filter(r => r.data === todayStr && r.status !== 'Cancelado');
        const checkedInToday = fakeReservations.filter(r => r.data === todayStr && r.status === 'Checked-in');

        document.getElementById('reservas-hoje').textContent = reservationsToday.length;

        const totalVisitantes = checkedInToday.reduce((acc, r) => acc + r.itens.adultos + r.itens.criancas, 0);
        document.getElementById('total-visitantes').textContent = totalVisitantes;

        const faturamentoDia = checkedInToday.reduce((acc, r) => acc + r.total, 0);
        document.getElementById('faturamento-dia').textContent = `R$ ${faturamentoDia.toFixed(2).replace('.', ',')}`;

        const quiosquesOcupados = checkedInToday.filter(r => r.itens.quiosques > 0).length;
        document.getElementById('quiosques-ocupados').textContent = `${quiosquesOcupados} / 15`;

        const recentBody = document.getElementById('recent-reservations-body');
        recentBody.innerHTML = '';
        fakeReservations
            .filter(r => r.dateObj >= today && r.status === 'Confirmado')
            .sort((a, b) => a.dateObj - b.dateObj)
            .slice(0, 5)
            .forEach(r => {
                const statusClass = `status-${r.status.toLowerCase()}`;
                recentBody.innerHTML += `
                    <tr>
                        <td>${r.nome.split(' ')[0]} ${r.nome.split(' ')[1]}</td>
                        <td>${r.data}</td>
                        <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                    </tr>
                `;
        });
        renderFinanceChart();
    }
    
    // --- GRÁFICO ---
    let financeChartInstance = null;
    function renderFinanceChart() {
        const ctx = document.getElementById('finance-chart').getContext('2d');
        const chartData = generateWeeklyChartData();

        if(financeChartInstance) {
            financeChartInstance.destroy();
        }

        financeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Faturamento',
                    data: chartData.data,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return 'R$ ' + value; }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Faturamento: R$ ${context.raw.toFixed(2).replace('.', ',')}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function generateWeeklyChartData() {
        const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const data = Array(7).fill(0);
        
        const todayDayIndex = today.getDay();
        const rotatedLabels = [];
        for(let i=0; i<7; i++){
            const index = (todayDayIndex - 6 + i + 7) % 7;
            rotatedLabels.push(labels[index]);
        }

        fakeReservations.forEach(res => {
            const diffTime = today.getTime() - res.dateObj.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (res.status === 'Checked-in' && diffDays >= 1 && diffDays <= 7) {
                const dayIndex = res.dateObj.getDay();
                data[dayIndex] += res.total;
            }
        });

        const rotatedData = [];
        for(let i=0; i<7; i++){
            const index = (todayDayIndex - 6 + i + 7) % 7;
            rotatedData.push(data[index]);
        }
        return { labels: rotatedLabels, data: rotatedData };
    }

    // --- PÁGINA DE RESERVAS ---
    function loadReservations() {
        const tableBody = document.getElementById('reservations-table-body');
        tableBody.innerHTML = '';
        fakeReservations
            .sort((a,b) => a.dateObj - b.dateObj)
            .forEach(r => {
                let statusClass = `status-${r.status.toLowerCase()}`;
                
                let itemsSummary = [];
                if(r.itens.adultos > 0) itemsSummary.push(`${r.itens.adultos} Adulto(s)`);
                if(r.itens.criancas > 0) itemsSummary.push(`${r.itens.criancas} Criança(s)`);
                if(r.itens.quiosques > 0) itemsSummary.push(`${r.itens.quiosques} Quiosque(s)`);

                tableBody.innerHTML += `
                    <tr>
                        <td>${r.id}</td>
                        <td>${r.nome}</td>
                        <td>${r.data}</td>
                        <td>${itemsSummary.join(', ')}</td>
                        <td>R$ ${r.total.toFixed(2).replace('.', ',')}</td>
                        <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                        <td class="actions-cell"><button class="btn btn-sm" data-id="${r.id}">Detalhes</button></td>
                    </tr>
                `;
        });
        attachModalListeners();
    }
    
    // --- MODAL ---
    function attachModalListeners() {
        document.querySelectorAll('.btn[data-id]').forEach(button => {
            button.addEventListener('click', () => {
                const reservationId = button.getAttribute('data-id');
                openModal(reservationId);
            });
        });
    }

    function openModal(reservationId) {
        const reserva = fakeReservations.find(r => r.id === reservationId);
        if (!reserva) return;
        
        document.getElementById('modal-title').textContent = `Reserva ${reserva.id}`;
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="detail-row"><span class="detail-label">Nome</span><span class="detail-value">${reserva.nome}</span></div>
            <div class="detail-row"><span class="detail-label">CPF</span><span class="detail-value">${reserva.cpf}</span></div>
            <div class="detail-row"><span class="detail-label">Data</span><span class="detail-value">${reserva.data}</span></div>
            <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge status-${reserva.status.toLowerCase()}">${reserva.status}</span></span></div>
            <div class="detail-row"><span class="detail-label">Adultos</span><span class="detail-value">${reserva.itens.adultos}</span></div>
            <div class="detail-row"><span class="detail-label">Crianças</span><span class="detail-value">${reserva.itens.criancas}</span></div>
            <div class="detail-row"><span class="detail-label">Quiosques</span><span class="detail-value">${reserva.itens.quiosques}</span></div>
            <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">R$ ${reserva.total.toFixed(2).replace('.', ',')}</span></div>
        `;
        modal.classList.add('active');
    }
    
    function closeModal() {
        modal.classList.remove('active');
    }

    modalCloseBtns.forEach(btn => btn.addEventListener('click', closeModal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // --- PÁGINA DE CHECK-IN ---
    const checkinButton = document.querySelector('#checkin .btn');
    const checkinResult = document.getElementById('checkin-result');
    
    checkinButton.addEventListener('click', () => {
        const reserva = fakeReservations.find(r => r.status === 'Confirmado' && r.data === formatDate(today));
        if (reserva) {
            checkinResult.innerHTML = `
                <div class="checkin-info">
                    <p><strong>ID da Reserva:</strong> ${reserva.id}</p>
                    <p><strong>Nome:</strong> ${reserva.nome}</p>
                    <p><strong>Itens:</strong> ${reserva.itens.adultos} Adulto(s), ${reserva.itens.criancas} Criança(s)</p>
                    <p><strong>Status:</strong> <span class="status-badge status-confirmado">${reserva.status}</span></p>
                    <button class="btn" id="confirm-checkin-btn" data-id="${reserva.id}">Confirmar Check-in</button>
                </div>
            `;
            document.getElementById('confirm-checkin-btn').addEventListener('click', (e) => {
                const resId = e.target.dataset.id;
                const reservationToUpdate = fakeReservations.find(r => r.id === resId);
                if(reservationToUpdate) {
                    reservationToUpdate.status = 'Checked-in';
                    checkinResult.innerHTML = `<p class="success-message">Check-in de <strong>${reservationToUpdate.nome}</strong> realizado com sucesso!</p>`;
                    loadDashboard();
                    loadReservations();
                }
            });
        } else {
            checkinResult.innerHTML = `<p class="error-message">Nenhuma reserva confirmada para hoje encontrada para simular.</p>`;
        }
    });

    // --- INICIALIZAÇÃO ---
    loadDashboard();
    loadReservations();
});

