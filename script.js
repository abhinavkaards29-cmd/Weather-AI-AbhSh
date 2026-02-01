/* ================= CONFIG ================= */
const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

/* ===== ELEMENTS ===== */
const locationEl = document.getElementById("location");
const conditionEl = document.getElementById("condition");
const tempEl = document.getElementById("temperature");
const unitEl = document.getElementById("unit");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const forecastEl = document.getElementById("forecast");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const voiceBtn = document.getElementById("voiceBtn");
const aiBtn = document.getElementById("aiBtn");
const aiResult = document.getElementById("aiResult");
const unitToggle = document.getElementById("unitToggle");

/* ===== STATE ===== */
let map, marker;
let isCelsius = true;
let currentWeather = null;

/* ===== HAPTIC ===== */
function haptic(ms = 10) {
  if ("vibrate" in navigator) navigator.vibrate(ms);
}

/* ===== SEARCH ===== */
searchBtn.onclick = () => {
  haptic();
  if (searchInput.value.trim()) searchPlace(searchInput.value);
};

/* ===== VOICE ===== */
if ("webkitSpeechRecognition" in window) {
  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";
  voiceBtn.onclick = () => rec.start();
  rec.onresult = e => {
    searchInput.value = e.results[0][0].transcript;
    searchPlace(searchInput.value);
  };
}

/* ===== GEO SEARCH ===== */
async function searchPlace(q) {
  const res = await fetch(`${GEO_URL}?q=${q}&limit=1&appid=${API_KEY}`);
  const d = await res.json();
  if (!d.length) return alert("Location not found");
  loadWeather(d[0].lat, d[0].lon);
}

/* ===== WEATHER ===== */
async function loadWeather(lat, lon) {
  const res = await fetch(
    `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const d = await res.json();

  currentWeather = d;

  locationEl.textContent = `${d.name}, ${d.sys.country}`;
  conditionEl.textContent = d.weather[0].description;
  tempEl.textContent = Math.round(d.main.temp);
  humidityEl.textContent = d.main.humidity + "%";
  windEl.textContent = d.wind.speed + " m/s";

  setMood(d.weather[0].description);
  updateMap(lat, lon);
  loadForecast(lat, lon);
}

/* ===== FORECAST ===== */
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

/* ===== MAP ===== */
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

/* ===== BACKGROUND ===== */
function setMood(cond) {
  document.body.className = "";
  cond = cond.toLowerCase();
  if (cond.includes("rain")) document.body.classList.add("rain","bg-clouds");
  else if (cond.includes("cloud")) document.body.classList.add("clouds","bg-clouds");
  else if (cond.includes("snow")) document.body.classList.add("snow");
  else if (cond.includes("thunder")) document.body.classList.add("thunder");
  else document.body.classList.add("clear");
}

/* ===== °C / °F ===== */
unitToggle.onchange = () => {
  if (!currentWeather) return;
  isCelsius = !unitToggle.checked;
  let t = currentWeather.main.temp;
  if (!isCelsius) t = t * 9/5 + 32;
  tempEl.textContent = Math.round(t);
  unitEl.textContent = isCelsius ? "°C" : "°F";
};

/* ===== AI INSIGHT ===== */
aiBtn.onclick = () => {
  haptic(15);
  if (!currentWeather) return;
  const t = currentWeather.main.temp;
  let msg = "🌤️ ";
  if (t < 10) msg += "Cold weather. Dress warmly.";
  else if (t < 20) msg += "Cool and pleasant.";
  else if (t < 30) msg += "Warm weather. Stay hydrated.";
  else msg += "Very hot. Avoid outdoor activities.";
  aiResult.textContent = msg;
};
