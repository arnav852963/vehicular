import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: "./.env" });
}

export const detectVehicle = async (imageUrl) => {
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_KEY}`;

    if (!imageUrl || typeof imageUrl !== "string") {
        return { error: true, message: "imageUrl is required" };
    }


    const vehicleKeywords = [
        "vehicle",
        "car",
        "automobile",
        "motor vehicle",
        "land vehicle",
        "truck",
        "bus",
        "van",
        "motorcycle",
        "scooter",
        "bicycle",
        "license plate",
        "number plate",
        "wheel",
        "tire",
        "tyre",
        "headlamp",
        "bumper",
        "grille",
        "automotive",
        "vehicle registration plate"
    ];

    const vehicleObjectNames = [
        "vehicle",
        "car",
        "truck",
        "bus",
        "van",
        "motorcycle",
        "scooter",
        "bicycle"
    ];

    const requestBody = {
        requests: [
            {
                image: { source: { imageUri: imageUrl } },
                features: [
                    { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                    { type: "LABEL_DETECTION", maxResults: 25 },
                    { type: "SAFE_SEARCH_DETECTION" }
                ]
            }
        ]
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json().catch(() => null);


        if (!response.ok) {
            return {
                error: true,
                message: data?.error?.message || `Vision API request failed (${response.status})`,
                status: response.status,
                visionError: data?.error || data
            };
        }

        const first = data?.responses?.[0] || {};

        if (first?.error?.message) {
            return {
                error: true,
                message: first.error.message,
                visionError: first.error
            };
        }

        const safe = first.safeSearchAnnotation;
        const BAD = new Set(["LIKELY", "VERY_LIKELY"]);
        if (safe && (BAD.has(safe.adult) || BAD.has(safe.violence) || BAD.has(safe.racy))) {
            return {
                error: false,
                isVehicle: false,
                rejected: true,
                reason: "Image is not allowed",
                safe
            };
        }

        const objects = first.localizedObjectAnnotations || [];
        const labels = first.labelAnnotations || [];


        const detectedByObject = objects.find(
            (o) =>
                vehicleObjectNames.includes(String(o?.name || "").toLowerCase()) &&
                (o?.score ?? 0) >= 0.45
        );


        const detectedByLabel = labels.find((label) => {
            const desc = String(label?.description || "").toLowerCase();
            const score = label?.score ?? 0;
            return score >= 0.50 && vehicleKeywords.some((k) => desc.includes(k));
        });

        const isVehicle = Boolean(detectedByObject || detectedByLabel);

        return {
            error: false,
            isVehicle,

            debug: {
                detectedByObject: detectedByObject
                    ? { name: detectedByObject.name, score: detectedByObject.score }
                    : null,
                detectedByLabel: detectedByLabel
                    ? { description: detectedByLabel.description, score: detectedByLabel.score }
                    : null,
                topObjects: objects.slice(0, 8).map((o) => ({ name: o.name, score: o.score })),
                topLabels: labels.slice(0, 12).map((l) => ({ description: l.description, score: l.score })),
                safe
            }
        };

    } catch (error) {
        console.error("Vehicle detection failed:", error);
        return {
            error: true,
            message: error.message || "An error occurred during vehicle detection"
        };
    }
};