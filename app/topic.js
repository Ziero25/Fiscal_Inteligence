document.addEventListener('DOMContentLoaded', () => {
    const topicDetailContainer = document.getElementById('topicDetail');
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('id');

    if (!topicId) {
        topicDetailContainer.innerHTML = '<h2>Tópico não encontrado</h2><p>Identificador de tópico ausente. Retorne à página principal.</p>';
        return;
    }

    fetch('data2.json')
        .then(response => {
            if (!response.ok) throw new Error('Falha ao carregar os dados.');
            return response.json();
        })
        .then(data => {
            const post = data.find(p => p.Id === topicId);
            
            if (!post) {
                topicDetailContainer.innerHTML = '<h2>Tópico não encontrado</h2><p>Este tópico pode ter sido removido ou não existe mais no index. Tente recarregar o scraper principal.</p>';
                return;
            }

            const postDate = new Date(post.Date).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
            
            let postType = post.Type || 'Notícias e Atualizações';
            if (post.Type === 'Ask the Community') { postType = 'Dúvidas da Comunidade'; }
            if (post.Type === 'News and Announcements') { postType = 'Notícias Oficiais'; }

            const isGov = post.Source.includes("Oficial") || post.Source.includes("SPED");
            const authorName = isGov ? "Sefaz / Receita Federal" : post.Source.replace("Reddit - ", "");

            let fullText = post.FullText || post.Snippet || 'Nenhum texto adicional disponível para esta publicação.';
            
            // Transformar [DOWNLOAD PDF] em um botão
            fullText = fullText.replace(/📄 \[DOWNLOAD PDF\]|\[DOWNLOAD PDF\]/g, `<a href="${post.Url}" target="_blank" class="btn-source" style="margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px;">📄 Fazer Download do PDF original Sefaz</a><br><br>`);

            fullText = fullText.replace(/TÃ©cnica/g, 'Técnica').replace(/tÃ©cnica/g, 'técnica')
                             .replace(/atualizaÃ§Ã£o/g, 'atualização').replace(/MudanÃ§a|mudanÃ§a/g, 'mudança')
                             .replace(/publicaÃ§Ã£o/g, 'publicação').replace(/Ã¡rea/g, 'área')
                             .replace(/cÃ³digos/g, 'códigos').replace(/rejeiÃ§Ã£o/g, 'rejeição')
                             .replace(/validaÃ§Ã£o/g, 'validação').replace(/negÃ³cio/g, 'negócio');

            topicDetailContainer.innerHTML = `
                <div class="topic-meta-tags" style="margin-bottom: 10px;">
                    <span class="tag tag-${post.Category.toLowerCase()}">${post.Category}</span>
                    <span class="tag tag-type">${postType}</span>
                </div>
                <h1 class="topic-detail-title">${post.Title}</h1>
                <div class="topic-detail-meta">
                    <span class="author">👤 ${authorName}</span>
                    <span class="date">📅 Publicado em: ${postDate}</span>
                </div>
                <div class="topic-detail-content">${fullText}</div>
                <div class="topic-actions">
                    <a href="${post.Url}" target="_blank" class="btn-source">Visualizar no Site Original ↗</a>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            topicDetailContainer.innerHTML = '<h2>Erro ao carregar banco de dados local</h2><p>Houve uma falha de comunicação ao ler os dados do tópico a partir do data.json.</p>';
        });
});
