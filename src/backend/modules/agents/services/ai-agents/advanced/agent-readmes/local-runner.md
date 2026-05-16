# Local Runner Agent

The Local Runner Agent queues sandbox/local computer jobs for builds, tests, and generated app hosting.

## Rules

- Requires confirmation for local-computer and package-install risk.
- Emits process id, parent scope id, user id, CPU/RAM estimates, and status events.
- Returns command, args, workspace, artifacts, and validation summary.
