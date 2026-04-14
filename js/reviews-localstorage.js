class LocalStorageReviewSystem {
    constructor() {
        this.apiBaseUrl = (window.CONFIG && window.CONFIG.apiBaseUrl) || '/api';
        this.currentPage = 1;
        this.reviewsPerPage = 6;
        this.selectedRating = 0;
        this.publicReviews = [];
        this.cachedAllReviews = [];
        this.pagination = { page: 1, totalPages: 1, total: 0 };
        this.fallbackReviews = [
            {
                id: 'fallback-shivam-singh',
                reviewerName: 'Shivam',
                reviewerEmail: 'kaushalshivam71@gmail.com',
                reviewerInstagram: '',
                projectType: 'Trading Video',
                rating: 5,
                reviewText: 'The video editing was really well done. The transitions were smooth, the timing was perfect, and the overall presentation looked professional. Thank you for paying attention to every detail. Keep up the creative and clean work.\n\n- Shivam',
                allowDisplay: true,
                status: 'approved',
                createdAt: '2025-08-27T00:00:00.000Z',
            },
        ];

        this.init();
    }

    async init() {
        this.initializeStarRating();
        await this.refreshPublicData();
        console.log('MongoDB review system initialized');
    }

    async api(path, options = {}) {
        const response = await fetch(`${this.apiBaseUrl}${path}`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Request failed (${response.status})`);
        }

        return data;
    }

    async refreshPublicData() {
        await Promise.all([this.displayReviews(), this.updateStats()]);
    }

    mergeFallbackReviews(reviews) {
        const list = Array.isArray(reviews) ? [...reviews] : [];

        this.fallbackReviews.forEach((fallbackReview) => {
            const exists = list.some((review) => {
                return (
                    (review.reviewerEmail && review.reviewerEmail === fallbackReview.reviewerEmail) ||
                    (review.reviewerName && review.reviewerName.toLowerCase() === fallbackReview.reviewerName.toLowerCase()) ||
                    (review.reviewText && review.reviewText === fallbackReview.reviewText)
                );
            });

            if (!exists) {
                list.unshift(fallbackReview);
            }
        });

        return list;
    }

    getFallbackStats(reviews) {
        const approved = reviews.filter((review) => review.status === 'approved' && review.allowDisplay !== false);
        const averageRating = approved.length > 0
            ? approved.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / approved.length
            : 0;

        return {
            approved: approved.length,
            averageRating,
            satisfactionRate: reviews.length > 0 ? Math.round((approved.length / reviews.length) * 100) : 0,
        };
    }

    initializeStarRating() {
        this.selectedRating = 0;
        const stars = document.querySelectorAll('#starRating .star');
        const ratingInput = document.getElementById('rating');

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.selectedRating = index + 1;
                if (ratingInput) {
                    ratingInput.value = this.selectedRating;
                }

                stars.forEach((s, i) => {
                    s.classList.toggle('selected', i < this.selectedRating);
                });
            });

            star.addEventListener('mouseover', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('hover', i <= index);
                });
            });
        });

        const starContainer = document.getElementById('starRating');
        if (starContainer) {
            starContainer.addEventListener('mouseleave', () => {
                stars.forEach((s, i) => {
                    s.classList.remove('hover');
                    s.classList.toggle('selected', i < this.selectedRating);
                });
            });
        }
    }

    async submitReview(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const reviewData = {
            reviewerName: formData.get('reviewerName'),
            reviewerEmail: formData.get('reviewerEmail') || '',
            reviewerInstagram: formData.get('reviewerInstagram') || '',
            projectType: formData.get('projectType'),
            rating: parseInt(formData.get('rating'), 10),
            reviewText: formData.get('reviewText'),
            allowDisplay: formData.get('allowDisplay') === 'on',
        };

        if (!reviewData.reviewerName || !reviewData.projectType || !reviewData.rating || !reviewData.reviewText) {
            this.showMessage('reviewFormMsg', 'Please fill in all required fields.', 'error');
            return false;
        }

        try {
            await this.api('/reviews', {
                method: 'POST',
                body: JSON.stringify(reviewData),
            });

            this.showMessage('reviewFormMsg', 'Review submitted successfully! It will appear after approval.', 'success');
            event.target.reset();
            this.selectedRating = 0;
            document.querySelectorAll('#starRating .star').forEach((s) => s.classList.remove('selected'));

            setTimeout(() => {
                this.closeReviewModal();
            }, 1500);

            return false;
        } catch (error) {
            console.error('Review submit failed:', error);
            this.showMessage('reviewFormMsg', error.message || 'Failed to submit review.', 'error');
            return false;
        }
    }

    async displayReviews() {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;

        try {
            const result = await this.api(`/reviews/public?page=${this.currentPage}&limit=${this.reviewsPerPage}`);
            const reviews = this.mergeFallbackReviews(result.items || []);

            this.publicReviews = reviews;
            this.cachedAllReviews = reviews;
            this.pagination = result.pagination || { page: 1, totalPages: 1, total: reviews.length };

            if (!reviews.length) {
                grid.innerHTML = `
                    <div class="no-reviews" style="text-align:center;padding:40px;color:var(--muted);">
                        <h4>No reviews yet</h4>
                        <p>Be the first to share your experience.</p>
                    </div>
                `;
            } else {
                grid.innerHTML = reviews.map((review) => this.createReviewCard(review)).join('');
            }

            this.updatePaginationButtons();
        } catch (error) {
            console.error('Failed to load reviews:', error);
            const reviews = this.mergeFallbackReviews([]);
            this.publicReviews = reviews;
            this.cachedAllReviews = reviews;
            this.pagination = { page: 1, totalPages: 1, total: reviews.length };
            grid.innerHTML = `
                ${reviews.map((review) => this.createReviewCard(review)).join('')}
            `;

            this.updatePaginationButtons();
        }
    }

    createReviewCard(review) {
        const initials = (review.reviewerName || 'U')
            .split(' ')
            .map((n) => n.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');

        const rating = Math.max(1, Math.min(5, review.rating || 0));
        const stars = Array.from({ length: 5 }, (_, i) =>
            i < rating ? '<span class="star"></span>' : '<span class="star empty"></span>'
        ).join('');

        const dateLabel = new Date(review.createdAt || Date.now()).toLocaleDateString();

        return `
            <article class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${initials}</div>
                        <div class="reviewer-details">
                            <h5>${this.escapeHtml(review.reviewerName || 'Anonymous')}</h5>
                            <div class="project-type">${this.escapeHtml(review.projectType || 'Project')}</div>
                        </div>
                    </div>
                    <div class="review-rating">${stars}</div>
                </div>
                <p class="review-text">${this.escapeHtml(review.reviewText || '')}</p>
                <div class="review-meta">
                    <span class="review-date">${dateLabel}</span>
                    <span class="review-verified"> Verified</span>
                </div>
            </article>
        `;
    }

    async updateStats() {
        try {
            const stats = await this.api('/reviews/stats');
            const merged = this.mergeFallbackReviews(this.cachedAllReviews);
            const fallbackStats = this.getFallbackStats(merged);
            const totalReviews = Math.max(stats.approved ?? 0, fallbackStats.approved);
            const averageRating = Math.max(stats.averageRating ?? 0, fallbackStats.averageRating);
            const satisfactionRate = Math.max(stats.satisfactionRate ?? 0, fallbackStats.satisfactionRate);

            this.setText('totalReviews', totalReviews);
            this.setText('averageRating', averageRating.toFixed(1));
            this.setText('satisfactionRate', `${satisfactionRate}%`);
        } catch (error) {
            console.error('Failed to update stats:', error);
            const fallbackStats = this.getFallbackStats(this.mergeFallbackReviews([]));
            this.setText('totalReviews', fallbackStats.approved);
            this.setText('averageRating', fallbackStats.averageRating.toFixed(1));
            this.setText('satisfactionRate', `${fallbackStats.satisfactionRate}%`);
        }
    }

    updatePaginationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const info = document.getElementById('paginationInfo');

        const page = this.pagination.page || this.currentPage;
        const totalPages = this.pagination.totalPages || 1;

        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= totalPages;
        if (info) info.textContent = `Page ${page} of ${totalPages}`;
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            await this.displayReviews();
        }
    }

    async nextPage() {
        const totalPages = this.pagination.totalPages || 1;
        if (this.currentPage < totalPages) {
            this.currentPage += 1;
            await this.displayReviews();
        }
    }

    openReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeReviewModal(event) {
        const modal = document.getElementById('reviewModal');
        if (event && event.target && event.target !== modal) return;
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    getAllReviews() {
        return this.cachedAllReviews;
    }

    async approveReview(id) {
        await this.api(`/reviews/admin/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'approved' }),
        });
        await this.refreshPublicData();
    }

    async rejectReview(id) {
        await this.api(`/reviews/admin/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected' }),
        });
        await this.refreshPublicData();
    }

    exportToJSON() {
        const data = JSON.stringify(this.cachedAllReviews, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reviews_export_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.className = `form-message ${type}`;
        element.textContent = message;
        element.style.display = 'block';
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const reviewSystem = new LocalStorageReviewSystem();
window.reviewSystem = reviewSystem;
