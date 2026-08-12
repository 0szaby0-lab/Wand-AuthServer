require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static admin files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Database Schema (Subscription)
const SubscriptionSchema = new mongoose.Schema({
    hwid: { type: String, required: true, unique: true },
    userName: String,
    machineName: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }, // The timestamp when it expires
    isActive: { type: Boolean, default: true } // Killswitch toggle
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

// ---------------------------
// 1. Client Auth API
// ---------------------------
app.post('/api/auth', async (req, res) => {
    try {
        const { hwid, userName, machineName } = req.body;
        
        if (!hwid) {
            return res.json({ authorized: false, message: 'Hibás kliens, a HWID hiányzik!' });
        }

        const sub = await Subscription.findOne({ hwid });

        if (!sub) {
            return res.json({ authorized: false, message: 'Nincs előfizetésed ehhez a számítógéphez!' });
        }

        if (!sub.isActive) {
            return res.json({ authorized: false, message: 'Az adminisztrátor visszavonta a hozzáférésed!' });
        }

        if (new Date() > sub.expiresAt) {
            sub.isActive = false; // Auto-deactivate
            await sub.save();
            return res.json({ authorized: false, message: 'Az előfizetésed lejárt! Kérlek hosszabbíts!' });
        }

        // Auto update their username just in case they changed it
        sub.userName = userName;
        sub.machineName = machineName;
        await sub.save();

        return res.json({ authorized: true, message: 'Sikeres azonosítás.' });

    } catch (err) {
        console.error(err);
        return res.json({ authorized: false, message: 'Szerver hiba az azonosítás során.' });
    }
});

// ---------------------------
// 2. Admin API
// ---------------------------
// A very simple hardcoded password check for the admin panel API (for your safety)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secret-wand-admin-password';

const checkAdmin = (req, res, next) => {
    const pwd = req.headers['x-admin-password'];
    if (pwd === ADMIN_PASSWORD) return next();
    return res.status(401).json({ error: 'Hibás admin jelszó!' });
};

// Get all subscriptions
app.get('/api/admin/subs', checkAdmin, async (req, res) => {
    const subs = await Subscription.find().sort({ createdAt: -1 });
    res.json(subs);
});

// Add or Extend Subscription
app.post('/api/admin/subs', checkAdmin, async (req, res) => {
    const { hwid, daysToAdd, userName, machineName } = req.body;
    
    let sub = await Subscription.findOne({ hwid });
    
    const additionalMs = daysToAdd * 24 * 60 * 60 * 1000;
    
    if (sub) {
        // Extend existing
        let currentExpiry = sub.expiresAt.getTime();
        // If it was already expired, start counting from today instead of from the past
        if (currentExpiry < Date.now()) currentExpiry = Date.now();
        
        sub.expiresAt = new Date(currentExpiry + additionalMs);
        sub.isActive = true; // Make sure it's active again
    } else {
        // Create new
        sub = new Subscription({
            hwid,
            userName,
            machineName,
            expiresAt: new Date(Date.now() + additionalMs),
            isActive: true
        });
    }

    await sub.save();
    res.json(sub);
});

// Toggle / Revoke (Killswitch)
app.put('/api/admin/subs/:id/toggle', checkAdmin, async (req, res) => {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    
    sub.isActive = !sub.isActive;
    await sub.save();
    res.json(sub);
});

// Delete Subscription completely
app.delete('/api/admin/subs/:id', checkAdmin, async (req, res) => {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


// Fallback to admin UI
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Wand Elite Auth Server fut ezen a porton: ${PORT}`);
});
