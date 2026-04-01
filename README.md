# Kiro 개발 & 배포 환경

비전공자도 Kiro로 웹 서비스를 만들고, `git push`만으로 배포할 수 있는 환경입니다.

## 지원 런타임

| 런타임 | 설정값 | 프롬프트 템플릿 |
|--------|--------|----------------|
| Python 3.11 | `python311` | `prompts/user-prompt-python.md` |
| Node.js 22 | `nodejs22` | `prompts/user-prompt-node.md` |
| Corretto 11 (Java) | `corretto11` | `prompts/user-prompt-java.md` |

## 구조

```
.
├── Dockerfile              # 앱 컨테이너 설정 (Python/Node.js/Java)
├── apprunner.yaml          # App Runner 빌드 & 실행 설정
├── scripts/
│   └── server-control.sh   # 서버 시작/중지 스크립트
├── infra/
│   ├── deploy-notification.yaml  # 배포 알림 (CloudFormation)
│   └── auto-shutdown.yaml        # 오후 8시 자동 중지 (CloudFormation)
├── prompts/                # 사용자용 프롬프트 템플릿
└── .kiro/hooks/            # Kiro 자동화 훅
```

## 배포 흐름

```
Kiro에서 앱 개발 → git push → App Runner 자동 빌드/배포 → 퍼블릭 URL로 확인
```

## 사용자 가이드

### 1단계: 앱 만들기
`prompts/` 폴더에서 사용할 언어의 템플릿을 참고해서 Kiro 채팅에 프롬프트를 입력하세요.

### 2단계: 배포
```bash
git add .
git commit -m "내 앱 배포"
git push
```
push하면 App Runner가 자동으로 빌드하고 배포합니다.

### 3단계: 서버 시작/중지
Kiro 채팅에서:
- **"서버 시작해줘"** → 서비스 시작 (Resume)
- **"서버 중지해줘"** → 서비스 중지 (Pause, 비용 절감)

또는 터미널에서:
```bash
./scripts/server-control.sh start
./scripts/server-control.sh stop
```

## 관리자 설정 가이드

### 1. 사용자 환경 만들기
1. 사용자별 GitHub 리포 생성 (이 템플릿을 fork 또는 복사)
2. AWS 콘솔에서 App Runner 서비스 생성
   - 소스: GitHub 리포 연결
   - 빌드 설정: "구성 파일 사용" 선택 (apprunner.yaml)
   - 자동 배포: 활성화
3. 사용자에게 리포 URL과 퍼블릭 도메인 전달

### 2. 서버 제어용 IAM 사용자 만들기
서버 시작/중지 전용 사용자를 만들고 아래 권한만 부여:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apprunner:PauseService",
                "apprunner:ResumeService",
                "apprunner:DescribeService",
                "apprunner:ListServices"
            ],
            "Resource": "*"
        }
    ]
}
```
발급받은 키를 `scripts/server-control.sh`에 입력하세요.

### 3. 배포 알림 설정 (이메일)
배포 시작/완료/실패 시 이메일 알림을 받을 수 있습니다.

1. `infra/deploy-notification.yaml`을 CloudShell에 업로드
2. CloudShell에서 실행:
```bash
aws cloudformation deploy --template-file deploy-notification.yaml --stack-name apprunner-deploy-notification --parameter-overrides SenderEmail=발신자이메일 --capabilities CAPABILITY_NAMED_IAM
```
3. SES 이메일 인증:
```bash
aws ses verify-email-identity --email-address 수신자이메일
```
4. DynamoDB에 서비스-이메일 매핑 등록:
```bash
aws dynamodb put-item --table-name apprunner-notification-config --item '{"ServiceArn":{"S":"서비스ARN"},"Email":{"S":"수신자이메일"}}'
```

알림 종류:
| 이벤트 | 메일 제목 | 내용 |
|--------|-----------|------|
| 배포 시작 | `[배포 시작] 서비스명` | 서비스 정보 |
| 배포 완료 | `[배포 완료] 서비스명` | 서비스 정보 + 로그 |
| 배포 실패 | `[배포 실패] 서비스명` | 서비스 정보 + 로그 |
| 서버 시작 완료 | `[서버 시작 완료] 서비스명` | 서비스 URL |
| 서버 중지 완료 | `[서버 중지 완료] 서비스명` | 비용 절감 안내 |

### 4. 오후 8시 자동 중지 설정
매일 오후 8시(KST)에 모든 App Runner 서비스를 자동 중지합니다.

1. `infra/auto-shutdown.yaml`을 CloudShell에 업로드
2. CloudShell에서 실행:
```bash
aws cloudformation deploy --template-file auto-shutdown.yaml --stack-name apprunner-auto-shutdown --capabilities CAPABILITY_NAMED_IAM
```

## 중요: revised build vs original build

| 런타임 | 빌드 방식 | 패키지 설치 위치 |
|--------|-----------|-----------------|
| Python 3.11 | revised | `run.pre-run` (필수) |
| Node.js 22 | revised | `run.pre-run` (필수) |
| Corretto 11 | original | `build.commands.build` (OK) |

Python 3.11, Node.js 22는 build 단계에서 설치한 패키지가 런타임에서 사라집니다.
반드시 `run.pre-run`에서 설치해야 합니다.

## 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `ModuleNotFoundError` | build에서 설치한 패키지가 런타임에 없음 | `run.pre-run`에서 설치 |
| `executable not found` | gunicorn 등이 PATH에 없음 | `run.pre-run`에서 설치 |
| `runtime version not supported` | 잘못된 런타임 값 | python311/nodejs22/corretto11 사용 |
| `Container exit code: 1` | 앱 시작 시 에러 | CloudWatch 로그 확인 |

## 비용 절약

- 오후 8시 자동 중지 설정 (auto-shutdown.yaml)
- Kiro에서 "서버 중지해줘"로 수동 중지
- 사용하지 않는 서비스는 App Runner에서 삭제
- 0.25 vCPU / 0.5 GB 최소 사양 권장
