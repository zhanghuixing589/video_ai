# 视频 AI 平台

一个类似腾讯视频的视频流媒体平台，集成 AI 功能，包括个性化推荐、智能搜索、自动字幕等。

## 项目架构

```
┌─────────────────┐
│   React 前端    │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Java    │
    │Spring   │────────────┐
    │Boot     │            │
    │主服务   │            │
    └─────────┘            │
         │                 │
    ┌────▼────┐       ┌────▼─────────┐
    │PostgreSQL       │  Python FastAPI│
    │+ Redis  │       │  AI 微服务     │
    └─────────┘       │ (推荐/搜索等)  │
                      └────────────────┘
```

## 技术栈

### 前端
- React 18+
- TypeScript
- Axios
- Ant Design

### 后端（主服务）
- Java 17+
- Spring Boot 3.x
- Spring Data JPA
- Spring Security
- Maven

### AI 微服务
- Python 3.10+
- FastAPI
- LangChain
- OpenAI API / 开源模型

### 数据库
- PostgreSQL 15
- Redis 7

### 部署
- Docker & Docker Compose

## 项目结构

```
video_ai/
├── .idea/                       # IDEA 配置
├── .mvn/                        # Maven Wrapper
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── org/example/video_ai/
│   │   │       ├── VideoAiApplication.java      # Spring Boot 入口
│   │   │       ├── entity/                      # JPA 实体类
│   │   │       │   ├── Video.java               # 视频实体
│   │   │       │   ├── User.java                # 用户实体
│   │   │       │   └── Comment.java             # 评论实体
│   │   │       ├── repository/                  # 数据访问层
│   │   │       │   ├── VideoRepository.java
│   │   │       │   ├── UserRepository.java
│   │   │       │   └── CommentRepository.java
│   │   │       ├── service/                     # 业务逻辑层
│   │   │       │   ├── VideoService.java
│   │   │       │   ├── UserService.java
│   │   │       │   └── CommentService.java
│   │   │       ├── controller/                  # REST 控制层
│   │   │       │   ├── VideoController.java
│   │   │       │   ├── UserController.java
│   │   │       │   └── CommentController.java
│   │   │       ├── dto/                         # 数据传输对象
│   │   │       │   ├── VideoDTO.java
│   │   │       │   ├── UserDTO.java
│   │   │       │   ├── ApiResponse.java
│   │   │       │   └── CommentDTO.java
│   │   │       ├── config/                      # Spring 配置类
│   │   │       │   ├── CorsConfig.java          # CORS 配置
│   │   │       │   ├── SwaggerConfig.java       # Swagger 配置
│   │   │       │   └── SecurityConfig.java      # 安全配置
│   │   │       ├── util/                        # 工具类
│   │   │       │   ├── JwtUtil.java
│   │   │       │   └── ResponseUtil.java
│   │   │       └── exception/                   # 异常处理
│   │   │           └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.yml                  # 主配置文件
│   │       ├── application-dev.yml              # 开发环境配置
│   │       ├── application-prod.yml             # 生产环境配置
│   │       └── db/
│   │           └── migration/                   # 数据库迁移脚本（可选）
│   └── test/
│       └── java/
│           └── org/example/video_ai/
│               ├── service/
│               ├── controller/
│               └── VideoAiApplicationTests.java
├── .mvn/                        # Maven 配置
├── mvnw                         # Maven Wrapper 脚本
├── mvnw.cmd                     # Maven Wrapper 脚本（Windows）
├── pom.xml                      # Maven 依赖配置
├── Dockerfile                   # Docker 镜像配置
├── .gitignore                   # Git 忽略配置
├── README.md                    # 项目说明
└── HELP.md                      # Spring Boot 帮助文档

## 前端项目结构（单独仓库）
```
frontend/
├── src/
│   ├── components/              # 组件库
│   ├── pages/                   # 页面
│   ├── services/                # API 服务
│   ├── store/                   # 状态管理
│   ├── styles/                  # 样式
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── Dockerfile
```

## AI 微服务项目结构（单独仓库）
```
ai-service/
├── app/
│   ├── main.py                  # FastAPI 主应用
│   ├── models/                  # 数据模型
│   ├── services/                # AI 服务
│   ├── routes/                  # API 路由
│   └── config.py                # 配置
├── requirements.txt             # Python 依赖
├── Dockerfile                   # Docker 镜像
├── .env.example                 # 环境变量示例
└── .gitignore
```

## 快速开始

### 前置要求
- Java 17+
- Maven 3.8+
- Docker & Docker Compose（可选）
- PostgreSQL 15（如果不使用 Docker）
- Redis 7（如果不使用 Docker）

### 1. 启动数据库和缓存（Docker）

```bash
docker-compose up -d postgres redis
```

### 2. 构建项目

```bash
# 使用 Maven Wrapper（推荐）
./mvnw clean install

