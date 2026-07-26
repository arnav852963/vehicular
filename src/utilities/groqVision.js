import dotenv from "dotenv";
import OpenAI from "openai";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" });
}


const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export const detectVehicleWithGroq = async (publicUrls) => {
    try {


        const response = await groq.chat.completions.create({
            model: "qwen/qwen3.6-27b",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Does this image contain a vehicle? Reply strictly with a JSON object: { \"isVehicle\": true/false, \"reason\": \"brief reason\" }" },
                        { type: "image_url", image_url: { url: publicUrls[0] } }
                    ]
                }
            ],

            response_format: { type: "json_object" }
        });


        const result = JSON.parse(response.choices[0].message.content);

        console.log(result)
        return {
            url: publicUrls[0],
            error: false,
            isVehicle: result.isVehicle,
            message: result.reason
        };

    } catch (error) {
        console.error("Groq detection failed:", error);
        return { error: true, message: error.message, isVehicle: false };
    }
};
