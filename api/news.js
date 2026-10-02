export default async function handler(req, res) {
    const API_KEY = process.env.GNEWS_API_KEY;

    // Check API key
    if (!API_KEY) {
        return res.status(500).json({
            error: "GNews API key is not configured."
        });
    }

    const { category = "general", search } = req.query;

    // Decide API endpoint
    const endpoint = search ? "search" : "top-headlines";

    const url = new URL(
        `https://gnews.io/api/v4/${endpoint}`
    );

    // Search news
    if (search) {
        url.searchParams.set("q", search);
    } 
    // Category news
    else {
        url.searchParams.set("category", category);
        url.searchParams.set("country", "in");
    }

    // Common settings
    url.searchParams.set("lang", "en");
    url.searchParams.set("max", "10");
    url.searchParams.set("apikey", API_KEY);

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error: "Unable to fetch news."
        });
    }
}