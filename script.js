// ---------- JAVASCRIPT: how the page behaves ----------
// API used: Open-Meteo Geocoding (free, no API key)
// Example: https://geocoding-api.open-meteo.com/v1/search?name=lagos&count=10

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

function showResults(places) {
  hideAll();
  // .map() turns each place into a block of HTML; .join("") glues them together
  resultsEl.innerHTML = places
    .map(place => {
      // ?? gives a fallback when a field is missing from the data
      const region = place.admin1 ?? "N/A";
      const country = place.country ?? "N/A";
      const population = place.population
        ? place.population.toLocaleString()
        : "N/A";
      return `
        <div class="card">
          <h2>${place.name}</h2>
          <p><strong>Country:</strong> ${country}</p>
          <p><strong>Region:</strong> ${region}</p>
          <p><strong>Population:</strong> ${population}</p>
        </div>
      `;
    })
    .join("");
}

// 3. THE MAIN SEARCH FUNCTION (Days 22 to 26 all meet here)
async function search(query) {
  query = query.trim();                       // remove extra spaces

  if (query === "") {
    showError("Please type a city name first.");
    return;
  }

  showLoading();                              // state 1: loading

  try {
    // encodeURIComponent makes text safe for a URL (e.g. "new york")
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`;

    const response = await fetch(url);        // ask the API and wait

    // Any bad status is a real error: throw it so catch can handle it
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const data = await response.json();       // read the data (also takes time)

    // This API replies 200 with NO "results" list when nothing matches.
    // That is the EMPTY state, not an error.
    if (!data.results || data.results.length === 0) {
      showEmpty();
      return;
    }

    // Sort biggest population first (missing population counts as 0)
    const places = data.results.sort(
      (a, b) => (b.population ?? 0) - (a.population ?? 0)
    );

    showResults(places);                      // state: success

    // Save the last successful search so it survives a refresh
    localStorage.setItem("lastCitySearch", JSON.stringify({ query, places }));
  } catch (error) {
    // Runs if the request fails (no internet, blocked, bad status...)
    console.error(error);
    showError("Could not load data. Please try again in a moment.");
  }
}

// 4. ON PAGE LOAD: show the last saved search so the page is never blank
function loadLastSearch() {
  const saved = localStorage.getItem("lastCitySearch");
  if (!saved) return;

  try {
    const { query, places } = JSON.parse(saved);   // text back into real data
    searchInput.value = query;
    showResults(places);
  } catch (error) {
    localStorage.removeItem("lastCitySearch");     // saved data was broken: clear it
  }
}

// 5. CONNECT USER ACTIONS: click the button, or press Enter
searchBtn.addEventListener("click", () => search(searchInput.value));

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") search(searchInput.value);
});

loadLastSearch();