const WEATHERSTACK_KEY = "102db9f038683e97d7fda5c8ab2f7c54";
const COUNTRY_API = "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,cca3";
const WEATHERSTACK_API = "https://api.weatherstack.com/current";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const sortBy = document.getElementById("sortBy");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const statusText = document.getElementById("status");
const countryGrid = document.getElementById("countryGrid");

// App State
let countries = [];
let onlyFavorites = false;
const FAVORITES_KEY = "travelwise-favorites";

/**
 * STORAGE HELPERS
 */
function getFavorites() {
  const data = localStorage.getItem(FAVORITES_KEY);
  return data ? JSON.parse(data) : [];
}

function setFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0);
}

/**
 * DATA FETCHING
 */
function loadCountries() {
  statusText.textContent = "Loading countries...";
  fetch(COUNTRY_API)
    .then(res => res.json())
    .then(data => {
      countries = data;
      renderCountries();
    })
    .catch(err => {
      console.error("Fetch error:", err);
      statusText.textContent = "Error: Could not load country data.";
    });
}

/**
 * FILTERING & SORTING (ONLY SEARCH IMPROVED)
 */
function getFilteredCountries() {
  const text = searchInput.value.toLowerCase();
  const region = regionFilter.value.toLowerCase();
  const favorites = getFavorites();

  let result = [];

  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const name = country.name.common.toLowerCase();
    const countryRegion = (country.region || "").toLowerCase();

    if (
      (region === "all" || countryRegion === region) &&
      name.includes(text) &&
      (!onlyFavorites || favorites.includes(country.cca3))
    ) {
      result.push(country);
    }
  }

  // simple sorting
  const mode = sortBy.value;

  if (mode === "name-asc") {
    result.sort((a, b) => a.name.common.localeCompare(b.name.common));
  } else if (mode === "name-desc") {
    result.sort((a, b) => b.name.common.localeCompare(a.name.common));
  } else if (mode === "population-desc") {
    result.sort((a, b) => b.population - a.population);
  } else if (mode === "population-asc") {
    result.sort((a, b) => a.population - b.population);
  }

  return result;
}

/**
 * WEATHER LOGIC (WEATHERSTACK)
 */
function getWeather(city, weatherSpan) {
  if (!city || city === "N/A") {
    weatherSpan.textContent = "No capital city";
    return;
  }

  if (WEATHERSTACK_KEY.includes("your_")) {
    weatherSpan.textContent = "API Key missing";
    return;
  }

  weatherSpan.textContent = "Loading...";

  const url = `${WEATHERSTACK_API}?access_key=${WEATHERSTACK_KEY}&query=${encodeURIComponent(city)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.success === false) {
        weatherSpan.textContent = "Unavailable";
        return;
      }

      const temp = data.current.temperature;
      const desc = data.current.weather_descriptions[0];
      weatherSpan.textContent = `${temp}°C, ${desc}`;
    })
    .catch(() => {
      weatherSpan.textContent = "Network Error";
    });
}

/**
 * FAVORITES LOGIC
 */
function toggleFavorite(code) {
  const favorites = getFavorites();
  const index = favorites.indexOf(code);

  if (index === -1) {
    favorites.push(code);
  } else {
    favorites.splice(index, 1);
  }

  setFavorites(favorites);
  renderCountries();
}

/**
 * UI RENDERING
 */
function renderCountries() {
  const list = getFilteredCountries();
  const favorites = getFavorites();

  countryGrid.innerHTML = "";

  if (list.length === 0) {
    statusText.textContent = "No countries match your search.";
    return;
  }

  statusText.textContent = `${list.length} result(s) found`;

  list.forEach(country => {
    const capital = country.capital && country.capital.length ? country.capital[0] : "N/A";
    const isFav = favorites.includes(country.cca3);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${country.flags.svg || country.flags.png}" alt="Flag">
      <h3>${country.name.common}</h3>
      <p><b>Capital:</b> ${capital}</p>
      <p><b>Region:</b> ${country.region || "Unknown"}</p>
      <p><b>Population:</b> ${formatNumber(country.population)}</p>
      <p><b>Weather:</b> <span class="weather">-</span></p>
      <div class="btns">
        <button class="weather-btn">Get Weather</button>
        <button class="favorite-btn ${isFav ? "saved" : ""}">
          ${isFav ? "Remove Favorite" : "Add Favorite"}
        </button>
      </div>
    `;

    card.querySelector(".weather-btn").addEventListener("click", () => {
      getWeather(capital, card.querySelector(".weather"));
    });

    card.querySelector(".favorite-btn").addEventListener("click", () => {
      toggleFavorite(country.cca3);
    });

    countryGrid.appendChild(card);
  });
}

/**
 * INITIALIZATION
 */
searchInput.addEventListener("input", renderCountries);
regionFilter.addEventListener("change", renderCountries);
sortBy.addEventListener("change", renderCountries);

showFavoritesBtn.addEventListener("click", () => {
  onlyFavorites = !onlyFavorites;
  showFavoritesBtn.textContent = onlyFavorites ? "Show All" : "Show Favorites";
  renderCountries();
});

loadCountries();
