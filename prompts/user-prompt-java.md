# 사용자용 프롬프트 템플릿 (Java - Corretto 11)

아래 프롬프트를 Kiro 채팅에 붙여넣고, [서비스 설명] 부분만 바꿔서 사용하세요.
Corretto 8도 사용 가능하지만, 신규 프로젝트는 Corretto 11을 권장합니다.

---

## 프롬프트

```
[서비스 설명]을 만들어줘.

조건:
- Java Spring Boot 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- Gradle 또는 Maven 빌드를 사용해줘
- apprunner.yaml의 runtime은 corretto11로 설정해줘
- 빌드 결과물(jar)을 java -jar로 실행해줘
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## 예시

```
간단한 REST API 서버를 만들어줘. /api/hello로 GET 요청하면 인사 메시지를 반환해줘.

조건:
- Java Spring Boot 기반으로 만들어줘
- 포트는 5000번을 사용해줘
- Gradle 빌드를 사용해줘
- apprunner.yaml의 runtime은 corretto11로 설정해줘
- 빌드 결과물(jar)을 java -jar로 실행해줘
- 개발이 완료되면 "git push로 배포할까요?" 라고 물어봐줘. 승인하면 git add, commit, push를 실행해줘
```

---

## apprunner.yaml 예시 (Corretto 11 + Gradle)

```yaml
version: 1.0
runtime: corretto11

build:
  commands:
    pre-build:
      - java --version
    build:
      - ./gradlew build -x test

run:
  command: java -jar build/libs/app.jar
  network:
    port: 5000
  env:
    - name: SERVER_PORT
      value: "5000"
```

## apprunner.yaml 예시 (Corretto 8)

```yaml
version: 1.0
runtime: corretto8

build:
  commands:
    pre-build:
      - java -version
    build:
      - ./gradlew build -x test

run:
  command: java -jar build/libs/app.jar
  network:
    port: 5000
  env:
    - name: SERVER_PORT
      value: "5000"
```

## 주의사항

- Corretto 8/11은 original build를 사용하므로 build 단계 설치가 런타임에 유지됨
- Python/Node.js와 달리 pre-run에서 설치할 필요 없음
- Spring Boot의 경우 application.properties에서 server.port=5000 설정 필요
