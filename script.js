// ==========================================
// CONFIG MESIN GEMINI (OWNER: BELLA & HADI)
// ==========================================
const API_KEY = "AIzaSyCktn1c0GWy45BbdYSWII5DbMo86LWuXLQ";
const MODEL = "gemini-2.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Elemen UI
const terminal = document.getElementById('terminal');
const fill = document.getElementById('fill');
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// ==========================================
// 1. LOGIKA LOADING SCREEN (HACKER INTRO)
// ==========================================
const texts = ["INITIALIZING SYSTEM...", "LOADING NEURAL NETWORK...", "CONNECTING TO HADI AI...", "WELCOME HADI!!!", "READY!"];
let step = 0;

function runLoading() {
    if (step < texts.length) {
        terminal.innerText = texts[step];
        let progress = ((step + 1) / texts.length) * 100;
        fill.style.width = progress + "%";
        step++;
        setTimeout(runLoading, 700);
    } else {
        setTimeout(() => {
            loader.style.display = 'none';
            mainContent.style.display = 'flex';
        }, 500);
    }
}
runLoading();

// ==========================================
// 2. LOGIKA CHAT & MESIN AI
// ==========================================

async function askAI(pesan) {
    showTyping();
    try {
        const resp = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: pesan }] }] })
        });
        const data = await resp.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        
        removeTyping();
        renderResponse(textResponse);
    } catch (err) {
        removeTyping();
        renderResponse("Gagal koneksi ke mesin. Pastikan API Key benar atau kuota limit sudah habis.");
        console.error(err);
    }
}

// Fungsi Render Pesan dengan Fitur Salin Kode
function renderResponse(rawText) {
    const div = document.createElement('div');
    div.className = 'message ai-message';
    
    // Convert Markdown ke HTML
    div.innerHTML = marked.parse(rawText);

    // Tambahkan Tombol Salin di Setiap Blok Kode
    div.querySelectorAll('pre').forEach(pre => {
        const box = document.createElement('div');
        box.className = 'code-box';
        
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerText = 'Salin';
        
        // Logika Salin ke Keyboard (Clipboard)
        btn.onclick = () => {
            const codeText = pre.innerText; 
            navigator.clipboard.writeText(codeText).then(() => {
                // Efek visual sukses ala hacker
                btn.innerText = 'Tersalin!';
                btn.style.background = '#00ff41'; 
                btn.style.color = '#000';

                setTimeout(() => {
                    btn.innerText = 'Salin';
                    btn.style.background = '#222';
                    btn.style.color = '#eee';
                }, 2000);
            }).catch(err => {
                alert("Gagal menyalin. Pastikan menggunakan HTTPS atau Localhost.");
            });
        };    

        // Susun elemen
        pre.parentNode.insertBefore(box, pre);
        box.appendChild(btn);
        box.appendChild(pre);
    });

    chatContainer.appendChild(div);
    
    // Jalankan highlight kodingan
    div.querySelectorAll('pre code').forEach(c => hljs.highlightElement(c));
    
    // Auto-scroll ke bawah
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ==========================================
// 3. UI HELPER & EVENT LISTENERS
// ==========================================

function showTyping() {
    const t = document.createElement('div');
    t.id = 'typing-indicator';
    t.className = 'typing';
    t.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatContainer.appendChild(t);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeTyping() {
    const t = document.getElementById('typing-indicator');
    if(t) t.remove();
}

// Fungsi Kirim Pesan
function handleSend() {
    const m = userInput.value.trim();
    if(!m) return;

    // Tampilkan pesan user
    const uDiv = document.createElement('div');
    uDiv.className = 'message user-message';
    uDiv.innerText = m;
    chatContainer.appendChild(uDiv);
    
    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Tanya ke AI
    askAI(m);
}

sendBtn.onclick = handleSend;

// Support tombol Enter
userInput.onkeydown = (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
};

// Auto-expand textarea saat mengetik
userInput.oninput = function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
};
