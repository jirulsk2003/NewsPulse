/* =========================================================
   NEWSPULSE - COMPLETE SCRIPT.JS
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_URL = "/api/news";

const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const REQUEST_DELAY = 1300; // 1.3 seconds between requests

const categories = [
    "general",
    "nation",
    "world",
    "sports",
    "technology",
    "business",
    "science",
    "entertainment"
];

/* =========================================================
   CATEGORY → HTML ELEMENT
   ========================================================= */

const categoryContainers = {
    general: "latestNews",
    nation: "indiaNews",
    world: "worldNews",
    sports: "sportsNews",
    technology: "technologyNews",
    business: "businessNews",
    science: "scienceNews",
    entertainment: "entertainmentNews"
};

/* =========================================================
   CATEGORY NAMES
   ========================================================= */

const categoryNames = {
    general: "Latest",
    nation: "India",
    world: "World",
    sports: "Sports",
    technology: "Technology",
    business: "Business",
    science: "Science",
    entertainment: "Entertainment"
};

/* =========================================================
   GLOBAL STATE
   ========================================================= */

const memoryCache = {};
let lastRequestTime = 0;
let currentCategory = "general";

/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setCurrentDate();
    setCurrentYear();

    setupNavigation();
    setupCategoryButtons();
    setupSearch();
    setupTheme();
    setupNewsletter();

    loadNewsPage();
});

/* =========================================================
   DATE
   ========================================================= */

function setCurrentDate() {

    const dateElement = document.getElementById("currentDate");

    if (!dateElement) {
        return;
    }

    const now = new Date();

    dateElement.textContent = now.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

/* =========================================================
   YEAR
   ========================================================= */

function setCurrentYear() {

    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const menuButton = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuButton && navLinks) {

        menuButton.addEventListener("click", () => {

            navLinks.classList.toggle("active");

        });
    }

    document.querySelectorAll("#navLinks a").forEach(link => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 760) {
                navLinks?.classList.remove("active");
            }

        });

    });

}

/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

function setupCategoryButtons() {

    document.querySelectorAll("[data-category]").forEach(element => {

        element.addEventListener("click", async event => {

            event.preventDefault();

            const category = element.dataset.category;

            if (!category) {
                return;
            }

            currentCategory = category;

            updateActiveCategory(category);

            await loadCategory(category);

            scrollToCategory(category);

        });

    });

}

/* =========================================================
   ACTIVE CATEGORY
   ========================================================= */

function updateActiveCategory(category) {

    document.querySelectorAll(".category-btn").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.category === category
        );

    });

}

/* =========================================================
   SCROLL TO CATEGORY
   ========================================================= */

function scrollToCategory(category) {

    const elementId = categoryContainers[category];

    if (!elementId) {
        return;
    }

    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    const section = element.closest("section");

    if (section) {

        const offset = 130;

        const position =
            section.getBoundingClientRect().top +
            window.scrollY -
            offset;

        window.scrollTo({
            top: position,
            behavior: "smooth"
        });

    }

}

/* =========================================================
   LOAD INITIAL PAGE
   ========================================================= */

async function loadNewsPage() {

    /*
       Important:
       We do NOT use Promise.all() here.

       Requests are sent one-by-one to avoid
       GNews 429 rate-limit errors.
    */

    for (const category of categories) {

        try {

            await loadCategory(category, false);

        } catch (error) {

            console.error(
                `Failed to load ${category}:`,
                error
            );

        }

    }

}

/* =========================================================
   LOAD CATEGORY
   ========================================================= */

async function loadCategory(category, showLoading = true) {

    const containerId = categoryContainers[category];

    if (!containerId) {
        console.warn("Unknown category:", category);
        return;
    }

    const container = document.getElementById(containerId);

    if (!container) {
        console.warn(
            "Container not found:",
            containerId
        );
        return;
    }

    /* Check browser cache */

    const cached = getCachedNews(category);

    if (cached) {

        renderNews(
            container,
            cached,
            category
        );

        updateBreakingNews(cached);

        return cached;

    }

    if (showLoading) {

        showLoadingState(
            container,
            `Loading ${categoryNames[category]} news...`
        );

    }

    /* Rate limit */

    await waitForRequestSlot();

    try {

        const articles = await getNews(category);

        if (!articles || articles.length === 0) {

            showEmptyState(
                container,
                category
            );

            return [];

        }

        saveCachedNews(
            category,
            articles
        );

        renderNews(
            container,
            articles,
            category
        );

        updateBreakingNews(articles);

        return articles;

    } catch (error) {

        console.error(
            `Error loading ${category}:`,
            error
        );

        showErrorState(
            container,
            error
        );

        return [];

    }

}

