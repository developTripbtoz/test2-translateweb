# 사용자용 프롬프트 템플릿 (Node.js 22)

아래 프롬프트를 Kiro 채팅에 붙여넣고, [서비스 설명] 부분만 바꿔서 사용하세요.

---

## 프롬프트

```
[서비스 설명]을 만들어줘.

조건:
- Node.js Express 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- app.js를 진입점으로 해줘
- package.json도 만들어줘
- apprunner.yaml의 runtime은 nodejs22로 설정해줘
- npm install은 반드시 run.pre-run에서 실행해줘 (build 단계에서 하면 런타임에서 모듈을 못 찾음)
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## 예시

```
실시간 채팅 웹앱을 만들어줘. 닉네임을 입력하고 채팅방에 들어가서 메시지를 주고받을 수 있으면 좋겠어.

조건:
- Node.js Express 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- app.js를 진입점으로 해줘
- package.json도 만들어줘
- apprunner.yaml의 runtime은 nodejs22로 설정해줘
- npm install은 반드시 run.pre-run에서 실행해줘
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## apprunner.yaml 예시

```yaml
version: 1.0
runtime: nodejs22

build:
  commands:
    pre-build:
      - node --version

run:
  pre-run:
    - npm install
  command: node app.js
  network:
    port: 5000
```

## 주의사항

- nodejs22는 revised build를 사용하므로 build 단계 설치가 런타임에 유지되지 않음
- 반드시 `run.pre-run`에서 npm install 실행
- Node.js 12, 14, 16, 18은 2025년 12월 1일부로 지원 종료
