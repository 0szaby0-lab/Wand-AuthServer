require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load allowed identities from an environment variable, separated by commas.
// E.g., ALLOWED_USERS="Szaby-PC\\Szaby,LO-PC\\LO,test-pc\\testuser"
const allowedUsersEnv = process.env.ALLOWED_USERS || "";
const allowedUsers = allowedUsersEnv.split(',').map(u => u.trim().toLowerCase()).filter(u => u.length > 0);

// Global killswitch, if set to "false", no one can run it.
const globalKillswitch = process.env.IS_RUNNING_ALLOWED !== "false";

// A simple GET endpoint so you can keep the server awake with UptimeRobot
app.get('/', (req, res) => {
    res.send('Wand Auth Server is awake and running! 🚀');
});

// A friendly message if someone opens the auth link in a browser
app.get('/api/auth', (req, res) => {
    res.send('This endpoint is for the Wand Enhancer app. (Only POST requests are accepted)');
});

app.post('/api/auth', (req, res) => {
    const { machineName, userName } = req.body;

    console.log(`Received auth request from: Machine=${machineName}, User=${userName}`);

    if (!machineName || !userName) {
        return res.status(400).json({ authorized: false, message: "Missing machineName or userName." });
    }

    if (!globalKillswitch) {
        console.log("Access denied: Global killswitch is active.");
        return res.json({ authorized: false, message: "A szerver jelenleg le van állítva." });
    }

    const identity = `${machineName}\\${userName}`.toLowerCase();

    // If allowedUsers array is empty, we allow everyone (or you can change it to deny everyone).
    // Let's deny if the list is empty to be secure.
    if (allowedUsers.length === 0) {
        console.log("No allowed users configured. Denying access.");
        return res.json({ authorized: false, message: `Nincs senki engedélyezve a szerveren.\n\nAz azonosítód: ${identity}` });
    }

    if (allowedUsers.includes(identity)) {
        console.log(`Access granted to: ${identity}`);
        return res.json({ authorized: true, message: "Welcome!" });
    } else {
        console.log(`Access denied to: ${identity}`);
        return res.json({ authorized: false, message: `Nincs engedélyed a futtatáshoz!\n\nAz azonosítód: ${identity}` });
    }
});

app.listen(PORT, () => {
    console.log(`Wand Auth Server is running on port ${PORT}`);
    console.log(`Allowed users:`, allowedUsers.length > 0 ? allowedUsers : "NONE - PLEASE SET ALLOWED_USERS ENV VARIABLE");
});
