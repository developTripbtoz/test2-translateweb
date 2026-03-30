# 사용자용 프롬프트 템플릿 (Python 3.11)

아래 프롬프트를 Kiro 채팅에 붙여넣고, [서비스 설명] 부분만 바꿔서 사용하세요.

---

## 프롬프트

```
[서비스 설명]을 만들어줘.

조건:
- Python Flask 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- app.py를 진입점으로 해줘
- requirements.txt에 gunicorn도 포함해줘
- apprunner.yaml의 runtime은 python311로 설정해줘
- pip install은 반드시 run.pre-run에서 실행해줘 (build 단계에서 하면 런타임에서 패키지를 못 찾음)
- gunicorn으로 실행해줘: gunicorn --bind 0.0.0.0:5000 --timeout 300 app:app
- render_template 대신 HTML 문자열 직접 반환 방식을 사용해줘
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## 예시

```
할 일 관리 웹앱을 만들어줘. 할 일을 추가, 완료, 삭제할 수 있고 깔끔한 UI가 있으면 좋겠어.

조건:
- Python Flask 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- app.py를 진입점으로 해줘
- requirements.txt에 gunicorn도 포함해줘
- apprunner.yaml의 runtime은 python311로 설정해줘
- pip install은 반드시 run.pre-run에서 실행해줘 (build 단계에서 하면 런타임에서 패키지를 못 찾음)
- gunicorn으로 실행해줘: gunicorn --bind 0.0.0.0:5000 --timeout 300 app:app
- render_template 대신 HTML 문자열 직접 반환 방식을 사용해줘
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## apprunner.yaml 예시

```yaml
version: 1.0
runtime: python311

build:
  commands:
    pre-build:
      - python3 --version

run:
  pre-run:
    - pip3 install --upgrade pip
    - pip3 install -r requirements.txt
  command: gunicorn --bind 0.0.0.0:5000 --timeout 300 app:app
  network:
    port: 5000
```

## 주의사항

- python311은 revised build를 사용하므로 build 단계 설치가 런타임에 유지되지 않음
- 반드시 `run.pre-run`에서 pip install 실행
- gunicorn 사용 권장 (Flask 개발 서버는 프로덕션에 부적합)
