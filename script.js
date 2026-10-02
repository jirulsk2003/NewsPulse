/* =====================================================
   NEWSPULSE - SCRIPT.JS
   Rate-limit safe GNews version
===================================================== */

const API_URL = "/api/news";

/* =====================================================
   ELEMENTS
===================================================== */

const searchBtn = document.getElementById("searchBtn");
const searchSection = document.getElementById("searchSection");
const searchInput = document.getElementById("searchInput");
const searchSubmit = document.getElementById("searchSubmit");

const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

const currentDate = document.getElementById("currentDate");
const year = document.getElementById("year");
const breakingText = document.getElementById("breakingText");

/* =====================================================
   FALLBACK IMAGES
===================================================== */

const fallbackImages = [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=80"
];

/* =====================================================
   DATE
===================================================== */

function updateDate() {

    const date = new Date();

    if (currentDate) {
        currentDate.textContent =
            date.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }

    if (year) {
        year.textContent = date.getFullYear();
    }
}

updateDate();

/* =====================================================
   SEARCH OPEN / CLOSE
===================================================== */

if (searchBtn && searchSection) {

    searchBtn.addEventListener("click", () => {

        searchSection.classList.toggle("show");

        if (
            searchSection.classList.contains("show") &&
            searchInput
        ) {
            searchInput.focus();
        }
    });
}

/* =====================================================
   MOBILE MENU
===================================================== */

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("show");

    });
}

/* =====================================================
   DARK MODE
===================================================== */

const savedTheme =
    localStorage.getItem("newspulse-theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    if (themeBtn) {
        themeBtn.textContent = "☀️";
    }
}

if (themeBtn) {

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");

        themeBtn.textContent =
            dark ? "☀️" : "🌙";

        localStorage.setItem(
            "newspulse-theme",
            dark ? "dark" : "light"
        );
    });
}

/* =====================================================
   REQUEST CONTROL
===================================================== */

let lastRequestTime = 0;

const REQUEST_DELAY = 1200;

/*
   GNews Free plan:
   approximately 1 request / second.

   We use 1200ms to keep a safe gap.
*/

async function waitForRateLimit() {

    const now = Date.now();

    const elapsed =
        now - lastRequestTime;

    const waitTime =
        REQUEST_DELAY - elapsed;

    if (waitTime > 0) {

        await new Promise(resolve =>
            setTimeout(resolve, waitTime)
        );
    }

    lastRequestTime = Date.now();
}

/* =====================================================
   NEWS API
===================================================== */

async function getNews(category = "general") {

    try {

        await waitForRateLimit();

        console.log(
            "Loading category:",
            category
        );

        const response = await fetch(
            `${API_URL}?category=${encodeURIComponent(category)}`,
            {
                cache: "no-store"
            }
        );

        /* 429 */

        if (response.status === 429) {

            console.warn(
                "GNews rate limit reached."
            );

            return {
                articles: [],
                rateLimited: true
            };
        }

        /* Other errors */

        if (!response.ok) {

            let errorData = {};

            try {
                errorData =
                    await response.json();
            } catch (error) {
                // Ignore JSON parsing error
            }

            console.error(
                "News API error:",
                response.status,
                errorData
            );

            return {
                articles: [],
                error: true
            };
        }

        const data =
            await response.json();

        return {
            articles: data.articles || [],
            rateLimited: false,
            error: false
        };

    } catch (error) {

        console.error(
            "Network error:",
            error
        );

        return {
            articles: [],
            error: true
        };
    }
}

/* =====================================================
   SEARCH API
===================================================== */

async function searchNews(query) {

    try {

        await waitForRateLimit();

        const response = await fetch(
            `${API_URL}?search=${encodeURIComponent(query)}`,
            {
                cache: "no-store"
            }
        );

        if (response.status === 429) {

            return {
                articles: [],
                rateLimited: true
            };
        }

        if (!response.ok) {

            return {
                articles: [],
                error: true
            };
        }

        const data =
            await response.json();

        return {
            articles: data.articles || [],
            rateLimited: false
        };

    } catch (error) {

        console.error(error);

        return {
            articles: [],
            error: true
        };
    }
}

/* =====================================================
   IMAGE
===================================================== */

