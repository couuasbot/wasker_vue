---
description: Summarize this session into bilingual (zh/en) blog posts under src/content/blog, then git commit & push
---

# /save-blog

Summarize the **current conversation session** into two Markdown blog posts (Chinese + English), save them into this repo, then commit and push.

## Requirements

### Output format

1. Generate **two** Markdown files:
   - `src/content/blog/zh/<YYYY-MM-DD>-<slug>.md`
   - `src/content/blog/en/<YYYY-MM-DD>-<slug>.md`
2. Each file must start with YAML frontmatter:

```yaml
---
title: "..."
date: YYYY-MM-DD
tags: ["...", "..."]
description: "..."
---
```

3. Article structure (both languages):
   - Background
   - Key takeaways / Best practices
   - Practical notes (e.g. how to apply)
   - References (links mentioned in the session)

### Slug rules

- `slug` must be **kebab-case**, ASCII only.
- If the title is Chinese, create an English slug.

### Save rules

1. Ensure directories exist:
   - `src/content/blog/zh`
   - `src/content/blog/en`
2. Use the **Write** tool to create/overwrite the two files.

### Git rules (do not skip)

1. Run `git status`.
2. Stage ONLY the two newly created/updated blog files.
3. Create a commit:
   - message format: `content: add session blog post <slug>`
4. Run `git push`.

### Safety

- Do NOT include secrets/tokens.
- If `git status` shows other unrelated changes, do NOT stage them.
- If push fails (auth/conflict), stop and report the exact error output.
