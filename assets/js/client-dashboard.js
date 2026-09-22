// Main logic for fetching schedules and rendering dynamic blocks

document.addEventListener('DOMContentLoaded', async () => {
    // Basic session wait (handled securely in auth.js, but double checking profile)
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    // Fetch Profile
    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (profile && document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').textContent = `Olá, ${profile.full_name || 'Membro'}`;
    }

    await loadClientSchedules(session.user.id);
});

async function loadClientSchedules(userId) {
    const container = document.getElementById('dashboardContainer');
    
    const { data: schedules, error } = await window.supabaseClient
        .from('client_schedules')
        .select('*')
        .eq('client_id', userId)
        .order('order_index', { ascending: true });

    if (error) {
        container.innerHTML = `<div class="loading-state">Erro ao carregar os dados.</div>`;
        console.error(error);
        return;
    }

    if (!schedules || schedules.length === 0) {
        container.innerHTML = `
            <div class="cp-block-journey" style="padding: 4rem;">
                <h2 class="journey-title" style="margin:0; font-size:2rem; color: var(--cp-blue-dark);">Bem-vindo ao Lenses O.S.</h2>
                <p style="margin-top:1rem; color:#666; font-size:1.1rem;">Nenhum cronograma ou jornada foi atribuído a você ainda. Aguarde a configuração pelo seu consultor.</p>
            </div>
        `;
        return;
    }

    // Clear loader and render blocks
    container.innerHTML = '';

    schedules.forEach(sched => {
        const blockEl = createBlockElement(sched.block_type, sched.content);
        if (blockEl) {
            container.appendChild(blockEl);
        }
    });
}

function createBlockElement(type, content) {
    const wrap = document.createElement('div');

    if (type === 'highlight_card') {
        // e.g. Image 1 / Image 4
        // content: { monthTitle, leftPill, leftHtml, rightPill, rightBullets[], imageUrl, imagePosition: 'left'|'right' }
        wrap.className = 'cp-block-highlight';
        
        const contentHtml = `
            <div class="highlight-content">
                ${content.monthTitle ? `<div class="highlight-header">${content.monthTitle}</div>` : ''}
                
                ${content.leftPill ? `<div class="pill-title">${content.leftPill}</div>` : ''}
                ${content.leftText ? `<div class="highlight-text">${content.leftText}</div>` : ''}
                
                ${content.rightPill ? `<div class="pill-title">${content.rightPill}</div>` : ''}
                ${content.rightBullets && content.rightBullets.length > 0 ? `
                    <ul class="highlight-list">
                        ${content.rightBullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;

        const imageHtml = `
            <div class="highlight-image-side" style="background-image: url('${content.imageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80'}')"></div>
        `;

        // Compose based on position
        if (content.imagePosition === 'left') {
            wrap.innerHTML = imageHtml + contentHtml;
        } else {
            wrap.innerHTML = contentHtml + imageHtml;
        }
        return wrap;

    } else if (type === 'matrix') {
        // e.g. Image 2 / Image 3
        // content: { headerText, columns: ['Day 1', 'Day 2'], rows: [ ['Company BG', ''], ['IT Setup', 'Benefits'] ] }
        wrap.className = 'cp-block-matrix';
        
        const ths = content.columns.map(c => `<th>${c}</th>`).join('');
        const trs = content.rows.map(rowCols => {
            const tds = rowCols.map(val => `<td class="${val ? 'cell-active' : ''}">${val || ''}</td>`).join('');
            return `<tr>${tds}</tr>`;
        }).join('');

        wrap.innerHTML = `
            ${content.headerText ? `<div class="matrix-header">${content.headerText}</div>` : ''}
            <div class="matrix-table-wrap">
                <table class="matrix-table">
                    <thead><tr>${ths}</tr></thead>
                    <tbody>${trs}</tbody>
                </table>
            </div>
        `;
        return wrap;

    } else if (type === 'timeline') {
        // e.g. Image 6
        // content: { title: 'YOUR ONBOARDING JOURNEY', steps: [{month: 'MONTH 1', desc: 'Getting started'}, ...] }
        wrap.className = 'cp-block-journey';
        
        const stepsHtml = content.steps.map(step => `
            <div class="journey-step">
                <div class="journey-card">
                    <div class="journey-dot"></div>
                    <div class="step-title">${step.title}</div>
                    <div class="step-desc">${step.desc}</div>
                </div>
            </div>
        `).join('');

        wrap.innerHTML = `
            ${content.title ? `<div class="journey-title">${content.title}</div>` : ''}
            <div class="journey-line-container">
                ${stepsHtml}
            </div>
        `;
        return wrap;

    } else if (type === 'agenda') {
        // e.g. Image 5
        // content: { title: 'WELCOME TO CREATIVE COMPANY', pill: 'AGENDA', items: ['Overview', 'Month 1', 'Month 2'] }
        wrap.className = 'cp-block-agenda';
        
        const listLinks = content.items.map(i => `<li>${i}</li>`).join('');

        wrap.innerHTML = `
            <div class="agenda-left">
                <div class="agenda-left-title">${content.title}</div>
            </div>
            <div class="agenda-right">
                <div class="pill-title" style="margin-top:0;">${content.pill || 'AGENDA'}</div>
                <ul class="agenda-list">
                    ${listLinks}
                </ul>
            </div>
        `;
        return wrap;
    }

    return null; // Unknown type
}
