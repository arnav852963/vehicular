import dotenv from "dotenv";

dotenv.config({
    path:'./.env'
});

export const detectVehicle = async (imageUrl) => {
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_KEY}`;

    const vehicleKeywords = [
        "Vehicle", "Car", "Truck", "Motorcycle", "Bus", "Van",
        "Automobile", "Land vehicle", "License plate"
    ];

    const requestBody = {
        requests: [
            {
                image: { source: { imageUri: imageUrl } },
                features: [{ type: "LABEL_DETECTION", maxResults: 15 }]
            }
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) return false;

        const data = await response.json();
        const labels = data.responses[0].labelAnnotations || [];

        const detectedVehicle = labels.find(label =>
            vehicleKeywords.some(keyword => label.description.toLowerCase().includes(keyword.toLowerCase())) &&
            label.score > 0.60
        );

        return {
            error: false,
        isVehicle:!!detectedVehicle
        };

    } catch (error) {
        console.error("Vehicle detection failed:", error);
        return {
            error: true,
            message: error.message || "An error occurred during vehicle detection"
        };
    }
};