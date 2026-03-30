FROM amazoncorretto:11
WORKDIR /app
COPY . .
RUN ./gradlew build -x test
EXPOSE 5000
CMD ["java", "-jar", "build/libs/app.jar"]