/* =========================================================
   GET NEWS FROM BACKEND
   ========================================================= */

async function getNews(category) {

    const url =
        `${API_URL}?category=${encodeURIComponent(category)}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
        cache: "no-store"
    });

    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        throw new Error(
            "Invalid response from backend."
        );

    }

    if (!response.ok) {

        if (response.status === 429) {

            throw new Error(
                "GNews rate limit reached. Please wait a moment and try again."
            );

        }

        if (response.status === 403) {

            throw new Error(
                "GNews daily API limit has been reached."
            );

        }

        throw new Error(
            data.error ||
            data.message ||
            `News request failed (${response.status})`
        );

    }

    if (data.success === false) {

        throw new Error(
            data.error ||
            "News request failed."
        );

    }

    return Array.isArray(data.articles)
        ? data.articles
        : [];

}

/* =========================================================
   REQUEST RATE LIMIT
   ========================================================= */

async function waitForRequestSlot() {

    const now = Date.now();

    const elapsed =
        now - lastRequestTime;

    const remaining =
        REQUEST_DELAY - elapsed;

    if (remaining > 0) {

        await sleep(remaining);

    }

    lastRequestTime = Date.now();

}

/* =========================================================
   SLEEP
   ========================================================= */

function sleep(milliseconds) {

    return new Promise(resolve => {

        setTimeout(resolve, milliseconds);

    });

}

/* =========================================================
   CACHE - SAVE
   ========================================================= */

function saveCachedNews(category, articles) {

    const cacheObject = {
        timestamp: Date.now(),
        articles: articles
    };

    memoryCache[category] = cacheObject;

    try {

        localStorage.setItem(
            `newspulse_${category}`,
            JSON.stringify(cacheObject)
        );

    } catch (error) {

        console.warn(
            "localStorage unavailable:",
            error
        );

    }

}

/* =========================================================
   CACHE - GET
   ========================================================= */

function getCachedNews(category) {

    const now = Date.now();

    /* Memory cache */

    if (memoryCache[category]) {

        const cache = memoryCache[category];

        if (
            now - cache.timestamp <
            CACHE_TIME
        ) {

            return cache.articles;

        }

        delete memoryCache[category];

    }

    /* Local storage */

    try {

        const saved =
            localStorage.getItem(
                `newspulse_${category}`
            );

        if (!saved) {
            return null;
        }

        const cache =
            JSON.parse(saved);

        if (
            !cache.timestamp ||
            !Array.isArray(cache.articles)
        ) {

            localStorage.removeItem(
                `newspulse_${category}`
            );

            return null;

        }

        if (
            now - cache.timestamp <
            CACHE_TIME
        ) {

            memoryCache[category] = cache;

            return cache.articles;

        }

        localStorage.removeItem(
            `newspulse_${category}`
        );

    } catch (error) {

        console.warn(
            "Unable to read cache:",
            error
        );

    }

    return null;

}

/* =========================================================
   RENDER NEWS
   ========================================================= */

function renderNews(
    container,
    articles,
    category
) {

    if (!articles || articles.length === 0) {

        showEmptyState(
            container,
            category
        );

        return;
    }

    /*
       Hero / general section
    */

    if (
        category === "general" &&
        container.id === "latestNews"
    ) {

        renderStandardNews(
            container,
            articles,
            category
        );

        renderHeroNews(
            articles
        );

        return;
    }

    renderStandardNews(
        container,
        articles,
        category
    );

}

/* =========================================================
   STANDARD NEWS GRID
   ========================================================= */

function renderStandardNews(
    container,
    articles,
    category
) {

    container.innerHTML = "";

    const fragment =
        document.createDocumentFragment();

    articles
        .slice(0, 10)
        .forEach(article => {

            const card =
                createNewsCard(
                    article,
                    category
                );

            fragment.appendChild(card);

        });

    container.appendChild(fragment);

}

/* =========================================================
   HERO NEWS
   ========================================================= */

function renderHeroNews(articles) {

    const heroContainer =
        document.getElementById("heroNews");

    if (!heroContainer) {
        return;
    }

    if (!articles.length) {
        return;
    }

    heroContainer.innerHTML = "";

    const heroArticles =
        articles.slice(0, 3);

    heroArticles.forEach(
        (article, index) => {

            const card =
                document.createElement("a");

            card.className =
                index === 0
                    ? "hero-card large"
                    : "hero-card";

            card.href =
                article.url || "#";

            card.target = "_blank";
            card.rel = "noopener noreferrer";

            const image =
                getArticleImage(article);

            card.innerHTML = `
                ${
                    image
                        ? `<img
                            src="${escapeAttribute(image)}"
                            alt="${escapeAttribute(
                                article.title || "News"
                            )}"
                            loading="${
                                index === 0
                                    ? "eager"
                                    : "lazy"
                            }"
                            onerror="this.style.display='none'"
                        >`
                        : ""
                }

                <div class="hero-overlay">

                    <div class="news-meta">

                        <span>
                            ${escapeHTML(
                                categoryNames.general
                            )}
                        </span>

                        <span>
                            ${formatDate(
                                article.publishedAt
                            )}
                        </span>

                    </div>

                    <h2>
                        ${escapeHTML(
                            article.title ||
                            "Untitled news"
                        )}
                    </h2>

                    ${
                        article.description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        article.description
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>
            `;

            heroContainer.appendChild(card);

        }
    );

}

/* =========================================================
   CREATE NEWS CARD
   ========================================================= */

function createNewsCard(
    article,
    category
) {

    const card =
        document.createElement("article");

    card.className = "news-card";

    const title =
        article.title ||
        "Untitled news";

    const description =
        article.description ||
        "Read the latest news and updates.";

    const image =
        getArticleImage(article);

    const source =
        article.source?.name ||
        "News";

    card.innerHTML = `

        <a
            href="${escapeAttribute(
                article.url || "#"
            )}"
            target="_blank"
            rel="noopener noreferrer"
        >

            <div class="news-card-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(
                                    image
                                )}"
                                alt="${escapeAttribute(
                                    title
                                )}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none'
                                "
                            >
                          `
                        : `
                            <div
                                style="
                                    width:100%;
                                    height:100%;
                                    display:grid;
                                    place-items:center;
                                    color:var(--muted);
                                    font-size:13px;
                                "
                            >
                                No Image
                            </div>
                          `
                }

            </div>

            <div class="news-card-body">

                <span class="category">
                    ${escapeHTML(
                        categoryNames[category] ||
                        "News"
                    )}
                </span>

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <p>
                    ${escapeHTML(
                        truncateText(
                            description,
                            150
                        )
                    )}
                </p>

                <div class="news-card-footer">

                    <span>
                        ${escapeHTML(source)}
                    </span>

                    <span>
                        ${formatDate(
                            article.publishedAt
                        )}
                    </span>

                </div>

            </div>

        </a>
    `;

    return card;

}

