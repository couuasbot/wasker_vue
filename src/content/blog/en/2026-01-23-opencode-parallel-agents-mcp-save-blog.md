---
title: "OpenCode in Practice: Parallel Agents, MCP, and a Custom /save-blog Command"
date: 2026-01-23
tags: ["opencode", "oh-my-opencode", "agent", "mcp", "workflow", "claude-code"]
description: "A practical walkthrough of managing context with parallel agents, triggering MCP tools, and installing a /save-blog command that turns a session into bilingual Markdown posts with git commit + push."
---

## Background

This session focused on making OpenCode / oh-my-opencode workflows more “engineering-grade”:

- How to use parallel agents effectively without losing context
- How MCP (Model Context Protocol) is configured and triggered in OpenCode
- The practical difference between **agents**, **commands**, and **skills** in Claude Code tooling
- How to borrow ideas from [everything-claude-code](https://github.com/affaan-m/everything-claude-code) and install a custom `/save-blog` command in the current project
- How `/save-blog` can summarize the current session into **bilingual Markdown**, save to `src/content/blog`, then run `git commit` + `git push`

Along the way we hit two common adoption issues: custom slash commands not being discovered by certain runtimes unless installed into the right directory, and git push requiring proper identity + SSH configuration in non-interactive environments.

## Key takeaways / Best practices

### 1) Parallel agent context: isolated execution + centralized synthesis

- Parallel agents are **isolated by default**: each agent works from its own prompt and does not automatically share results.
- A “controller” (the main chat) should **synthesize** outputs into a single, actionable context.

Suggested synthesis template:

1. Problem/Goal (with acceptance criteria)
2. Findings (grouped by source: Explore#1, Explore#2, Librarian…)
3. Conflicts/Unknowns
4. Decision (with constraints/risks)
5. Plan (verifiable steps + commands)

### 2) Triggering MCP: configure servers first, then explicitly request tools

- Prerequisite: declare MCP servers in your OpenCode/Claude Code config (stdio or HTTP) and restart to load them.
- Usage: explicitly specify “which MCP + which tool + arguments”.
- Don’t enable too many tools: too many MCPs/tools can shrink the effective context window.

### 3) Agents vs Commands vs Skills (it’s not only “prompts + tools”)

They may look similar, but the engineering intent differs:

- **Agent**: a delegated execution unit (role + scope + tool allowlist/model selection). Think “specialist teammate”.
- **Command**: a user-facing entrypoint that expands into a repeatable workflow (a macro).
- **Skill**: a reusable SOP/knowledge chunk (checklists/patterns) referenced by commands or agents.

In one line: **Command = entrypoint, Agent = executor, Skill = reusable playbook**.

### 4) Session → blog automation: a minimal /save-blog design

We installed a custom `save-blog` command that requires:

- Two posts generated:
  - `src/content/blog/zh/<date>-<slug>.md`
  - `src/content/blog/en/<date>-<slug>.md`
- Consistent frontmatter (title/date/tags/description)
- Fixed structure: Background / Key takeaways / Practical notes / References
- Safe git behavior: stage **only** the two blog files, commit, then push; never include unrelated changes

Practical note:

- Some OpenCode runtimes won’t discover project-level `.claude/commands/` automatically. Installing into `~/.claude/commands/` and restarting the client is often required.
- In non-interactive terminals, HTTPS pushes may fail; SSH is usually more reliable.

## Practical notes (copy/paste)

### 1) Install the command (project + user level)

- Project: `.claude/commands/save-blog.md`
- User (for discovery): `~/.claude/commands/save-blog.md`

### 2) Configure git identity (required for commits)

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

### 3) Configure GitHub SSH (avoid HTTPS prompts)

```bash
ssh-keygen -t ed25519 -C "you@example.com" -f ~/.ssh/id_ed25519
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
ssh -T git@github.com
git remote set-url origin git@github.com:couuas/wasker_vue.git
git push
```

## References

- Everything Claude Code: https://github.com/affaan-m/everything-claude-code