function getImage(article, index = 0) {

    if (
        article &&
        article.image
    ) {
        return article.image;
    }

    return fallbackImages[
        index % fallbackImages.length
    ];
}

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(dateString) {

    if (!dateString) {
        return "Today";
    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {
        return "Today";
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

/* =====================================================
   NEWS CARD
===================================================== */

function createNewsCard(
    article,
    index = 0
) {

    const image =
        getImage(article, index);

    const title =
        article.title ||
        "Latest News";

    const description =
        article.description ||
        "Read the latest news and updates.";

    const source =
        article.source?.name ||
        "NewsPulse";

    const articleUrl =
        article.url || "#";

    return `
        <article class="news-card">

            <a
                href="${articleUrl}"
                target="_blank"
                rel="noopener noreferrer"
            >

                <div class="news-card-image">

                    <img
                        src="${image}"
                        alt="${title.replace(/"/g, "")}"
                        loading="lazy"
                        onerror="this.src='${fallbackImages[0]}'"
                    >

                </div>

            </a>

            <div class="news-card-content">

                <div class="news-meta">

                    <span class="news-category">
                        ${source}
                    </span>

                    <span>•</span>

                    <span>
                        ${formatDate(article.publishedAt)}
                    </span>

                </div>

                <h3>
                    ${title}
                </h3>

                <p>
                    ${description}
                </p>

                <a
                    class="read-more"
                    href="${articleUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Read Full News →
                </a>

            </div>

        </article>
    `;
}

/* =====================================================
   COMPACT CARD
===================================================== */

function createCompactCard(
    article,
    index = 0
) {

    return `
        <article class="compact-card">

            <img
                src="${getImage(article, index)}"
                alt="News"
                loading="lazy"
                onerror="this.src='${fallbackImages[0]}'"
            >

            <div>

                <a
                    href="${article.url || "#"}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <h3>
                        ${article.title || "Latest News"}
                    </h3>

                </a>

                <span>
                    ${formatDate(article.publishedAt)}
                </span>

            </div>

        </article>
    `;
}

/* =====================================================
   HERO CARD
===================================================== */

function createHeroCard(
    article,
    index,
    large = false
) {

    return `
        <article
            class="hero-card ${large ? "large" : ""}"
        >

            <img
                src="${getImage(article, index)}"
                alt="News"
                loading="lazy"
                onerror="this.src='${fallbackImages[0]}'"
            >

            <div class="hero-overlay">

                <div class="news-meta">

                    <span>
                        ${article.source?.name || "News"}
                    </span>

                    <span>•</span>

                    <span>
                        ${formatDate(article.publishedAt)}
                    </span>

                </div>

                <h2>
                    ${article.title || "Top News"}
                </h2>

                <p>
                    ${article.description || ""}
                </p>

                <a
                    class="read-more"
                    href="${article.url || "#"}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="color:#c9ff36;margin-top:18px"
                >
                    Read Story →
                </a>

            </div>

        </article>
    `;
}

/* =====================================================
   EMPTY / ERROR MESSAGE
===================================================== */

function showNewsMessage(
    element,
    message
) {

    if (!element) {
        return;
    }

    element.innerHTML = `
        <div class="loading">
            ${message}
        </div>
    `;
}

/* =====================================================
   RENDER NEWS
===================================================== */

function renderNews(
    elementId,
    result
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    if (result.rateLimited) {

        showNewsMessage(
            element,
            "News service is busy. Please try again in a few seconds."
        );

        return;
    }

    if (
        result.error ||
        !result.articles.length
    ) {

        showNewsMessage(
            element,
            "No news available right now."
        );

        return;
    }

    element.innerHTML =
        result.articles
            .slice(0, 6)
            .map(
                (article, index) =>
                    createNewsCard(
                        article,
                        index
                    )
            )
            .join("");
}

/* =====================================================
   RENDER COMPACT
===================================================== */

function renderCompact(
    elementId,
    result
) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    if (
        result.rateLimited ||
        result.error ||
        !result.articles.length
    ) {

        showNewsMessage(
            element,
            "News temporarily unavailable."
        );

        return;
    }

    element.innerHTML =
        result.articles
            .slice(0, 5)
            .map(
                (article, index) =>
                    createCompactCard(
                        article,
                        index
                    )
            )
            .join("");
}

/* =====================================================
   HERO
===================================================== */

async function loadHero() {

    const result =
        await getNews("general");

    const hero =
        document.getElementById("heroNews");

    if (!hero) {
        return;
    }

    if (result.rateLimited) {

        showNewsMessage(
            hero,
            "News service is busy. Please try again shortly."
        );

        return;
    }

    if (
        result.error ||
        !result.articles.length
    ) {

        showNewsMessage(
            hero,
            "Unable to load top stories."
        );

        return;
    }

    const articles =
        result.articles.slice(0, 3);

    hero.innerHTML = `
        ${createHeroCard(
            articles[0],
            0,
            true
        )}

        <div class="hero-side">

            ${articles
                .slice(1)
                .map(
                    (article, index) =>
                        createHeroCard(
                            article,
                            index + 1
                        )
                )
                .join("")}

        </div>
    `;

    if (breakingText) {

        breakingText.textContent =
            result.articles
                .slice(0, 5)
                .map(
                    article => article.title
                )
                .join(" • ");
    }
}

/* =====================================================
   LOAD ONE CATEGORY
===================================================== */

async function loadCategory(
    category
) {

    console.log(
        "Category clicked:",
        category
    );

    const result =
        await getNews(category);

    renderNews(
        "latestNews",
        result
    );

    const latestSection =
        document.querySelector(
            ".news-section"
        );

    if (latestSection) {

        latestSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =====================================================
   CATEGORY BUTTONS
===================================================== */

document
    .querySelectorAll("[data-category]")
    .forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const category =
                    button.dataset.category;

                console.log(
                    "Clicked:",
                    category
                );

                /* Active category */

                document
                    .querySelectorAll(
                        ".category-btn"
                    )
                    .forEach(btn => {

                        btn.classList.toggle(
                            "active",
                            btn.dataset.category ===
                                category
                        );

                    });

                /* Close mobile menu */

                if (navLinks) {
                    navLinks.classList.remove(
                        "show"
                    );
                }

                /* Load selected category */

                loadCategory(category);
            }
        );

    });

