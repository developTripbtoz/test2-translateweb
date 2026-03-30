const captureBtn = document.getElementById('captureBtn');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const result = document.getElementById('result');
const originalText = document.getElementById('originalText');
const translatedText = document.getElementById('translatedText');
const sourceLangSelect = document.getElementById('sourceLang');

// 단축키: Ctrl+Shift+X
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

async function startCapture() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' }
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        // 프레임 캡쳐 후 스트림 종료
        await new Promise(r => setTimeout(r, 300));
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        stream.getTracks().forEach(t => t.stop());

        // 크롭 UI 표시
        showCropOverlay(tempCanvas);
    } catch (err) {
        if (err.name !== 'AbortError') {
            alert('화면 캡쳐에 실패했습니다. 브라우저 권한을 확인해주세요.');
        }
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
    // 어두운 오버레이
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);

    overlay.style.display = 'block';
    selection.style.display = 'none';

    let startX, startY, dragging = false;

    function onMouseDown(e) {
        startX = e.clientX;
        startY = e.clientY;
        dragging = true;
        selection.style.display = 'block';
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        selection.style.width = '0px';
        selection.style.height = '0px';
    }

    function onMouseMove(e) {
        if (!dragging) return;
        const x = Math.min(e.clientX, startX);
        const y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);
        selection.style.left = x + 'px';
        selection.style.top = y + 'px';
        selection.style.width = w + 'px';
        selection.style.height = h + 'px';
    }

    function onMouseUp(e) {
        if (!dragging) return;
        dragging = false;

        const x = Math.min(e.clientX, startX);
        const y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);

        overlay.style.display = 'none';
        overlay.removeEventListener('mousedown', onMouseDown);
        overlay.removeEventListener('mousemove', onMouseMove);
        overlay.removeEventListener('mouseup', onMouseUp);

        if (w < 10 || h < 10) return;

        // 원본 비율로 크롭
        const scaleX = sourceCanvas.width / window.innerWidth;
        const scaleY = sourceCanvas.height / window.innerHeight;

        const cropCanvas2 = document.createElement('canvas');
        cropCanvas2.width = w * scaleX;
        cropCanvas2.height = h * scaleY;
        cropCanvas2.getContext('2d').drawImage(
            sourceCanvas,
            x * scaleX, y * scaleY, w * scaleX, h * scaleY,
            0, 0, cropCanvas2.width, cropCanvas2.height
        );

        canvas.width = cropCanvas2.width;
        canvas.height = cropCanvas2.height;
        canvas.getContext('2d').drawImage(cropCanvas2, 0, 0);
        preview.style.display = 'block';
        processImage(canvas);
    }

    overlay.addEventListener('mousedown', onMouseDown);
    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);
}


// OCR 언어 매핑
function getOcrLang(lang) {
    const map = {
        'auto': 'eng+jpn+chi_sim+kor',
        'en': 'eng',
        'ja': 'jpn',
        'zh-CN': 'chi_sim',
        'zh-TW': 'chi_tra',
        'fr': 'fra',
        'de': 'deu',
        'es': 'spa',
        'pt': 'por',
        'ru': 'rus',
        'vi': 'vie',
        'th': 'tha'
    };
    return map[lang] || 'eng';
}

async function processImage(canvasEl) {
    loading.style.display = 'block';
    loadingText.textContent = '텍스트 인식 중... (처음엔 모델 다운로드로 시간이 걸릴 수 있습니다)';
    result.style.display = 'none';

    const sourceLang = sourceLangSelect.value;
    const ocrLang = getOcrLang(sourceLang);

    try {
        const { data: { text } } = await Tesseract.recognize(canvasEl, ocrLang, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    const pct = Math.round((m.progress || 0) * 100);
                    loadingText.textContent = `텍스트 인식 중... ${pct}%`;
                }
            }
        });

        const cleaned = text.trim();
        if (!cleaned) {
            loading.style.display = 'none';
            alert('이미지에서 텍스트를 인식하지 못했습니다. 더 선명한 이미지를 사용해주세요.');
            return;
        }

        originalText.textContent = cleaned;
        loadingText.textContent = '한국어로 번역 중...';

        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleaned, sourceLang: sourceLang })
        });

        const data = await res.json();

        loading.style.display = 'none';
        result.style.display = 'block';

        if (data.error) {
            translatedText.textContent = '번역 오류: ' + data.error;
        } else {
            translatedText.textContent = data.translated;
        }
    } catch (err) {
        loading.style.display = 'none';
        alert('처리 중 오류가 발생했습니다: ' + err.message);
    }
}
