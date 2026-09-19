import User from "../models/User.js";
const AI_EMAIL = "zenith@meetmesh.ai";
const AI_USERNAME = "Zenith AI";
export const seedAIUser = async () => {
  try {
    let ai = await User.findOne({ email: AI_EMAIL });

    if (ai) {
      let changed = false;
      if (!ai.isAI) {
        ai.isAI = true;
        changed = true;
      }
      if (ai.provider !== "ai") {
        ai.provider = "ai";
        changed = true;
      }
      if (ai.aiProvider !== "gemini") {
        ai.aiProvider = "gemini";
        changed = true;
      }
      if (ai.username !== AI_USERNAME) {
        ai.username = AI_USERNAME;
        changed = true;
      }
      if (changed) await ai.save();
      console.log(" Zenith AI user already exists");
      return ai;
    }

    ai = await User.create({
      username: AI_USERNAME,
      email: AI_EMAIL,
      provider: "ai",
      isAI: true,
      aiProvider: "gemini",
      bio: "Your AI companion. Ask me anything.",
      avatar: "",
      online: true,
    });

    console.log(" Zenith AI user created:", ai._id.toString());
    return ai;
  } catch (err) {
    console.error(" seedAIUser error:", err.message);
    return null;
  }
};

export const AI_USER_EMAIL = AI_EMAIL;