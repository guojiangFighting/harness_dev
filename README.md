# dsh-custom-agent

基于 **最轻可运行层** 的自定义 Agent 脚手架：

- 共享核心：`@deepseek-ai/dsh-base`
- 无 Web UI 的一次性入口：`@deepseek-ai/dsh-headless`（比 `web` 轻很多）
- 其余能力：你自己在 `plugins/` 开发，经 `cordis.patch.yml` 挂载

> 纯 `dsh-base` 没有任务入口；要对话/跑任务必须叠 headless / web / sdk，或自写 runner。

插件说明书（每个插件干什么、留/关建议、web/headless/sdk 分层）见 [BASE-PLUGINS.md](./BASE-PLUGINS.md)。

## 目录

```text
dsh-custom-agent/
  package.json           # dsh.bundle 声明
  cordis.patch.yml       # 插入你的插件 + 可选 disable base 行
  BASE-PLUGINS.md        # dsh-base 插件清单
  plugins/
    hello-persona/       # 示例：系统提示词
    hello-tool/          # 示例：工具插件占位
```

## 快速开始（源码仓旁路）

在已 `pnpm install && pnpm run build` 的 `deepseek-harness` 旁使用：

```powershell
cd F:\file_work\harness_dev\deepseek-harness

# 1) 用 headless 模板创建独立 profile（自动含 dsh-base + dsh-headless）
pnpm dsh --profile custom --from-default-profile headless

# 2) 安装本脚手架 bundle（会写入 profile 的 bundles 列表）
pnpm dsh plugin --profile custom add F:\file_work\harness_dev\dsh-custom-agent

# 3) 查看最终插件树（对照 BASE-PLUGINS.md 决定 disable）
pnpm dsh --profile custom --dump-config

# 4) 跑一次（需可用的 DEEPSEEK_API_KEY 或你已配置的凭据）
pnpm dsh --profile custom "ping: say hello-tool loaded"
```

开发期也可以不安装 bundle，直接 overlay：

```powershell
pnpm dsh --profile custom --patch F:\file_work\harness_dev\dsh-custom-agent\cordis.patch.yml "ping"
```

## 你自己加插件

1. 在 `plugins/<name>/index.js`（或迁到 TS 包）导出：

```js
export const name = 'my-plugin'
export const inject = ['tools', 'systemPrompt'] // 按需
export function apply(ctx, config) { /* register */ }
```

2. 在 `cordis.patch.yml` 的 `insert` 里加一行：

```yaml
- id: my-plugin
  name: './plugins/my-plugin/index.js'
```

3. 正式工具请用 `defineTool`（见 harness 文档 `docs/cookbook/adding-a-tool.zh.md`），本仓库 `hello-tool` 只是占位。

## 关掉不需要的 base 插件

编辑 `cordis.patch.yml`，取消注释对应 `- id: ... / disabled: true`。  
**不要随便关掉 A 类内核**（见 BASE-PLUGINS.md），否则启动会失败。

## 比 headless 更“纯 base”？

可以：

```powershell
# 仅作实验：profile 只挂 base（仍建议用 plugin 管理）
# 但没有 headless-runner 时，CLI 不会替你创建 agent / 跑任务
```

实际开发请保留 headless；等你写好自己的 runner/Host 再去掉它。
