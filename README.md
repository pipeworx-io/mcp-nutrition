# @pipeworx/mcp-nutrition

MCP server for nutrition data — food search and nutritional info via Open Food Facts.

## Tools

| Tool | Description |
|------|-------------|
| `search_products` | Search for food products by name, brand, or keyword |
| `get_product` | Get full nutrition details for a product by barcode (EAN/UPC) |

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

## CLI Usage

```bash
npx pipeworx use nutrition
```

## License

MIT
