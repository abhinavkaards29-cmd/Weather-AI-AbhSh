const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");

const locationEl = document.getElementById("location");
const conditionEl = document.getElementById("condition");
const tempEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastEl = document.getElementById("forecast");

let map, marker;

// EVENTS
searchBtn.onclick = () => {
  const q = searchInput.value.trim();
  if (q) searchPlace(q);
};

locBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeather(pos.coords.latitude, pos.coords.longitude);
  });
};

// SEARCH AREA / CITY / COUNTRY
async function searchPlace(q) {
  const res = await fetch(
    `${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`
  );
  const data = await res.json();
  if (!data.length) return alert("Location not found");
  loadWeather(data[0].lat, data[0].lon);
}

let lastForecastLat = null;
let lastForecastLon = null;
if (!lat || !lon) return;
// LOAD WEATHER
async function loadWeather(lat, lon) {
  const res = await fetch(
    `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const d = await res.json();

  locationEl.textContent = `${d.name}, ${d.sys.country}`;
  conditionEl.textContent = d.weather[0].description;
  tempEl.textContent = Math.round(d.main.temp) + "°";
  humidityEl.textContent = d.main.humidity;
  windEl.textContent = d.wind.speed;

  window.currentWeather = {
    temp: Math.round(d.main.temp),
    humidity: d.main.humidity,
    wind: d.wind.speed,
    condition: d.weather[0].description,
    lat,
    lon
  };

  updateMap(lat, lon);
 if (lat !== lastForecastLat || lon !== lastForecastLon) {
  lastForecastLat = lat;
  lastForecastLon = lon;
  loadForecast(lat, lon);
}

  // 🔥 THIS WAS MISSING
  animateUpdate();
  setMood(d.weather[0].description);
}

// MAP (SAFE)
function updateMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], 11);
    marker.setLatLng([lat, lon]);
  }
}

// FORECAST
async function loadForecast(lat, lon) {
  const res = await fetch(
    `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const data = await res.json();

  forecastEl.innerHTML = "";
  const days = {};

  data.list.forEach(i => {
    const day = i.dt_txt.split(" ")[0];
    if (!days[day]) days[day] = i;
  });

  Object.values(days).slice(0, 7).forEach(d => {
    const div = document.createElement("div");
    div.className = "forecast-day";
    div.innerHTML = `
      <div>${new Date(d.dt_txt).toDateString().slice(0,3)}</div>
      <div>${Math.round(d.main.temp)}°</div>
      <div>${d.weather[0].main}</div>
    `;
    forecastEl.appendChild(div);
  });
}

// ---------- PREMIUM ANIMATION HELPERS ----------

function animateUpdate() {
  const temp = document.getElementById("temperature");
  if (!temp) return;

  temp.animate(
    [
      { transform: "scale(0.92)", opacity: 0.6 },
      { transform: "scale(1)", opacity: 1 }
    ],
    {
      duration: 450,
      easing: "cubic-bezier(0.22,1,0.36,1)"
    }
  );
}

function setMood(condition) {
  if (!condition) return;

  document.body.style.transition = "background 1.2s ease";

  if (condition.includes("rain")) {
    document.body.style.background =
      "linear-gradient(180deg,#2c3e50,#000)";
  } 
  else if (condition.includes("cloud")) {
    document.body.style.background =
      "linear-gradient(180deg,#3a4a5a,#111)";
  } 
  else {
    document.body.style.background =
      "linear-gradient(180deg,#1e3c72,#2a5298)";
  }
}

// ---------- AI WEATHER INSIGHT (SAFE, NO API) ----------
const aiBtn = document.getElementById("aiBtn");
const aiResult = document.getElementById("aiResult");

aiBtn.onclick = () => {
  if (!window.currentWeather) {
    aiResult.textContent = "Get weather first, then tap AI Insight.";
    aiResult.classList.add("show");
    return;
  }

  const { temp, humidity, wind } = window.currentWeather;
  let insight = "";


  if (temp <= 10) {
    insight += "❄️ Cold weather detected. Wear warm clothes. ";
  } else if (temp <= 20) {
    insight += "🌤️ Cool and comfortable temperature. ";
  } else if (temp <= 30) {
    insight += "☀️ Warm weather. Stay hydrated. ";
  } else {
    insight += "🔥 Very hot conditions. Avoid outdoor activities. ";
  }

  if (humidity > 70) {
    insight += "High humidity may cause discomfort. ";
  }

  if (wind > 5) {
    insight += "Windy conditions detected. ";
  }

  insight += "Overall, today looks manageable with proper planning.";

  aiResult.textContent = insight;
  aiResult.classList.add("show");
};
