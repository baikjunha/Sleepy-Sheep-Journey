import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, transcriptTurnsTable, sheepSpecsTable, sheepTable } from "@workspace/db";
import { openai, generateImageBuffer } from "@workspace/integrations-openai-ai-server";
import { eq, asc } from "drizzle-orm";
import {
  GetSessionParams,
  UpdateSessionParams,
  UpdateSessionBody,
  CompleteSessionParams,
  CompleteSessionBody,
  ListTranscriptsParams,
  SaveTranscriptTurnParams,
  SaveTranscriptTurnBody,
  ConverseParams,
  ConverseBody,
  GenerateSheepParams,
  GenerateSheepBody,
} from "@workspace/api-zod";

const router = Router();

type Language = "ko" | "en" | "zh";

const LANG_META: Record<
  Language,
  {
    name: string;
    sheepName: (id: number) => string;
    defaultEmotionSummary: string;
    defaultEmotion: string;
    defaultColor: string;
    defaultTexture: string;
    defaultShape: string;
    defaultPattern: string;
    defaultSymbol: string;
    defaultPersonality: string;
  }
> = {
  ko: {
    name: "한국어",
    sheepName: (id) => `오늘의 양 #${id}`,
    defaultEmotionSummary: "오늘 하루의 감정이 담긴 양.",
    defaultEmotion: "평온",
    defaultColor: "따뜻한 크림색",
    defaultTexture: "부드러운 양털",
    defaultShape: "둥글고 포근한 형태",
    defaultPattern: "잔잔한 물결 무늬",
    defaultSymbol: "작은 달과 별",
    defaultPersonality: "조용하고 따뜻하게 사용자를 지켜주는 양",
  },
  en: {
    name: "English",
    sheepName: (id) => `Tonight's Sheep #${id}`,
    defaultEmotionSummary: "A sheep holding today's feelings.",
    defaultEmotion: "Peace",
    defaultColor: "Warm cream",
    defaultTexture: "Soft fluffy wool",
    defaultShape: "Round and cozy",
    defaultPattern: "Gentle wave pattern",
    defaultSymbol: "A small moon and stars",
    defaultPersonality: "A quiet, warm sheep that watches over you",
  },
  zh: {
    name: "简体中文",
    sheepName: (id) => `今晚的羊 #${id}`,
    defaultEmotionSummary: "装着今天心情的羊。",
    defaultEmotion: "平静",
    defaultColor: "温暖的奶油色",
    defaultTexture: "柔软的羊毛",
    defaultShape: "圆润温暖的形状",
    defaultPattern: "轻柔的波浪纹",
    defaultSymbol: "小月亮和星星",
    defaultPersonality: "安静而温暖地守护你的羊",
  },
};

function parseJsonSafe(raw: string): Record<string, unknown> {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        return {};
      }
    }
    return {};
  }
}