/* =========================================================
   ARTICLE IMAGE
   ========================================================= */

function getArticleImage(article) {

    if (
        article &&
        typeof article.image === "string" &&
        article.image.trim() !== ""
    ) {

        return article.image;

    }

    return null;

}

/* =========================================================
   BREAKING NEWS
   ========================================================= */

function updateBreakingNews(articles) {

    const breaking =
        document.getElementById(
            "breakingText"
        );

    if (!breaking || !articles?.length) {
        return;
    }

    const headlines =
        articles
            .slice(0, 5)
            .map(article => article.title)
            .filter(Boolean);

    if (!headlines.length) {
        return;
    }

    breaking.textContent =
        headlines.join("  •  ");

}

/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoadingState(
    container,
    message
) {

    container.innerHTML = `
        <div class="loading">
            ${escapeHTML(message)}
        </div>
    `;

}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function showEmptyState(
    container,
    category
) {

    container.innerHTML = `

        <div class="error-message">

            No ${
                escapeHTML(
                    categoryNames[category] ||
                    ""
                )
            } news available right now.

        </div>

    `;

}

/* =========================================================
   ERROR STATE
   ========================================================= */

function showErrorState(
    container,
    error
) {

    const message =
        error?.message ||
        "Unable to load news.";

    container.innerHTML = `

        <div class="error-message">

            ${escapeHTML(message)}

        </div>

    `;

}

