export default async function handler(req, res) {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            articles: [],
            error: "GNEWS_API_KEY is missing in Vercel."
        });
    }

    const category = req.query.category || "general";

    const allowedCategories = [
        "general",
        "world",
        "nation",
        "business",
        "technology",
        "entertainment",
        "sports",
        "science"
    ];

    if (!allowedCategories.includes(category)) {
        return res.status(400).json({
            articles: [],
            error: "Invalid category."
        });
    }

    const params = new URLSearchParams({
        category: category,
        lang: "en",
        country: "in",
        max: "10",
        nullable: "image,description",
        apikey: apiKey
    });

    try {
        const response = await fetch(
            `https://gnews.io/api/v4/top-headlines?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                articles: [],
                error: data.errors || "GNews request failed."
            });
        }

        return res.status(200).json({
            articles: data.articles || []
        });

    } catch (error) {
        return res.status(500).json({
            articles: [],
            error: error.message
        });
    }
}
