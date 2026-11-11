type AiRequest = { feature: "analyzer" | "bio" | "gig"; profile?: Record<string, unknown>; skills?: string[]; gig?: Record<string, unknown> };

// Keep the provider behind one function so it can be swapped for another OpenAI-compatible API later.
export async function generateAiContent(input: AiRequest) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI features are not configured yet.");
  const endpoint = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const prompts = { analyzer: `Analyze this student profile: ${JSON.stringify(input.profile)}. Return JSON with score (0-100), strengths (array), missing (array), and tips (exactly 3 concrete tips).`, bio: `Write a professional, warm student bio from these skills: ${(input.skills || []).join(", ")}. Return JSON with one bio string under the key bio.`, gig: `Suggest a gig title and description for this student: ${JSON.stringify(input.gig)}. Return JSON with title and description.` };
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, temperature: .6, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are a practical career coach. Return valid JSON only." }, { role: "user", content: prompts[input.feature] }] }) });
  if (!response.ok) throw new Error("The AI service is temporarily unavailable.");
  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI returned an empty response.");
  return JSON.parse(content) as Record<string, unknown>;
}
