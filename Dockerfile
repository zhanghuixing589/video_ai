FROM eclipse-temurin:17-jre-alpine

# 设置工作目录
WORKDIR /app

# 创建日志目录
RUN mkdir -p /app/logs

# 安装基础工具（Alpine 使用 apk）
RUN apk add --no-cache curl ca-certificates ffmpeg

# 复制 JAR 文件
ARG JAR_FILE=target/video_ai-0.0.1.jar
COPY ${JAR_FILE} app.jar

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", \
    "-server", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:InitiatingHeapOccupancyPercent=35", \
    "-Xms512m", \
    "-Xmx1024m", \
    "-Dfile.encoding=UTF-8", \
    "-Duser.timezone=Asia/Shanghai", \
    "-jar", \
    "app.jar"]
