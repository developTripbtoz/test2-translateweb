# ============================================
# 범용 Dockerfile (Python / Node.js / Java 지원)
# 사용할 언어의 블록만 활성화하고 나머지는 주석 처리하세요
# ============================================

# --- Python 앱일 경우 (기본값) ---
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "300", "app:app"]

# --- Node.js 앱일 경우 ---
# 위 Python 블록 전체를 주석 처리하고 아래 주석을 해제하세요
# FROM node:22-slim
# WORKDIR /app
# COPY package*.json ./
# RUN npm install --production
# COPY . .
# EXPOSE 5000
# CMD ["node", "app.js"]

# --- Java (Corretto 11) 앱일 경우 ---
# 위 블록 전체를 주석 처리하고 아래 주석을 해제하세요
# FROM amazoncorretto:11
# WORKDIR /app
# COPY . .
# RUN ./gradlew build -x test
# EXPOSE 5000
# CMD ["java", "-jar", "build/libs/app.jar"]
