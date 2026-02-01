/* ===================== CONFIG ===================== */
const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

/* ===================== ELEMENTS ===================== */
function haptic(ms = 15) {
  if ("vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
searchBtn.onclick = () => {
  haptic(10);
  const q = searchInput.value.trim();
  if (q) searchPlace(q);
};
const locBtn = document.getElementById("locBtn");
locBtn.onclick = () => {
  haptic(15);
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeather(pos.coords.latitude, pos.coords.longitude);
  });
};
const locationEl = document.getElementById("location");
const conditionEl = document.getElementById("condition");
const tempEl = document.getElementById("temperature");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastEl = document.getElementById("forecast");

const aiBtn = document.getElementById("aiBtn");
aiBtn.onclick = () => {
  haptic(8);
  if (!window.currentWeather) return;
  ...
};
const aiResult = document.getElementById("aiResult");

/* ===================== STATE ===================== */
let map, marker;
let weatherLoading = false;
let forecastLoading = false;
let lastForecastLat = null;
let lastForecastLon = null;
let tempAnimation = null;

/* ===================== EVENTS ===================== */
searchBtn.onclick = () => {
  const q = searchInput.value.trim();
  if (q) searchPlace(q);
};

locBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeather(pos.coords.latitude, pos.coords.longitude);
  });
};

/* ===================== SEARCH ===================== */
async function searchPlace(q) {
  const res = await fetch(
    `${GEO_URL}?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`
  );
  const data = await res.json();
  if (!data.length) return alert("Location not found");
  loadWeather(data[0].lat, data[0].lon);
}

/* ===================== WEATHER ===================== */
async function loadWeather(lat, lon) {
  if (weatherLoading) return;
  weatherLoading = true;

  try {
    const res = await fetch(
      `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const d = await res.json();

    locationEl.textContent = `${d.name}, ${d.sys.country}`;
    conditionEl.textContent = d.weather[0].description;
    tempEl.textContent = Math.round(d.main.temp) + "°C";
    humidityEl.textContent = d.main.humidity + "%";
    windEl.textContent = d.wind.speed + " m/s";

    window.currentWeather = {
      temp: Math.round(d.main.temp),
      humidity: d.main.humidity,
      wind: d.wind.speed,
      condition: d.weather[0].description
    };

    animateTemperature();
    setMood(d.weather[0].description);
    updateMap(lat, lon);

    if (lat !== lastForecastLat || lon !== lastForecastLon) {
      lastForecastLat = lat;
      lastForecastLon = lon;
      loadForecast(lat, lon);
    }

  } catch (e) {
    console.error(e);
  } finally {
    weatherLoading = false;
  }
}

/* ===================== MAP ===================== */
function updateMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], 11);
    marker.setLatLng([lat, lon]);
    map.invalidateSize();
  }
}

/* ===================== FORECAST ===================== */
async function loadForecast(lat, lon) {
  if (forecastLoading) return;
  forecastLoading = true;

  try {
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
        <div>${Math.round(d.main.temp)}°C</div>
        <div>${d.weather[0].main}</div>
      `;
      forecastEl.appendChild(div);
    });

  } catch (e) {
    console.error(e);
  } finally {
    forecastLoading = false;
  }
}

/* ===================== ANIMATION ===================== */
function animateTemperature() {
  if (tempAnimation) tempAnimation.cancel();

  tempAnimation = tempEl.animate(
    [
      { transform: "scale(0.9)", opacity: 0.6 },
      { transform: "scale(1)", opacity: 1 }
    ],
    {
      duration: 450,
      easing: "cubic-bezier(0.22,1,0.36,1)",
      fill: "forwards"
    }
  );
}

/* ===================== BACKGROUND ===================== */
function setMood(condition) {
  condition = condition.toLowerCase();

  document.body.className = ""; // reset

  if (condition.includes("rain")) {
    document.body.classList.add("rain");
  } else if (condition.includes("cloud")) {
    document.body.classList.add("clouds");
  } else if (condition.includes("snow")) {
    document.body.classList.add("snow");
  } else if (condition.includes("thunder")) {
    document.body.classList.add("thunder");
  } else {
    document.body.classList.add("clear");
  }
}

/* ===================== AI INSIGHT ===================== */
aiBtn.onclick = () => {
  if (!window.currentWeather) {
    aiResult.textContent = "Get weather first.";
    aiResult.classList.add("show");
    return;
  }

  const { temp, humidity, wind } = window.currentWeather;
  let insight = "";

  if (temp <= 10) insight += "❄️ Cold weather. Wear warm clothes. ";
  else if (temp <= 20) insight += "🧥 Cool and comfortable. ";
  else if (temp <= 30) insight += "☀️ Warm weather. Stay hydrated. ";
  else insight += "🔥 Very hot. Avoid outdoor activities. ";

  if (humidity > 70) insight += "High humidity may cause discomfort. ";
  if (wind > 5) insight += "Windy conditions detected. ";

  insight += "Overall, today looks manageable with planning.";

  aiResult.textContent = insight;
  aiResult.classList.add("show");
};
