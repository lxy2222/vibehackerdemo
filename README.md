# 汇报不返工

根据汇报背景和工作材料，先识别领导这次要判断的问题，确认主线后再出网页预览和可编辑 PPT。下载前验收能不能交，不编造材料里没有的数字。

创建（口述 / 粘贴 / Notion）→ 确认主线 → 预览验收 → 下载 PPT。

## 能做什么

- **创建**：写下或口述最初的汇报背景，再贴工作对话或材料；也可从 Notion 导入页面
- **分析主线**：抽出标题、领导要判断的问题、结论、发现、风险、下一步和拍板事项
- **确认再出稿**：改结论或补材料后可重新分析，确认后才生成预览
- **验收**：可提交 / 需要修改；可复制给领导的交付消息
- **导出**：可编辑 `.pptx`（PowerPoint / WPS 可打开），封面以外有演讲备注

本仓库对应的产品范围见 [`docs/superpowers/specs/2026-08-29-动态证据模块-design.md`](docs/superpowers/specs/2026-08-29-动态证据模块-design.md)。

## 技术栈

| 模块 | 方案 |
| --- | --- |
| 应用 | Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4 |
| 校验 | Zod |
| 大模型 | DeepSeek（OpenAI 兼容 Chat Completions，仅服务端） |
| PPTX | PptxGenJS |
| 数据 | 演示草稿存在浏览器 `sessionStorage`（关标签即清），服务端不落库 |
| Notion | Public Integration OAuth，只读导入 |

模型只负责理解、提炼、组织故事；TypeScript 负责 Deck 组装、裸数字检查、点名指标门禁和 PPT 渲染。禁止「材料 → LLM → PPTX」跳过确认和校验。

## 环境要求

- Node.js 20+
- npm
- DeepSeek API Key（分析主线和语义验收都需要）
- Notion 为可选：不配置时，粘贴 / 口述路径仍可完整使用

## 快速开始

```bash
npm install
cp .env.example .env
```

在 `.env` 里至少填入：

```bash
DEEPSEEK_API_KEY=sk-...
```

然后启动：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

项目草稿保存在当前标签页的 `sessionStorage` 里，刷新可继续；关掉标签后需要重新创建。

## 环境变量

模板见 [`.env.example`](.env.example)。不要把真实 Key 提交进仓库。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | 仅服务端使用，不要加 `NEXT_PUBLIC_` 前缀 |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL_FLASH` | 否 | 分析主线，默认 `deepseek-v4-flash` |
| `DEEPSEEK_MODEL_PRO` | 否 | 语义验收 + 交付消息，默认 `deepseek-v4-pro` |
| `NOTION_CLIENT_ID` | Notion 时 | Public Integration 的 Client ID |
| `NOTION_CLIENT_SECRET` | Notion 时 | Public Integration 的 Client Secret |
| `NOTION_REDIRECT_URI` | Notion 时 | 必须与 Notion 后台填写的 Redirect URI 完全一致，本地默认 `http://localhost:3000/api/notion/callback` |
| `NOTION_API_KEY` | 否 | Internal Integration Token，仅本地调试、没有 OAuth 时用来读已分享页面 |

## 使用流程

1. **创建**：填写「我最初的汇报背景」（必填，支持浏览器语音输入），可选粘贴工作对话 / 材料、设置时长。
2. **确认主线**：查看并编辑分析出的核心问题、结论、风险、下一步；可改背景或补材料后重新分析。
3. **预览**：固定结构为封面 / 结论或进展 / 风险点 / 下一步与拍板。
4. **验收**：自动给出「可提交」或「需要修改」。可提交时复制交付消息，再导出 PPTX。

预览页结构不随汇报目的换版；意图只作为确认页标签和封面副标题。

### 内置测试材料

创建页可一键载入三套案例，用来验收门禁是否符合预期：

| 案例 | 预期 |
| --- | --- |
| 完整 demo | 可提交，可能建议缺量化 |
| 点名转化（应阻塞） | 需要修改：领导点名要看转化，材料没有数字 |
| 缺量化（建议） | 可提交：领导没点名具体指标，缺量化只是建议 |

对应文本也可从 `fixtures/audit/` 复制。

**阻塞**（必须改完才能交）：领导点名了指标而材料没有对应数字；稿子里出现材料没有的数字；页数过少 / 过多；讲解时长超过要求 20%；PPTX 空文件。

**建议**（不挡提交）：领导没点名指标时的「缺量化」。

## Notion（可选）

不连 Notion 时，纯粘贴路径与主流程完全一样。

1. 在 [Notion Integrations](https://www.notion.so/my-integrations) 创建 Public Integration。
2. Redirect URI 填 `http://localhost:3000/api/notion/callback`（上线时再追加生产地址，并设置 `NOTION_REDIRECT_URI`）。
3. 把 Client ID / Secret 写入 `.env`。
4. 创建页或确认页点「去授权」，在 Notion 勾选要分享的页面后返回本站，勾选页面导入正文。

导入文本带页面标题和来源链接。Token 只放 httpOnly cookie，Key 只在服务端。只读，不写回 Notion。

## 常用命令

```bash
npm run dev          # 本地开发（Turbopack）
npm run build        # 生产构建
npm run start        # 运行生产构建
npm run lint         # ESLint
npm test             # 验收规则单测
npm run generate:demo  # 写出 artifacts/ 下的示例 PPTX（不经过主流程）
```

## 目录结构

```text
app/                 # Next.js App Router：页面与 API
components/          # 创建、确认、预览、验收、Notion 连接
lib/
  llm/               # Flash 分析、Pro 验收、模型客户端
  presentation/      # DeckSpec → 网页预览 / PPTX
  validation/        # 代码验收（页数、时长、点名指标、裸数字）
  notion/            # OAuth 与只读导入
  projects/          # 无状态项目流程与 sessionStorage
  demo/              # 内置演示案例
docs/superpowers/    # 产品说明与里程碑
fixtures/audit/      # 验收用文本材料
```

本地运行时还会生成（已在 `.gitignore` 中忽略）：

- `artifacts/`：`npm run generate:demo` 写出的示例 PPTX

## 本版不做

- 自定义画布、多主题母版、成品视觉精修
- 按汇报意图切换幻灯片结构、九种证据模块
- 账号体系、往 Notion 回写
- PDF / DOCX / 旧 PPT 解析

更完整的范围说明见产品文档。里程碑（含已取消项）见 [`docs/superpowers/specs/2026-08-29-汇报不返工-milestones.md`](docs/superpowers/specs/2026-08-29-汇报不返工-milestones.md)。
