const API_KEY = "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";
const MODEL = "upstage/solar-pro-3:free"; 

// 1. Inisialisasi Memori & Elemen
let chatMemory = [
    { 
        role: "system", 
        content: "Nama kamu adalah Hadi AI. Kamu adalah asisten pribadi yang diciptakan oleh Hadi. Jawab selalu dalam Bahasa Indonesia yang santai dan akrab. Jangan kaku. Panggil penciptamu dengan nama Hadi." 
    }
];

const chatContainer = document.getElementById('chat-container');
const inputField = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const splash = document.getElementById('splash-screen');
const micBtn = document.getElementById('mic-btn');
const fileInput = document.getElementById('file-input');
const previewCont = document.getElementById('image-preview-container');

// Fungsi Helper untuk mengamankan teks kodingan agar tidak dieksekusi browser
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// 2. Logic Splash Screen
window.addEventListener('load', () => {
    setTimeout(() => { 
        if (splash) { 
            splash.classList.add('hidden'); 
            setTimeout(() => splash.remove(), 1000); 
        } 
    }, 2000);
});

// 3. Fitur Voice to Text (Mic)
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'id-ID';
    micBtn.onclick = () => { 
        recognition.start(); 
        micBtn.classList.add('active'); 
    };
    recognition.onresult = (e) => {
        inputField.value = e.results[0][0].transcript;
        micBtn.classList.remove('active');
    };
    recognition.onerror = () => micBtn.classList.remove('active');
}

// 4. Fitur Preview Foto
fileInput.onchange = function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('image-preview').src = e.target.result;
            previewCont.style.display = 'block';
        }
        reader.readAsDataURL(this.files[0]);
    }
};

function clearPreview() {
    fileInput.value = '';
    previewCont.style.display = 'none';
}

function resetChat() { 
    chatContainer.innerHTML = ''; 
    chatMemory = [
        { role: "system", content: "Nama kamu adalah Hadi AI, asisten pribadinya Hadi. Jawab dengan santai, gunakan Bahasa Indonesia, dan jangan kaku." }
    ]; 
}

// 5. Fungsi Render AI (Kodingan, Tabel, & Soal PG Ala Gemini)
function formatResponse(text) {
    // A. Render Blok Kode (Sudah ditambahkan escapeHTML)
    const codeRegex = /```(\w+)?([\s\S]*?)```/g;
    let formatted = text.replace(codeRegex, (match, lang, code) => {
        const language = lang || 'code';
        return `
            <div class="code-wrapper">
                <div class="code-header">
                    <span>${language}</span>
                    <button class="copy-btn" onclick="copyToClipboard(this)">Copy</button>
                </div>
                <pre><code>${escapeHTML(code.trim())}</code></pre>
            </div>`;
    });

    // B. Cek apakah ini format soal pilihan ganda
    const isQuestion = /^\s*\d+\./m.test(formatted) && /[A-E]\./.test(formatted);

    if (isQuestion) {
        formatted = formatted.replace(/\|/g, ' ').replace(/\-\-\-/g, '');
        formatted = formatted.replace(/([A-E]\.)/g, '\n$1');
        formatted = formatted.replace(/(\d+\.)/g, '\n\n$1');
    } else {
        // C. Render Tabel (Hanya jika bukan format soal)
        const tableRegex = /\|(.+)\|.*\n\|[\s\-\|]+\|\n((?:\|.+\|.*\n?)+)/g;
        formatted = formatted.replace(tableRegex, (match, headerLine, bodyLines) => {
            const header = headerLine.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
            const rows = bodyLines.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<div style="overflow-x:auto; margin: 15px 0;"><table class="chat-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
        });
    }

    // D. Bold & List Item
    formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*[\-\*]\s+(.*)$/gm, '<li>$1</li>');

    // E. Line Break Aman (Clean-up)
    return formatted.trim().split('\n').map(line => {
        // Jangan tambahkan <br> jika ada tag code atau tabel agar tidak berantakan
        if (line.includes('<div') || line.includes('<table') || line.includes('<tr') || line.includes('<thead') || line.includes('<tbody') || line.includes('<li') || line.includes('<pre')) {
            return line;
        }
        return line.trim() === '' ? '' : line + '<br>';
    }).join('');
}

function copyToClipboard(btn) {
    const code = btn.parentElement.nextElementSibling.innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.innerText = "Copied!";
        setTimeout(() => { btn.innerText = "Copy"; }, 2000);
    });
}

// 6. Fungsi Utama Kirim Pesan
async function sendChat() {
    const message = inputField.value.trim();
    const hasImage = fileInput.files.length > 0;

    if (!message && !hasImage) return;

    // Gunakan escapeHTML pada pesan user agar aman
    chatContainer.innerHTML += `<div class="msg-row user"><div class="bubble">${escapeHTML(message) || "*(Mengirim Gambar)*"}</div></div>`;
    
    if (message) {
        chatMemory.push({ role: "user", content: message });
        if (chatMemory.length > 50) chatMemory.shift();
    }

    inputField.value = '';
    const imageSent = hasImage;
    clearPreview();

    const aiMsgId = 'ai-' + Date.now();
    chatContainer.innerHTML += `
        <div class="msg-row ai" id="c-${aiMsgId}">
            <div class="gemini-loader" id="l-${aiMsgId}"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>
            <div id="${aiMsgId}" class="bubble" style="display:none"></div>
        </div>`;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    try {
        if (imageSent && !message) {
            document.getElementById(`l-${aiMsgId}`).remove();
            const aiBubble = document.getElementById(aiMsgId);
            aiBubble.style.display = 'block';
            aiBubble.innerHTML = "Wah, fotonya keren! Tapi Hadi AI baru bisa baca teks saja sekarang ya. 😊";
        } 
        else {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ "model": MODEL, "messages": chatMemory })
            });

            const data = await response.json();
            const loader = document.getElementById(`l-${aiMsgId}`);
            if(loader) loader.remove();

            const aiBubble = document.getElementById(aiMsgId);
            if (data.choices && data.choices[0]) {
                let aiText = data.choices[0].message.content;
                aiBubble.style.display = 'block';
                aiBubble.innerHTML = formatResponse(aiText);
                chatMemory.push({ role: "assistant", content: aiText });
            }
        }
    } catch (e) {
        const errorCont = document.getElementById(`c-${aiMsgId}`);
        if(errorCont) errorCont.innerHTML = '<div class="bubble" style="color:red">Koneksi terputus! Cek internet kamu, Hadi.</div>';
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

// 7. Event Listeners
sendBtn.onclick = sendChat;
inputField.onkeydown = (e) => { 
    if(e.key === 'Enter') { 
        e.preventDefault(); 
        sendChat(); 
    } 
};