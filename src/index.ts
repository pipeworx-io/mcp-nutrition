interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Nutrition MCP — wraps Open Food Facts API (free, no auth)
 *
 * Tools:
 * - search_products: search food products by name, brand, or keyword
 * - get_product: full nutrition details for a product by barcode
 */


const BASE_URL = 'https://world.openfoodfacts.org';

type Nutriments = {
  'energy-kcal_100g'?: number;
  fat_100g?: number;
  'saturated-fat_100g'?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
  sodium_100g?: number;
};

type Product = {
  id?: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  serving_size?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  image_url?: string;
  ingredients_text?: string;
  allergens?: string;
  nutriments?: Nutriments;
};

type SearchProduct = Product & {
  code?: string;
};

const tools: McpToolExport['tools'] = [
  {
    name: 'search_products',
    description:
      'Search for food products by name, brand, or keyword. Returns product name, brand, Nutri-Score, and key nutrition facts.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (product name, brand, or ingredient)' },
        limit: { type: 'number', description: 'Number of results to return (1-20, default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product',
    description:
      'Get full nutrition details for a food product by its barcode (EAN/UPC).',
    inputSchema: {
      type: 'object',
      properties: {
        barcode: { type: 'string', description: 'Product barcode (EAN-13 or UPC-A)' },
      },
      required: ['barcode'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_products':
      return searchProducts(args.query as string, (args.limit as number) ?? 5);
    case 'get_product':
      return getProduct(args.barcode as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function formatNutriments(n: Nutriments | undefined) {
  if (!n) return null;
  return {
    calories_per_100g: n['energy-kcal_100g'] ?? null,
    fat_g: n.fat_100g ?? null,
    saturated_fat_g: n['saturated-fat_100g'] ?? null,
    carbohydrates_g: n.carbohydrates_100g ?? null,
    sugars_g: n.sugars_100g ?? null,
    fiber_g: n.fiber_100g ?? null,
    protein_g: n.proteins_100g ?? null,
    salt_g: n.salt_100g ?? null,
    sodium_g: n.sodium_100g ?? null,
  };
}

async function searchProducts(query: string, limit: number) {
  const count = Math.min(20, Math.max(1, limit));
  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: String(count),
  });
  const res = await fetch(`${BASE_URL}/cgi/search.pl?${params}`);
  if (!res.ok) throw new Error(`Open Food Facts search error: ${res.status}`);

  const data = (await res.json()) as { count: number; products: SearchProduct[] };

  return {
    total_found: data.count,
    products: data.products.map((p) => ({
      barcode: p.code ?? p.id ?? null,
      name: p.product_name ?? null,
      brand: p.brands ?? null,
      quantity: p.quantity ?? null,
      nutriscore: p.nutriscore_grade?.toUpperCase() ?? null,
      nova_group: p.nova_group ?? null,
      image_url: p.image_url ?? null,
      nutrition: formatNutriments(p.nutriments),
    })),
  };
}

async function getProduct(barcode: string) {
  const cleanBarcode = barcode.replace(/\D/g, '');
  const res = await fetch(`${BASE_URL}/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`);
  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const data = (await res.json()) as { status: number; product: Product };
  if (data.status === 0) throw new Error(`Product not found for barcode: "${barcode}"`);

  const p = data.product;
  return {
    barcode: cleanBarcode,
    name: p.product_name ?? null,
    brand: p.brands ?? null,
    quantity: p.quantity ?? null,
    serving_size: p.serving_size ?? null,
    categories: p.categories ?? null,
    ingredients: p.ingredients_text ?? null,
    allergens: p.allergens ?? null,
    nutriscore: p.nutriscore_grade?.toUpperCase() ?? null,
    nova_group: p.nova_group ?? null,
    image_url: p.image_url ?? null,
    nutrition_per_100g: formatNutriments(p.nutriments),
  };
}

export default { tools, callTool } satisfies McpToolExport;
