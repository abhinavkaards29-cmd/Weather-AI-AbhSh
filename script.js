const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";
const BASE = "https://api.openweathermap.org/data/2.5/weather";

let map, marker;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchBtn").onclick = searchCity;
  document.getElementById("locBtn").onclick = searchLocation;
});

function status(msg) {
  document.getElementById("status").innerText = msg;
}

async function searchCity() {
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return status("Enter a place");

  status("Loading...");
  fetchWeather(`${BASE}?q=${q}&units=metric&appid=${API_KEY}`);
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
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const d = await res.json();

    document.getElementById("location").innerText =
      `${d.name}, ${d.sys.country}`;
    document.getElementById("condition").innerText =
      d.weather[0].description;
    document.getElementById("temperature").innerText =
      Math.round(d.main.temp) + "°";
    document.getElementById("humidity").innerText = d.main.humidity;
    document.getElementById("wind").innerText = d.wind.speed;

    window.currentWeather = {
  temp: temp,
  humidity: humidity,
  wind: wind
};

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
