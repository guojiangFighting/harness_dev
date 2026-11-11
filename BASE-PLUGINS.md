# DeepSeek Harness 插件说明书（决定留 / 不留）

面向：**自研业务 Agent**（以 `dsh-base` + `dsh-headless` 为最轻可跑层）。

关闭写法（写在你的 `cordis.patch.yml`）：

```yaml
- id: <插件 id>
  disabled: true
```

图例：

| 标记 | 含义 |
|---|---|
| **必留** | 关掉后内核或执行链基本不可用 |
| **建议留** | 多数业务仍有用 |
| **按需** | 看你的业务 |
| **可关** | 垂直自研时常关掉 |
| **默认关** | base 里已经 `disabled: true`，别乱开 |

---

## 0. 先搞清「层」

| 层 | 是什么 | 你要不要 |
|---|---|---|
| **`dsh-base`** | 共享内核 + 大量内置工具/策略（约 99 个插件行） | **要**（地基） |
| **`dsh-headless`** | 在 base 上加 CLI 一次性跑任务入口；关掉交互凭据/HMR | **要**（最轻能跑） |
| **`dsh-web-app`** | HTTP + 浏览器 UI + 几十个 `ui-*` | 只要 CLI/自研入口就 **不要** |
| **`dsh-sdk-app` / `dsh-acp-app`** | JSON-RPC / ACP 自动化入口 | 嵌入其它程序时再考虑 |
| **你自己的 bundle** | persona、业务工具、策略 | **你要写的** |

`dsh-base` ** alone 没有任务入口**。没有 headless/web/sdk/acp/自写 runner，进程挂完插件后不会替你对话。

---

# 一、`dsh-base` 全部插件（按作用）

来源：`deepseek-harness/packages/bundle/base/cordis.patch.yml`。

## 1. Agent 内核（没有这些就不是 agent）

| id | 干什么 | 留否 |
|---|---|---|
| `timer` | Cordis 定时器、可随插件卸载清理 | **必留** |
| `llm` | 模型服务定义：适配器往这里注册路由 | **必留** |
| `session` | 会话事件日志（append-only） | **必留** |
| `agent` | Agent 实例注册表 | **必留** |
| `tools` | 工具注册表 + 执行流水线入口 | **必留** |
| `tool-executor-native` | 真正执行工具调用（原生模式） | **必留** |
| `system-prompt` | 拼系统提示（persona、工具说明、各类 section） | **必留**（改 config，别关） |
| `agent-loop` | 模型 ↔ 工具的主循环；base 默认 `agents: []`，靠 runner 创建 | **必留** |
| `llm-deepseek` | DeepSeek API Key 适配器 | **必留**（或换成你自己的 LLM 插件） |
| `deepseek-llm-api-extensions` | DeepSeek 协议扩展 | 用 DeepSeek → **建议留** |
| `agent-default-model` | 新建 Agent 时的默认模型 | **建议留**（改成你的默认） |
| `llm-retry` | 模型请求失败重试 | **建议留** |
| `session-log-deepseek` | DeepSeek 相关会话日志扩展 | **按需** |

**你怎么用：** 人设不要重写 loop，往 `system-prompt` 挂 section，或 patch `personaPrefix`。

---

## 2. 执行环境、权限、沙箱（安全边界）

| id | 干什么 | 留否 |
|---|---|---|
| `subprocess` | 本地起子进程 | **必留**（要用 shell/外部命令） |
| `sandbox` | 沙箱实现（限制文件副作用） | **建议留** |
| `sandbox-policy` | 模式：`read-only` / `workspace-write` / `danger-full-access` | **建议留** |
| `bash-sandbox` | Linux/macOS 上 bash 的沙箱（win 上默认关） | POSIX → **建议留** |
| `pwsh-sandbox` | Windows PowerShell 沙箱 | Windows → **建议留** |
| `approval` | 危险操作问不问人（`ask` / `never`） | **建议留** |
| `permission` | 上面几种权限档位的预设组合 | **建议留** |
| `fs-sandbox` | 给工具用的沙箱文件系统 `ctx.fs` | **建议留** |
| `shell-env` | 往 shell 注入环境变量 | **按需** |
| `timeout-policy` | 工具调用超时 | **建议留** |
| `spill-local` + `spill-policy` | 工具输出太大时外溢到磁盘，避免撑爆上下文 | **建议留** |
| `session-checkpoint-policy` | 每次调模型前打检查点，利于恢复 | **建议留** |
| `fs-observation-policy` | 「先读后改」类观测策略 | **默认关**；要严再开 |

**你怎么用：** 业务自动化可把 `approval` 配成 `never`，但别一上来就 `danger-full-access`，除非你清楚风险。

---

## 3. 模型可调用的「内置工具」（最该裁的一层）

这些是 **给模型用的工具**。你自研工具多，就可以多关。

