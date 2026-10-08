# Codex team for SF “Genys”

This project uses a leader-and-specialists workflow to reduce unnecessary model usage while keeping complex work reliable.

## Team

| Role | Agent | Model | Best used for |
| --- | --- | --- | --- |
| Leader | Primary Codex agent | `gpt-6.1-sol`, medium | Understand the request, plan, assign work, integrate changes, and report to you |
| Explorer | `site_explorer` | `gpt-6-luna`, medium | Fast read-only codebase discovery and dependency tracing |
| Content editor | `content_editor` | `gpt-6-luna`, low | Copy, JSON content, metadata, and small isolated markup edits |
| UI builder | `ui_builder` | `gpt-6.1-sol`, medium | Multi-file frontend features, JavaScript, and complex responsive work |
| Reviewer | `quality_reviewer` | `gpt-6.1-sol`, high | Focused final review of meaningful or risky changes |

The default subagent is Luna. Sol is reserved for work where planning, integration, debugging, or careful review materially improves reliability. Astra is not part of the normal workflow.

## How to use it

Give the leader a normal command, for example:

> Add a bilingual events page that matches the current site. Plan the work, delegate where useful, and keep token use low.

The leader will decide whether the task is small enough to handle directly. For larger work it will assign independent tasks, prevent agents from editing the same file simultaneously, combine the results, and validate the final state.

You can override routing in a prompt:

- “Use only Luna agents for this task.”
- “Do not delegate; handle this directly.”
- “Have the explorer map the change first, then let the UI builder implement it.”
- “Use Sol for the implementation and reviewer.”
- “Show me the delegation plan before editing.”

## Token-saving rules

- Small tasks stay with the leader; spawning agents has overhead.
- Read-heavy and repetitive work goes to Luna.
- Agents receive narrow scopes and return concise evidence.
- Parallel work is used only for genuinely independent tasks.
- Review is proportional to risk instead of automatic for every tiny edit.
- Astra requires explicit user direction or a clearly explained escalation.

Configuration lives in [`.codex/config.toml`](.codex/config.toml), specialist definitions live in [`.codex/agents/`](.codex/agents/), and leader behavior lives in [`AGENTS.md`](AGENTS.md).
