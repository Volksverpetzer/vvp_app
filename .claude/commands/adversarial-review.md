---
description: Run the adversarial-reviewer agent against a PR (usage: /adversarial-review <PR number or branch>)
---

Launch the `adversarial-reviewer` agent (defined in .claude/agents/adversarial-reviewer.md) against: $ARGUMENTS

- If $ARGUMENTS is a number, review that GitHub PR (`gh pr diff`/`gh pr view`).
- If it is a branch name, review `git diff prerelease...<branch>`.
- If empty, review the current branch against `prerelease`.

Pass along: repo root, the base branch, and the note that full `pnpm lint` hangs in this environment (targeted `pnpm test -- <path>` is fine). Relay the agent's ranked findings verbatim — do not soften or summarize them away.