/* =====================================================
   LOAD ALL NEWS
===================================================== */

/*
   IMPORTANT:
   Do NOT use Promise.all() here.

   Promise.all() sends 8 requests together.
   GNews Free allows about 1 request/second.

   We load categories one-by-one.
*/

async function loadAllNews() {

    console.log(
        "Starting NewsPulse news loading..."
    );

    /* HERO */

    await loadHero();

    /* Latest */

    const latest =
        await getNews("general");

    renderNews(
        "latestNews",
        latest
    );

    /* India */

    const india =
        await getNews("nation");

    renderNews(
        "indiaNews",
        india
    );

    /* World */

    const world =
        await getNews("world");

    renderNews(
        "worldNews",
        world
    );

    /* Sports */

    const sports =
        await getNews("sports");

    renderNews(
        "sportsNews",
        sports
    );

    /* Technology */

    const technology =
        await getNews("technology");

    renderNews(
        "technologyNews",
        technology
    );

    /* Business */

    const business =
        await getNews("business");

    renderCompact(
        "businessNews",
        business
    );

    /* Science */

    const science =
        await getNews("science");

    renderCompact(
        "scienceNews",
        science
    );

    /* Entertainment */

    const entertainment =
        await getNews("entertainment");

    renderNews(
        "entertainmentNews",
        entertainment
    );

    console.log(
        "NewsPulse loading completed."
    );
}

/* =====================================================
   SEARCH
===================================================== */

async function performSearch() {

    if (!searchInput) {
        return;
    }

    const query =
        searchInput.value.trim();

    if (!query) {

        alert(
            "Please enter something to search."
        );

        return;
    }

    const result =
        await searchNews(query);

    const latestSection =
        document.getElementById(
            "latestNews"
        );

    if (!latestSection) {
        return;
    }

    if (result.rateLimited) {

        showNewsMessage(
            latestSection,
            "Search is temporarily busy. Please try again shortly."
        );

        return;
    }

    if (
        result.error ||
        !result.articles.length
    ) {

        showNewsMessage(
            latestSection,
            `No results found for "${query}".`
        );

        return;
    }

    latestSection.innerHTML =
        result.articles
            .map(
                (article, index) =>
                    createNewsCard(
                        article,
                        index
                    )
            )
            .join("");

    const newsSection =
        document.querySelector(
            ".news-section"
        );

    if (newsSection) {

        newsSection.scrollIntoView({
            behavior: "smooth"
        });
    }
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

            if (event.key === "Enter") {

                performSearch();

            }

        }
    );
}

/* =====================================================
   NEWSLETTER
===================================================== */

const newsletterForm =
    document.getElementById(
        "newsletterForm"
    );

if (newsletterForm) {

    newsletterForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const email =
                document.getElementById(
                    "newsletterEmail"
                )?.value;

            if (!email) {
                return;
            }

            alert(
                `Thanks! ${email} has been subscribed.`
            );

            newsletterForm.reset();
        }
    );
}

/* =====================================================
   AUTOMATIC REFRESH
===================================================== */

/*
   IMPORTANT:
   Do not refresh every 15 minutes with 8 requests.
   That creates unnecessary API usage.

   Refresh once every 30 minutes.
*/

setInterval(
    () => {

        console.log(
            "Refreshing NewsPulse..."
        );

        loadAllNews();

    },
    30 * 60 * 1000
);

/* =====================================================
   START APP
===================================================== */

loadAllNews();