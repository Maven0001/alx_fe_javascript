// Default quotes
const defaultQuotes = [
  {
    text: "The only way to do great work is to love what you do.",
    category: "Motivation",
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    category: "Leadership",
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    category: "Life",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    category: "Inspiration",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    category: "Motivation",
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    category: "Wisdom",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    category: "Success",
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    category: "Inspiration",
  },
  {
    text: "The only impossible journey is the one you never begin.",
    category: "Motivation",
  },
  { text: "Quality is not an act, it is a habit.", category: "Wisdom" },
];

let quotes = [];
let selectedCategory = "All";

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

// LOCAL STORAGE
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [...defaultQuotes];
  if (!stored) saveQuotes();
}

// SESSION STORAGE
function incrementSessionViews() {
  let views = parseInt(sessionStorage.getItem("quotesViewed") || "0") + 1;
  sessionStorage.setItem("quotesViewed", views);
  document.getElementById("lastViewed").textContent = views;
}

// DISPLAY QUOTE
function showRandomQuote() {
  quoteDisplay.innerHTML = "";
  let filtered =
    selectedCategory === "All"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.innerHTML =
      '<p class="empty-quote">No quotes in this category. Add one!</p>';
    return;
  }

  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.innerHTML = `
        <p class="quote-text">${quote.text}</p>
        <span class="quote-category">${quote.category}</span>
    `;

  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
  incrementSessionViews();
}

// ADD QUOTE
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill in both fields!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  updateStats();
  createCategoryFilter();
  alert("Quote added successfully!");
  showRandomQuote();
}

// CATEGORY FILTER
function getUniqueCategories() {
  return ["All", ...new Set(quotes.map((q) => q.category))];
}

function createCategoryFilter() {
  categoryFilter.innerHTML = "";
  getUniqueCategories().forEach((cat) => {
    const btn = document.createElement("button");
    btn.className =
      "category-btn" + (cat === selectedCategory ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      selectedCategory = cat;
      createCategoryFilter();
      showRandomQuote();
    };
    categoryFilter.appendChild(btn);
  });
}

// STATS
function updateStats() {
  document.getElementById("totalQuotes").textContent = quotes.length;
  document.getElementById("totalCategories").textContent =
    getUniqueCategories().length - 1;
  document.getElementById("lastViewed").textContent =
    sessionStorage.getItem("quotesViewed") || "0";
}

// JSON EXPORT
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `quotes_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);
  alert("Quotes exported successfully!");
}

// JSON IMPORT
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported)) {
        alert("Invalid JSON format");
        return;
      }

      quotes.push(...imported);
      saveQuotes();
      updateStats();
      createCategoryFilter();
      alert(`${imported.length} quotes imported successfully!`);
      showRandomQuote();
    } catch (error) {
      alert("Error importing file: " + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// CLEAR ALL
function clearAllQuotes() {
  if (
    confirm(
      "Are you sure you want to delete all quotes? This cannot be undone."
    )
  ) {
    quotes = [];
    saveQuotes();
    updateStats();
    createCategoryFilter();
    quoteDisplay.innerHTML =
      '<p class="empty-quote">All quotes cleared. Add new ones!</p>';
    alert("All quotes cleared!");
  }
}

// RESET
function resetToDefaults() {
  if (confirm("Reset to default quotes? Your custom quotes will be lost.")) {
    quotes = [...defaultQuotes];
    saveQuotes();
    updateStats();
    createCategoryFilter();
    showRandomQuote();
    alert("Reset to default quotes!");
  }
}

// INIT
function initializeApp() {
  loadQuotes();
  createCategoryFilter();
  updateStats();
  showRandomQuote();
}

newQuoteBtn.addEventListener("click", showRandomQuote);

document.getElementById("newQuoteText").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addQuote();
});

document
  .getElementById("newQuoteCategory")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") addQuote();
  });

initializeApp();
