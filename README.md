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
- Kubernetes（可选）

## 项目结构

```
video-ai/
├── backend/                 # Java Spring Boot 后端
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/video/
│   │   │   │       ├── entity/          # JPA 实体
│   │   │   │       ├── repository/      # 数据访问层
│   │   │   │       ├── service/         # 业务逻辑层
│   │   │   │       ├── controller/      # 控制层
│   │   │   │       ├── config/          # 配置类
│   │   │   │       ├── util/            # 工具类
│   │   │   │       └── VideoAiApplication.java
│   │   │   └── resources/
│   │   │       ├── application.yml      # 配置文件
│   │   │       └── application-dev.yml  # 开发环境配置
│   │   └── test/
│   ├── pom.xml              # Maven 配置
│   ├── Dockerfile           # Docker 镜像
│   └── .gitignore
│
├── ai-service/              # Python FastAPI AI 服务
│   ├── app/
│   │   ├── main.py          # FastAPI 主应用
│   │   ├── models/          # 数据模型
│   │   ├── services/        # AI 服务
│   │   ├── routes/          # API 路由
│   │   └── config.py        # 配置
│   ├── requirements.txt      # Python 依赖
│   ├── Dockerfile           # Docker 镜像
│   ├── .env.example         # 环境变量示例
│   └── .gitignore
│
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 服务
│   │   ├── store/           # 状态管理
│   │   ├── styles/          # 样式
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .gitignore
│
├── docker-compose.yml       # Docker 编排
├── .gitignore
└── docs/                    # 文档
    ├── API.md               # API 文档
    ├── DEVELOPMENT.md       # 开发指南
    └── DEPLOYMENT.md        # 部署指南
```

## 快速开始

### 前置要求
- Docker & Docker Compose
- Java 17+
- Python 3.10+
- Node.js 16+

### 一键启动所有服务

```bash
docker-compose up -d
```

### 本地开发

#### 启动 PostgreSQL 和 Redis
```bash
docker-compose up -d postgres redis
```

#### 启动 Java 后端
```bash
cd backend
mvn spring-boot:run
```

#### 启动 Python AI 服务
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### 启动 React 前端
```bash
cd frontend
npm install
npm start
```

## API 文档

- Java 后端 API: http://localhost:8080/swagger-ui.html
- Python AI 服务: http://localhost:8000/docs

## 核心功能

### 已完成
- [ ] 用户认证和授权
- [ ] 视频管理和上传
- [ ] 视频搜索
- [ ] 用户评论和评分

### 开发中
- [ ] AI 个性化推荐
- [ ] 智能搜索（语义搜索）
- [ ] 自动字幕生成

### 计划中
- [ ] 视频分类和标签
- [ ] 观看历史
- [ ] 收藏夹
- [ ] 社交功能（关注、点赞等）

## 环境配置

### Java 后端
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/video_db
    username: postgres
    password: zhx1314
```

### Python AI 服务
```
# .env
OPENAI_API_KEY=your_key_here
DATABASE_URL=postgresql://postgres:zhx1314@localhost:5432/video_db
```

### 前端
```
# .env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_AI_SERVICE_URL=http://localhost:8000
```

## 贡献指南

欢迎提交 Pull Request！

## 许可证

MIT