| id | 模型得到什么 | 留否 |
|---|---|---|
| `tool-bash` / `tool-pwsh` | 跑 shell（按 OS 二选一启用） | 需要命令行 → **建议留**；纯 API 编排 → **可关** |
| `tool-fs` | 读/写/编辑文件 | 多数 **建议留**；你完全自写文件工具 → **可关** |
| `tool-fs-search` | grep / glob | 同上 |
| `tool-jobs` + `jobs` | 后台任务与 `job_*` 控制 | 没有长任务 → **可关** |
| `working-directory` | 当前工作目录服务（不少投影依赖它） | **建议留** |
| `tool-working-directory` | 让模型改 cwd 的工具 | **按需** |
| `agent-instructions` | 把仓库里的指令文件注入提示 | 编码助手 → **建议留**；纯业务 → **可关** |
| `skill` + `skill-filesystem` + `tool-skill` | Skill 目录与加载工具 | 不用 skill → **可关（整组）** |
| `tool-todo` | 待办清单工具 | **可关** |
| `goal` + `goal-round-driver` + `command-goal` + `tool-goal` | 同会话 Goal + `/goal` | **可关（整组）** |
| `plan-mode` | 计划模式（先规划再执行） | **可关** |
| `web` + `web-search-deepseek` + `web-deepseek-api` + `web-fetch-http` + `tool-web` | `web_search` / `web_fetch` | 不需要上网 → **可关（整组）** |
| `repeat-tool-reminder` | 同一工具连打太多次时提醒模型 | **按需** |
| `commands` + `command-feedback` + `command-compact` | slash 命令体系（`/feedback` `/compact`…） | headless 无聊天 UI → **可关** |
| `user-questions` | 结构化向用户提问（`ask_user_question`） | 全自动 → **按需**；要人确认 → **建议留** |
| `mcp-resources` | 读 MCP 资源的共享能力 | 不用 MCP → **可关** |

---

## 4. 子代理 / 团队 / 工作流（PTC）

| id | 干什么 | 留否 |
|---|---|---|
| `subagent` | 子代理注册与生命周期 | 不做委派 → **可关** |
| `subagent-spawn-in-process` | 进程内 spawn 子代理 | 同上 |
| `subagent-fork-in-process` | fork 子代理（共享上下文） | 同上 |
| `tool-subagent` | 模型工具 `subagent` | 同上 |
| `tool-subagent-fork` | 模型工具 `subagent_fork` | 同上 |
| `tool-subagent-control` | 给子代理发消息等控制 | 同上 |
| `agent-team` + `tool-agent-team` | 多 agent 协作看板 | **可关** |
| `ptc-runtime` | Programmatic Tool Calling 运行时（Node） | 不用 PTC → **可关** |
| `workflow-ptc` + `tool-workflow` | 工作流引擎 + 工具 | **可关** |
| `tool-executor-ptc` | PTC 模式下的工具执行器 | **默认关** |

**一句话：** 单 agent + 你自己的工具，这整块都可以关。

---

## 5. 会话持久化、压缩、存储

| id | 干什么 | 留否 |
|---|---|---|
| `session-persistence-jsonl` | 会话以 JSONL 落盘 | **建议留**（否则重启全丢） |
| `attachment-local` | 图片等附件的内容寻址存储 | 有多模态 → **建议留**；纯文本 → **可关** |
| `session-projection` | 「投影」注册表（列表列、cwd 等派生视图） | **建议留** |
| `session-projection-cache` | 投影结果缓存 | **按需** |
| `session-query-sqlite` | 会话查询；默认 `openAt: never`（不开全文搜索库） | **建议留行**；要全文再改 `openAt` |
| `session-title` + `session-title-llm` | 自动起会话标题 | 一次性 CLI → **可关** |
| `storage` + `storage-json` + `storage-domain` | 通用 KV 存储（很多功能依赖） | **建议留** |
| `token-meter` | 统计 token / 上下文压力 | **建议留** |
| `compaction-basic` | 上下文太长时压缩 | 长跑 → **建议留**；极短任务 → **按需** |
| `tool-result-pruner` | 单个工具结果过长时先砍 | **建议留** |
| `image-offload` | 图片过多超预算时换占位 | 有图 → **建议留** |

---

## 6. 凭据、账号、设置、插件管理

| id | 干什么 | 留否 |
|---|---|---|
| `credentials` | `$DSH_HOME` 托管密钥文件 | headless 模板已关；API Key 走环境变量即可 → **可关** |
| `authorization` | 交互式授权编排 | headless 已关 → **可关** |
| `deepseek-account` | DeepSeek 登录账号 | headless 已关 → **可关** |
| `llm-deepseek-account` | 用登录账号当模型源 | 有 API Key → **可关** |
| `llm-pi-ai` | 多厂商模型（要 settings 配了才有路由） | 只用 DeepSeek → **可关** |
| `settings` + `config-editor` | 交互设置表单 | 无 Web/无 profile 交互时常自动关 → **可关** |
| `hmr` | 改配置热重载 | headless 已关；生产 → **可关**；开发可开 |
| `plugin-manager` | 运行时安装/管理 bundle | 固定组合 → **可关** |
| `tool-plugin-manager` | **让模型自己装插件** | **默认关**（生产别开） |
| `plugin-package-inventory-deepseek` | 请求里带活跃包清单（诊断） | **按需** |

---

