# 📊 Review System Data Flow & Storage Locations

## 🗂️ WHERE REVIEWS ARE STORED

### 1. 🌐 BROWSER LOCALSTORAGE (Primary)
```
Location: Each visitor's browser
Storage Key: 'editedframe_reviews'
Data Format: JSON array
Capacity: ~5-10MB per domain
Persistence: Permanent (until user clears browser data)
```

**Example LocalStorage Structure:**
```json
{
  "editedframe_reviews": [
    {
      "id": "rev_1696147200000",
      "name": "John Doe",
      "email": "john@example.com", 
      "rating": 5,
      "message": "Amazing work!",
      "timestamp": 1696147200000,
      "status": "approved",
      "ip": "xxx.xxx.xxx.xxx"
    }
  ]
}
```

### 2. 📢 DISCORD SERVER (Notifications)
```
Location: Your Discord server
Channel: Wherever webhook is configured
Purpose: Instant notifications of new reviews
Retention: Based on Discord's message history
```

**Discord Message Format:**
```
🌟 NEW REVIEW SUBMITTED! 🌟
👤 Name: John Doe
📧 Email: john@example.com
⭐ Rating: 5/5 stars
💬 Message: "Amazing work!"
🕒 Time: 2024-10-01 10:00:00
🌐 IP: xxx.xxx.xxx.xxx
```

### 3. 💾 SQLITE DATABASE (Local Backup)
```
Location: Your computer only
File: reviews_backup.db
Table: reviews
Purpose: Personal backup & data analysis
```

## 🔄 COMPLETE DATA FLOW

### Step 1: User Submits Review
```
User fills form → JavaScript validation → Data prepared
```

### Step 2: Dual Storage
```
📝 LocalStorage ← Review data → 📢 Discord webhook
    (Browser)                      (Your server)
```

### Step 3: Admin Approval
```
You see Discord notification → Visit admin panel → Approve/Reject
```

### Step 4: Public Display
```
Approved reviews → Visible to all visitors → Loaded from LocalStorage
```

## 🌍 STORAGE BY PLATFORM

### ON GITHUB PAGES:
```
✅ Browser LocalStorage: Works perfectly
✅ Discord Notifications: Works perfectly  
❌ SQLite Database: Not available (static hosting)
```

### ON YOUR LOCAL MACHINE:
```
✅ Browser LocalStorage: Works perfectly
✅ Discord Notifications: Works perfectly
✅ SQLite Database: Works perfectly
```

## 📱 USER EXPERIENCE

### What Each Visitor Sees:
1. **Loads your website** → Browser checks localStorage
2. **Finds approved reviews** → Displays them instantly
3. **Submits new review** → Stored locally + sent to Discord
4. **Waits for approval** → Review pending until you approve
5. **After approval** → Review appears for all visitors

### What You (Admin) Experience:
1. **Discord notification** → "New review submitted!"
2. **Visit admin panel** → See pending reviews
3. **Approve/Reject** → Updates everyone's localStorage
4. **Optional backup** → Export to SQLite locally

## 🔒 DATA PERSISTENCE & SECURITY

### Browser LocalStorage:
- **Persistent**: Survives browser restart
- **Isolated**: Each domain has separate storage
- **Secure**: Only your domain can access the data
- **Limit**: ~5-10MB (thousands of reviews)

### Discord Webhook:
- **Instant**: Real-time notifications
- **Reliable**: Discord's infrastructure
- **Secure**: Encoded URL in your code
- **Permanent**: Message history in Discord

### SQLite Backup:
- **Local only**: Your computer only
- **Exportable**: CSV, JSON formats
- **Searchable**: SQL queries
- **Portable**: Single file database

## 📊 STORAGE COMPARISON

| Storage Type | Location | Capacity | Persistence | Access |
|--------------|----------|----------|-------------|---------|
| LocalStorage | User's Browser | 5-10MB | Permanent* | Domain only |
| Discord | Discord Server | Unlimited | Permanent | You only |
| SQLite | Your Computer | Unlimited | Permanent | You only |

*Permanent unless user manually clears browser data

## 🔍 HOW TO VIEW STORED DATA

### View Browser LocalStorage:
```javascript
// In browser console (F12):
console.log(localStorage.getItem('editedframe_reviews'));
```

### View Discord History:
```
Visit your Discord server → Check webhook channel
```

### View SQLite Database:
```python
# Run on your computer:
python backup_reviews.py
# Creates: reviews_backup.db
```

## ⚠️ IMPORTANT NOTES

### Data Synchronization:
- **No central database** - each browser has its own copy
- **Admin approval** updates all browsers via localStorage
- **New visitors** get current approved reviews
- **Offline users** see reviews when they return online

### Privacy & GDPR:
- **No server storage** - data stays in browsers
- **User consent** - implied by form submission  
- **Data portability** - users can clear browser data
- **Admin control** - you control what gets approved

### Backup Strategy:
- **Primary**: Browser LocalStorage (automatic)
- **Notification**: Discord history (automatic)
- **Backup**: SQLite export (manual, your computer only)