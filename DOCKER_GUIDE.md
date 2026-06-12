# Docker 部署完整指南

## 📁 Docker 相关文件说明
## 开发环境
# 启动 -- 有些可能比较慢所以要去docker里手动启动
docker-compose -f docker-compose.dev.yml up -d

# 查看状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f

# 停止
docker-compose -f docker-compose.dev.yml down

## 生产环境
# 构建 JAR
./mvnw clean package -DskipTests

# 构建镜像
docker build -t video-ai:1.0.0 .

# 启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止
docker-compose down

## java后端启动应用
./mvnw spring-boot:run "-Dspring.profiles.active=dev"

## pg http://127.0.0.1:5050
登录：
用户名：admin@example.com
密码：admin

在services右键选registrar -> sever
general标签：
name - video_db_local

connection标签：
主机名/地址: postgres
端口: 5432
维护数据库: postgres
用户名: postgres
密码: zhx1314
保存密码: 勾选 ✓

这样就链接上了（创建好实体类 -> 运行application.java -> 打开这个网址就能看到数据表了）


