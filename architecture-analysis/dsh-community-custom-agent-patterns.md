# DSH 社区：自定义业务 Agent 常见做法

> 落盘日期：2026-11-12  
> 用途：支撑 [`firmware-rce-agent-plan.md`](./firmware-rce-agent-plan.md)  
> 说明：收录≠安全/兼容背书；安装前自行审源码与权限。

## 生态入口

| 资源 | 作用 |
|---|---|
| [bruc3van/awesome-dsh-plugin](https://github.com/bruc3van/awesome-dsh-plugin) | 人工复核的插件目录与市场快照 |
| [AdamPlatin123/dsh-plugin-radar](https://github.com/AdamPlatin123/dsh-plugin-radar) | 持续发现 + 兼容性实测雷达 |
| [ymck-x/dsh-plugin-index](https://github.com/ymck-x/dsh-plugin-index) | 只认 `package.json` 的 `dsh.bundle` 判真伪 |
| GitHub `topic:dsh-plugin` | 官方推荐的发现标签 |

官方安装约定（见 DSH `docs/user/develop/basic/publish.md`）：

- **bundle（组合包）**：`dsh.bundle.patch` → 往配置树插/改插件行
- **profile（配置档）**：`dsh.profile.bundles` 有序列表
- 安装：`dsh plugin --profile <name> add <pkg|path|git>`
- **不是** fork（分叉）`deepseek-ai/deepseek-harness` 做业务

## 对标项目与启发

| 项目 | 形态 | 启发 |
|---|---|---|
| [OneZero-Y/dsh-plugin-kit](https://github.com/OneZero-Y/dsh-plugin-kit) | 树外插件脚手架 + forge skills（分阶段造插件技能） | 默认交付模板：`package.json` + `cordis.patch.yml` + `src/` |
| [roberts9012062/dsh-reverse-security](https://github.com/roberts9012062/dsh-reverse-security) | Agent preset + 40+ skills；`case-init` / `auth.status=granted` 前禁 ACT | 领域 Agent = 预设 + 技能；授权状态机先于动手 |
| [SeaOf0/dsh-redteam-model](https://github.com/SeaOf0/dsh-redteam-model) | 多 mode；`stage_gate`；ask-before-run；工具层拦截 | 阶段闸 + 确定性工具拦截（不只靠 prompt） |
| [xydijkkk/dsh-voredteam](https://dsh-plugin.org/plugins/xydijkkk/dsh-voredteam) | 黑板 SSOT + 六阶段门禁 + 专工子代理 + 独立 review | 对齐 kanban/MEA；阶段未齐拒前进 |
| [gladess1102/legacy-firmware-reversing](https://dsh-plugin.org/plugins/gladess1102/legacy-firmware-reversing) | 固件 RE + zero-brick 安全闸 + PROJECT-STATE.md | 同域：危险操作前结构性闸；多 Agent 防漂移 |
| [WDahah/portable-dsh-multi-agent-plugin](https://github.com/WDahah/portable-dsh-multi-agent-plugin) | 监督者+工人；`/gov-authorize` 等人斜杠命令；预算；pause/resume | **人授权必须走命令面**，模型输出不能授权 |
| [omdsh-dev/dsh_workflow](https://github.com/omdsh-dev/dsh_workflow) | 可恢复 workflow；approvalMode；证据与验收 | 长程任务可观测/可恢复 |
| [DamonBao/dsh-dungeon-party](https://github.com/DamonBao/dsh-dungeon-party) | 写范围租约、检查点、独立验收 | Executor/Verifier 分离与预算硬顶 |
| [dsh-agent-swarm](https://dsh-plugin.org/plugins/tt-wang/dsh-agent-swarm) | 多 Agent 协作与独立核验 | 非作者复核 + 资源天花板 |
| [Luck9Star/dsh-plugin-subagents](https://github.com/Luck9Star/dsh-plugin-subagents) | 树外增强 subagent；preset 适配；偶发宿主 patch | 能力增强优先插件；慎用强制打宿主补丁 |
| [omdsh-dev/dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) | 只读审计；路径围栏；密钥脱敏 | 参数不能扩大读范围 |

## 社区共识五条

1. **几乎不做业务 fork**：业务独立仓库 + `dsh plugin add`。
2. **领域 Agent ≈ preset + skills**；重能力才写 Host 插件（tools/events/UI）。
3. **人工限制分层**：文案只教；真闸 = 工具拦截 / approval / 斜杠命令 / 阶段状态。
4. **Preset 与 Bundle 不要双挂同一插件**（resume 会 already registered）。
5. **SSOT 文件**（kanban / PROJECT-STATE / blackboard）支撑长程任务，不靠会话记忆 alone。

## 对固件 RCE Agent 的直接取舍

| 决策 | 取社区哪一派 |
|---|---|
| 交付形态 | kit / reverse-security：**树外 bundle + preset**，不 fork harness |
| 安全闸 | redteam + portable-multi-agent：**工具拦截 + 人斜杠授权** |
| 阶段闸 | redteam / voredteam：`stage_gate` / 阶段未齐拒前进 |
| 三角色 | dungeon-party / swarm：执行与核验分离、预算硬顶 |
| SSOT | voredteam / legacy-firmware / 本仓库 skill：kanban 落盘 |

## 参考链接（官方）

- 发布插件：https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md
- 架构：本地 `../deepseek-harness/docs/architecture.zh.md`
- 本仓库架构摘要：[`deepseek-harness-architecture.md`](./deepseek-harness-architecture.md)
