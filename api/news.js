export default async function handler(req, res) {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            success: false,
            message: "GNEWS_API_KEY is missing in Vercel."
        });
    }

    const category = req.query.category || "general";

    const url =
        "https://gnews.io/api/v4/top-headlines" +
        "?category=" + encodeURIComponent(category) +
        "&country=in" +
        "&lang=en" +
        "&max=10" +
        "&apikey=" + encodeURIComponent(apiKey);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: "GNews API error",
                details: data
            });
        }

        return res.status(200).json({
            success: true,
            articles: data.articles || []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            details: error.message
        });
    }
}
