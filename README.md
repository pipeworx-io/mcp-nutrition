# mcp-nutrition

Nutrition MCP — wraps Open Food Facts API (free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "nutrition": {
      "url": "https://gateway.pipeworx.io/nutrition/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use nutrition
```

## License

MIT
