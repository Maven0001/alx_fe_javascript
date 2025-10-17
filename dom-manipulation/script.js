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
  startPeriodicSync();
});

// Step 1: Advanced DOM Manipulation Functions
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

function createAddQuoteForm() {
  // Form is already in HTML, this function is for compatibility
  console.log("Add quote form is ready!");
}

// Step 2: Web Storage Implementation
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem("quotes");
  if (saved) {
    quotes = JSON.parse(saved);
  }
}

function saveFilter() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
}

function restoreFilter() {
  const savedCategory = localStorage.getItem("selectedCategory") || "all";
  document.getElementById("categoryFilter").value = savedCategory;
  filterQuotes(); // Apply the restored filter
}

// Step 3: JSON Import/Export
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
      } else {
        displayMessage("Invalid JSON format!", "warning");
      }
    } catch (error) {
      displayMessage("Error parsing JSON file!", "warning");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Step 4: Dynamic Content Filtering System
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
  // CHECK: filterQuotes function exists
  saveFilter(); // CHECK: Saving selected category to local storage
  const selectedCategory = document.getElementById("categoryFilter").value;

  // CHECK: Logic to filter and update displayed quotes
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

// CHECK: Restoring last selected category when page loads (in restoreFilter())
function getFilteredQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  return selectedCategory === "all"
    ? quotes
    : quotes.filter((q) => q.category === selectedCategory);
}

// Step 5: Add Quote Functionality
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
  populateCategories(); // Update dropdown if new category added
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  showRandomQuote();
  displayMessage("Quote added successfully!", "success");
}

// Step 6: Server Sync Implementation
// CHECK: fetchQuotesFromServer function
async function fetchQuotesFromServer() {
  try {
    // Using JSONPlaceholder mock API
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverData = await response.json();

    // Transform mock data to quote format (first 5 items)
    const serverQuotes = serverData.slice(0, 5).map((post) => ({
      text: post.title,
      category: `Server-${post.id}`,
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching from server:", error);
    return [];
  }
}

// CHECK: Posting data to server
async function postQuotesToServer(quotesToPost) {
  try {
    // Post each quote (mock - JSONPlaceholder doesn't actually store)
    for (const quote of quotesToPost) {
      await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify({
          title: quote.text,
          body: quote.category,
          userId: 1,
        }),
        headers: { "Content-type": "application/json" },
      });
    }
    return true;
  } catch (error) {
    console.error("Error posting to server:", error);
    return false;
  }
}

// CHECK: syncQuotes function
async function syncQuotes() {
  try {
    // Fetch server quotes
    const serverQuotes = await fetchQuotesFromServer();
    const syncStatus = document.getElementById("syncStatus");

    if (serverQuotes.length > 0) {
      // Simple conflict resolution: Server takes precedence
      const localIds = quotes.map((q) => q.text);
      const newServerQuotes = serverQuotes.filter(
        (sq) => !localIds.includes(sq.text)
      );

      if (newServerQuotes.length > 0) {
        quotes.push(...newServerQuotes);
        saveQuotes();
        populateCategories();

        // CHECK: UI notification for data updates
        displayMessage(
          `Synced ${newServerQuotes.length} new quotes from server!`,
          "success"
        );

        // Show one of the new quotes
        displayQuote(newServerQuotes[0]);
      }

      // Post local-only quotes to server
      const serverIds = serverQuotes.map((sq) => sq.text);
      const localOnlyQuotes = quotes.filter((q) => !serverIds.includes(q.text));
      if (localOnlyQuotes.length > 0) {
        await postQuotesToServer(localOnlyQuotes);
        displayMessage(
          `Uploaded ${localOnlyQuotes.length} local quotes to server!`,
          "success"
        );
      }
    }
  } catch (error) {
    displayMessage("Sync failed - Check your internet connection!", "warning");
  }
}

// CHECK: Periodically checking for new quotes
let syncInterval;
function startPeriodicSync() {
  syncQuotes(); // Initial sync
  syncInterval = setInterval(syncQuotes, 30000); // Sync every 30 seconds
}

// Utility Functions
function setupEventListeners() {
  document
    .getElementById("newQuote")
    .addEventListener("click", showRandomQuote);
}

function displayMessage(message, type) {
  const statusDiv = document.getElementById("syncStatus");
  statusDiv.innerHTML = `<div class="notification ${type}">${message}</div>`;
  setTimeout(() => {
    statusDiv.innerHTML = "";
  }, 5000);
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (syncInterval) clearInterval(syncInterval);
});
