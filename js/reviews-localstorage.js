// =====================================================
// LOCAL STORAGE + DISCORD WEBHOOK REVIEW SYSTEM
// =====================================================
// Perfect for GitHub Pages - No server required!

class LocalStorageReviewSystem {
    constructor() {
        this.storageKey = 'editedframe_reviews';
        this.currentPage = 1;
        this.reviewsPerPage = 6;
        this.selectedRating = 0;
        
        // Configuration will be loaded from external config file
        this.gistId = null;
        this.gistFilename = 'approved-reviews.json';
        this.githubToken = null;
        this.webhook = null;
        
        // Load configuration from external file (keeps sensitive data private)
        this.loadConfiguration();
        
        this.init();
    }

    // Simple decode function (you can make this more complex)
    // Load configuration from external file (keeps sensitive data private)
    async loadConfiguration() {
        try {
            const response = await fetch('./config.json');
            if (response.ok) {
                const config = await response.json();
                
                // Set up Discord webhook
                if (config.discord?.webhook) {
                    this.webhook = this.decodeWebhook(config.discord.webhook);
                }
                
                // Set up GitHub Gist
                if (config.github?.gistId) {
                    this.gistId = config.github.gistId;
                }
                
                if (config.github?.token) {
                    this.githubToken = config.github.token;
                }
                
                console.log('✅ Configuration loaded from config.json');
            } else {
                console.warn('⚠️ No config.json found - using fallback configuration');
                this.useFallbackConfig();
            }
        } catch (error) {
            console.warn('⚠️ Could not load config.json - using fallback configuration');
            this.useFallbackConfig();
        }
    }

    // Fallback configuration for when config.json is not available
    useFallbackConfig() {
        console.log('📝 Using fallback configuration (no sensitive data)');
        // System will work in local-only mode
        this.gistId = null;
        this.webhook = null;
    }

    decodeWebhook(encoded) {
        try {
            return atob(encoded);
        } catch(e) {
            console.warn('Webhook decode failed - reviews will work but no Discord notifications');
            return null;
        }
    }

    // GitHub Gist Methods - Centralized Review Storage
    async loadApprovedReviews() {
        if (!this.gistId || this.gistId === 'your-gist-id-here') {
            console.log('📝 No Gist ID configured - using local storage only');
            return;
        }

        try {
            console.log('📡 Loading approved reviews from GitHub Gist...');
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            
            if (response.ok) {
                const gist = await response.json();
                const fileContent = gist.files[this.gistFilename]?.content;
                
                if (fileContent) {
                    const approvedReviews = JSON.parse(fileContent);
                    
                    // Merge with local storage (approved reviews take priority)
                    const localReviews = this.getStoredReviews();
                    const mergedReviews = [...approvedReviews];
                    
                    // Add local pending/rejected reviews that aren't in Gist
                    localReviews.forEach(localReview => {
                        if (!approvedReviews.find(approved => approved.id === localReview.id)) {
                            mergedReviews.push(localReview);
                        }
                    });
                    
                    this.saveReviews(mergedReviews);
                    console.log(`✅ Loaded ${approvedReviews.length} approved reviews from Gist`);
                }
            } else {
                console.log('⚠️ Could not load from Gist - using local storage only');
            }
        } catch (error) {
            console.warn('❌ Error loading from Gist - using local storage:', error.message);
        }
    }