## 7. 远程 API（Typert）—— headless 多半可整组关

这是给 **Web/Host ↔ 浏览器 Client** 用的类型化 RPC 栈。

| id | 干什么 | 留否 |
|---|---|---|
| `typert` | 类型运行时注册表 | 无浏览器 Client → **可关** |
| `typert-loader` | 加载生成好的类型产物 | 同上 |
| `typert-gateway` | Remote 方法网关 | 同上 |
| `remote-access` | Peer 访问控制（Gateway 依赖） | 同上；开 Gateway 则必留 |

---

## 8. 遥测

| id | 干什么 | 留否 |
|---|---|---|
| `otel` | OpenTelemetry 基础设施 | 离线/隐私 → **可关** |
| `session-telemetry-otel` | 会话反馈上报（默认仅反馈模式） | **可关**；或设 `DSH_TELEMETRY_DISABLED` |

---

# 二、`dsh-headless` 多了什么 / 关了什么

文件：`packages/bundle/headless/cordis.patch.yml`

| 动作 | id | 说明 |
|---|---|---|
| **新增** | `headless-startup` | 解析 `dsh --profile … "<任务>"`、session、json 等 CLI 参数 |
| **新增** | `headless-runner` | 建 Agent、跑完任务、打印结果 —— **没有它你调不起来** |
| **改** | `system-prompt` | 默认 coding persona（你应用自己的覆盖） |
| **改** | `sandbox-policy` | 接上 CLI 额外可写目录 |
| **关** | `hmr` / `credentials` / `authorization` / `deepseek-account` | 一次性任务用环境变量凭据 |

---

# 三、`dsh-web-app`（只要知道「整层可不要」）

浏览器产品层，**不是** headless 自定义 Agent 的必需品。大致分组：

| 组 | 代表 | 作用 |
|---|---|---|
| 传输 | `web-startup` `webserver` `web-runtime` `connection` `modules` | 起 HTTP、送前端、建连 |
| Host API | `session-controller` `job-controller` `settings-controller` … | 给浏览器的远程控制面 |
| 工作区 | `workspace` `directory-picker` `schedule` … | 工作区、选目录、定时任务 |
| MCP 管理 | `mcp-manager` | Web 设置里管 MCP 服务器 |
| **`ui-*` 一大票** | `ui-chat` `ui-sidebar` `ui-settings-*` … | 纯前端界面插件 |
| Agent preset | `standard` / `minimal` / `ptc` / `cordis` | Web 把 base 工具行禁用，改按会话 preset 挂载 |

结论：你走 `headless` + 自研插件时，**不要装 web-app**，也就不用纠结这些 `ui-*`。

---

# 四、其它入口层（对照）

| Bundle | 用途 | 相对 headless |
|---|---|---|
| `dsh-sdk-app` | 程序用 JSON-RPC 驱动 | 更重（办公、schedule、连接等） |
| `dsh-sdk-minimal` | **不叠 base** 的极简 SDK 树 | 另一条线，不是「裁 base」 |
| `dsh-acp-app` | Agent Client Protocol 自动化 | 很薄入口 + 仍带 base |

---

# 五、不在 base、要另装才有的

| 能力 | 怎么来 |
|---|---|
| `dsh-mcp-client` | 你自己 patch / `dsh plugin add`；每个 MCP server 一行 |
| `tool-str-replace-editor` | 可选，base 默认不挂 |
| experimental browser-use / computer-use | 实验包，不在 shipped base |
| 第三方 market 插件 | `dsh plugin add …` |

---

# 六、实操：垂直业务起步怎么裁

## 建议先留

1. **§1 内核全部**  
2. **§2 沙箱/权限/超时/spill**  
3. **`tool-fs` + `tool-fs-search` + 平台 shell`**（除非你完全自写）  
4. **§5 会话落盘 + storage + token-meter + 压缩/pruner**  
5. **`headless-startup` + `headless-runner`**  
6. **你自己的 persona / tools**

## 建议先关（整组）

```text
web 全家桶
subagent + team
workflow + PTC
todo / goal / plan / skill
commands / command-*
otel 遥测
typert 四件套（无 Web Client 时）
llm-pi-ai / account 线
session-title-llm
```

`cordis.patch.yml` 里已有注释版 disable，对照本文取消注释即可。

## 验证

```powershell
pnpm dsh --profile custom --dump-config
```

打印出来的每一行，都可以被你的 patch 替换或 `disabled: true`。

---

# 七、一张总决策图

```text
要对话/跑任务吗？
  └─ 要 → 保留 headless-runner（或换 web/sdk/自写 runner）

只要单 Agent + 自研工具？
  └─ 关：subagent / team / workflow / PTC / todo / goal / plan / skill

要上网搜吗？
  └─ 否 → 关 web*

要浏览器 UI 吗？
  └─ 否 → 不要装 dsh-web-app

只要 DeepSeek API Key？
  └─ 关：credentials/authorization/account/pi-ai（headless 已关前三个）

要远程给前端调吗？
  └─ 否 → 关 typert*

要上报遥测吗？
  └─ 否 → 关 otel*
```
