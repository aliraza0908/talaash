type TemplateData = Record<string, unknown>;

const colors = { cream: "#f6f3ee", green: "#275c4b", lavender: "#c9bde0", ink: "#18231f" };

// Escaping keeps user supplied names and messages safe inside HTML email.
function safe(value: unknown) { return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character)); }

// This shared shell keeps every Talaash email visually consistent.
function shell(title: string, content: string) { return `<!doctype html><html><body style="margin:0;background:${colors.cream};font-family:Arial,sans-serif;color:${colors.ink};"><div style="max-width:560px;margin:0 auto;padding:32px 20px;"><div style="font-size:28px;font-weight:700;color:${colors.green};">talash<span style="color:${colors.lavender};">.</span></div><div style="margin-top:28px;padding:32px;background:#fff;border-radius:18px;"><h1 style="margin:0 0 16px;font-size:26px;">${safe(title)}</h1>${content}</div><p style="font-size:12px;color:#68736e;text-align:center;">A network for people building what is next in Pakistan.</p></div></body></html>`; }

export function welcomeEmail(data: TemplateData) { return shell("Welcome to Talash", `<p style="line-height:1.6;">Hi ${safe(data.name || "there")}, your ${safe(data.role || "Talash")} account is ready to grow.</p><p style="line-height:1.6;">Complete your profile, share your work, and find people who are excited about what you can do next.</p>`); }
export function contactEmail(data: TemplateData) { return shell("New contact message", `<p><strong>From:</strong> ${safe(data.name)}</p><p><strong>Email:</strong> ${safe(data.email)}</p><p style="line-height:1.6;white-space:pre-wrap;">${safe(data.message)}</p>`); }
export function adminAlertEmail(data: TemplateData) { return shell("New student signup", `<p style="line-height:1.6;">A new student joined Talash.</p><p><strong>Email:</strong> ${safe(data.email)}</p><p><strong>Role:</strong> ${safe(data.role)}</p>`); }