    async updateApprovedReviewsGist(approvedReviews) {
        if (!this.gistId || this.gistId === 'your-gist-id-here') {
            console.log('📝 Creating new Gist for approved reviews...');
            return await this.createApprovedReviewsGist(approvedReviews);
        }

        if (!this.githubToken) {
            console.log('⚠️ No GitHub token - approved reviews will only be local');
            return false;
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: {
                        [this.gistFilename]: {
                            content: JSON.stringify(approvedReviews, null, 2)
                        }
                    }
                })
            });

            if (response.ok) {
                console.log('✅ Updated approved reviews in Gist');
                return true;
            } else {
                console.warn('❌ Failed to update Gist:', response.status);
                return false;
            }
        } catch (error) {
            console.warn('❌ Error updating Gist:', error.message);
            return false;
        }
    }

    async createApprovedReviewsGist(initialReviews = []) {
        console.log('📝 Instructions for creating GitHub Gist:');
        console.log('1. Go to https://gist.github.com/');
        console.log('2. Create a new public gist named "approved-reviews.json"');
        console.log('3. Content: ' + JSON.stringify(initialReviews, null, 2));
        console.log('4. Copy the Gist ID from the URL');
        console.log('5. Update this.gistId in the code');
        return false;
    }

    async init() {
        // Load configuration first (contains sensitive data)
        await this.loadConfiguration();
        
        // Import existing review from JSON if exists (do this first)
        this.importExistingReview();
        
        // Load approved reviews from GitHub Gist (centralized)
        await this.loadApprovedReviews();
        
        // Initialize star rating for the modal
        this.initializeStarRating();
        
        // Display reviews and update stats
        this.displayReviews();
        this.updateStats();
        
        console.log('🌟 Centralized Review system initialized successfully');
    }

    // Import the existing review from your JSON file
    importExistingReview() {
        const existingReview = {
            id: 'import_1',
            reviewerName: 'Shivam',
            reviewerEmail: 'kaushalshivam71@gmail.com',
            reviewerInstagram: '',
            projectType: 'Trading Video',
            rating: 5,
            reviewText: 'The video editing was really well done. The transitions were smooth, the timing was perfect, and the overall presentation looked professional. Thank you for paying attention to every detail. Keep up the creative and clean work.\n\n- Shivam',
            allowDisplay: true,
            status: 'approved', // Auto-approve existing review
            timestamp: 1756302033252,
            date: new Date(1756302033252).toISOString().split('T')[0]
        };

        const reviews = this.getStoredReviews();
        
        // Only import if not already imported
        if (!reviews.find(r => r.id === 'import_1')) {
            reviews.push(existingReview);
            this.saveReviews(reviews);
            console.log('✅ Imported existing review from JSON');
        }
    }

    // Get reviews from localStorage
    getStoredReviews() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch(e) {
            console.error('Error loading reviews:', e);
            return [];
        }
    }

    // Save reviews to localStorage
    saveReviews(reviews) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(reviews));
            return true;
        } catch(e) {
            console.error('Error saving reviews:', e);
            return false;
        }
    }

    // Initialize star rating system
    initializeStarRating() {
        this.selectedRating = 0; // Initialize rating
        const stars = document.querySelectorAll('#starRating .star');
        const ratingInput = document.getElementById('rating');

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.selectedRating = index + 1;
                ratingInput.value = this.selectedRating;
                
                // Update visual feedback
                stars.forEach((s, i) => {
                    s.classList.toggle('selected', i < this.selectedRating);
                });
                
                console.log('Selected rating:', this.selectedRating);
            });

            star.addEventListener('mouseover', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('hover', i <= index);
                });
            });
        });

        document.getElementById('starRating').addEventListener('mouseleave', () => {
            stars.forEach((s, i) => {
                s.classList.remove('hover');
                s.classList.toggle('selected', i < this.selectedRating);
            });
        });
    }

    // Submit new review
    async submitReview(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const reviewData = {
            id: 'review_' + Date.now(),
            reviewerName: formData.get('reviewerName'),
            reviewerEmail: formData.get('reviewerEmail') || '',
            reviewerInstagram: formData.get('reviewerInstagram') || '',
            projectType: formData.get('projectType'),
            rating: parseInt(formData.get('rating')),
            reviewText: formData.get('reviewText'),
            allowDisplay: formData.get('allowDisplay') === 'on',
            status: 'pending', // You'll approve manually
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };

        // Validate required fields
        if (!reviewData.reviewerName || !reviewData.projectType || !reviewData.rating || !reviewData.reviewText) {
            this.showMessage('reviewFormMsg', 'Please fill in all required fields.', 'error');
            return false;
        }

        try {
            // Save to localStorage
            const reviews = this.getStoredReviews();
            reviews.push(reviewData);
            
            if (this.saveReviews(reviews)) {
                // Send to Discord webhook for backup/notification
                await this.sendToDiscord(reviewData);
                
                // Show success message
                this.showMessage('reviewFormMsg', 'Review submitted successfully! It will appear after approval.', 'success');
                
                // Reset form
                event.target.reset();
                this.selectedRating = 0;
                document.querySelectorAll('#starRating .star').forEach(s => s.classList.remove('selected'));
                
                // Close modal after delay
                setTimeout(() => {
                    this.closeReviewModal();
                }, 2000);
                
                // Refresh stats
                this.updateStats();
                
                return false;
            } else {
                throw new Error('Failed to save review locally');
            }
        } catch(error) {
            console.error('Error submitting review:', error);
            this.showMessage('reviewFormMsg', 'Error submitting review. Please try again.', 'error');
            return false;
        }
    }

    // Send review to Discord webhook
    async sendToDiscord(reviewData) {
        if (!this.webhook) {
            console.warn('⚠️ No Discord webhook configured - notifications disabled');
            return;
        }
        
        console.log('📡 Attempting to send Discord notification...');
        console.log('🔗 Webhook URL:', this.webhook.substring(0, 50) + '...');

        try {
            const embed = {
                title: "🌟 New Review Submitted",
                color: 0x7b2ff2, // Purple color matching your theme
                fields: [
                    { name: "👤 Name", value: reviewData.reviewerName, inline: true },
                    { name: "⭐ Rating", value: "★".repeat(reviewData.rating) + "☆".repeat(5-reviewData.rating), inline: true },
                    { name: "🎬 Project Type", value: reviewData.projectType, inline: true },
                    { name: "📝 Review", value: reviewData.reviewText.substring(0, 1000) + (reviewData.reviewText.length > 1000 ? '...' : ''), inline: false },
                    { name: "📧 Email", value: reviewData.reviewerEmail || 'Not provided', inline: true },
                    { name: "📱 Instagram", value: reviewData.reviewerInstagram || 'Not provided', inline: true },
                    { name: "🔒 Status", value: `${reviewData.status.toUpperCase()} | Display: ${reviewData.allowDisplay ? 'Yes' : 'No'}`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "edited.frame Portfolio Review System"
                }
            };

            const response = await fetch(this.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [embed]
                })
            });
            
            if (response.ok) {
                console.log('✅ Review sent to Discord successfully!');
            } else {
                console.error('❌ Discord webhook failed:', response.status, response.statusText);
                if (response.status === 404) {
                    console.error('💡 Webhook not found - it may have been deleted. Create a new one!');
                }
            }
        } catch(error) {
            console.warn('Discord webhook failed (review still saved locally):', error);
        }
    }

    // Load and display reviews
    displayReviews() {
        const container = document.getElementById('reviewsGrid');
        
        // Clear any loading state first
        if (container) {
            const reviews = this.getStoredReviews().filter(r => r.status === 'approved' && r.allowDisplay);
            
            if (reviews.length === 0) {
                container.innerHTML = `
                    <div class="no-reviews">
                        <div class="no-reviews-icon">⭐</div>
                        <h4>No Reviews Yet</h4>
                        <p>Be the first to leave a review!</p>
                    </div>
                `;
                return;
            }

            // Sort by timestamp (newest first)
            reviews.sort((a, b) => b.timestamp - a.timestamp);
            
            // Pagination
            const startIndex = (this.currentPage - 1) * this.reviewsPerPage;
            const endIndex = startIndex + this.reviewsPerPage;
            const paginatedReviews = reviews.slice(startIndex, endIndex);
            
            container.innerHTML = paginatedReviews.map(review => this.createReviewCard(review)).join('');
            
            // Update pagination
            this.updatePagination(reviews.length);
            
            console.log(`📋 Displayed ${paginatedReviews.length} reviews (${reviews.length} total approved)`);
        } else {
            console.error('❌ Reviews container not found');
        }
    }

    // Create review card HTML
    createReviewCard(review) {
        const timeAgo = this.getTimeAgo(review.timestamp);
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.reviewerName.charAt(0).toUpperCase()}
                        </div>
                        <div class="reviewer-details">
                            <h5 class="reviewer-name">${review.reviewerName}</h5>
                            <div class="review-meta">
                                <span class="project-type">${review.projectType}</span>
                                <span class="review-date">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                    <div class="review-rating">
                        <div class="stars">${stars}</div>
                        <div class="rating-number">${review.rating}/5</div>
                    </div>
                </div>
                <div class="review-content">
                    <p class="review-text">${review.reviewText}</p>
                </div>
                ${review.reviewerInstagram ? `
                    <div class="review-footer">
                        <span class="instagram-handle">📱 ${review.reviewerInstagram}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Update statistics
    updateStats() {
        const reviews = this.getStoredReviews().filter(r => r.status === 'approved' && r.allowDisplay);
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0.0';
        const satisfactionRate = totalReviews > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100) : 0;

        document.getElementById('totalReviews').textContent = totalReviews;
        document.getElementById('averageRating').textContent = averageRating;
        document.getElementById('satisfactionRate').textContent = `${satisfactionRate}%`;
    }

    // Utility functions
    getTimeAgo(timestamp) {
        const now = new Date();
        const reviewDate = new Date(timestamp);
        const diffInSeconds = Math.floor((now - reviewDate) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return reviewDate.toLocaleDateString();
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Modal functions
    openReviewModal() {
        document.getElementById('reviewModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeReviewModal(event) {
        if (!event || event.target.classList.contains('review-modal') || event.target.classList.contains('close-modal')) {
            document.getElementById('reviewModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            document.getElementById('reviewForm').reset();
            this.selectedRating = 0;
            document.querySelectorAll('#starRating .star').forEach(s => s.classList.remove('selected'));
            document.getElementById('reviewFormMsg').style.display = 'none';
        }
    }

    // Pagination
    updatePagination(totalReviews) {
        const totalPages = Math.ceil(totalReviews / this.reviewsPerPage);
        
        document.getElementById('prevBtn').disabled = this.currentPage <= 1;
        document.getElementById('nextBtn').disabled = this.currentPage >= totalPages;
        document.getElementById('paginationInfo').textContent = 
            totalPages > 0 ? `Page ${this.currentPage} of ${totalPages}` : 'No reviews';
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.displayReviews();
        }
    }

    nextPage() {
        const reviews = this.getStoredReviews().filter(r => r.status === 'approved' && r.allowDisplay);
        const totalPages = Math.ceil(reviews.length / this.reviewsPerPage);
        
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayReviews();
        }
    }

    // Admin functions (for you to manage reviews)
    getAllReviews() {
        return this.getStoredReviews();
    }

    async approveReview(reviewId) {
        const reviews = this.getStoredReviews();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            review.status = 'approved';
            this.saveReviews(reviews);
            
            // Update centralized approved reviews
            const approvedReviews = reviews.filter(r => r.status === 'approved' && r.allowDisplay);
            await this.updateApprovedReviewsGist(approvedReviews);
            
            this.displayReviews();
            this.updateStats();
            
            console.log('✅ Review approved and synced to all visitors');
        }
    }

    async rejectReview(reviewId) {
        const reviews = this.getStoredReviews();
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
            review.status = 'rejected';
            this.saveReviews(reviews);
            
            // Update centralized approved reviews (remove if it was there)
            const approvedReviews = reviews.filter(r => r.status === 'approved' && r.allowDisplay);
            await this.updateApprovedReviewsGist(approvedReviews);
            
            this.displayReviews();
            this.updateStats();
            
            console.log('✅ Review rejected and removed from public view');
        }
    }

    // Export for backup
    exportToJSON() {
        const reviews = this.getStoredReviews();
        const dataStr = JSON.stringify(reviews, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `editedframe_reviews_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Initialize the review system
const reviewSystem = new LocalStorageReviewSystem();

// Make functions available globally for HTML onclick handlers
window.reviewSystem = reviewSystem;