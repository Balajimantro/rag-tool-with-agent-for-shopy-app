import { searchDocs } from "./rag.js";
import { addToCart, getCart } from "./cart.js";

// What the model reads to decide which tool to use
export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the product catalog (PDF) for product details such as name, price, specs, features. Use for any question about products.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "What to look for, e.g. 'bluetooth speaker'" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description:
        "Add a product to the shopping cart. Use the exact product name and price found via search_products.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Exact product name" },
          qty: { type: "number", description: "Quantity, default 1" },
          price: { type: "number", description: "Unit price from the catalog" },
        },
        required: ["product"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cart",
      description: "Show what is currently in the shopping cart.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// The real functions your code runs when the model asks
export const toolHandlers = {
  search_products: async ({ query }) => {
    const results = await searchDocs(query);
    return results.map((r) => r.text);
  },
  add_to_cart: async (args) => addToCart(args),
  get_cart: async () => getCart(),
};
