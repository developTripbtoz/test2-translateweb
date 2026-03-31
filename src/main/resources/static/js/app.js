// 탭 전환
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');
    });
});

const inputText = document.getElementById('inputText');
const translateBtn = document.getElementById('translateBtn');
const captureBtn = document.getElementById('captureBtn');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const result = document.getElementById('result');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const sourceLang = document.getElementById('sourceLang');

// 텍스트 번역 (메인 기능)
translateBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if (!text) return;
    doTranslate(text);
});

// Ctrl+Enter로도 번역
inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        translateBtn.click();
    }
});

// Ctrl+Shift+X 화면 캡쳐
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        startCapture();
    }
});

captureBtn.addEventListener('click', startCapture);

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        preview.style.display = 'block';
        processImage(canvas);
    };
    img.src = URL.createObjectURL(file);
});

async function doTranslate(text) {
    loading.style.display = 'block';
    loadingText.textContent = '번역 중...';
    result.style.display = 'none';

    try {
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, sourceLang: sourceLang.value })
        });
        const data = await res.json();
        loading.style.display = 'none';
        result.style.display = 'block';
        originalText.textContent = text;
        translatedText.textContent = data.error ? '오류: ' + data.error : data.translated;
    } catch (err) {
        loading.style.display = 'none';
        alert('번역 실패: ' + err.message);
    }
}


// 화면 캡쳐
async function startCapture() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        await new Promise(r => setTimeout(r, 300));

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        stream.getTracks().forEach(t => t.stop());

        showCropOverlay(tempCanvas);
    } catch (err) {
        if (err.name !== 'AbortError') alert('화면 캡쳐 실패. 브라우저 권한을 확인하세요.');
    }
}

function showCropOverlay(sourceCanvas) {
    const overlay = document.getElementById('cropOverlay');
    const cropCanvas = document.getElementById('cropCanvas');
    const selection = document.getElementById('selection');

    cropCanvas.width = window.innerWidth;
    cropCanvas.height = window.innerHeight;
    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

    overlay.style.display = 'block';
    selection.style.display = 'none';

    let startX, startY, dragging = false;

    function onDown(e) {
        startX = e.clientX; startY = e.clientY; dragging = true;
        selection.style.display = 'block';
        Object.assign(selection.style, { left: startX+'px', top: startY+'px', width: '0', height: '0' });
    }
    function onMove(e) {
        if (!dragging) return;
        const x = Math.min(e.clientX, startX), y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX), h = Math.abs(e.clientY - startY);
        Object.assign(selection.style, { left: x+'px', top: y+'px', width: w+'px', height: h+'px' });
    }
    function onUp(e) {
        if (!dragging) return;
        dragging = false;
        const x = Math.min(e.clientX, startX), y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX), h = Math.abs(e.clientY - startY);
        overlay.style.display = 'none';
        overlay.removeEventListener('mousedown', onDown);
        overlay.removeEventListener('mousemove', onMove);
        overlay.removeEventListener('mouseup', onUp);
        if (w < 10 || h < 10) return;

        const sx = sourceCanvas.width / window.innerWidth;
        const sy = sourceCanvas.height / window.innerHeight;
        const crop = document.createElement('canvas');
        crop.width = w * sx; crop.height = h * sy;
        crop.getContext('2d').drawImage(sourceCanvas, x*sx, y*sy, w*sx, h*sy, 0, 0, crop.width, crop.height);

        canvas.width = crop.width; canvas.height = crop.height;
        canvas.getContext('2d').drawImage(crop, 0, 0);
        preview.style.display = 'block';
        processImage(canvas);
    }

    overlay.addEventListener('mousedown', onDown);
    overlay.addEventListener('mousemove', onMove);
    overlay.addEventListener('mouseup', onUp);
}

// OCR 언어 매핑
function getOcrLang(lang) {
    const map = { 'auto':'eng+jpn+chi_sim', 'en':'eng', 'ja':'jpn', 'zh-CN':'chi_sim',
        'zh-TW':'chi_tra', 'fr':'fra', 'de':'deu', 'es':'spa', 'ru':'rus', 'vi':'vie', 'th':'tha' };
    return map[lang] || 'eng';
}

async function processImage(canvasEl) {
    loading.style.display = 'block';
    loadingText.textContent = '텍스트 인식 중...';
    result.style.display = 'none';

    try {
        const { data: { text } } = await Tesseract.recognize(canvasEl, getOcrLang(sourceLang.value), {
            logger: m => {
                if (m.status === 'recognizing text')
                    loadingText.textContent = '텍스트 인식 중... ' + Math.round((m.progress||0)*100) + '%';
            }
        });
        const cleaned = text.trim();
        if (!cleaned) { loading.style.display = 'none'; alert('텍스트를 인식하지 못했습니다.'); return; }
        loadingText.textContent = '번역 중...';
        doTranslate(cleaned);
    } catch (err) {
        loading.style.display = 'none';
        alert('OCR 실패: ' + err.message);
    }
}
