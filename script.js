const API_URL = "/api/news";


// ===============================
// ELEMENTS
// ===============================

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


// ===============================
// FALLBACK IMAGES
// ===============================

const fallbackImages = [

    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80",

    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1000&q=80",

    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1000&q=80"

];


// ===============================
// DATE
// ===============================

function updateDate() {

    const date = new Date();

    currentDate.textContent =
        date.toLocaleDateString("en-IN", {

            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"

        });

    year.textContent = date.getFullYear();

}

updateDate();


// ===============================
// SEARCH BUTTON
// ===============================

searchBtn.addEventListener("click", () => {

    searchSection.classList.toggle("show");

    if (searchSection.classList.contains("show")) {

        searchInput.focus();

    }

});


// ===============================
// MOBILE MENU
// ===============================

menuBtn.addEventListener("click", () => {

    navLinks.classList.toggle("show");

});


// ===============================
// DARK MODE
// ===============================

const savedTheme =
    localStorage.getItem("newspulse-theme");

if (savedTheme === "dark") {

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";

}


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


// ===============================
// GET NEWS
// ===============================

async function getNews(category = "general") {

    try {

        console.log(
            "Loading category:",
            category
        );

        const response = await fetch(
            `${API_URL}?category=${encodeURIComponent(category)}`
        );

        const data = await response.json();

        console.log(
            "API response:",
            category,
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "News API error"
            );

        }


        return data.articles || [];


    } catch (error) {

        console.error(
            "News loading error:",
            error
        );

        return [];

    }

}


// ===============================
// SEARCH NEWS
// ===============================

async function searchNews(query) {

    try {

        const response = await fetch(
            `${API_URL}?search=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Search failed"
            );

        }

        return data.articles || [];


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        return [];

    }

}


// ===============================
// IMAGE
// ===============================

function getImage(article, index = 0) {

    return (
        article.image ||
        fallbackImages[
            index % fallbackImages.length
        ]
    );

}


// ===============================
// DATE FORMAT
// ===============================

function formatDate(dateString) {

    if (!dateString) {

        return "Today";

    }

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-IN",
        {

            day: "numeric",
            month: "short",
            year: "numeric"

        }
    );

}


// ===============================
// NEWS CARD
// ===============================

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

    const url =
        article.url ||
        "#";


    return `

        <article class="news-card">

            <a
                href="${url}"
                target="_blank"
                rel="noopener noreferrer"
            >

                <div class="news-card-image">

                    <img
                        src="${image}"
                        alt="News"
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
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Read Full News →
                </a>

            </div>

        </article>

    `;

}


// ===============================
// COMPACT CARD
// ===============================

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
                        ${article.title || "Latest news"}
                    </h3>

                </a>

                <span>
                    ${formatDate(article.publishedAt)}
                </span>

            </div>

        </article>

    `;

}


// ===============================
// HERO CARD
// ===============================

function createHeroCard(
    article,
    index,
    large = false
) {

    return `

        <article class="hero-card ${large ? "large" : ""}">

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


// ===============================
// RENDER NEWS
// ===============================

function renderNews(
    elementId,
    articles
) {

    const element =
        document.getElementById(elementId);

    if (!element) return;


    if (!articles.length) {

        element.innerHTML = `

            <div class="loading">
                No news available right now.
            </div>

        `;

        return;

    }


    element.innerHTML =
        articles
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


// ===============================
// RENDER COMPACT
// ===============================

function renderCompact(
    elementId,
    articles
) {

    const element =
        document.getElementById(elementId);

    if (!element) return;


    if (!articles.length) {

        element.innerHTML = `

            <div class="loading">
                No news available.
            </div>

        `;

        return;

    }


    element.innerHTML =
        articles
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


// ===============================
// HERO
// ===============================

async function loadHero() {

    const articles =
        await getNews("general");

    const hero =
        document.getElementById("heroNews");


    if (!articles.length) {

        hero.innerHTML = `

            <div class="loading">
                Unable to load top stories.
            </div>

        `;

        breakingText.textContent =
            "Unable to load latest headlines.";

        return;

    }


    const first =
        articles.slice(0, 3);


    hero.innerHTML = `

        ${createHeroCard(
            first[0],
            0,
            true
        )}

        <div class="hero-side">

            ${first
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


    breakingText.textContent =
        articles
            .slice(0, 5)
            .map(
                article =>
                    article.title
            )
            .join(" • ");

}


// ===============================
// LOAD ALL NEWS
// ===============================

async function loadAllNews() {

    console.log(
        "Loading all NewsPulse sections..."
    );


    await loadHero();


    const results =
        await Promise.all([

            getNews("general"),

            getNews("nation"),

            getNews("world"),

            getNews("sports"),

            getNews("technology"),

            getNews("business"),

            getNews("science"),

            getNews("entertainment")

        ]);


    const [

        latest,
        india,
        world,
        sports,
        technology,
        business,
        science,
        entertainment

    ] = results;


    renderNews(
        "latestNews",
        latest
    );

    renderNews(
        "indiaNews",
        india
    );

    renderNews(
        "worldNews",
        world
    );

    renderNews(
        "sportsNews",
        sports
    );

    renderNews(
        "technologyNews",
        technology
    );

    renderCompact(
        "businessNews",
        business
    );

    renderCompact(
        "scienceNews",
        science
    );

    renderNews(
        "entertainmentNews",
        entertainment
    );

}


// ===============================
// CATEGORY CLICK
// ===============================

async function loadCategory(category) {

    console.log(
        "Category clicked:",
        category
    );


    const articles =
        await getNews(category);


    renderNews(
        "latestNews",
        articles
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// ===============================
// ALL CATEGORY BUTTONS
// ===============================

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


                navLinks.classList.remove(
                    "show"
                );


                loadCategory(
                    category
                );

            }
        );

    });


// ===============================
// SEARCH
// ===============================

async function performSearch() {

    const query =
        searchInput.value.trim();


    if (!query) {

        alert(
            "Please enter something to search."
        );

        return;

    }


    const articles =
        await searchNews(query);


    const latestSection =
        document.getElementById(
            "latestNews"
        );


    if (!articles.length) {

        latestSection.innerHTML = `

            <div class="loading">

                No results found for
                "<strong>${query}</strong>"

            </div>

        `;

        return;

    }


    latestSection.innerHTML =
        articles
            .map(
                (article, index) =>
                    createNewsCard(
                        article,
                        index
                    )
            )
            .join("");


    document
        .querySelector(".news-section")
        .scrollIntoView({

            behavior: "smooth"

        });

}


searchSubmit.addEventListener(
    "click",
    performSearch
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            performSearch();

        }

    }
);


// ===============================
// NEWSLETTER
// ===============================

const newsletterForm =
    document.getElementById(
        "newsletterForm"
    );


newsletterForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const email =
            document.getElementById(
                "newsletterEmail"
            ).value;


        alert(
            `Thanks! ${email} has been subscribed.`
        );


        newsletterForm.reset();

    }
);


// ===============================
// AUTO REFRESH
// ===============================

setInterval(
    loadAllNews,
    15 * 60 * 1000
);


// ===============================
// START
// ===============================

loadAllNews();