/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const searchButton =
        document.getElementById(
            "searchBtn"
        );

    const searchSection =
        document.getElementById(
            "searchSection"
        );

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const searchSubmit =
        document.getElementById(
            "searchSubmit"
        );

    if (
        searchButton &&
        searchSection
    ) {

        searchButton.addEventListener(
            "click",
            () => {

                searchSection.classList.toggle(
                    "show"
                );

                if (
                    searchSection.classList.contains(
                        "show"
                    )
                ) {

                    searchInput?.focus();

                }

            }
        );

    }

    if (searchSubmit) {

        searchSubmit.addEventListener(
            "click",
            performSearch
        );

    }

    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    performSearch();

                }

            }
        );

    }

}

/* =========================================================
   SEARCH FUNCTION
   ========================================================= */

async function performSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );

    if (!input) {
        return;
    }

    const query =
        input.value.trim();

    if (!query) {
        return;
    }

    const latestNews =
        document.getElementById(
            "latestNews"
        );

    if (latestNews) {

        showLoadingState(
            latestNews,
            `Searching for "${query}"...`
        );

        latestNews.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

    try {

        await waitForRequestSlot();

        const response =
            await fetch(
                `${API_URL}?search=${encodeURIComponent(
                    query
                )}`,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    },
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                `Search failed (${response.status})`
            );

        }

        const articles =
            Array.isArray(data.articles)
                ? data.articles
                : [];

        if (!articles.length) {

            showErrorState(
                latestNews,
                new Error(
                    "No news found for this search."
                )
            );

            return;
        }

        renderStandardNews(
            latestNews,
            articles,
            "general"
        );

        updateBreakingNews(
            articles
        );

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        showErrorState(
            latestNews,
            error
        );

    }

}

/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

    const themeButton =
        document.getElementById(
            "themeBtn"
        );

    if (!themeButton) {
        return;
    }

    const savedTheme =
        localStorage.getItem(
            "newspulse_theme"
        );

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent = "☀️";

    }

    themeButton.addEventListener(
        "click",
        () => {

            const isDark =
                document.body.classList.toggle(
                    "dark"
                );

            themeButton.textContent =
                isDark
                    ? "☀️"
                    : "🌙";

            localStorage.setItem(
                "newspulse_theme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );

}

/* =========================================================
   NEWSLETTER
   ========================================================= */

function setupNewsletter() {

    const form =
        document.getElementById(
            "newsletterForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "newsletterEmail"
                )?.value.trim();

            if (!email) {
                return;
            }

            alert(
                "Thank you! You have subscribed to NewsPulse."
            );

            form.reset();

        }
    );

}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}

/* =========================================================
   TRUNCATE TEXT
   ========================================================= */

function truncateText(
    text,
    maxLength
) {

    if (!text) {
        return "";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return (
        text.substring(
            0,
            maxLength
        ).trim() +
        "..."
    );

}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;

}

/* =========================================================
   ATTRIBUTE ESCAPE
   ========================================================= */

function escapeAttribute(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* =========================================================
   CLEAR CACHE
   ========================================================= */

function clearNewsCache() {

    Object.keys(memoryCache)
        .forEach(key => {
            delete memoryCache[key];
        });

    categories.forEach(category => {

        try {

            localStorage.removeItem(
                `newspulse_${category}`
            );

        } catch (error) {
            console.warn(error);
        }

    });

}

/* =========================================================
   AUTO REFRESH
   ========================================================= */

/*
   Refresh cache after 30 minutes.

   We do not automatically request all categories again.
   Existing cached data remains available.
*/

setInterval(
    () => {

        clearNewsCache();

    },
    30 * 60 * 1000
);