const OPENWEATHER_API_KEY = "abc123xyzYOURKEY";

const COUNTRY_API = "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,cca3";
const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";

const searchInput = document.getElementById("searchInput");
const regionFilter = document.getElementById("regionFilter");
const sortBy = document.getElementById("sortBy");
const showFavoritesBtn = document.getElementById("showFavoritesBtn");
const statusText = document.getElementById("status");
const countryGrid = document.getElementById("countryGrid");

let countries = [];
let onlyFavorites = false;
const FAVORITES_KEY = "travelwise-favorites";

function getFavorites() {
  const data = localStorage.getItem(FAVORITES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

function setFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0);
}

function loadCountries() {
  fetch(COUNTRY_API)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      countries = data;
      renderCountries();
    })
    .catch(function () {
      statusText.textContent = "Could not load countries.";
    });
}

function getFilteredCountries() {
  const text = searchInput.value.toLowerCase().trim();
  const region = regionFilter.value;
  const favorites = getFavorites();

  let result = countries.filter(function (country) {
    const name = country.name.common.toLowerCase();
    const regionMatch = region === "all" || (country.region || "").toLowerCase() === region;
    const searchMatch = name.includes(text);
    const favMatch = !onlyFavorites || favorites.includes(country.cca3);

    return regionMatch && searchMatch && favMatch;
  });

  const mode = sortBy.value;

  if (mode === "name-asc") {
    result.sort(function (a, b) {
      return a.name.common.localeCompare(b.name.common);
    });
  } else if (mode === "name-desc") {
    result.sort(function (a, b) {
      return b.name.common.localeCompare(a.name.common);
    });
  } else if (mode === "population-desc") {
    result.sort(function (a, b) {
      return b.population - a.population;
    });
  } else if (mode === "population-asc") {
    result.sort(function (a, b) {
      return a.population - b.population;
    });
  }

  return result;
}

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

function getWeather(city, weatherSpan) {
  if (city === "N/A") {
    weatherSpan.textContent = "No capital city";
    return;
  }

  if (OPENWEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    weatherSpan.textContent = "Add API key in script.js";
    return;
  }

  weatherSpan.textContent = "Loading...";

  const url = WEATHER_API + "?q=" + encodeURIComponent(city) + "&appid=" + OPENWEATHER_API_KEY + "&units=metric";

  fetch(url)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data.main || !data.weather) {
        weatherSpan.textContent = "Weather not found";
        return;
      }

      const temp = Math.round(data.main.temp);
      const desc = data.weather[0].description;
      weatherSpan.textContent = temp + "°C, " + desc;
    })
    .catch(function () {
      weatherSpan.textContent = "Weather error";
    });
}

function renderCountries() {
  const list = getFilteredCountries();
  const favorites = getFavorites();

  countryGrid.innerHTML = "";

  if (list.length === 0) {
    statusText.textContent = "No countries found.";
    return;
  }

  statusText.textContent = list.length + " result(s)";

  list.forEach(function (country) {
    const capital = country.capital && country.capital.length ? country.capital[0] : "N/A";
    const isFav = favorites.includes(country.cca3);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML =
      '<img src="' + (country.flags.svg || country.flags.png) + '" alt="flag">' +
      '<h3>' + country.name.common + '</h3>' +
      '<p><b>Capital:</b> ' + capital + '</p>' +
      '<p><b>Region:</b> ' + (country.region || "Unknown") + '</p>' +
      '<p><b>Population:</b> ' + formatNumber(country.population) + '</p>' +
      '<p><b>Weather:</b> <span class="weather">-</span></p>' +
      '<div class="btns">' +
      '<button class="weather-btn">Get Weather</button>' +
      '<button class="favorite-btn ' + (isFav ? "saved" : "") + '">' + (isFav ? "Remove Favorite" : "Add Favorite") + '</button>' +
      '</div>';

    const weatherBtn = card.querySelector(".weather-btn");
    const favoriteBtn = card.querySelector(".favorite-btn");
    const weatherSpan = card.querySelector(".weather");

    weatherBtn.addEventListener("click", function () {
      getWeather(capital, weatherSpan);
    });

    favoriteBtn.addEventListener("click", function () {
      toggleFavorite(country.cca3);
    });

    countryGrid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderCountries);
regionFilter.addEventListener("change", renderCountries);
sortBy.addEventListener("change", renderCountries);

showFavoritesBtn.addEventListener("click", function () {
  onlyFavorites = !onlyFavorites;
  showFavoritesBtn.textContent = onlyFavorites ? "Show All" : "Show Favorites";
  renderCountries();
});

loadCountries();
