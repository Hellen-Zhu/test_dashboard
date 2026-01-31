# MeterSphere 3.x 二次开发与部署指南

> 本文档用于记录 MeterSphere 3.x 的二次开发和部署流程，请持续维护更新。

## 项目概述

MeterSphere 3.x 是基于 **Java 21 + Spring Boot 3.5.7** 的现代化测试平台，采用前后端分离架构。

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Java 21, Spring Boot 3.5.7, MyBatis, Apache Shiro 2.0.2 |
| 前端 | Vue.js, TypeScript, Tailwind CSS, pnpm 8.4.0 |
| 中间件 | MySQL 8.x, Kafka, Redis (Redisson 3.49.0), MinIO |
| 测试引擎 | JMeter 5.6.3 |
| 构建工具 | Maven (后端), pnpm (前端) |
| AI 能力 | Spring AI 1.0.3 |

---

## 一、开发环境准备

### 1.1 必需软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| JDK | 21+ | 项目强制要求 |
| Node.js | v20.8.1+ | 前端构建 |
| pnpm | 8.4.0+ | 前端包管理 |
| Docker | 最新版 | 运行中间件 |
| IDE | IntelliJ IDEA | 推荐 |

### 1.2 中间件服务

本地开发需要启动以下服务：

```yaml
# 建议创建 docker-compose-dev.yml 用于本地开发
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: metersphere

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  kafka:
    image: bitnami/kafka:latest
    ports:
      - "9092:9092"
    environment:
      KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE: "true"

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
```

---

## 二、源码构建

### 2.1 后端构建

```bash
# 1. 进入项目根目录
cd /Users/summerliu/Downloads/study/metersphere-3.x/metersphere-3.x

# 2. 安装父 POM 到本地仓库
./mvnw install -N

# 3. 构建后端 SDK 和依赖
./mvnw clean install -DskipTests -DskipAntRunForJenkins --file backend/pom.xml

# 4. 整体打包
./mvnw clean package
```

### 2.2 前端构建

```bash
cd frontend

# 安装依赖
pnpm install

# 开发模式启动
pnpm dev

# 生产构建
pnpm build
```

---

## 三、本地开发启动

### 3.1 后端启动

1. 在 IDE 中导入项目
2. 配置数据库和中间件连接 (修改 `backend/app/src/main/resources/commons.properties`)
3. 运行主类: `io.metersphere.Application`
4. 后端默认端口: **8081**

### 3.2 前端启动

```bash
cd frontend
pnpm dev
```

前端开发服务器会自动代理 API 请求到后端。

### 3.3 访问地址

- 后端 API: http://localhost:8081
- 前端开发: http://localhost:5173 (默认)
- 默认账号: `admin` / `metersphere`

---

## 四、项目结构

```
metersphere-3.x/
├── backend/
│   ├── framework/          # 核心框架：工具类、配置、拦截器、异常处理
│   │   └── ai-engine/      # AI 引擎模块
│   ├── services/           # 业务逻辑模块，按功能领域划分
│   └── app/                # 应用入口
│       └── src/main/
│           ├── java/       # Controller 层、主程序入口
│           └── resources/  # 配置文件、静态资源
├── frontend/
│   ├── src/                # 前端源码
│   ├── public/             # 静态资源
│   ├── config/             # 构建配置
│   └── nginx.conf          # Nginx 配置 (容器化部署用)
├── Dockerfile              # Docker 镜像构建
├── Jenkinsfile             # CI/CD 配置
├── build.md                # 官方构建说明
└── pom.xml                 # 根 Maven 配置
```

---

## 五、二次开发指南

### 5.1 新增后端 API

1. 在 `backend/services/` 中添加业务逻辑 (Service 层)
2. 在 `backend/app/` 中添加 Controller
3. 遵循现有代码规范和包结构

### 5.2 数据库变更

项目使用 **Flyway** 管理数据库版本：

```
backend/app/src/main/resources/migration/
└── V*.sql    # 按版本号命名的 SQL 脚本
```

新增数据库变更时，创建新的 SQL 脚本文件。

### 5.3 前端开发

- 使用 TypeScript 编写
- 遵循 Vue 3 组合式 API 规范
- 样式使用 Tailwind CSS

### 5.4 配置文件

主配置文件: `backend/app/src/main/resources/commons.properties`

| 配置项 | 说明 |
|--------|------|
| `spring.datasource.url` | MySQL 连接地址 |
| `spring.kafka.bootstrap-servers` | Kafka 地址 |
| `server.port` | 后端服务端口 (默认 8081) |
| `management.port` | 管理端口 (默认 7071) |

---

## 六、框架功能分析

