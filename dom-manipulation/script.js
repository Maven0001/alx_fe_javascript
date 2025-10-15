// Array of quote objects with text and category
let quotes = [
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

// Variable to track selected category filter
let selectedCategory = "All";

// Get DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

/**
 * Function to show a random quote
 * Filters by category if one is selected
 */
function showRandomQuote() {
  // Clear existing content
  quoteDisplay.innerHTML = "";

  // Filter quotes by selected category
  let filteredQuotes = quotes;
  if (selectedCategory !== "All") {
    filteredQuotes = quotes.filter(
      (quote) => quote.category === selectedCategory
    );
  }

  // Check if there are any quotes to display
  if (filteredQuotes.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-quote";
    emptyMessage.textContent = "No quotes available in this category. Add one!";
    quoteDisplay.appendChild(emptyMessage);
    return;
  }

  // Get a random quote from the filtered array
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  // Create quote text element
  const quoteText = document.createElement("p");
  quoteText.className = "quote-text";
  quoteText.textContent = randomQuote.text;

  // Create category badge element
  const categoryBadge = document.createElement("span");
  categoryBadge.className = "quote-category";
  categoryBadge.textContent = randomQuote.category;

  // Append elements to quote display
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(categoryBadge);

  // Add fade-in animation
  quoteDisplay.style.opacity = "0";
  setTimeout(() => {
    quoteDisplay.style.transition = "opacity 0.5s ease";
    quoteDisplay.style.opacity = "1";
  }, 10);
}

/**
 * Function to add a new quote
 * Validates input and updates the quotes array
 */
function addQuote() {
  // Get input values
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document
    .getElementById("newQuoteCategory")
    .value.trim();

  // Validate inputs
  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please fill in both the quote text and category!");
    return;
  }

  // Create new quote object
  const newQuote = {
    text: newQuoteText,
    category: newQuoteCategory,
  };

  // Add to quotes array
  quotes.push(newQuote);

  // Clear input fields
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  // Update statistics
  updateStats();

  // Recreate category filter buttons
  createCategoryFilter();

  // Show success feedback
  alert(`Quote added successfully! Total quotes: ${quotes.length}`);

  // Optionally display the newly added quote
  showRandomQuote();
}

/**
 * Function to get unique categories from quotes array
 */
function getUniqueCategories() {
  const categories = quotes.map((quote) => quote.category);
  return ["All", ...new Set(categories)];
}

/**
 * Function to create category filter buttons dynamically
 */
function createCategoryFilter() {
  // Clear existing filter buttons
  categoryFilter.innerHTML = "";

  // Get unique categories
  const categories = getUniqueCategories();

  // Create a button for each category
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "category-btn";
    button.textContent = category;

    // Set active class for selected category
    if (category === selectedCategory) {
      button.classList.add("active");
    }

    // Add click event listener
    button.addEventListener("click", function () {
      // Update selected category
      selectedCategory = category;

      // Update button active states
      const allButtons = categoryFilter.querySelectorAll(".category-btn");
      allButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show a quote from the selected category
      showRandomQuote();
    });

    // Append button to category filter
    categoryFilter.appendChild(button);
  });
}

/**
 * Function to update statistics display
 */
function updateStats() {
  // Update total quotes count
  document.getElementById("totalQuotes").textContent = quotes.length;

  // Update total categories count (excluding 'All')
  const categories = getUniqueCategories();
  document.getElementById("totalCategories").textContent =
    categories.length - 1;
}

/**
 * Function to create the add quote form dynamically
 * (Alternative implementation - form already exists in HTML)
 */
function createAddQuoteForm() {
  // This function would create the form dynamically if it didn't exist in HTML
  // For this implementation, the form is pre-built in HTML
  // But here's how you would create it dynamically:

  const formContainer = document.createElement("div");
  formContainer.className = "add-quote-section";

  const heading = document.createElement("h2");
  heading.textContent = "Add Your Own Quote";

  const quoteTextGroup = document.createElement("div");
  quoteTextGroup.className = "form-group";
  const quoteTextLabel = document.createElement("label");
  quoteTextLabel.textContent = "Quote Text";
  const quoteTextInput = document.createElement("input");
  quoteTextInput.id = "newQuoteText";
  quoteTextInput.type = "text";
  quoteTextInput.placeholder = "Enter a new quote";
  quoteTextGroup.appendChild(quoteTextLabel);
  quoteTextGroup.appendChild(quoteTextInput);

  const categoryGroup = document.createElement("div");
  categoryGroup.className = "form-group";
  const categoryLabel = document.createElement("label");
  categoryLabel.textContent = "Category";
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryGroup.appendChild(categoryLabel);
  categoryGroup.appendChild(categoryInput);

  const addButton = document.createElement("button");
  addButton.className = "add-quote-btn";
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formContainer.appendChild(heading);
  formContainer.appendChild(quoteTextGroup);
  formContainer.appendChild(categoryGroup);
  formContainer.appendChild(addButton);

  return formContainer;
}

/**
 * Initialize the application
 */
function initializeApp() {
  // Create category filter buttons
  createCategoryFilter();

  // Update initial statistics
  updateStats();

  // Display first quote on load
  showRandomQuote();
}

// Add event listener to "Show New Quote" button
newQuoteBtn.addEventListener("click", showRandomQuote);

// Add Enter key support for input fields
document
  .getElementById("newQuoteText")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addQuote();
    }
  });

document
  .getElementById("newQuoteCategory")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addQuote();
    }
  });

// Initialize the application when the page loads
initializeApp();