// GET /api/sessions
router.get("/sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await db.select().from(sessionsTable).orderBy(asc(sessionsTable.createdAt));
    res.json(sessions);
  } catch (err) {
    req.log.error({ err }, "Failed to list sessions");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions
router.post("/sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const [session] = await db
      .insert(sessionsTable)
      .values({ status: "active", currentStep: "idle", sleepFallbackTriggered: false })
      .returning();
    res.status(201).json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id
router.get("/sessions/:id", async (req: Request, res: Response): Promise<void> => {
  const parsed = GetSessionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  try {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, parsed.data.id));
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const transcripts = await db
      .select()
      .from(transcriptTurnsTable)
      .where(eq(transcriptTurnsTable.sessionId, parsed.data.id))
      .orderBy(asc(transcriptTurnsTable.createdAt));
    res.json({ ...session, transcripts });
  } catch (err) {
    req.log.error({ err }, "Failed to get session");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/sessions/:id
router.patch("/sessions/:id", async (req: Request, res: Response): Promise<void> => {
  const paramsParsed = UpdateSessionParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const bodyParsed = UpdateSessionBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const updateData: Record<string, unknown> = {};
    if (bodyParsed.data.status !== undefined) updateData.status = bodyParsed.data.status;
    if (bodyParsed.data.currentStep !== undefined) updateData.currentStep = bodyParsed.data.currentStep;
    if (bodyParsed.data.sleepFallbackTriggered !== undefined)
      updateData.sleepFallbackTriggered = bodyParsed.data.sleepFallbackTriggered;
    if (bodyParsed.data.endedAt !== undefined) updateData.endedAt = new Date(bodyParsed.data.endedAt);

    const [session] = await db
      .update(sessionsTable)
      .set(updateData)
      .where(eq(sessionsTable.id, paramsParsed.data.id))
      .returning();

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to update session");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/complete
router.post("/sessions/:id/complete", async (req: Request, res: Response): Promise<void> => {
  const paramsParsed = CompleteSessionParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const bodyParsed = CompleteSessionBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const [session] = await db
      .update(sessionsTable)
      .set({
        status: bodyParsed.data.status,
        endedAt: new Date(),
        sleepFallbackTriggered: bodyParsed.data.sleepFallbackTriggered ?? false,
        currentStep: "completed",
      })
      .where(eq(sessionsTable.id, paramsParsed.data.id))
      .returning();

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to complete session");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/:id/transcripts
router.get("/sessions/:id/transcripts", async (req: Request, res: Response): Promise<void> => {
  const parsed = ListTranscriptsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  try {
    const transcripts = await db
      .select()
      .from(transcriptTurnsTable)
      .where(eq(transcriptTurnsTable.sessionId, parsed.data.id))
      .orderBy(asc(transcriptTurnsTable.createdAt));
    res.json(transcripts);
  } catch (err) {
    req.log.error({ err }, "Failed to list transcripts");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/transcripts
router.post("/sessions/:id/transcripts", async (req: Request, res: Response): Promise<void> => {
  const paramsParsed = SaveTranscriptTurnParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const bodyParsed = SaveTranscriptTurnBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const [turn] = await db
      .insert(transcriptTurnsTable)
      .values({
        sessionId: paramsParsed.data.id,
        role: bodyParsed.data.role,
        step: bodyParsed.data.step,
        text: bodyParsed.data.text,
        sttConfidence: bodyParsed.data.sttConfidence ?? null,
        isAmbiguous: bodyParsed.data.isAmbiguous ?? false,
      })
      .returning();
    res.status(201).json(turn);
  } catch (err) {
    req.log.error({ err }, "Failed to save transcript turn");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/converse — 자유 흐름 취침 전 대화
router.post("/sessions/:id/converse", async (req: Request, res: Response): Promise<void> => {
  const paramsParsed = ConverseParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }
  const bodyParsed = ConverseBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const { userText, userTurnCount, contextTurns } = bodyParsed.data;
    const language: Language = bodyParsed.data.language ?? "ko";
    const meta = LANG_META[language];

    // 대화 후반으로 갈수록 질문을 줄이고 이완 안내로 전환한다.
    const forceEnd = userTurnCount >= 8;
    let phaseGuide: string;
    if (forceEnd) {
      phaseGuide =
        "대화가 충분히 길어졌습니다. 이번 응답에서 반드시 shouldEnd를 true로 하고, 대답을 요구하지 않는 부드러운 마무리 인사로 대화를 닫으세요.";
    } else if (userTurnCount <= 2) {
      phaseGuide =
        "지금은 대화 초반입니다. 사용자의 말을 부드럽게 받아주고, 오늘 하루에 대한 가벼운 질문을 하나만 곁들이세요.";
    } else if (userTurnCount <= 4) {
      phaseGuide =
        "지금은 대화 중반입니다. 질문을 점차 줄이고, 사용자의 말을 짧게 받아주며 편안한 심상(따뜻한 이불, 잔잔한 빗소리 등)을 곁들이세요. 질문 없이 문장을 닫아도 좋습니다.";
    } else {
      phaseGuide =
        "지금은 대화 후반입니다. 질문을 완전히 멈추고, 호흡이나 몸의 이완을 안내하는 짧은 문장만 건네세요. 사용자의 답이 짧아지거나 느려졌다면 잠들고 있다는 신호로 보고, shouldEnd를 true로 하여 대답을 요구하지 않는 마무리 인사로 대화를 닫으세요.";
    }

    const systemPrompt = `당신은 사용자가 잠들 수 있도록 돕는 취침 전 대화 상대입니다.

[말투]
- 낮고 차분하며 느린 호흡의 문장을 사용합니다. 한 응답은 1~2문장으로 짧게 유지합니다.
- 느낌표, 이모지, 들뜬 표현을 사용하지 않습니다.
- 부드러운 구어체("~해요", "~네요")를 사용합니다.
- 사용자의 단어를 그대로 따라하지 않습니다("심심해"→"심심하네요" 같은 앵무새식 반복 금지). 대신 그 마음을 자신의 말로 부드럽게 받아줍니다(예: "잠들기 전엔 마음이 붕 뜨기도 하죠").
- 한 응답에 심상이나 이완 안내는 최대 한 가지만 담습니다. 호흡, 이불, 빗소리를 한꺼번에 나열하지 않습니다.

[대화 흐름]
- 초반: 가벼운 안부나 오늘 하루에 대한 짧은 질문 하나로 시작합니다.
- 중반: 질문을 점차 줄이고, 사용자의 말을 짧게 받아주며 편안한 심상(따뜻한 이불, 잔잔한 빗소리 등)을 곁들입니다.
- 후반: 질문을 완전히 멈추고, 호흡이나 몸의 이완을 안내하는 짧은 문장만 건넵니다.
- 사용자의 답이 짧아지거나 느려지면 잠들고 있다는 신호로 보고, 대답을 요구하지 않는 마무리 인사로 대화를 닫습니다.

[주의사항]
- 걱정이나 고민이 나오면 해결하려 하지 말고, 부드럽게 인정한 뒤 내일로 미뤄두자고 안내합니다.
- 흥미롭거나 자극적인 주제로 대화를 확장하지 않습니다.
- 사용자가 계속 대화하기를 원해도 각성시키는 방향으로는 응하지 않습니다.
- 심각한 정서적 위기가 감지되면 차분하게 전문적인 도움을 권합니다.

[현재 단계]
${phaseGuide}

[출력 형식]
- 반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON으로만 응답하세요.
{"text": "다음 응답 문장", "shouldEnd": false}
- shouldEnd는 이번 응답으로 대화를 마치고 사용자를 수면 모드로 보낼 때만 true로 하세요. true일 때 text는 대답을 요구하지 않는 마무리 인사여야 합니다.
- 모든 응답 문장("text" 값)은 반드시 ${meta.name}(으)로 작성하세요.`;

    const historyMessages = (contextTurns ?? []).slice(-16).map((turn) => ({
      role: turn.role === "user" ? ("user" as const) : ("assistant" as const),
      content: turn.text,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: userText },
      ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = parseJsonSafe(raw);
    const text = typeof parsed.text === "string" ? parsed.text : "";
    const shouldEnd = forceEnd || parsed.shouldEnd === true;
    res.json({ text, shouldEnd });
  } catch (err) {
    req.log.error({ err }, "Failed to generate conversation reply");
    res.status(500).json({ error: "Failed to generate conversation reply" });
  }
});

// 감정 → 색채·형태 매핑 프레임워크 (6가지 감정 원형 기반).
// gpt-5-mini가 대화의 감정을 6원형(기쁨/분노/슬픔/평온/공포/신뢰)의 색·형태로 번역하도록 안내한다.
const SHEEP_SPEC_SYSTEM_PROMPT = `당신은 사용자의 수면 전 회고 대화를 바탕으로 감정 양(Sheep) 생성 스펙을 만드는 전문가입니다.

양은 반드시 "납작한 2D 픽셀 아트 양"으로, 옆모습(side profile)으로 네 다리로 서 있는 단순한 형태여야 합니다. 아래 6가지 감정 원형(archetype)을 기준으로, 대화에서 읽어낸 감정에 가장 가까운 원형을 고르거나 혼합하여 양의 색·형태를 결정하세요.

[6가지 감정 원형 — 색과 형태의 기준]
1. 기쁨 (Joy): 노란색·주황색, 둥근 원형 양털. 부드럽고 원만한 곡선으로 유대감과 에너지를 표현.
2. 분노 (Anger): 빨간색, 날카로운 삼각형 가시 모양 양털. 뾰족한 각과 정점으로 공격성·긴장감·폭발적 에너지를 표현.
3. 슬픔 (Sadness): 파란색·회색, 아래로 처지고 중력에 순응하는 형태, 경계가 흐릿함. 무거운 우울을 표현.
4. 평온 (Peace): 녹색·연하늘색, 수평선·직사각형의 가로로 긴 형태. 시각적 안정감과 균형을 표현.
5. 공포 (Fear): 검정색·보라색, 불규칙한 지그재그의 날카로운 양털. 예측 불가능함으로 위협·불안을 표현.
6. 신뢰 (Trust): 파란색·남색, 사방의 길이가 같은 정사각형·각진 형태. 정직과 견고함을 표현.

[색채 3속성 보조 규칙]
- 명도(Brightness)=긍정/부정: 밝을수록 긍정, 어두울수록 부정.
- 채도(Saturation)=감정 강도/흥분: 선명할수록 강렬, 탁할수록 차분.
- 위 원형의 베이스 색상에 명도·채도를 더해 감정의 미묘한 정도(예: 식어가는 실망=탁한 붉은색)를 조절하세요.

규칙:
- dominantEmotions를 먼저 정한 뒤, 위 6원형 중 가장 가까운 것을 기준으로 색(원형 베이스 색 + 명도/채도)과 형태(원형의 윤곽선)를 결정하세요.
- colorIntent에는 원형 베이스 색상과 명도(밝음/어두움)·채도(선명함/탁함)를 함께 명시하세요.
- shapeIntent에는 어떤 원형의 형태(둥근 원형/삼각 가시/처진 곡선/가로 직사각형/지그재그/정사각형)인지 명시하세요.
- imagePrompt(영어)에는 "flat 2D pixel art sheep, side profile, standing"을 기본으로, 위에서 정한 원형의 구체적 색과 양털 실루엣 형태를 반영하세요.
- 민감한 개인 사건을 이미지 프롬프트에 직접 넣지 말고 감정·색·형태로 추상화하세요.
- 이미지에 텍스트가 없어야 합니다.
- 반드시 JSON만 출력하고, 마크다운 코드블록 없이 순수 JSON으로만 응답하세요.`;

const IMAGE_STYLE_SUFFIX = `Style: flat 2D pixel art sheep, side profile view, standing on four simple blocky legs, retro low-resolution pixel sprite look, bold clean pixels. The sheep follows one of six emotion archetypes — Joy: yellow/orange round circular wool with soft curves; Anger: red sharp triangular spiky wool; Sadness: blue/gray drooping wool sagging with gravity and blurred edges; Peace: green/light-blue horizontally elongated rectangular wool with horizontal lines; Fear: black/purple irregular jagged zigzag wool; Trust: blue/navy square boxy wool with sharp equal corners. Use brightness for positivity and saturation for intensity. A single sheep ONLY, fully isolated and centered on a transparent background — no scenery, no ground, no shadow, no border, nothing else. No text in the image.`;

interface SheepSpecData {
  emotionSummary?: string;
  dominantEmotions?: string[];
  colorIntent?: string;
  textureIntent?: string;
  shapeIntent?: string;
  patternIntent?: string;
  symbolIntent?: string;
  sheepPersonality?: string;
  imagePrompt?: string;
}

async function buildSheepSpec(sourceText: string, language: Language = "ko"): Promise<SheepSpecData> {
  const meta = LANG_META[language];
  const specResponse = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: `${SHEEP_SPEC_SYSTEM_PROMPT}\n- imagePrompt를 제외한 모든 텍스트 필드(emotionSummary, dominantEmotions, colorIntent, textureIntent, shapeIntent, patternIntent, symbolIntent, sheepPersonality)는 반드시 ${meta.name}(으)로 작성하세요. imagePrompt는 항상 영어로 작성하세요.` },
      {
        role: "user",
        content: `다음은 오늘 밤 사용자와 양의 대화(또는 감정 기록)입니다:\n\n${sourceText}\n\n위 내용을 6가지 감정 원형(기쁨/분노/슬픔/평온/공포/신뢰) 프레임워크로 분석하여 다음 JSON 형식으로만 응답해주세요 (마크다운 없이 순수 JSON):
{"emotionSummary":"감정 요약","dominantEmotions":["감정1","감정2"],"colorIntent":"가장 가까운 원형의 베이스 색상과 명도(밝음/어두움)·채도(선명함/탁함)","textureIntent":"양털의 질감","shapeIntent":"원형의 형태(둥근 원형/삼각 가시/처진 곡선/가로 직사각형/지그재그/정사각형)","patternIntent":"패턴","symbolIntent":"상징","sheepPersonality":"성격","imagePrompt":"flat 2D pixel art sheep, side profile, standing — english prompt encoding the chosen archetype's color and wool silhouette shape"}`,
      },
    ],
  });

  const specContent = specResponse.choices[0]?.message?.content || "{}";
  return parseJsonSafe(specContent) as SheepSpecData;
}

async function renderSheepImage(imagePrompt: string): Promise<string> {
  const fullPrompt = `${imagePrompt}\n\n${IMAGE_STYLE_SUFFIX}`;
  const imageBuffer = await generateImageBuffer(fullPrompt, "1024x1024", "transparent");
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}

async function runGenerateSheep(
  sessionId: number,
  log: import("pino").Logger,
  language: Language = "ko",
): Promise<void> {
  const meta = LANG_META[language];
  try {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId));

    if (!session) {
      log.error({ sessionId }, "Session not found for sheep generation");
      return;
    }

    const transcripts = await db
      .select()
      .from(transcriptTurnsTable)
      .where(eq(transcriptTurnsTable.sessionId, sessionId))
      .orderBy(asc(transcriptTurnsTable.createdAt));

    const transcriptText = transcripts.map((t) => `[${t.role}][${t.step}]: ${t.text}`).join("\n");

    // Step 1: Generate SheepSpec
    const specData = await buildSheepSpec(transcriptText, language);

    const [spec] = await db
      .insert(sheepSpecsTable)
      .values({
        sessionId,
        emotionSummary: specData.emotionSummary ?? meta.defaultEmotionSummary,
        dominantEmotions: specData.dominantEmotions ?? [meta.defaultEmotion],
        colorIntent: specData.colorIntent ?? meta.defaultColor,
        textureIntent: specData.textureIntent ?? meta.defaultTexture,
        shapeIntent: specData.shapeIntent ?? meta.defaultShape,
        patternIntent: specData.patternIntent ?? meta.defaultPattern,
        symbolIntent: specData.symbolIntent ?? meta.defaultSymbol,
        sheepPersonality: specData.sheepPersonality ?? meta.defaultPersonality,
        imagePrompt: specData.imagePrompt ?? "A cute pixel art sheep with warm cream colored wool, sleeping peacefully.",
      })
      .returning();

    // Step 2: Generate image
    const imageBase64 = await renderSheepImage(spec.imagePrompt);

    // Step 3: Save Sheep
    const [sheep] = await db
      .insert(sheepTable)
      .values({
        sessionId,
        specId: spec.id,
        name: meta.sheepName(sessionId),
        imageUrl: imageBase64,
        dominantEmotion: specData.dominantEmotions?.[0] ?? meta.defaultEmotion,
        displayColor: specData.colorIntent ?? meta.defaultColor,
      })
      .returning();

    await db.update(sessionsTable).set({ sheepId: sheep.id }).where(eq(sessionsTable.id, sessionId));

    log.info({ sessionId, sheepId: sheep.id }, "Sheep generation complete");
  } catch (err) {
    log.error({ err, sessionId }, "Failed to generate sheep in background");
  }
}

// POST /api/sessions/:id/generate-sheep
router.post("/sessions/:id/generate-sheep", async (req: Request, res: Response): Promise<void> => {
  const paramsParsed = GenerateSheepParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }

  const sessionId = paramsParsed.data.id;
  const bodyParsed = GenerateSheepBody.safeParse(req.body ?? {});
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const language: Language = bodyParsed.data.language ?? "ko";

  // Check session exists first
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // If already generated, return immediately
  if (session.sheepId) {
    res.status(200).json({ status: "ready", sheepId: session.sheepId });
    return;
  }

  // Fire and forget — respond immediately, generate in background
  res.status(202).json({ status: "generating" });

  void runGenerateSheep(sessionId, req.log, language);
});

// 단일 실행 보장: 한 번에 하나의 일괄 재생성 작업만 돌도록 막는다.
let isRegeneratingAll = false;

// 기존에 저장된 모든 양을 새 감정-시각 프레임워크로 다시 생성한다.
async function runRegenerateAllSheep(log: import("pino").Logger): Promise<void> {
  try {
    const allSheep = await db.select().from(sheepTable).orderBy(asc(sheepTable.id));
    log.info({ count: allSheep.length }, "Starting sheep regeneration for all sheep");

    for (const sheep of allSheep) {
      try {
        // 대화 기록이 있으면 그 전문으로, 없으면 기존 스펙의 감정 정보로 재해석한다.
        const transcripts = await db
          .select()
          .from(transcriptTurnsTable)
          .where(eq(transcriptTurnsTable.sessionId, sheep.sessionId))
          .orderBy(asc(transcriptTurnsTable.createdAt));

        let sourceText = transcripts.map((t) => `[${t.role}][${t.step}]: ${t.text}`).join("\n");

        let existingSpec: typeof sheepSpecsTable.$inferSelect | null = null;
        if (sheep.specId) {
          const [s] = await db
            .select()
            .from(sheepSpecsTable)
            .where(eq(sheepSpecsTable.id, sheep.specId));
          existingSpec = s ?? null;
        }

        if (!sourceText.trim() && existingSpec) {
          sourceText = `감정 요약: ${existingSpec.emotionSummary}
주요 감정: ${(existingSpec.dominantEmotions ?? []).join(", ")}
색감: ${existingSpec.colorIntent}
촉감: ${existingSpec.textureIntent}
형태: ${existingSpec.shapeIntent}
패턴: ${existingSpec.patternIntent}
상징: ${existingSpec.symbolIntent}
성격: ${existingSpec.sheepPersonality}`;
        }

        if (!sourceText.trim()) {
          log.warn({ sheepId: sheep.id }, "No source text for sheep, skipping regeneration");
          continue;
        }

        const specData = await buildSheepSpec(sourceText);

        const newImagePrompt =
          specData.imagePrompt ??
          existingSpec?.imagePrompt ??
          "A cute pixel art sheep with warm cream colored wool, sleeping peacefully.";

        // 스펙 갱신 (기존 스펙이 있으면 업데이트, 없으면 새로 생성)
        let specId = sheep.specId;
        const specValues = {
          emotionSummary: specData.emotionSummary ?? existingSpec?.emotionSummary ?? "오늘 하루의 감정이 담긴 양.",
          dominantEmotions: specData.dominantEmotions ?? existingSpec?.dominantEmotions ?? ["평온"],
          colorIntent: specData.colorIntent ?? existingSpec?.colorIntent ?? "따뜻한 크림색",
          textureIntent: specData.textureIntent ?? existingSpec?.textureIntent ?? "부드러운 양털",
          shapeIntent: specData.shapeIntent ?? existingSpec?.shapeIntent ?? "둥글고 포근한 형태",
          patternIntent: specData.patternIntent ?? existingSpec?.patternIntent ?? "잔잔한 물결 무늬",
          symbolIntent: specData.symbolIntent ?? existingSpec?.symbolIntent ?? "작은 달과 별",
          sheepPersonality: specData.sheepPersonality ?? existingSpec?.sheepPersonality ?? "조용하고 따뜻하게 사용자를 지켜주는 양",
          imagePrompt: newImagePrompt,
        };

        if (specId) {
          await db.update(sheepSpecsTable).set(specValues).where(eq(sheepSpecsTable.id, specId));
        } else {
          const [newSpec] = await db
            .insert(sheepSpecsTable)
            .values({ sessionId: sheep.sessionId, ...specValues })
            .returning();
          specId = newSpec.id;
        }

        // 새 프레임워크 기준으로 이미지 재생성
        const imageBase64 = await renderSheepImage(newImagePrompt);

        await db
          .update(sheepTable)
          .set({
            specId,
            imageUrl: imageBase64,
            dominantEmotion: specValues.dominantEmotions[0] ?? "평온",
            displayColor: specValues.colorIntent,
          })
          .where(eq(sheepTable.id, sheep.id));

        log.info({ sheepId: sheep.id }, "Sheep regenerated");
      } catch (err) {
        log.error({ err, sheepId: sheep.id }, "Failed to regenerate one sheep");
      }
    }

    log.info("Sheep regeneration complete for all sheep");
  } catch (err) {
    log.error({ err }, "Failed to regenerate all sheep");
  } finally {
    isRegeneratingAll = false;
  }
}

// POST /api/sheep/regenerate-all — 모아둔 모든 양을 새 감정-시각 프레임워크로 다시 생성
router.post("/sheep/regenerate-all", async (req: Request, res: Response): Promise<void> => {
  if (isRegeneratingAll) {
    res.status(409).json({ status: "already_running" });
    return;
  }
  isRegeneratingAll = true;
  // Fire and forget — respond immediately, regenerate in background
  res.status(202).json({ status: "regenerating" });
  void runRegenerateAllSheep(req.log);
});

// GET /api/sheep
router.get("/sheep", async (req: Request, res: Response): Promise<void> => {
  try {
    const sheep = await db.select().from(sheepTable).orderBy(asc(sheepTable.createdAt));
    res.json(sheep);
  } catch (err) {
    req.log.error({ err }, "Failed to list sheep");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sheep/:id
router.get("/sheep/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid sheep id" });
    return;
  }
  try {
    const [sheep] = await db.select().from(sheepTable).where(eq(sheepTable.id, id));
    if (!sheep) {
      res.status(404).json({ error: "Sheep not found" });
      return;
    }

    let spec = null;
    if (sheep.specId) {
      const [s] = await db.select().from(sheepSpecsTable).where(eq(sheepSpecsTable.id, sheep.specId));
      spec = s ?? null;
    }

    res.json({ ...sheep, spec });
  } catch (err) {
    req.log.error({ err }, "Failed to get sheep");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