# 或使用本地 Maven
mvn clean install
```

### 3. 运行应用

```bash
# 使用 Maven 运行
./mvnw spring-boot:run

# 或打包后运行
./mvnw clean package
java -jar target/video-ai-1.0.0.jar
```

### 4. 访问应用

- 主应用：http://localhost:8080
- Swagger API 文档：http://localhost:8080/api/swagger-ui.html
- Swagger API JSON：http://localhost:8080/api/v3/api-docs

## 环境配置

### application.yml

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/video_db
    username: postgres
    password: zhx1314
  
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  
  redis:
    host: localhost
    port: 6379

server:
  port: 8080
  servlet:
    context-path: /api
```

## API 端点

### 视频相关
- `GET /api/videos` - 获取所有视频
- `GET /api/videos/{id}` - 获取视频详情
- `POST /api/videos` - 创建视频
- `PUT /api/videos/{id}` - 更新视频
- `DELETE /api/videos/{id}` - 删除视频
- `GET /api/videos/search` - 搜索视频
- `GET /api/videos/popular` - 获取热门视频
- `GET /api/videos/top-rated` - 获取高评分视频

### 用户相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/users/{id}` - 获取用户信息
- `PUT /api/users/{id}` - 更新用户信息

### 评论相关
- `POST /api/comments` - 发表评论
- `GET /api/videos/{videoId}/comments` - 获取视频评论
- `DELETE /api/comments/{id}` - 删除评论

## 核心功能

### 第一阶段（已完成）
- [x] 项目结构搭建
- [x] 视频 CRUD 操作
- [ ] 用户认证和授权

### 第二阶段（开发中）
- [ ] 用户系统完整实现
- [ ] 评论系统
- [ ] 视频搜索功能

### 第三阶段（计划中）
- [ ] AI 个性化推荐
- [ ] 智能搜索（语义搜索）
- [ ] 自动字幕生成
- [ ] 视频分类和标签

### 后续功能
- [ ] 观看历史
- [ ] 收藏夹
- [ ] 社交功能（关注、点赞等）
- [ ] 实时通知

## Docker 部署

### 构建镜像

```bash
./mvnw clean package
docker build -t video-ai:1.0.0 .
```

### 运行容器

```bash
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/video_db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=zhx1314 \
  -e SPRING_REDIS_HOST=redis \
  video-ai:1.0.0
```

### 使用 Docker Compose

```bash
docker-compose up -d
```

## 开发规范

### Java 编码规范
- 类名：PascalCase（如 VideoController）
- 方法名：camelCase（如 getVideoById）
- 常量名：UPPER_SNAKE_CASE（如 DEFAULT_PAGE_SIZE）

### 提交规范
- 使用有意义的提交信息
- 一个提交只做一件事

### 分支规范
- `main` - 主分支，稳定版本
- `develop` - 开发分支
- `feature/xxx` - 功能分支
- `bugfix/xxx` - 修复分支

## 贡献指南

欢迎提交 Pull Request！请确保：
1. 代码符合编码规范
2. 添加必要的测试
3. 更新相关文档

## 常见问题

### Q: 如何连接到数据库？
A: 使用 PostgreSQL 客户端（如 pgAdmin）连接 `localhost:5432`，用户名 `postgres`，密码 `zhx1314`

### Q: 如何修改服务端口？
A: 在 `application.yml` 中修改 `server.port`

### Q: 如何启用 SQL 日志？
A: 在 `application.yml` 中设置 `spring.jpa.show-sql: true`

## 许可证

MIT

## 联系方式

- 邮箱：zhanghuixing589@gmail.com
- GitHub：https://github.com/zhanghuixing589
