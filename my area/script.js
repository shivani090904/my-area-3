// Initialize map (Nizamabad)
const map = L.map('map').setView([18.6725, 78.0940], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Garbage truck depot
const depot = [18.6725, 78.0940];
let routeControl, chart;

// AREA NAMES (USER PROVIDED)
const areas = [
  { name: "Manikbandar", lat: 18.6736, lng: 78.0941 },
  { name: "Kanteshwar", lat: 18.6710, lng: 78.1025 },
  { name: "Bus Stand", lat: 18.6722, lng: 78.0958 },
  { name: "Railway Station", lat: 18.6745, lng: 78.0915 },
  { name: "Mubarak Nagar", lat: 18.6689, lng: 78.0976 },
  { name: "Gangasthan", lat: 18.6705, lng: 78.0899 }
];

// Show area labels
function showAreaNames() {
  areas.forEach(a => {
    L.marker([a.lat, a.lng], {
      icon: L.divIcon({
        className: 'area-label',
        html: a.name
      })
    }).addTo(map);
  });
}
showAreaNames();

// BIN DATA (mapped to areas)
const bins = [
  {id:"BIN-01", area:"Manikbandar", lat:18.6736, lng:78.0941, level:82, priority:3, health:"OK"},
  {id:"BIN-02", area:"Kanteshwar", lat:18.6710, lng:78.1025, level:65, priority:2, health:"OK"},
  {id:"BIN-03", area:"Bus Stand", lat:18.6722, lng:78.0958, level:90, priority:3, health:"OK"},
  {id:"BIN-04", area:"Railway Station", lat:18.6745, lng:78.0915, level:55, priority:3, health:"LOW BATTERY"},
  {id:"BIN-05", area:"Mubarak Nagar", lat:18.6689, lng:78.0976, level:40, priority:2, health:"OK"},
  {id:"BIN-06", area:"Gangasthan", lat:18.6705, lng:78.0899, level:75, priority:2, health:"OK"}
];

// Render bins
function renderBins() {
  document.getElementById("binPanel").innerHTML = "";

  bins.forEach(b => {
    let color = b.level > 80 ? "red" : b.level > 60 ? "orange" : "green";

    L.circleMarker([b.lat, b.lng], {
      radius: 9,
      color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(map);

    document.getElementById("binPanel").innerHTML += `
      <div class="bin-card ${color === "orange" ? "yellow" : color}">
        <b>${b.id}</b> – ${b.area}<br>
        Level: ${b.level}%<br>
        Priority: ${b.priority}<br>
        Health: ${b.health}<br>
        Updated: ${new Date().toLocaleTimeString()}
      </div>`;
  });

  notifyAndRoute();
}

// Notification + Route
function notifyAndRoute() {
  const bar = document.getElementById("notificationBar");
  const text = document.getElementById("notificationText");

  const critical = bins.filter(b => b.level > 80)
                        .sort((a,b)=>b.priority-a.priority);

  if (critical.length) {
    bar.style.background = "red";
    text.innerText = `🚨 ${critical.length} Critical Bins | Optimized Route Generated`;
    generateRoute(critical);
  } else {
    bar.style.background = "green";
    text.innerText = "✅ All bins under control";
    if (routeControl) map.removeControl(routeControl);
  }
}

// Route + Stats
function generateRoute(critical) {
  if (routeControl) map.removeControl(routeControl);

  routeControl = L.Routing.control({
    waypoints: [L.latLng(...depot), ...critical.map(b=>L.latLng(b.lat,b.lng))],
    show:false
  }).on('routesfound', e => {
    const d = e.routes[0].summary.totalDistance / 1000;
    const t = e.routes[0].summary.totalTime / 60;

    document.getElementById("distance").innerText = `Distance: ${d.toFixed(2)} km`;
    document.getElementById("time").innerText = `ETA: ${(t*1.2).toFixed(0)} min`;
    document.getElementById("fuel").innerText = `Fuel Cost: ₹ ${(d*8).toFixed(0)}`;
    document.getElementById("co2").innerText = `CO₂ Saved: ${(d*0.21).toFixed(2)} kg`;

    updateChart(critical);
  }).addTo(map);
}

// Analytics chart
function updateChart(data) {
  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("analyticsChart"), {
    type:'bar',
    data:{
      labels:data.map(b=>b.area),
      datasets:[{
        label:'Bin Fill Level (%)',
        data:data.map(b=>b.level),
        backgroundColor:'red'
      }]
    }
  });
}

// Dark mode
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// Simulate live updates
setInterval(()=>{
  bins.forEach(b=>b.level=Math.min(100,b.level+Math.floor(Math.random()*5)));
  renderBins();
},5000);

renderBins();
