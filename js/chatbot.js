class SalesChatbot {
    constructor() {
        this.apiBaseUrl = (window.CONFIG && window.CONFIG.apiBaseUrl) || '/api';
        this.mode = (window.CONFIG && window.CONFIG.chatbotMode) || 'rule';
        this.onboardingStorageKey = 'editedframe_chatbot_onboarding_seen_v1';
        this.state = { open: false, loading: false };
        this.inquiryFlow = { active: false, step: '', payload: {} };
        this.nodes = {};
        this.quickPrompts = [
            'Show trading videos',
            'Show educational videos',
            'Show motion graphics',
            'Show social media edits',
            'What services do you offer?',
            'Show client reviews',
            'About Video Editor Sachin',
            'About developer',
            'Send requirement now',
        ];

        this.init();
    }

    init() {
        this.cacheNodes();
        if (!this.nodes.root) return;

        this.setupOnboarding();
        this.renderQuickPrompts();
        this.bindEvents();
        this.addBotMessage('Hi! Ask about portfolio, pricing, or contact.');
    }

    cacheNodes() {
        this.nodes.root = document.getElementById('salesChatbot');
        this.nodes.toggle = document.getElementById('chatbotToggle');
        this.nodes.panel = document.getElementById('chatbotPanel');
        this.nodes.messages = document.getElementById('chatbotMessages');
        this.nodes.form = document.getElementById('chatbotForm');
        this.nodes.input = document.getElementById('chatbotInput');
        this.nodes.quick = document.getElementById('chatbotQuickPrompts');
        this.nodes.status = document.getElementById('chatbotStatus');
        this.nodes.close = document.getElementById('chatbotClose');
        this.nodes.wake = document.getElementById('chatbotWake');
        this.nodes.modeSelect = document.getElementById('chatbotModeSelect');
        this.nodes.onboarding = document.getElementById('chatbotOnboarding');
        this.nodes.promptSelect = document.getElementById('chatbotPromptSelect');
    }

    setupOnboarding() {
        if (!this.nodes.onboarding) return;

        const seen = localStorage.getItem(this.onboardingStorageKey) === '1';
        if (seen) {
            this.nodes.onboarding.style.display = 'none';
            return;
        }

        this.nodes.onboarding.style.display = 'grid';
    }

    bindEvents() {
        this.nodes.toggle?.addEventListener('click', () => this.togglePanel());
        this.nodes.close?.addEventListener('click', () => this.closePanel());
        this.nodes.wake?.addEventListener('click', async () => {
            await this.wakeBackend();
        });
        this.nodes.modeSelect?.addEventListener('change', (event) => {
            this.mode = event.target.value;
            this.setStatus(`Mode: ${this.mode}`);
        });

        const clearBtn = document.getElementById('chatbotClear');
        clearBtn?.addEventListener('click', () => this.clearChat());

        const fullscreenBtn = document.getElementById('chatbotFullscreen');
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        this.nodes.promptSelect?.addEventListener('change', (event) => {
            const text = String(event.target.value || '').trim();
            if (!text || !this.nodes.input) return;
            this.nodes.input.value = text;
            this.nodes.input.focus();
        });

        this.nodes.messages?.addEventListener('click', (event) => {
            const button = event.target.closest('.chatbot-filter-btn');
            if (!button) return;
            const category = button.getAttribute('data-category');
            if (category && typeof window.filterGrid === 'function') {
                window.filterGrid(category);
                this.addBotMessage(`Applied ${this.categoryLabel(category)} filter on portfolio.`);
            }
        });

        this.nodes.form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const text = (this.nodes.input?.value || '').trim();
            if (!text || this.state.loading) return;

            this.nodes.input.value = '';
            this.addUserMessage(text);
            await this.handleMessage(text);
        });
    }

    renderQuickPrompts() {
        if (this.nodes.quick) {
            this.nodes.quick.innerHTML = '';
        }

        if (!this.nodes.promptSelect) return;

        this.nodes.promptSelect.innerHTML = [
            '<option value="">Quick ask: choose a topic...</option>',
            ...this.quickPrompts.map((prompt) => `<option value="${this.escapeHtml(prompt)}">${this.escapeHtml(prompt)}</option>`),
        ].join('');
    }

    togglePanel() {
        this.state.open = !this.state.open;
        this.nodes.panel?.classList.toggle('open', this.state.open);
        this.nodes.toggle?.classList.toggle('open', this.state.open);
        if (this.state.open) {
            if (this.nodes.onboarding && this.nodes.onboarding.style.display !== 'none') {
                this.nodes.onboarding.style.display = 'none';
                localStorage.setItem(this.onboardingStorageKey, '1');
            }
            this.nodes.input?.focus();
        }
    }

    closePanel() {
        this.state.open = false;
        this.nodes.panel?.classList.remove('open');
        this.nodes.toggle?.classList.remove('open');
    }

    clearChat() {
        if (this.nodes.messages) {
            this.nodes.messages.innerHTML = '';
        }
        this.inquiryFlow = { active: false, step: '', payload: {} };
        this.addBotMessage('Chat cleared. How can I help you?');
    }

    toggleFullscreen() {
        const panel = this.nodes.panel;
        if (!panel) return;

        if (panel.classList.contains('fullscreen')) {
            panel.classList.remove('fullscreen');
            panel.style.width = '';
            panel.style.height = '';
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.right = '';
            panel.style.bottom = '';
            panel.style.zIndex = '';
        } else {
            panel.classList.add('fullscreen');
            panel.style.position = 'fixed';
            panel.style.top = '0';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.bottom = '0';
            panel.style.width = '100%';
            panel.style.height = '100%';
            panel.style.zIndex = '11001';
            panel.style.borderRadius = '0';
        }
    }

    setStatus(text) {
        if (this.nodes.status) {
            this.nodes.status.textContent = text;
        }
    }

    addUserMessage(text) {
        this.addMessage('user', text);
    }

    addBotMessage(text) {
        this.addMessage('bot', text);
    }

    addBotCard(title, htmlBody, copyValue = '') {
        const wrap = document.createElement('div');
        wrap.className = 'chatbot-msg bot';

        wrap.innerHTML = `
            <div class="chatbot-bubble-wrap chatbot-card-wrap">
                <div class="chatbot-bubble chatbot-card">
                    <h5 class="chatbot-card-title">${this.escapeHtml(title)}</h5>
                    <div class="chatbot-card-body">${htmlBody}</div>
                </div>
                <button type="button" class="chatbot-copy-btn" data-copy="${this.escapeHtml(copyValue || title)}">Copy Card</button>
            </div>
        `;

        const copyBtn = wrap.querySelector('.chatbot-copy-btn');
        copyBtn?.addEventListener('click', async () => {
            const textToCopy = copyBtn.getAttribute('data-copy') || '';
            await this.copyToClipboard(textToCopy);
        });

        this.nodes.messages?.appendChild(wrap);
        this.scrollToBottom();
    }

    addMessage(role, text) {
        const wrap = document.createElement('div');
        wrap.className = `chatbot-msg ${role}`;
        const rawText = String(text || '');
        const roleLabel = role === 'bot' ? 'Assistant' : 'You';
        wrap.innerHTML = `
            <div class="chatbot-bubble-wrap">
                <div class="chatbot-bubble">${this.formatMessage(rawText)}</div>
                <button type="button" class="chatbot-copy-btn" data-copy="${this.escapeHtml(rawText)}">Copy ${roleLabel}</button>
            </div>
        `;

        const copyBtn = wrap.querySelector('.chatbot-copy-btn');
        copyBtn?.addEventListener('click', async () => {
            const textToCopy = copyBtn.getAttribute('data-copy') || '';
            await this.copyToClipboard(textToCopy);
        });

        this.nodes.messages?.appendChild(wrap);
        this.scrollToBottom();
    }

    async copyToClipboard(value) {
        const text = String(value || '');
        if (!text) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const area = document.createElement('textarea');
                area.value = text;
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.focus();
                area.select();
                document.execCommand('copy');
                document.body.removeChild(area);
            }
            this.setStatus('Copied to clipboard');
        } catch (_error) {
            this.setStatus('Copy failed. Please copy manually.');
        }
    }

    formatMessage(text) {
        return this.escapeHtml(String(text || '')).replace(/\n/g, '<br>');
    }

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    scrollToBottom() {
        if (!this.nodes.messages) return;
        this.nodes.messages.scrollTop = this.nodes.messages.scrollHeight;
    }

    async handleMessage(text) {
        if (this.inquiryFlow.active) {
            await this.handleInquiryFlow(text);
            return;
        }

        this.state.loading = true;
        this.setStatus('Thinking...');

        try {
            const response = await fetch(`${this.apiBaseUrl}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, mode: this.mode }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Chat service unavailable');
            }

            this.addBotMessage(data.reply || 'I am here to help with your video requirements.');
            this.applyAction(data.action, data.data || {}, text);

            const llmLabel = data.llmStatus === 'ready'
                ? 'Groq ready'
                : (data.llmStatus === 'unavailable' ? 'Groq unavailable' : 'Groq not configured');
            this.setStatus(`Mode: ${data.mode || 'rule'} | ${llmLabel}`);
        } catch (_error) {
            this.addBotMessage('Backend chat is offline right now. Click Wake Backend and try again.');
            this.handleOfflineFallback(text);
            this.setStatus('Backend offline. Use Wake Backend button.');
        } finally {
            this.state.loading = false;
        }
    }

    async wakeBackend() {
        this.setStatus('Waking backend...');
        try {
            const [healthRes, statusRes] = await Promise.all([
                fetch(`${this.apiBaseUrl}/health`),
                fetch(`${this.apiBaseUrl}/chat/status`),
            ]);

            const health = await healthRes.json().catch(() => ({}));
            const status = await statusRes.json().catch(() => ({}));

            if (healthRes.ok && statusRes.ok) {
                const db = status.database || (health.database?.state || 'unknown');
                const groq = status.groq || 'not-configured';
                this.setStatus(`Backend online | DB: ${db} | Groq: ${groq}`);
                this.addBotMessage('Backend is awake. You can continue now.');
            } else {
                this.setStatus('Wake failed. Please retry in 10-20 seconds.');
            }
        } catch (_error) {
            this.setStatus('Still offline. Retry Wake Backend.');
        }
    }

    handleOfflineFallback(text) {
        const lower = String(text || '').toLowerCase();
        if (lower.includes('review')) {
            this.scrollToSection('reviews');
            return;
        }
        if (lower.includes('service')) {
            this.scrollToSection('services');
            return;
        }
        if (lower.includes('video') || lower.includes('work') || lower.includes('portfolio')) {
            this.scrollToSection('portfolio');
            return;
        }
        if (lower.includes('email') || lower.includes('contact')) {
            this.openEmailDraft('New Project Inquiry from Website Chatbot', 'Hi Sachin, I want to discuss a video editing project.');
        }
    }

    applyAction(action, data, userMessage) {
        const lower = String(userMessage || '').toLowerCase();

        if (action === 'show_services') {
            if (Array.isArray(data.services) && data.services.length) {
                const list = data.services.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('');
                this.addBotCard('Services', `<ul class="chatbot-list">${list}</ul>`, data.services.join(', '));
            }
            return;
        }

        if (action === 'show_reviews') {
            if (Array.isArray(data.reviews) && data.reviews.length) {
                const cards = data.reviews.map((item) => {
                    const stars = '★'.repeat(Math.max(1, Number(item.rating) || 0));
                    return `<article class="chatbot-inline-card"><h6>${this.escapeHtml(item.reviewerName)} • ${this.escapeHtml(item.projectType)}</h6><p>${this.escapeHtml(stars)}</p><p>${this.escapeHtml(item.reviewText)}</p></article>`;
                }).join('');
                this.addBotCard('Recent Client Reviews', cards, JSON.stringify(data.reviews));
            }
            return;
        }

        if (action === 'show_developer') {
            const body = this.buildPersonCardHtml(data.developer || {}, 'Developer');
            this.addBotCard('Developer Details', body, JSON.stringify(data.developer || {}));
            return;
        }

        if (action === 'show_profile') {
            const profile = data.profile || {};
            const body = this.buildProfileDetailHtml(profile);
            this.addBotCard(`${profile.name || 'Profile'} - ${profile.role || 'Role'}`, body, JSON.stringify(profile));
            return;
        }

        if (action === 'show_editor' || action === 'show_about') {
            const editor = data.editor || {};
            const developer = data.developer || {};
            const editorCard = this.buildPersonCardHtml(editor, 'Editor');
            const developerCard = this.buildPersonCardHtml(developer, 'Developer');
            this.addBotCard('Team Details', `${editorCard}${developerCard}`, JSON.stringify({ editor, developer }));
            return;
        }

        if (action === 'open_contact') {
            this.scrollToSection('contact');
            return;
        }

        if (action === 'send_inquiry') {
            this.startInquiryFlow(data.email || 'connectwithsachin06@gmail.com');
            return;
        }

        if (action === 'show_portfolio') {
            const category = this.detectCategory(lower);
            if (category && typeof window.filterGrid === 'function') {
                window.filterGrid(category);
                this.addBotMessage(`Applied ${this.categoryLabel(category)} filter on portfolio.`);
            } else if (typeof window.filterGrid === 'function') {
                window.filterGrid('all');
            }

            if (Array.isArray(data.videos) && data.videos.length) {
                const cards = data.videos.map((item, index) => {
                    const categoryBtn = item.category
                        ? `<button type="button" class="chatbot-filter-btn" data-category="${this.escapeHtml(item.category)}">Filter ${this.escapeHtml(item.label || '')}</button>`
                        : '';
                    return `
                        <article class="chatbot-inline-card">
                            <h6>${index + 1}. ${this.escapeHtml(item.title || 'Video')}</h6>
                            <p>${this.escapeHtml(item.label || 'Portfolio')}</p>
                            <p><a href="${this.escapeHtml(item.url || '#')}" target="_blank" rel="noopener noreferrer">Open Video</a></p>
                            ${categoryBtn}
                        </article>
                    `;
                }).join('');
                this.addBotCard('Video Matches', cards, JSON.stringify(data.videos));
            }
        }
    }

    startInquiryFlow(email) {
        this.inquiryFlow = { active: true, step: 'name', payload: { emailTo: email } };
        this.addBotMessage('Great. I will send this directly to Sachin. Please enter your name.');
    }

    async handleInquiryFlow(text) {
        const value = String(text || '').trim();
        if (!value) return;

        if (this.inquiryFlow.step === 'name') {
            this.inquiryFlow.payload.name = value;
            this.inquiryFlow.step = 'email';
            this.addBotMessage('Please enter your email address.');
            return;
        }

        if (this.inquiryFlow.step === 'email') {
            this.inquiryFlow.payload.email = value;
            this.inquiryFlow.step = 'budget';
            this.addBotMessage('Enter your budget (or type NA).');
            return;
        }

        if (this.inquiryFlow.step === 'budget') {
            this.inquiryFlow.payload.budget = value.toLowerCase() === 'na' ? 'Not specified' : value;
            this.inquiryFlow.step = 'requirement';
            this.addBotMessage('Now send your full requirement. I will send it directly.');
            return;
        }

        if (this.inquiryFlow.step === 'requirement') {
            this.inquiryFlow.payload.requirement = value;
            await this.submitInquiry();
        }
    }

    async submitInquiry() {
        this.state.loading = true;
        this.setStatus('Sending requirement...');

        try {
            const payload = this.inquiryFlow.payload;
            const res = await fetch(`${this.apiBaseUrl}/chat/inquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: payload.name,
                    email: payload.email,
                    budget: payload.budget,
                    requirement: payload.requirement,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to send inquiry');
            }

            this.addBotMessage(data.message || 'Requirement sent successfully.');
            this.setStatus('Inquiry sent');
        } catch (error) {
            this.addBotMessage(error.message || 'Could not send inquiry right now. Please try again.');
            this.setStatus('Inquiry failed');
        } finally {
            this.inquiryFlow = { active: false, step: '', payload: {} };
            this.state.loading = false;
        }
    }

    detectCategory(text) {
        if (/review|testimonial|client|feedback/.test(text)) return '';
        if (/trading/.test(text)) return 'trading-reel';
        if (/education|educational/.test(text)) return 'educational-video';
        if (/motion/.test(text)) return 'motion-graphic';
        if (/social|reel|short/.test(text)) return 'social-media';
        return '';
    }

    categoryLabel(category) {
        const map = {
            'trading-reel': 'Trading Reels',
            'educational-video': 'Educational Videos',
            'motion-graphic': 'Motion Graphics',
            'social-media': 'Social Media Edits',
        };
        return map[category] || 'portfolio';
    }

    buildPersonCardHtml(person, fallbackRole) {
        const name = this.escapeHtml(person.name || fallbackRole || 'Profile');
        const role = this.escapeHtml(person.role || fallbackRole || 'Role');
        const avatar = this.escapeHtml(person.avatar || 'assets/logo.jpg');
        const phone = person.phone ? `<p>Phone: ${this.escapeHtml(person.phone)}</p>` : '<p>Phone: Not shared publicly</p>';
        const github = person.github ? `<a href="${this.escapeHtml(person.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : '';
        const linkedin = person.linkedin ? `<a href="${this.escapeHtml(person.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : '';

        return `
            <article class="chatbot-inline-card">
                <div class="chatbot-profile-row">
                    <img src="${avatar}" alt="${name}" class="chatbot-profile-avatar" loading="lazy">
                    <div>
                        <h6>${name}</h6>
                        <p>${role}</p>
                    </div>
                </div>
                <p>Email: ${this.escapeHtml(person.email || 'Not available')}</p>
                ${phone}
                <div class="chatbot-links">${github}${linkedin}</div>
            </article>
        `;
    }

    buildProfileDetailHtml(profile) {
        const name = this.escapeHtml(profile.name || 'Profile');
        const role = this.escapeHtml(profile.role || 'Role');
        const title = this.escapeHtml(profile.title || role);
        const avatar = this.escapeHtml(profile.avatar || 'assets/logo.jpg');
        const bio = this.escapeHtml(profile.bio || 'Passionate about creating impactful video content.');
        const phone = profile.phone ? `<p><strong>☎️ Phone:</strong> ${this.escapeHtml(profile.phone)}</p>` : '';
        const email = profile.email ? `<p><strong>📧 Email:</strong> ${this.escapeHtml(profile.email)}</p>` : '';
        const github = profile.github ? `<a href="${this.escapeHtml(profile.github)}" target="_blank" rel="noopener noreferrer">GitHub Profile</a>` : '';
        const linkedin = profile.linkedin ? `<a href="${this.escapeHtml(profile.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn Profile</a>` : '';
        const turnaround = profile.turnaround ? `<p><strong>⏱️ Turnaround:</strong> ${this.escapeHtml(profile.turnaround)}</p>` : '';
        const skills = profile.skills && profile.skills.length
            ? `<p><strong>🎯 Skills:</strong> ${profile.skills.map(s => this.escapeHtml(s)).join(', ')}</p>`
            : '';

        return `
            <article class="chatbot-inline-card">
                <div class="chatbot-profile-row">
                    <img src="${avatar}" alt="${name}" class="chatbot-profile-avatar" loading="lazy">
                    <div>
                        <h6>${name}</h6>
                        <p style="font-size: 11px; color: #9fdcff;">${title}</p>
                    </div>
                </div>
                <p style="margin-top: 8px; font-size: 12px;">${bio}</p>
                ${email}
                ${phone}
                ${turnaround}
                ${skills}
                <div class="chatbot-links" style="margin-top: 8px;">${github}${linkedin ? ' | ' + linkedin : ''}</div>
            </article>
        `;
    }

    scrollToSection(id) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    openEmailDraft(subject, body) {
        const email = 'connectwithsachin06@gmail.com';
        const link = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = link;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.salesChatbot = new SalesChatbot();
});
