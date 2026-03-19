// =====================
// DATA.JS - All stored data
// =====================

const USERS = [
  { username: "user1", password: "user123", role: "user", name: "Rahul Sharma" },
  { username: "user2", password: "user456", role: "user", name: "Priya Patel" }
];

const ADMINS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin Officer" }
];

function initStorage() {
  if (!localStorage.getItem("alerts")) {
    localStorage.setItem("alerts", JSON.stringify([
      { id: 1, message: "Cyclone warning issued for coastal Maharashtra", type: "cyclone", time: "2 hours ago", active: true },
      { id: 2, message: "Heavy rainfall expected in Mumbai - Stay indoors", type: "flood", time: "5 hours ago", active: true }
    ]));
  }
  if (!localStorage.getItem("disasters")) {
    localStorage.setItem("disasters", JSON.stringify([]));
  }
  if (!localStorage.getItem("resources")) {
    localStorage.setItem("resources", JSON.stringify([
      { id: 1, name: "Ambulances", total: 20, assigned: 5, location: "Mumbai Central" },
      { id: 2, name: "Fire Trucks", total: 15, assigned: 3, location: "Thane" },
      { id: 3, name: "Rescue Teams", total: 10, assigned: 2, location: "Navi Mumbai" },
      { id: 4, name: "Medical Kits", total: 100, assigned: 30, location: "Pune" }
    ]));
  }
  if (!localStorage.getItem("sos_requests")) {
    localStorage.setItem("sos_requests", JSON.stringify([]));
  }
}