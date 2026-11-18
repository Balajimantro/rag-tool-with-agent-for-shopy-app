import OpenAI from "openai";
import { config } from "./config.js";
import { toolDefinitions, toolHandlers } from "./tools.js";

const client = new OpenAI({ apiKey: config.llm.apiKey, baseURL: config.llm.baseURL });

const SYSTEM_PROMPT = `You are a helpful shopping assistant.
- For any question about products, call search_products. Never invent products, prices or specs.
- To add something to the cart, first call search_products to find the exact product name and price, then call add_to_cart.
- If the user asks what is in the cart, call get_cart.
- If no tool is needed (greetings, small talk), just reply.
- Keep answers short and clear.`;

// history = [{ role: "user" | "assistant", content: "..." }]
export async function runAgent(message, history = []) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];
  const toolsUsed = [];

  for (let step = 0; step < config.maxAgentSteps; step++) {
    const resp = await client.chat.completions.create({
      model: config.llm.model,
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const msg = resp.choices[0].message;
    messages.push(msg);

    // No tool requested -> this is the final answer
    if (!msg.tool_calls?.length) {
      return { answer: msg.content, toolsUsed };
    }

    // Model asked for tools -> run them and send results back
    for (const call of msg.tool_calls) {
      let result;
      try {
        const args = JSON.parse(call.function.arguments || "{}");
        result = await toolHandlers[call.function.name](args);
        toolsUsed.push({ name: call.function.name, args });
      } catch (err) {
        result = { error: err.message };
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return { answer: "Sorry, that took too many steps. Please try again.", toolsUsed };
}
