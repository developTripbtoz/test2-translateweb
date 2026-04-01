#!/bin/bash
# App Runner 서비스 시작/중지 스크립트
# 사용법: ./scripts/server-control.sh start|stop
#
# [설정 방법]
# 1. .env.example을 .env로 복사: cp .env.example .env
# 2. .env에 관리자에게 받은 키와 서비스 ARN을 입력하세요
# 3. .env는 .gitignore에 포함되어 GitHub에 올라가지 않습니다

# .env 파일 로드
SCRIPT_DIR="$(dirname "$0")"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "오류: .env 파일이 없습니다."
    echo "  cp .env.example .env 로 파일을 만들고 키를 입력하세요."
    exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

ACTION=$1

if [ "$ACTION" = "start" ]; then
    echo "서비스 시작 중..."
    aws apprunner resume-service --service-arn "$SERVICE_ARN"
    echo "Resume 요청 완료. 몇 분 후 서비스가 활성화됩니다."
elif [ "$ACTION" = "stop" ]; then
    echo "서비스 중지 중..."
    aws apprunner pause-service --service-arn "$SERVICE_ARN"
    echo "Pause 요청 완료."
else
    echo "사용법: $0 start|stop"
    exit 1
fi
