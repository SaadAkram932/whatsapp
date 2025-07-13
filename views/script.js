const socket = io();


const qrContainer = document.getElementById('qr-container');
const statusTitle = document.getElementById('status-title');
const messageForm = document.getElementById('message-form');

const sendBtn = document.getElementById('send-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

let isConnected = false;

socket.on('qr', (qrUrl) => {
    if (!isConnected) {
        qrContainer.innerHTML = `<img src="${qrUrl}" alt="Scan QR Code" />`;
        statusTitle.textContent = 'Scan QR Code to Login';
        messageForm.classList.add('hidden');
    }
});

socket.on('connected', () => {
    isConnected = true;
    qrContainer.innerHTML = '';
    statusTitle.textContent = 'Connected to WhatsApp';
    messageForm.classList.remove('hidden');
    disconnectBtn.classList.remove('hidden');
    sendBtn.disabled = false;
});

socket.on('disconnected', () => {
    isConnected = false;
    statusTitle.textContent = 'Wait for QR Code';
    messageForm.classList.add('hidden');
    disconnectBtn.classList.add('hidden');
     document.getElementById("message").value = "";
    sendBtn.disabled = true;
});


document.getElementById('send-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!isConnected) {
        document.getElementById('response').innerText = 'WhatsApp client not connected.';
        return;
    }
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!message) {
        document.getElementById('response').innerText = 'Please enter a message.';
        return;
    }
    if(!phoneNumber){
        document.getElementById('response').innerText = 'Please enter a Number.';
    }
    sendBtn.disabled = true;
    document.getElementById('response').innerText = 'Sending...';
    fetch('/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, phoneNumber})
    })
    .then(async res => {
        let data;
        try {
            data = await res.json();
        } catch (err) {
            document.getElementById('response').innerText = 'Invalid server response.';
            sendBtn.disabled = false;
            return;
        }
        if (res.ok && data.success) {
            document.getElementById('response').innerText = `Message sent to ${data.sent} numbers!`;
        } else if (res.status === 207 && data.failed) {
            document.getElementById('response').innerText = `Partial success: Sent to ${data.sent}, failed for ${data.failed.length} numbers.`;
        } else {
            document.getElementById('response').innerText = `Failed: ${data.error || 'Unknown error.'}`;
        }
        sendBtn.disabled = false;
    })
    .catch(err => {
        document.getElementById('response').innerText = 'Error sending message.';
        sendBtn.disabled = false;
    });
});

disconnectBtn.addEventListener("click", () => {
    fetch("/disconnect", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                location.reload(); // Or update UI accordingly
            } else {
                document.getElementById("response").innerText = "Failed to disconnect.";
            }
        })
        .catch(() => {
            document.getElementById("response").innerText = "Error disconnecting.";
        });
});