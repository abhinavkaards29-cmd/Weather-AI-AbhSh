const API_KEY = "fab9b6d2db473ddcfb43b90e080ca8ee";

const statusEl = document.getElementById("status");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const input = document.getElementById("searchInput");

const currentBox = document.getElementById("current");
const placeEl = document.getElementById("place");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const extraEl = document.getElementById("extra");
const forecastEl = document.getElementById("forecast");
const voiceBtn = document.getElementById("voiceBtn");

let map, marker, lastText = "";

function status(msg) { statusEl.textContent = msg; }

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw "API Error";
  return r.json();
}

function renderMap(lat, lon) {
  if (!map) {
    map = L.map("map").setView([lat, lon], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], 10);
    marker.setLatLng([lat, lon]);
  }
}

async function showWeather(lat, lon, name, country) {
  status("Loading weather...");
  const cur = await getJSON(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  const one = await getJSON(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  );

  currentBox.classList.remove("hidden");
  placeEl.textContent = `${name}, ${country}`;
  tempEl.textContent = Math.round(cur.main.temp) + "°C";
  descEl.textContent = cur.weather[0].description;
  extraEl.textContent = `Humidity ${cur.main.humidity}% • Wind ${cur.wind.speed} m/s`;

  lastText = `Weather in ${name}. Temperature ${cur.main.temp} degree. ${cur.weather[0].description}`;

  forecastEl.innerHTML = "";
  forecastEl.classList.remove("hidden");

  one.list.filter((_,i)=>i%8===0).slice(0,7).forEach(d=>{
    const div = document.createElement("div");
    div.innerHTML = `
      <b>${new Date(d.dt_txt).toLocaleDateString()}</b><br>
      ${Math.round(d.main.temp)}°
    `;
    forecastEl.appendChild(div);
  });

  renderMap(lat, lon);
  status("");
}

searchBtn.onclick = async () => {
  if (!input.value) return status("Enter area or city");
  status("Searching...");
  const g = await getJSON(
    `https://api.openweathermap.org/geo/1.0/direct?q=${input.value}&limit=1&appid=${API_KEY}`
  );
  if (!g[0]) return status("Not found");
  showWeather(g[0].lat, g[0].lon, g[0].name, g[0].country);
};

locBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(p=>{
    showWeather(p.coords.latitude, p.coords.longitude,"Your Location","");
  });
};

voiceBtn.onclick = () => {
  speechSynthesis.speak(new SpeechSynthesisUtterance(lastText));
};
// ===== AI WEATHER INSIGHT =====

const OPENAI_API_KEY = "PASTE_YOUR_OPENAI_KEY_HERE";

const aiBtn = document.getElementById("aiBtn");
const aiResult = document.getElementById("aiResult");

aiBtn.onclick = async () => {
  if (!lastText) {
    aiResult.textContent = "Get weather first 🙂";
    return;
  }

  aiResult.textContent = "🤖 Thinking...";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful weather assistant. Explain weather simply."
          },
          {
            role: "user",
            content: lastText + ". Give advice and health tips."
          }
        ],
        temperature: 0.6
      })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    aiResult.textContent = reply;

    // Optional voice
    speechSynthesis.speak(new SpeechSynthesisUtterance(reply));

  } catch (err) {
    aiResult.textContent = "AI error. Try again later.";
    console.error(err);
  }
};
