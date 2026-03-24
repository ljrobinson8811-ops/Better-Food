import { base44 } from "@/api/base44Client";
import { logError, ErrorTypes } from "./errorLogger";

export async function moderateAndStorePhoto(photoUrl, menuItemId, recipeId, caption, userId) {
  const queueEntry = await base44.entities.ContentModerationQueue.create({
    photo_url: photoUrl, submitted_by: userId, status: "pending",
    menu_item_id: menuItemId, recipe_id: recipeId,
  });
  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Review this image: Is it safe? Is it food-related? Rate it 0.0-1.0 (1.0 = completely safe food photo). Is there anything offensive or inappropriate?`,
      file_urls: [photoUrl],
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" }, is_food: { type: "boolean" },
          reason: { type: "string" }, score: { type: "number" }
        }
      }
    });
    const approved = result?.safe && result?.is_food && (result?.score || 0) > 0.7;
    await base44.entities.ContentModerationQueue.update(queueEntry.id, {
      status: approved ? "approved" : "flagged",
      ai_score: result?.score, ai_verdict: result?.reason,
    });
    if (approved) {
      await base44.entities.CommunityPhoto.create({
        photo_url: photoUrl, menu_item_id: menuItemId, recipe_id: recipeId,
        caption, status: "approved", likes_count: 0, liked_by: [],
      });
    }
    return { approved, score: result?.score, verdict: result?.reason };
  } catch (err) {
    await logError(ErrorTypes.MODERATION_ERROR, err.message, { photoUrl }, "high");
    await base44.entities.ContentModerationQueue.update(queueEntry.id, {
      status: "flagged", ai_verdict: "Service error — manual review required",
    });
    throw err;
  }
}