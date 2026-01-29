/**********************************************************
 * CONFIG
 **********************************************************/
const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

/**********************************************************
 * DOM ELEMENTS
 **********************************************************/
const searchInput = document.getElementById("searchInput");
const searchBtn   = document.getElementById("searchBtn");
const locBtn      = document.getElementById("locBtn");

const locationEl  = document.getElementById("location");
const conditionEl = document.getElementById("condition");
const tempEl      = document.getElementById("temperature");
const humidityEl  = document.getElementById("humidity");
const windEl      = document.getElementById("wind");

const forecastEl  = document.getElementById("forecast");
const mapEl       = document.getElementById("map");

/**********************************************************
 * MAP STATE (IMPORTANT: ONLY ONE MAP EVER)
 **********************************************************/
let map = null;
let marker = null;

/**********************************************************
 * INITIALIZE EVENTS (ONLY ONCE)
 **********************************************************/
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query) return;
  searchByPlace(query);
});

locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      loadWeather(pos.coords.latitude, pos.coords.longitude);
    },
    () => alert("Location access denied")
  );
});

/**********************************************************
 * SEARCH BY CITY / AREA / LOCALITY
 **********************************************************/
async function searchByPlace(place) {
  try {
    const geoRes = await fetch(
      `${GEO_URL}?q=${encodeURIComponent(place)}&limit=1&appid=${API_KEY}`
    );
    const geo = await geoRes.json();

    if (!geo || geo.length === 0) {
      alert("Location not found");
      return;
    }

    loadWeather(geo[0].lat, geo[0].lon);
  } catch (err) {
    console.error(err);
  }
}

/**********************************************************
 * LOAD WEATHER (SINGLE ENTRY POINT)
 **********************************************************/
async function loadWeather(lat, lon) {
  try {
    // Fetch current weather
    const res = await fetch(
      `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const data = await res.json();

    // Update UI
    animateText(locationEl, `${data.name}, ${data.sys.country}`);
    animateText(conditionEl, data.weather[0].description);
    animateNumber(tempEl, Math.round(data.main.temp) + "°");
    humidityEl.textContent = data.main.humidity + "%";
    windEl.textContent = data.wind.speed + " m/s";

    // Save for future AI
    window.currentWeather = {
      temp: data.main.temp,
      humidity: data.main.humidity,
      wind: data.wind.speed,
      condition: data.weather[0].main.toLowerCase()
    };

    // Map + Forecast (safe, no recursion)
    updateMap(lat, lon);
    loadForecast(lat, lon);

  } catch (err) {
    console.error(err);
  }
}

/**********************************************************
 * MAP (NEVER RECREATED, NEVER HANGS)
 **********************************************************/
function updateMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.flyTo([lat, lon], 11, { duration: 1 });
    marker.setLatLng([lat, lon]);
  }

  // Fix blank map issue
  requestAnimationFrame(() => {
    map.invalidateSize();
  });
}

/**********************************************************
 * 7-DAY FORECAST (STABLE VERSION)
 **********************************************************/
async function loadForecast(lat, lon) {
  try {
    const res = await fetch(
      `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const data = await res.json();

    forecastEl.innerHTML = "";

    const days = {};
    data.list.forEach(item => {
      const day = item.dt_txt.split(" ")[0];
      if (!days[day]) days[day] = item;
    });

    Object.values(days).slice(0, 7).forEach(d => {
      const div = document.createElement("div");
      div.className = "forecast-day";
      div.innerHTML = `
        <p>${new Date(d.dt_txt).toDateString().slice(0, 3)}</p>
        <p>${Math.round(d.main.temp)}°</p>
        <p>${d.weather[0].main}</p>
      `;
      forecastEl.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}

/**********************************************************
 * SMOOTH, NON-BLOCKING ANIMATIONS
 **********************************************************/
function animateText(el, text) {
  el.style.opacity = 0;
  requestAnimationFrame(() => {
    el.textContent = text;
    el.style.opacity = 1;
  });
}

function animateNumber(el, text) {
  el.style.transform = "scale(0.9)";
  el.textContent = text;
  requestAnimationFrame(() => {
    el.style.transform = "scale(1)";
  });
}
