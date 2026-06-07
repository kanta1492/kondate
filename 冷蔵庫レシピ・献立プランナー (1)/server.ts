/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is required. Please check your Secret keys in Settings."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Route: Generate recipes based on refrigerator ingredients
  app.post("/api/recipe/generate", async (req, res) => {
    try {
      const { ingredients, prepTimePreference, mealType, additionalRequest } = req.body;

      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: "冷蔵庫内の食材を1つ以上選択してください。" });
      }

      const client = getGeminiClient();

      // Formulate prompt with natural, simple, and clean tone
      const prepChoice = prepTimePreference ? `調理時間の希望: ${prepTimePreference}` : "調理時間の制限なし";
      const mealTypeChoice = mealType ? `想定される食事時間帯: ${mealType}` : "食事の時間帯指定なし";
      const userRequest = additionalRequest ? additionalRequest : "特になし";
      
      const prompt = `
あなたは余り物の食材を効率的に活用するためのシンプルで実用的なレシピを提案するプロの料理人・スマートな献立プランナーです。
ユーザーが選択した冷蔵庫の食材をもとに、健康的で手早く作れる現実的なレシピを最大3件、丁寧で客観的な日本語で提案してください。

◆ 冷蔵庫にある主要食材: ${ingredients.join(", ")}
◆ 調理時間の目安: ${prepChoice}
◆ 食事の想定時間帯: ${mealTypeChoice}
◆ 個別のご要望: ${userRequest}

【レシピ提案ルール】
1. 指定された主要食材を少なくとも1つ以上、効果的に活用する構成にしてください。
2. 一般的な家庭に常備されている基本調味料（塩、コショウ、砂糖、醤油、味噌、みりん、酒、酢、油、マヨネーズ、ケチャップ等）は、選択されていない場合でも使用して論理的に調味して構いません。
3. 実用的な視点（手際よく作れる工夫、他の食材での代用案、余った部分の保存ノウハウ等）を調理手順やアドバイス、ヒントに盛り込んでください。
4. 過剰な情緒的演出や、主婦・主夫を極端に応援・励ますようなおせっかいな表現は一切避け、シンプルで信頼できる専門的なレシピの提案に徹してください。
`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ユニークな連番ID（例：recipe_1, recipe_2, recipe_3）" },
                    title: { type: Type.STRING, description: "料理の名前（例：豚バラ大根のぽん酢炒め）" },
                    description: { type: Type.STRING, description: "料理の簡単な特徴や、美味しく仕上がるポイント（敬体（〜です・〜ます）で客観的に記述）" },
                    prepTime: { type: Type.INTEGER, description: "調理時間（およその分数、数値のみ、例：15）" },
                    difficulty: { 
                      type: Type.STRING, 
                      enum: ["簡単", "普通", "少し凝っている"],
                      description: "難易度" 
                    },
                    servingSize: { type: Type.INTEGER, description: "何人前かを表す数値（デフォルトは2人前）" },
                    ingredientsUsed: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "冷蔵庫内の食材リストから今回使った食材の名称"
                    },
                    ingredientsRequired: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "食材名・調味料名" },
                          amount: { type: Type.STRING, description: "分量（例：150g, 大さじ1.5, 少々）" }
                        },
                        required: ["name", "amount"]
                      },
                      description: "このレシピを完成させるために必要な【すべての食材・調味料】の分量リスト"
                    },
                    steps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "調理ステップを順番にわかりやすい文章で記述"
                    },
                    savingPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "調理の手際、冷蔵・冷凍保存の目安、食材の代用方法などの実用的なワンポイント"
                    },
                    nutritionEstimate: { type: Type.STRING, description: "期待できる栄養効果やメリット（簡潔に1〜2文で記述）" }
                  },
                  required: ["id", "title", "description", "prepTime", "difficulty", "servingSize", "ingredientsUsed", "ingredientsRequired", "steps", "savingPoints"]
                }
              }
            },
            required: ["recipes"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("AIからの応答を取得できませんでした。");
      }

      // Parse JSON from Gemini model
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Recipe generation error:", error);
      res.status(500).json({
        error: error.message || "レシピ生成中にエラーが発生しました。時間を置いて再度お試しください。",
      });
    }
  });

  // Serve static assets or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
