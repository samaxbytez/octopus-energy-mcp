# Setup

## 1. Get your credentials

1. Sign in to your Octopus Energy account and open the [API access page](https://octopus.energy/dashboard/developer/).
2. Copy the API key (`sk_live_...`).
3. Note your account number (`A-1234ABCD`).

Both are optional: without them only the product and tariff tools work.

## 2. Connect your AI app

Every config below runs `npx -y octopus-energy-mcp` with the two environment variables. Node.js 24+ is required.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "octopus-energy": {
      "command": "npx",
      "args": ["-y", "octopus-energy-mcp"],
      "env": {
        "OCTOPUS_ENERGY_API_KEY": "sk_live_...",
        "OCTOPUS_ENERGY_ACCOUNT_NUMBER": "A-1234ABCD"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add octopus-energy -e OCTOPUS_ENERGY_API_KEY=sk_live_... -e OCTOPUS_ENERGY_ACCOUNT_NUMBER=A-1234ABCD -- npx -y octopus-energy-mcp
```

### Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.octopus-energy]
command = "npx"
args = ["-y", "octopus-energy-mcp"]
env = { OCTOPUS_ENERGY_API_KEY = "sk_live_...", OCTOPUS_ENERGY_ACCOUNT_NUMBER = "A-1234ABCD" }
```

### Cursor

`~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project): same JSON as Claude Desktop.

### VS Code

`.vscode/mcp.json`. The `inputs` block prompts for the key so it is not stored in the file:

```json
{
  "inputs": [
    { "id": "octopus-key", "type": "promptString", "description": "Octopus Energy API key", "password": true }
  ],
  "servers": {
    "octopus-energy": {
      "command": "npx",
      "args": ["-y", "octopus-energy-mcp"],
      "env": {
        "OCTOPUS_ENERGY_API_KEY": "${input:octopus-key}",
        "OCTOPUS_ENERGY_ACCOUNT_NUMBER": "A-1234ABCD"
      }
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`: same JSON as Claude Desktop.

### Gemini CLI

`~/.gemini/settings.json`: same `mcpServers` JSON as Claude Desktop.

### ChatGPT and Grok

These only support remote HTTPS MCP servers. This server runs locally over stdio, so it can't be added to them directly.

## 3. Check it works

Ask: "List the current Octopus green tariffs." This needs no credentials. Then ask about your account to test the key.
