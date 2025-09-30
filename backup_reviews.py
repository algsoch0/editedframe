# Reviews Database Backup System
# Simple SQLite backup for your review system

import sqlite3
import json
import os
from datetime import datetime

class ReviewsBackup:
    def __init__(self, db_path='data/reviews.db'):
        self.db_path = db_path
        self.ensure_db_exists()
    
    def ensure_db_exists(self):
        """Create database and table if they don't exist"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS reviews (
                    id TEXT PRIMARY KEY,
                    reviewer_name TEXT NOT NULL,
                    reviewer_email TEXT,
                    reviewer_instagram TEXT,
                    project_type TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    review_text TEXT NOT NULL,
                    allow_display BOOLEAN,
                    status TEXT DEFAULT 'pending',
                    timestamp INTEGER,
                    date TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
    
    def import_from_json(self, json_file_path):
        """Import reviews from JSON file to SQLite"""
        with open(json_file_path, 'r') as f:
            reviews = json.load(f)
        
        if not isinstance(reviews, list):
            reviews = [reviews]  # Single review object
        
        with sqlite3.connect(self.db_path) as conn:
            for review in reviews:
                conn.execute('''
                    INSERT OR REPLACE INTO reviews 
                    (id, reviewer_name, reviewer_email, reviewer_instagram, 
                     project_type, rating, review_text, allow_display, 
                     status, timestamp, date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    review.get('id', f"review_{review.get('timestamp', int(datetime.now().timestamp()))}"),
                    review['reviewerName'],
                    review.get('reviewerEmail', ''),
                    review.get('reviewerInstagram', ''),
                    review['projectType'],
                    review['rating'],
                    review['reviewText'],
                    review.get('allowDisplay', True),
                    review.get('status', 'approved'),
                    review.get('timestamp', int(datetime.now().timestamp())),
                    review.get('date', datetime.now().strftime('%Y-%m-%d'))
                ))
        
        print(f"✅ Imported {len(reviews)} reviews to SQLite database")
    
    def export_to_json(self, output_file='backup_reviews.json'):
        """Export all reviews from SQLite to JSON"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            reviews = conn.execute('SELECT * FROM reviews ORDER BY timestamp DESC').fetchall()
        
        reviews_list = []
        for row in reviews:
            review = {
                'id': row['id'],
                'reviewerName': row['reviewer_name'],
                'reviewerEmail': row['reviewer_email'],
                'reviewerInstagram': row['reviewer_instagram'],
                'projectType': row['project_type'],
                'rating': row['rating'],
                'reviewText': row['review_text'],
                'allowDisplay': bool(row['allow_display']),
                'status': row['status'],
                'timestamp': row['timestamp'],
                'date': row['date']
            }
            reviews_list.append(review)
        
        with open(output_file, 'w') as f:
            json.dump(reviews_list, f, indent=2)
        
        print(f"✅ Exported {len(reviews_list)} reviews to {output_file}")
        return reviews_list
    
    def get_stats(self):
        """Get review statistics"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Total reviews
            stats['total'] = conn.execute('SELECT COUNT(*) FROM reviews').fetchone()[0]
            
            # Approved reviews
            stats['approved'] = conn.execute('SELECT COUNT(*) FROM reviews WHERE status = "approved"').fetchone()[0]
            
            # Pending reviews
            stats['pending'] = conn.execute('SELECT COUNT(*) FROM reviews WHERE status = "pending"').fetchone()[0]
            
            # Average rating
            avg_rating = conn.execute('SELECT AVG(rating) FROM reviews WHERE status = "approved"').fetchone()[0]
            stats['average_rating'] = round(avg_rating, 1) if avg_rating else 0
            
            # Rating distribution
            ratings = conn.execute('SELECT rating, COUNT(*) FROM reviews WHERE status = "approved" GROUP BY rating').fetchall()
            stats['rating_distribution'] = dict(ratings)
        
        return stats

if __name__ == '__main__':
    # Example usage
    backup = ReviewsBackup()
    
    # Import existing review from your JSON file
    backup.import_from_json('js/edited-frame-default-rtdb--OYfkZ-XOFtdfxT8Kx7v-export.json')
    
    # Show stats
    stats = backup.get_stats()
    print("\n📊 Review Statistics:")
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    # Export backup
    backup.export_to_json('reviews_backup.json')