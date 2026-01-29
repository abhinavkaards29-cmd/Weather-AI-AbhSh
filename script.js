const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";
const BASE = "https://api.openweathermap.org/data/2.5/weather";

let isLoading = false;

let map, marker;

function initMap(lat, lon, condition = "") {
  const isRain = condition.includes("rain");
  const isNight = new Date().getHours() > 18;

  const tileURL = isNight
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  if (!map) {
    map = L.map("map", {
      zoomControl: false,
      inertia: true
    }).setView([lat, lon], 11);

    L.tileLayer(tileURL).addTo(map);
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.flyTo([lat, lon], 11, { duration: 1.2 });
    marker.setLatLng([lat, lon]);
  }

  setTimeout(() => map.invalidateSize(), 200);
}
function status(msg) {
  document.getElementById("status").innerText = msg;
}

async function searchCity() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return status("Enter a place");

  status("Loading...");
  fetchWeather(`${BASE}?q=${q}&units=metric&appid=${API_KEY}`);
}

async function geocodePlace(place) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(place)}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error("Location not found");
  }

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    name: data[0].name,
    country: data[0].country
  };
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  const d = await res.json();

  updateUI(d);
}

function searchLocation() {
  if (!navigator.geolocation) {
    status("Location not supported");
    return;
  }

  status("Getting location...");
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    fetchWeather(
      `${BASE}?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
    );
  });
}

async function fetchWeather(url) {
  if (isLoading) return;        // ⛔ prevents hang
  isLoading = true;

  const res = await fetch(url);
  const data = await res.json();

  // 1️⃣ READ DATA
  const lat = data.coord.lat;
  const lon = data.coord.lon;
  const condition = data.weather[0].description.toLowerCase();

  const temp = Math.round(data.main.temp);
  const humidity = data.main.humidity;
  const wind = data.wind.speed;

  // 2️⃣ UPDATE UI (ONLY TEXT)
  document.getElementById("location").innerText =
    `${data.name}, ${data.sys.country}`;
  document.getElementById("temperature").innerText = temp + "°";
  document.getElementById("condition").innerText = data.weather[0].description;
  document.getElementById("humidity").innerText = humidity;
  document.getElementById("wind").innerText = wind;

  // Save for AI (safe)
  window.currentWeather = { temp, humidity, wind };

  // 3️⃣ MAP — DELAYED
  setTimeout(() => {
    initMap(lat, lon, condition);
  }, 200);

  // 4️⃣ FORECAST — MORE DELAYED
  setTimeout(() => {
    loadForecast(lat, lon);
    isLoading = false;          // ✅ RELEASE LOCK
  }, 500);
}

    showMap(d.coord.lat, d.coord.lon);
    status("");
  } catch {
    status("Weather not found");
  }
}


function showMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]);
  }
}
searchBtn.addEventListener("click", async () => {
  if (busy) return;
  busy = true;

  try {
    const q = input.value.trim();
    if (!q) return;

    showStatus("Searching area...");
    const place = await geocodePlace(q);
    await fetchWeatherByCoords(place.lat, place.lon);
  } catch (e) {
    showStatus("Area not found");
  } finally {
    busy = false;
  }
});

const FORECAST_URL =
  "https://api.openweathermap.org/data/2.5/forecast";
async function loadForecast(lat, lon) {
  const res = await fetch(
    `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );
  const data = await res.json();

  const days = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!days[date]) days[date] = item;
  });

  const forecastDiv = document.getElementById("forecast");
  forecastDiv.innerHTML = "";

  Object.values(days).slice(0, 7).forEach(d => {
    forecastDiv.innerHTML += `
      <div class="forecast-day">
        <p>${new Date(d.dt_txt).toDateString().slice(0,3)}</p>
        <p>${Math.round(d.main.temp)}°</p>
        <p>${d.weather[0].main}</p>
      </div>
    `;
  });
}
