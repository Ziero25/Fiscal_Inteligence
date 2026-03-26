document.addEventListener('DOMContentLoaded', async () => {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.getElementById('searchInput');
    const fiscalContainer = document.getElementById('fiscalContainer');
    const communityContainer = document.getElementById('communityContainer');
    const fiscalHeader = document.querySelector('.fiscal-header');
    const communityHeader = document.querySelector('.community-header');

    let allData = [];
    const urlParams = new URLSearchParams(window.location.search);
    let currentTab = urlParams.get('tab') || 'ALL';
    let currentSubFilter = 'ALL';
    let currentDateFilter = 'ALL';
    let searchQuery = '';

    const fiscalSubContainer = document.getElementById('fiscalSubContainer');
    const communitySubContainer = document.getElementById('communitySubContainer');
    const subFilterTabs = document.querySelectorAll('.sub-filter-tab');

    // Inicializar visual das tabs baseado na URL
    filterTabs.forEach(t => {
        t.classList.remove('active');
        if (t.getAttribute('data-tab') === currentTab) t.classList.add('active');
    });

    try {
        const response = await fetch('data2.json');
        allData = await response.json();
    } catch (err) {
        console.error("Error loading data: ", err);
        fiscalContainer.innerHTML = '<div class="leaderboard-empty">Erro ao carregar dados.</div>';
        return;
    }

    const filterByDate = (data, range) => {
        if (range === 'ALL') return data;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return data.filter(item => {
            const itemDate = new Date(item.Date);
            if (range === 'TODAY') return itemDate >= startOfToday;
            if (range === 'WEEK') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return itemDate >= weekAgo;
            }
            if (range === 'MONTH') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return itemDate >= monthAgo;
            }
            return true;
        });
    };

    const renderData = () => {
        let filtered = allData;
        
        // 1. Filtro de busca
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(d => d.Title.toLowerCase().includes(q) || d.Snippet.toLowerCase().includes(q));
        }

        // 2. Filtro de Data
        filtered = filterByDate(filtered, currentDateFilter);

        // Limpar containers
        fiscalContainer.innerHTML = '';
        communityContainer.innerHTML = '';

        // Visibilidade das seções baseada na aba
        if (currentTab === 'ALL') {
            fiscalHeader.style.display = 'flex';
            communityHeader.style.display = 'flex';
            fiscalContainer.style.display = 'block';
            communityContainer.style.display = 'block';
            fiscalSubContainer.style.display = 'none';
            communitySubContainer.style.display = 'none';
        } else if (currentTab === 'Fiscal') {
            fiscalHeader.style.display = 'flex';
            communityHeader.style.display = 'none';
            fiscalContainer.style.display = 'block';
            communityContainer.style.display = 'none';
            fiscalSubContainer.style.display = 'block';
            communitySubContainer.style.display = 'none';
        } else {
            fiscalHeader.style.display = 'none';
            communityHeader.style.display = 'flex';
            fiscalContainer.style.display = 'none';
            communityContainer.style.display = 'block';
            fiscalSubContainer.style.display = 'none';
            communitySubContainer.style.display = 'block';
        }

        let fiscalData = filtered.filter(d => d.Category === 'Fiscal');
        let communityData = filtered.filter(d => d.Category === 'Contabil');

        // 3. Aplicar Subfiltros dinâmicos
        if (currentSubFilter !== 'ALL') {
            if (currentTab === 'Fiscal') {
                fiscalData = fiscalData.filter(d => d.Type === currentSubFilter);
            } else if (currentTab === 'Contabil') {
                communityData = communityData.filter(d => d.Type === currentSubFilter);
            }
        }

        const renderItem = (post, container) => {
            const postDate = new Date(post.Date);
            const now = new Date();
            const diffMs = now - postDate;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);
            
            let timeAgo = '';
            if (diffDays > 0) timeAgo = `Há ${diffDays} dias`;
            else if (diffHours > 0) timeAgo = `Há ${diffHours} horas`;
            else if (diffMins > 0) timeAgo = `Há ${diffMins} min`;
            else timeAgo = 'Agora';

            const hash = post.Id ? post.Id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
            let upvotes = post.Likes !== undefined ? post.Likes : (hash % 50) + 1;
            let comments = post.Replies !== undefined ? post.Replies : (hash % 20);

            const isGov = post.Source.includes("Oficial") || post.Source.includes("SPED");
            const authorName = isGov ? "Sefaz / Receita Federal" : post.Source.replace("Reddit - ", "");
            const categoryClass = post.Category === 'Fiscal' ? 'fiscal-card' : 'contabil-card';

            // Tradução amigável do tipo
            let displayType = post.Type || 'Geral';
            if (displayType === 'Ask the Community') displayType = 'Dúvida';
            
            // Lógica de expansão
            const fullDesc = post.Snippet || '';
            const isCollapsible = fullDesc.length > 200 || post.Category === 'Fiscal';
            
            container.innerHTML += `
                <div class="topic-item ${categoryClass}" id="post-${post.Id}">
                    <div class="avatar">${authorName.charAt(0).toUpperCase()}</div>
                    <div class="topic-content">
                        <div class="topic-meta">
                            <span class="topic-author">${authorName}</span> • ${displayType}
                        </div>
                        <a href="topic.html?id=${post.Id}" class="topic-title">
                            ${post.Title}
                            ${isGov ? '<span class="badge" style="background-color: #EF4444">Oficial</span>' : ''}
                        </a>
                        <div class="topic-desc ${isCollapsible ? 'collapsed' : ''}">${fullDesc}</div>
                        
                        ${isCollapsible ? `
                            <button class="expand-btn" data-id="${post.Id}">
                                ${post.Category === 'Fiscal' ? '🔍 Ver detalhes técnicos' : 'Ver mais...'}
                            </button>
                        ` : ''}

                        <div class="topic-stats">
                            <span><span class="stat-icon">👍</span> ${upvotes}</span>
                            <span><span class="stat-icon">💬</span> ${comments}</span>
                            <span style="font-size: 11px; margin-left: auto;">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            `;
        };

        fiscalData.forEach(p => renderItem(p, fiscalContainer));
        communityData.forEach(p => renderItem(p, communityContainer));

        // Adicionar eventos de expansão
        document.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.target.getAttribute('data-id');
                const desc = document.querySelector(`#post-${postId} .topic-desc`);
                if (desc.classList.contains('collapsed')) {
                    desc.classList.remove('collapsed');
                    e.target.textContent = 'Ver menos';
                } else {
                    desc.classList.add('collapsed');
                    const post = allData.find(p => p.Id === postId);
                    e.target.textContent = (post && post.Category === 'Fiscal') ? '🔍 Ver detalhes técnicos' : 'Ver mais...';
                }
            });
        });

        if (fiscalData.length === 0 && (currentTab === 'ALL' || currentTab === 'Fiscal')) {
            fiscalContainer.innerHTML = '<div class="leaderboard-empty">Nenhum alerta fiscal encontrado para estes filtros.</div>';
        }
        if (communityData.length === 0 && (currentTab === 'ALL' || currentTab === 'Contabil')) {
            communityContainer.innerHTML = '<div class="leaderboard-empty">Nenhuma discussão na comunidade encontrada para estes filtros.</div>';
        }
    };

    // Tabs Principais
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-tab');
            if(!btn) return;
            filterTabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            
            // Resetar subfiltro ao trocar de categoria principal
            currentSubFilter = 'ALL';
            subFilterTabs.forEach(t => {
                if(!t.classList.contains('date-tab')) {
                    t.classList.remove('active');
                    if (t.getAttribute('data-sub') === 'ALL') t.classList.add('active');
                }
            });

            renderData();
        });
    });

    // Subfiltros (Fiscal / Comunidade / Data)
    subFilterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const subType = e.target.getAttribute('data-sub');
            const dateType = e.target.getAttribute('data-date');

            if (dateType) {
                // Filtro de Data
                document.querySelectorAll('.date-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentDateFilter = dateType;
            } else if (subType) {
                // Filtro por Tipo (Fiscal ou Comunidade)
                const isFiscal = e.target.classList.contains('fiscal-sub-tab');
                const selector = isFiscal ? '.fiscal-sub-tab' : '.community-sub-tab';
                document.querySelectorAll(selector).forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentSubFilter = subType;
            }
            renderData();
        });
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderData();
    });

    // Inicializar render
    renderData();

    // Lógica de Transição de Entrada
    const loader = document.getElementById('pageLoader');
    const mainContent = document.getElementById('mainContent');

    if (loader && mainContent) {
        // Pequeno delay para garantir que o render inicial terminou e dar o efeito "suave"
        setTimeout(() => {
            loader.classList.add('hidden');
            mainContent.style.opacity = '1';
            document.body.classList.remove('no-scroll');
        }, 600);
    }
});
