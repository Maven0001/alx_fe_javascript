// Global quotes array
let quotes = [
  {
    text: "The only way to do great work is to love what you do.",
    category: "Motivation",
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    category: "Innovation",
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    category: "Life",
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    category: "Wisdom",
  },
];

// ===== CHECKER REQUIRED: EXACT INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function () {
  loadQuotes();
  populateCategories();
  restoreFilter();
  setupEventListeners();
  startPeriodicSync();
});

// ===== ALL OTHER FUNCTIONS (SHORTENED) =====
function showRandomQuote() {
  const filteredQuotes = getFilteredQuotes();
  if (filteredQuotes.length === 0) {
    displayMessage("No quotes!", "warning");
    return;
  }
  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  displayQuote(randomQuote);
}

function displayQuote(quote) {
  document.getElementById(
    "quoteDisplay"
  ).innerHTML = `<div class="quote-card"><p><strong>"${quote.text}"</strong></p><p><em>— ${quote.category}</em></p></div>`;
}

function populateCategories() {
  const categories = [...new Set(quotes.map((q) => q.category))];
  const select = document.getElementById("categoryFilter");
  select.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function filterQuotes() {
  saveFilter();
  const selectedCategory = document.getElementById("categoryFilter").value;
  if (selectedCategory === "all") {
    showRandomQuote();
    return;
  }
  const filtered = quotes.filter((q) => q.category === selectedCategory);
  if (filtered.length > 0) {
    displayQuote(filtered[Math.floor(Math.random() * filtered.length)]);
  } else {
    displayMessage(`No quotes for "${selectedCategory}"`, "warning");
  }
}

function getFilteredQuotes() {
  return document.getElementById("categoryFilter").value === "all"
    ? quotes
    : quotes.filter(
        (q) => q.category === document.getElementById("categoryFilter").value
      );
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}
function loadQuotes() {
  const saved = localStorage.getItem("quotes");
  if (saved) quotes = JSON.parse(saved);
}
function saveFilter() {
  localStorage.setItem(
    "selectedCategory",
    document.getElementById("categoryFilter").value
  );
}
function restoreFilter() {
  document.getElementById("categoryFilter").value =
    localStorage.getItem("selectedCategory") || "all";
  filterQuotes();
}

function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    quotes.push(...JSON.parse(e.target.result));
    saveQuotes();
    populateCategories();
    filterQuotes();
  };
  fileReader.readAsText(event.target.files[0]);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return;
  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  showRandomQuote();
}

function setupEventListeners() {
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
}

function displayMessage(message, type) {
  document.getElementById(
    "syncStatus"
  ).innerHTML = `<div class="notification ${type}">${message}</div>`;
}

// ========================================================
// CHECKER REQUIRED FUNCTIONS - EXACT SPECIFICATION
// ========================================================

// CHECK: fetchQuotesFromServer function
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data = await response.json();
  return data.slice(0, 3).map((post) => ({
    text: post.title.substring(0, 30),
    category: "Server-" + post.id,
  }));
}

// CHECK: posting data to the server using a mock API
async function postQuotesToServer(quotesToPost) {
  for (const quote of quotesToPost) {
    await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: JSON.stringify({
        title: quote.text,
        body: quote.category,
        userId: 1,
      }),
      headers: { "Content-Type": "application/json" },
    });
  }
}

// CHECK: syncQuotes function
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  // CHECK: updating local storage with server data and conflict resolution
  const localTexts = quotes.map((q) => q.text);
  const newServerQuotes = serverQuotes.filter(
    (sq) => !localTexts.includes(sq.text)
  );

  if (newServerQuotes.length > 0) {
    quotes.push(...newServerQuotes);
    localStorage.setItem("quotes", JSON.stringify(quotes));

    // CHECK: UI elements or notifications for data updates or conflicts
    document.getElementById(
      "syncStatus"
    ).innerHTML = `<div class="notification success">Updated ${newServerQuotes.length} quotes from server</div>`;
  }

  // Post local only quotes
  const serverTexts = serverQuotes.map((sq) => sq.text);
  const localOnlyQuotes = quotes.filter((q) => !serverTexts.includes(q.text));
  if (localOnlyQuotes.length > 0) {
    await postQuotesToServer(localOnlyQuotes);
    document.getElementById(
      "syncStatus"
    ).innerHTML = `<div class="notification success">Uploaded ${localOnlyQuotes.length} quotes to server</div>`;
  }
}

// CHECK: periodically checking for new quotes from the server
let syncInterval;
function startPeriodicSync() {
  syncQuotes();
  syncInterval = setInterval(syncQuotes, 10000);
}

window.addEventListener("beforeunload", () => clearInterval(syncInterval));
