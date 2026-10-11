// ---------- JAVASCRIPT: how the page behaves ----------

// 1. GRAB ELEMENTS: find the HTML pieces so JavaScript can control them
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const loadingEl   = document.getElementById("loading");
const errorEl     = document.getElementById("error");
const emptyEl     = document.getElementById("empty");
const resultsEl   = document.getElementById("results");

// 2. STATE HELPERS: each one clears everything, then shows only its own part
function hideAll() {
  loadingEl.hidden = true;
  errorEl.hidden = true;
  emptyEl.hidden = true;
  resultsEl.innerHTML = "";
}

function showLoading() {
  hideAll();
  loadingEl.hidden = false;
}

function showError(message) {
  hideAll();
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function showEmpty() {
  hideAll();
  emptyEl.hidden = false;
}

function showResults(countries) {
  hideAll();
  // .map() turns each country into a block of HTML; .join("") glues them together
  resultsEl.innerHTML = countries
    .map(country => {
      // ?. avoids a crash if capital is missing; ?? gives a fallback value
      const capital = country.capital?.[0] ?? "N/A";
      return `
        <div class="card">
          <img src="${country.flags.png}" alt="Flag of ${country.name.common}">
          <h2>${country.name.common}</h2>
          <p><strong>Capital:</strong> ${capital}</p>
          <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
        </div>
      `;
    })
    .join("");
}

// 3. THE MAIN SEARCH FUNCTION (Days 22 to 26 all meet here)
async function search(query) {
  query = query.trim();                       // remove extra spaces

  if (query === "") {
    showError("Please type a country name first.");
    return;
  }

  showLoading();                              // state 1: loading

  try {
    // encodeURIComponent makes text safe for a URL (e.g. "south africa")
    // ?fields= asks the API for only the 4 things we need
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,capital,population,flags`;

    const response = await fetch(url);        // ask the API and wait

    // This API replies 404 when no country matches, so that means EMPTY, not a crash
    if (response.status === 404) {
      showEmpty();
      return;
    }

    // Any other bad status is a real error: throw it so catch can handle it
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const countries = await response.json();  // read the data (also takes time)

    // Sort biggest population first
    countries.sort((a, b) => b.population - a.population);

    showResults(countries);                   // state: success

    // Save the last successful search so it survives a refresh
    localStorage.setItem("lastSearch", JSON.stringify({ query, countries }));
  } catch (error) {
    // Runs if there is no internet, or if we threw an error above
    console.error(error);
    showError("Could not load data. Check your internet connection and try again.");
  }
}

// 4. ON PAGE LOAD: show the last saved search so the page is never blank
function loadLastSearch() {
  const saved = localStorage.getItem("lastSearch");
  if (!saved) return;

  try {
    const { query, countries } = JSON.parse(saved);  // text back into real data
    searchInput.value = query;
    showResults(countries);
  } catch (error) {
    localStorage.removeItem("lastSearch");           // saved data was broken: clear it
  }
}

// 5. CONNECT USER ACTIONS: click the button, or press Enter
searchBtn.addEventListener("click", () => search(searchInput.value));

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") search(searchInput.value);
});

loadLastSearch();