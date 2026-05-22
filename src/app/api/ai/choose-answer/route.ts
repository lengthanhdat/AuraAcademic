import { NextRequest, NextResponse } from "next/server";

type Option = {
  id: string;
  label: string;
  text: string;
};

type RequestBody = {
  question: string;
  options: Option[];
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export async function GET() {
  return NextResponse.json({
    enabled: !!(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    },
  });
}

function buildPrompt(question: string, options: Option[]) {
  return [
    "Bạn là trợ lý giáo viên. Hãy chọn chính xác 1 đáp án đúng cho câu hỏi trắc nghiệm.",
    "Chỉ trả về JSON hợp lệ, không markdown, không giải thích.",
    "Định dạng bắt buộc: {\"correctLabel\":\"A\"}",
    "",
    `Câu hỏi: ${question}`,
    ...options.map((option) => `${option.label}. ${option.text}`),
  ].join("\n");
}

function parseAnswerLabel(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const data = JSON.parse(cleaned);
    const label = String(data.correctLabel || data.answer || data.label || "").trim().toUpperCase();
    if (/^[A-D]$/.test(label)) return label;
  } catch {
    // Fall through to text parsing.
  }

  const match = cleaned.match(/(?:correctLabel|answer|đáp án|dap an)\s*[:：]\s*["']?([A-D])\b/i);
  if (match) return match[1].toUpperCase();

  const standalone = cleaned.match(/\b([A-D])\b/);
  return standalone ? standalone[1].toUpperCase() : null;
}

async function askOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${detail.slice(0, 240)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function askGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 240)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join("\n") || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    if (!body.question || !Array.isArray(body.options) || body.options.length === 0) {
      return NextResponse.json({ error: "Thiếu câu hỏi hoặc đáp án." }, { status: 400 });
    }

    const prompt = buildPrompt(body.question, body.options);
    const rawAnswer = (await askOpenAI(prompt)) || (await askGemini(prompt));
    if (!rawAnswer) {
      return NextResponse.json(
        { error: "Chưa cấu hình OPENAI_API_KEY hoặc GEMINI_API_KEY cho Next server." },
        { status: 424 }
      );
    }

    const correctLabel = parseAnswerLabel(rawAnswer);
    if (!correctLabel) {
      return NextResponse.json({ error: "AI không trả về nhãn đáp án hợp lệ.", rawAnswer }, { status: 422 });
    }

    return NextResponse.json({ correctLabel, rawAnswer });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Không thể gọi AI chọn đáp án." }, { status: 500 });
  }
}
