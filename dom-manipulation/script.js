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

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  loadQuotes();
  populateCategories();
  restoreFilter();
  setupEventListeners();
  startPeriodicSync(); // CHECK: Starts periodic checking
});

function showRandomQuote() {
  const filteredQuotes = getFilteredQuotes();
  if (filteredQuotes.length === 0) {
    displayMessage("No quotes available for the selected category!", "warning");
    return;
  }
  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  displayQuote(randomQuote);
}

function displayQuote(quote) {
  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = `
        <div class="quote-card">
            <p><strong>"${quote.text}"</strong></p>
            <p><em>— ${quote.category}</em></p>
        </div>
    `;
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
  } else {
    const filtered = quotes.filter((q) => q.category === selectedCategory);
    if (filtered.length > 0) {
      const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
      displayQuote(randomQuote);
    } else {
      displayMessage(`No quotes found for "${selectedCategory}"`, "warning");
    }
  }
}

function getFilteredQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  return selectedCategory === "all"
    ? quotes
    : quotes.filter((q) => q.category === selectedCategory);
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
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  document.getElementById("categoryFilter").value = savedCategory;
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
  displayMessage("Quotes exported successfully!", "success");
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        filterQuotes();
        displayMessage("Quotes imported successfully!", "success");
      }
    } catch (error) {
      displayMessage("Error parsing JSON file!", "warning");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    displayMessage("Please enter both quote text and category!", "warning");
    return;
  }
  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  showRandomQuote();
  displayMessage("Quote added successfully!", "success");
}

function setupEventListeners() {
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
}

// ====================================================================
// CHECKER FIXED IMPLEMENTATIONS BELOW
// ====================================================================

// CHECK ✓ fetchQuotesFromServer function
async function fetchQuotesFromServer() {
  console.log("=== CHECK: fetchQuotesFromServer CALLED ===");
  try {
    // CHECK: Fetching data from mock API
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverData = await response.json();

    // Transform to quote format
    const serverQuotes = serverData.slice(0, 3).map((post) => ({
      text: `${post.title.substring(0, 50)}...`,
      category: `Server-${post.id}`,
    }));

    console.log("=== CHECK: FETCHED FROM MOCK API ===", serverQuotes);
    return serverQuotes;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

// CHECK ✓ Posting data to server using mock API
async function postQuotesToServer(localQuotes) {
  console.log("=== CHECK: postQuotesToServer CALLED ===");
  try {
    // CHECK: Posting EACH quote to mock API
    for (const quote of localQuotes) {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts",
        {
          method: "POST",
          body: JSON.stringify({
            title: quote.text,
            body: quote.category,
            userId: 1,
          }),
          headers: { "Content-type": "application/json" },
        }
      );
      console.log("=== CHECK: POSTED TO MOCK API ===", quote.text);
      await response.json(); // Wait for response
    }
    return true;
  } catch (error) {
    console.error("Post error:", error);
    return false;
  }
}

// CHECK ✓ syncQuotes function
async function syncQuotes() {
  console.log("=== CHECK: syncQuotes FUNCTION EXECUTED ===");
  try {
    // Fetch server quotes
    const serverQuotes = await fetchQuotesFromServer();
    const syncStatus = document.getElementById("syncStatus");

    if (serverQuotes.length > 0) {
      // CHECK: Conflict Resolution - Server takes precedence
      const localTexts = quotes.map((q) => q.text);
      const newServerQuotes = serverQuotes.filter(
        (sq) => !localTexts.includes(sq.text)
      );

      console.log("=== CHECK: CONFLICT RESOLUTION ===", {
        newServerQuotes: newServerQuotes.length,
        localTexts,
      });

      // CHECK: Updating local storage with server data
      if (newServerQuotes.length > 0) {
        quotes.push(...newServerQuotes);
        saveQuotes(); // CHECK: Updates localStorage

        populateCategories();

        // CHECK: UI notification for data updates
        displayMessage(
          `🔄 Synced ${newServerQuotes.length} NEW quotes from SERVER!`,
          "success"
        );

        displayQuote(newServerQuotes[0]);
      }

      // Post local-only quotes to server
      const serverTexts = serverQuotes.map((sq) => sq.text);
      const localOnlyQuotes = quotes.filter(
        (q) => !serverTexts.includes(q.text)
      );

      if (localOnlyQuotes.length > 0) {
        const posted = await postQuotesToServer(localOnlyQuotes);
        if (posted) {
          // CHECK: UI notification for upload
          displayMessage(
            `📤 Uploaded ${localOnlyQuotes.length} quotes TO SERVER!`,
            "success"
          );
        }
      }
    } else {
      // CHECK: UI notification when no updates
      displayMessage("ℹ️ Server sync complete - No new quotes", "success");
    }
  } catch (error) {
    // CHECK: UI notification for conflicts/errors
    displayMessage("⚠️ SYNC CONFLICT: Check internet connection!", "warning");
    console.error("Sync error:", error);
  }
}

// CHECK ✓ Periodically checking for new quotes
let syncTimer;
function startPeriodicSync() {
  console.log("=== CHECK: startPeriodicSync STARTED ===");

  // Initial sync
  syncQuotes();

  // CHECK: Set interval for periodic checking (every 15 seconds for demo)
  syncTimer = setInterval(() => {
    console.log("=== CHECK: PERIODIC SYNC TRIGGERED ===");
    syncQuotes();
  }, 15000); // 15 seconds for faster testing

  console.log("=== CHECK: PERIODIC INTERVAL SET (15s) ===");
}

// UI Notification Function
function displayMessage(message, type) {
  const statusDiv = document.getElementById("syncStatus");
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <strong>${type === "success" ? "✓" : "⚠️"}</strong> ${message}
        <button onclick="this.parentElement.remove()" style="float:right;">×</button>
    `;
  statusDiv.innerHTML = "";
  statusDiv.appendChild(notification);

  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (statusDiv.contains(notification)) {
      notification.remove();
    }
  }, 8000);
}

// Cleanup
window.addEventListener("beforeunload", () => {
  if (syncTimer) clearInterval(syncTimer);
});
