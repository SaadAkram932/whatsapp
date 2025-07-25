const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});
const PORT = process.env.PORT || 3000;

// Setup Express
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Parse application/x-www-form-urlencoded (for HTML form submissions)
app.use(express.urlencoded({ extended: true }));

// Parse JSON if you're sending JSON via fetch or axios
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'views')));

// Route to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
function newClient(){


client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        io.emit('qr', url); // send to all connected clients
        console.log('QR sent!');
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
io.emit("connected");

});
client.initialize();
}
newClient();
app.post('/disconnect', async (req, res) => {
    try {
        await client.destroy(); 
        io.emit("disconnected");
        io.emit('qr', ''); // Clear QR on all clients
        
        newClient();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Failed to disconnect' });
    }
});

app.post('/send-message', async (req, res) => {

    if (!req.body.message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }
  if (!req.body.phoneNumber) {
        return res.status(400).json({ success: false, error: 'Number is required' });
    }

   let numberx = await req.body.phoneNumber.split(',').map(num => num.trim()).filter(num => num !== '').map(Number);
console.log(req.body.message);
    try {
        if (!client.info || !client.info.wid) {
            return res.status(503).json({ success: false, error: 'WhatsApp client not connected' });
        }
        let sent = 0;
        let failed = [];
        for (const number of numberx) {
            const chatId = `${number}@c.us`;
            try {
                await client.sendMessage(chatId, req.body.message);
                sent++;
            } catch (err) {
                failed.push({ number, error: err.message });
            }
        }
        if (failed.length === 0) {
            res.json({ success: true, sent });
        } else {
            res.status(207).json({ success: false, sent, failed });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
});


server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});