const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 5000;

// 파일 업로드 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'));
    }
  }
});

// Google Translate 비공식 API를 이용한 번역
function translateText(text) {
  return new Promise((resolve, reject) => {
    if (!text || !text.toString().trim()) {
      return resolve('');
    }
    const str = text.toString().trim();
    const encoded = encodeURIComponent(str);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=ko&dt=t&q=${encoded}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const translated = json[0].map(s => s[0]).join('');
          resolve(translated);
        } catch (e) {
          resolve(str); // 번역 실패 시 원문 반환
        }
      });
    }).on('error', () => resolve(str));
  });
}

// 딜레이 함수 (API 속도 제한 방지)
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// 메인 페이지
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>중국어 → 한국어 엑셀 번역기</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 16px; padding: 40px; max-width: 520px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; }
    h1 { font-size: 1.6rem; margin-bottom: 8px; color: #1a1a2e; }
    .subtitle { color: #666; margin-bottom: 28px; font-size: 0.95rem; }
    .upload-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px; cursor: pointer; transition: all 0.3s; margin-bottom: 20px; }
    .upload-area:hover { border-color: #3b82f6; background: #eff6ff; }
    .upload-area.dragover { border-color: #3b82f6; background: #dbeafe; }
    .upload-icon { font-size: 2.5rem; margin-bottom: 12px; }
    .upload-text { color: #64748b; font-size: 0.9rem; }
    .file-name { color: #3b82f6; font-weight: 600; margin-top: 8px; }
    input[type="file"] { display: none; }
    button { background: #3b82f6; color: white; border: none; padding: 14px 32px; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: background 0.3s; width: 100%; }
    button:hover { background: #2563eb; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    .progress { display: none; margin-top: 20px; }
    .progress-bar { background: #e2e8f0; border-radius: 8px; height: 8px; overflow: hidden; }
    .progress-fill { background: #3b82f6; height: 100%; width: 0%; transition: width 0.3s; border-radius: 8px; }
    .progress-text { color: #64748b; font-size: 0.85rem; margin-top: 8px; }
    .result { display: none; margin-top: 20px; padding: 16px; background: #f0fdf4; border-radius: 10px; }
    .result a { color: #16a34a; font-weight: 600; text-decoration: none; }
    .error { display: none; margin-top: 20px; padding: 16px; background: #fef2f2; border-radius: 10px; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🇨🇳 → 🇰🇷 엑셀 번역기</h1>
    <p class="subtitle">중국어 엑셀 파일을 업로드하면 한국어로 번역해드립니다</p>
    <form id="uploadForm" enctype="multipart/form-data">
      <div class="upload-area" id="dropZone">
        <div class="upload-icon">📄</div>
        <div class="upload-text">클릭하거나 파일을 드래그하세요</div>
        <div class="upload-text" style="font-size:0.8rem; margin-top:4px;">.xlsx, .xls 파일 지원 (최대 10MB)</div>
        <div class="file-name" id="fileName"></div>
      </div>
      <input type="file" id="fileInput" name="file" accept=".xlsx,.xls">
      <button type="submit" id="submitBtn" disabled>번역 시작</button>
    </form>
    <div class="progress" id="progress">
      <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      <div class="progress-text" id="progressText">번역 중...</div>
    </div>
    <div class="result" id="result">
      ✅ 번역 완료! <a id="downloadLink" href="#">번역된 파일 다운로드</a>
    </div>
    <div class="error" id="error"></div>
  </div>
  <script>
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('uploadForm');
    const progress = document.getElementById('progress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const result = document.getElementById('result');
    const error = document.getElementById('error');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateFileName();
      }
    });
    fileInput.addEventListener('change', updateFileName);

    function updateFileName() {
      if (fileInput.files.length) {
        fileName.textContent = fileInput.files[0].name;
        submitBtn.disabled = false;
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!fileInput.files.length) return;

      submitBtn.disabled = true;
      progress.style.display = 'block';
      result.style.display = 'none';
      error.style.display = 'none';
      progressFill.style.width = '20%';
      progressText.textContent = '파일 업로드 중...';

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        progressFill.style.width = '50%';
        progressText.textContent = '번역 중... (셀 수에 따라 시간이 걸릴 수 있습니다)';

        const res = await fetch('/translate', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '번역 실패');
        }

        progressFill.style.width = '90%';
        progressText.textContent = '파일 생성 중...';

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = '번역_' + fileInput.files[0].name;

        progressFill.style.width = '100%';
        progressText.textContent = '완료!';
        result.style.display = 'block';
      } catch (err) {
        error.textContent = '❌ ' + err.message;
        error.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
  `);
});

// 번역 API 엔드포인트
app.post('/translate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 없습니다.' });
    }

    // 엑셀 파일 읽기
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const newWorkbook = XLSX.utils.book_new();

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // 모든 셀의 텍스트를 수집
      const cells = [];
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
          const val = data[r][c];
          if (val && typeof val === 'string' && val.trim()) {
            cells.push({ r, c, text: val.trim() });
          }
        }
      }

      // 배치로 번역 (한 번에 하나씩, 딜레이 포함)
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        try {
          const translated = await translateText(cell.text);
          data[cell.r][cell.c] = translated;
        } catch (e) {
          // 번역 실패 시 원문 유지
        }
        // API 속도 제한 방지 (50ms 간격)
        if (i < cells.length - 1) await delay(50);
      }

      // 시트 이름도 번역
      let translatedSheetName = sheetName;
      try {
        translatedSheetName = await translateText(sheetName);
      } catch (e) {}

      const newSheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(newWorkbook, newSheet, translatedSheetName.substring(0, 31));
    }

    // 번역된 엑셀 파일 생성
    const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.xml');
    res.setHeader('Content-Disposition', 'attachment; filename="translated.xlsx"');
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('번역 오류:', err);
    res.status(500).json({ error: '번역 중 오류가 발생했습니다: ' + err.message });
  }
});

// 에러 핸들링
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 10MB를 초과합니다.' });
    }
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
});