### 6.1 系统架构概览

MeterSphere 3.x 采用分层架构设计，整体分为 5 层：

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Frontend)                      │
│         Vue 3 + TypeScript + Arco Design Vue            │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ RESTful API
                           ▼
┌─────────────────────────────────────────────────────────┐
│              应用层 (App - Controllers)                   │
│              路由、参数验证、响应封装                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              业务层 (Services - 业务模块)                 │
│  api-test | bug-management | case-management | ...     │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│             框架层 (Framework - 基础能力)                 │
│    SDK | Domain | Provider | Plugin | AI Engine        │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              数据层 (MySQL + Redis + MinIO)              │
└─────────────────────────────────────────────────────────┘
```

### 6.2 后端业务模块

| 模块 | 目录 | 职责 | API 路由 |
|------|------|------|----------|
| **API 测试** | `services/api-test/` | 接口定义、用例、场景、Mock、执行引擎 | `/api/test/*` |
| **缺陷管理** | `services/bug-management/` | 缺陷生命周期、附件、评论、关联用例 | `/bug/*` |
| **用例管理** | `services/case-management/` | 功能用例、评审、需求关联、AI 生成 | `/functional/case/*` |
| **测试计划** | `services/test-plan/` | 计划管理、执行、分组、报告 | `/test/plan/*` |
| **项目管理** | `services/project-management/` | 项目、成员、环境、文件、模板 | `/project/*` |
| **仪表板** | `services/dashboard/` | 数据可视化、待办事项、视图 | `/dashboard/*` |
| **系统设置** | `services/system-setting/` | 组织、用户、权限、日志、AI 配置 | `/system/*` |

### 6.3 框架层能力

#### 6.3.1 框架模块结构

```
backend/framework/
├── sdk/                 # 基础工具类和通用功能
│   ├── utils/          # BeanUtils, DateUtils, EncryptUtils, etc.
│   ├── http/           # HTTP Client 5, Kafka 集成
│   ├── storage/        # MinIO 客户端
│   └── git/            # JGit 集成
├── domain/             # 数据访问层 (Mapper + Entity)
├── provider/           # 服务层实现
├── plugin/             # 插件系统
│   ├── plugin-api-sdk/        # 测试元素抽象
│   ├── plugin-platform-sdk/   # 平台插件接口
│   └── plugin-sdk/            # 通用插件 SDK
└── ai-engine/          # AI 聊天引擎
    ├── ChatToolEngine.java    # 核心引擎
    ├── models/                # AI 客户端 (OpenAI, DeepSeek, 千帆, 智谱)
    ├── tools/                 # 工具类 (DateTime, FileReader, JVM)
    └── utils/                 # 文本处理工具
```

#### 6.3.2 权限管理 (Apache Shiro)

| 组件 | 功能 |
|------|------|
| `LocalRealm` | 本地用户认证，支持邮箱登录 |
| `ApiKeyFilter` | API 密钥认证 |
| `CsrfFilter` | CSRF 防护 |
| `MsPermissionAnnotationMethodInterceptor` | 注解式权限控制 |

#### 6.3.3 全局异常处理

```java
@RestControllerExceptionHandler
├── @Valid 参数验证异常
├── MSException 业务异常
├── HTTP 异常 (405, etc.)
└── Shiro 异常 (未授权、无权限)
```

#### 6.3.4 AI 引擎能力

```java
// 支持的 AI 模型
AIModelType.OPEN_AI      // OpenAI (GPT-3.5/4)
AIModelType.DEEP_SEEK    // DeepSeek
AIModelType.QIAN_FAN     // 百度千帆
AIModelType.ZHI_PU_AI    // 智谱 AI

// 使用示例
ChatResponse response = ChatToolEngine.builder(AIModelType.OPEN_AI,
    AiChatOptions.builder()
        .modelType("gpt-3.5-turbo")
        .apiKey("sk-xxx")
        .baseUrl("url")
        .build())
    .addPrompt("生成测试用例")
    .tools(new DateTimeTool())
    .executeChatResponse();
```

### 6.4 前端架构

#### 6.4.1 目录结构

```
frontend/src/
├── api/                 # API 接口封装
│   ├── http/           # Axios 配置
│   ├── modules/        # 按模块分类的 API
│   └── requrls/        # URL 配置
├── components/          # 组件库
│   ├── business/       # 业务组件
│   └── pure/          # 通用基础组件
├── layout/             # 布局组件
├── router/             # 路由配置 (Vue Router 4)
│   └── routes/modules/
│       ├── apiTest.ts
│       ├── bugManagement.ts
│       ├── caseManagement.ts
│       ├── projectManagement.ts
│       ├── testPlan.ts
│       └── setting.ts
├── store/              # 状态管理 (Pinia)
│   ├── app.ts
│   ├── user.ts
│   ├── global.ts
│   └── ...
├── views/              # 页面组件
├── hooks/              # Vue 组合式 API hooks
├── utils/              # 工具函数
└── theme/              # 主题配置
```

#### 6.4.2 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.31 | 前端框架 |
| TypeScript | 5.4.5 | 类型系统 |
| Vite | 5.3.3 | 构建工具 |
| Arco Design Vue | 2.56.3 | 主 UI 库 |
| Element Plus | 2.9.10 | 辅助 UI 库 |
| Pinia | 2.1.7 | 状态管理 |
| Vue Router | 4.4.0 | 路由 |
| Monaco Editor | 0.39.0 | 代码编辑器 |
| ECharts | 5.5.1 | 图表库 |

### 6.5 核心功能特性

| 特性 | 说明 |
|------|------|
| **统一认证授权** | 基于 Shiro，支持 API Key、CSRF 防护 |
| **多租户支持** | 组织级别的数据隔离 |
| **插件化架构** | 支持协议插件、平台插件扩展 |
| **AI 集成** | 支持智能测试用例生成、AI 辅助测试 |
| **导入导出** | Excel, XMind, Postman, HAR 格式 |
| **分布式执行** | 支持多节点执行测试任务 |
| **实时通知** | 邮件、系统通知、机器人集成 |
| **数据可视化** | ECharts 图表、仪表板 |
| **数据库版本管理** | Flyway 自动迁移 |

### 6.6 模块依赖关系

```
system-setting (基础层)
    ├── 项目管理
    │   ├── API 测试
    │   ├── 缺陷管理
    │   └── 用例管理
    └── 测试计划 (集成层)
            └── 仪表板 (展示层)
```

---

## 七、部署方式

### 6.1 Docker 镜像构建

```bash
# 1. 完成项目构建
./mvnw clean package -DskipTests

# 2. 构建 Docker 镜像
docker build -t metersphere:custom .

# 3. 查看镜像
docker images | grep metersphere
```

### 6.2 快速部署 (All-in-One)

```bash
docker run -d -p 8081:8081 \
  --name=metersphere \
  -v ~/.metersphere/data:/opt/metersphere/data \
  metersphere:custom
```

### 6.3 生产环境部署

**方式一**: 使用官方安装脚本
- 仓库: https://github.com/metersphere/metersphere
- 提供完整的 docker-compose 配置和环境编排

**方式二**: 1Panel 应用商店
- 地址: https://1panel.cn/
- 一键部署，自动配置

**方式三**: 离线安装包
- 下载: https://community.fit2cloud.com/#/products/metersphere/downloads
- 适用于内网环境

### 6.4 环境变量配置

Docker 部署时可通过环境变量覆盖配置：

```bash
docker run -d -p 8081:8081 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/metersphere \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  --name=metersphere \
  metersphere:custom
```

---

## 八、验证步骤

| 步骤 | 验证内容 | 预期结果 |
|------|----------|----------|
| 1 | 访问 http://localhost:8081 | 页面正常加载 |
| 2 | 使用 admin/metersphere 登录 | 登录成功 |
| 3 | 创建测试项目 | 功能正常 |
| 4 | 查看系统设置 | 配置项可见 |

---

## 九、常见问题

### Q1: 构建时报错 "JDK version not supported"
**A**: 确保使用 JDK 21+，检查 `JAVA_HOME` 环境变量。

### Q2: 前端无法连接后端 API
**A**: 检查后端是否启动在 8081 端口，前端代理配置是否正确。

### Q3: 数据库连接失败
**A**: 确认 MySQL 服务已启动，检查 `commons.properties` 中的连接配置。

### Q4: Kafka 连接超时
**A**: 确认 Kafka 服务已启动，检查 `bootstrap-servers` 配置。

---

## 十、参考资源

- [MeterSphere 官方文档](https://metersphere.io/docs/)
- [开发者手册](https://metersphere.io/docs/v3/dev_manual/)
- [官方论坛](https://bbs.fit2cloud.com/c/ms/8)
- [GitHub 仓库](https://github.com/metersphere/metersphere)
- [API 文档](https://metersphere.io/docs/v3/api/)

---

## 十一、更新日志

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|----------|------|
| 2026-01-29 | v1.0 | 初始版本，包含开发环境、构建、部署说明 | - |
| 2026-01-30 | v1.1 | 新增框架功能分析章节，包含系统架构、业务模块、前端架构等 | - |

---

> **提示**: 如有更新，请在「更新日志」中记录变更内容。
