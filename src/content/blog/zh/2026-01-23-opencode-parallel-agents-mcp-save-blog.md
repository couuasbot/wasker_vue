---
title: "OpenCode 实战：并行 Agent、MCP 与自定义 /save-blog 命令"
date: 2026-01-23
tags: ["opencode", "oh-my-opencode", "agent", "mcp", "workflow", "claude-code"]
description: "从一次真实会话出发，梳理 OpenCode 的并行 agent 上下文汇总方法、MCP 触发方式，以及如何把会话总结自动保存为双语博客并完成 git 提交与推送。"
---

## 背景

这次会话围绕 OpenCode / oh-my-opencode 的工程化使用展开：

- 如何用并行 agent 提升“探索/研究”效率，同时避免上下文混乱
- 在 OpenCode 里如何触发 MCP（Model Context Protocol）工具调用
- 如何理解 Claude Code 生态里的 **agents / commands / skills** 的分工
- 参考开源项目 [everything-claude-code](https://github.com/affaan-m/everything-claude-code)，在当前项目里安装一个自定义命令：`/save-blog`
- 让 `/save-blog` 把当前会话内容总结成 **中英文 Markdown**，落到 `src/content/blog`，并自动 `git commit` + `git push`

会话过程中也遇到了典型的落地问题：自定义 slash command 在某些运行时不会自动被识别，需要放到正确的加载目录；以及 push 需要配置 git 身份与 SSH。

## 关键要点 / 最佳实践

### 1) 并行 agent 的上下文管理：隔离执行 + 中央汇总

- **并行 agent 默认是隔离的**：每个 agent 只基于自己的 prompt 工作，不会自动共享其他 agent 的结论。
- **统一上下文需要主控汇总**：把各 agent 的结果收敛成一个“单一可执行版本”。

推荐的汇总协议（最终上下文）：

1. Problem/Goal：目标与验收标准
2. Findings：按来源列出（Explore#1/Explore#2/Librarian…）
3. Conflicts/Unknowns：冲突点与缺失信息
4. Decision：最终方案与理由（约束、风险、与代码库一致性）
5. Plan：可验证的步骤（含命令与证据）

### 2) 触发 MCP：先配置 server，再显式要求调用 tool

- 前置条件：在 OpenCode/Claude Code 配置中声明 MCP server（stdio 或 http），并重启让其加载。
- 使用时：在对话里明确说明“使用哪个 MCP + 哪个 tool + 参数”。
- 工具过多会挤占上下文：按项目只启用必要的 MCP（开源项目也强调“不要一次启用太多工具”）。

### 3) Agents / Commands / Skills 的区别（不只是“提示词+工具”）

它们的“材料”都像提示词，但**工程意义不同**：

- **Agent**：可被委派的执行单元（角色 + 边界 + 工具白名单/模型选择）。更像“把活交给专职同事”。
- **Command**：用户入口的流程编排（/plan、/tdd 这类），像“宏命令/脚本”。
- **Skill**：可复用的 SOP/知识块，更像“库函数/检查清单”，常被 command 或 agent 引用。

一句话：**Command = 入口，Agent = 执行者，Skill = 可复用能力**。

### 4) 把会话沉淀为博客：/save-blog 的最小可用设计

我们为项目安装了自定义命令 `save-blog`，要求它：

- 生成两篇文章：
  - `src/content/blog/zh/<date>-<slug>.md`
  - `src/content/blog/en/<date>-<slug>.md`
- 统一 frontmatter（title/date/tags/description）
- 结构固定：Background / Key takeaways / Practical notes / References
- Git 操作安全：只 stage 新增的两篇文章，commit 后 push；如果存在无关改动不得顺带提交

落地经验：

- 有些 OpenCode 运行时**不会自动扫描项目内** `.claude/commands/`；需要把命令同步到用户目录 `~/.claude/commands/` 并重启客户端。
- `git push` 若走 HTTPS 可能被“无交互终端”卡住，改用 SSH 更稳。

## 实操记录（可复用）

### 1) 安装命令到项目 & 用户目录

- 项目内：`.claude/commands/save-blog.md`
- 用户级（便于被运行时发现）：`~/.claude/commands/save-blog.md`

### 2) 配置 Git 身份（否则无法 commit）

```bash
git config user.name "你的名字"
git config user.email "你的邮箱"
```

### 3) 配置 GitHub SSH（避免 HTTPS 交互）

```bash
ssh-keygen -t ed25519 -C "你的邮箱" -f ~/.ssh/id_ed25519
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh -T git@github.com
git remote set-url origin git@github.com:couuas/wasker_vue.git
git push
```

## 参考

- Everything Claude Code: https://github.com/affaan-m/everything-claude-code
- MCP（Model Context Protocol）：
  - 关键实践：按项目启用少量 MCP，避免工具过多压缩上下文
