# Kiro 개발 & 배포 환경

비전공자도 Kiro로 웹 서비스를 만들고, `git push`만으로 퍼블릭에 배포할 수 있는 환경입니다.

## 지원 런타임

| 런타임 | 설정값 | 프롬프트 템플릿 |
|--------|--------|----------------|
| Python 3.11 | `python311` | `prompts/user-prompt-python.md` |
| Node.js 22 | `nodejs22` | `prompts/user-prompt-node.md` |
| Corretto 11 (Java) | `corretto11` | `prompts/user-prompt-java.md` |
| Corretto 8 (Java) | `corretto8` | `prompts/user-prompt-java.md` |

## 구조

```
.
├── Dockerfile              # 앱 컨테이너 설정 (Python/Node.js/Java)
├── apprunner.yaml          # App Runner 빌드 & 실행 설정 (런타임별 예시 포함)
├── .kiro/steering/         # Kiro 자동 가이드
└── prompts/                # 사용자용 프롬프트 템플릿
    ├── user-prompt-python.md
    ├── user-prompt-node.md
    └── user-prompt-java.md
```

## 배포 흐름

```
Kiro에서 앱 개발 → git push → App Runner 자동 빌드/배포 → 퍼블릭 URL로 확인
```

## 관리자: 사용자 환경 만들기

1. 사용자별 GitHub 리포 생성 (이 템플릿을 fork 또는 복사)
2. AWS 콘솔에서 App Runner 서비스 생성
   - 소스: GitHub 리포 연결
   - 빌드 설정: "구성 파일 사용" 선택 (apprunner.yaml)
   - 자동 배포: 활성화
3. 사용자에게 리포 URL과 퍼블릭 도메인 전달

## 사용자: 개발 & 배포

### 1단계: Kiro에서 앱 만들기
`prompts/` 폴더에서 사용할 언어의 템플릿을 참고해서 Kiro 채팅에 프롬프트를 입력하세요.

### 2단계: 배포
```bash
git add .
git commit -m "내 앱 배포"
git push
```

push하면 App Runner가 자동으로 빌드하고 배포합니다.

## 중요: revised build vs original build

| 런타임 | 빌드 방식 | 패키지 설치 위치 |
|--------|-----------|-----------------|
| Python 3.11 | revised | `run.pre-run` (필수) |
| Node.js 22 | revised | `run.pre-run` (필수) |
| Corretto 8 | original | `build.commands.build` (OK) |
| Corretto 11 | original | `build.commands.build` (OK) |

Python 3.11, Node.js 22는 build 단계에서 설치한 패키지가 런타임에서 사라집니다.
반드시 `run.pre-run`에서 설치해야 합니다.

## 자주 발생하는 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| `ModuleNotFoundError` | build에서 설치한 패키지가 런타임에 없음 | `run.pre-run`에서 설치 |
| `executable not found` | gunicorn 등이 PATH에 없음 | `run.pre-run`에서 설치 |
| `runtime version not supported` | 잘못된 런타임 값 | python311/nodejs22/corretto8/corretto11 사용 |
| `Container exit code: 1` | 앱 시작 시 에러 | CloudWatch 로그 확인 |

## 비용 절약

- App Runner 최소 인스턴스를 0으로 설정하면 트래픽 없을 때 자동 중지
- 0.25 vCPU / 0.5 GB 최소 사양 권장
- 사용하지 않는 서비스는 App Runner에서 삭제
