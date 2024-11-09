let currentCategoryIndex = 0;
let currentUser = "user1";
let sessionId = "";

// Event-Listener für User-Auswahl
document.getElementById("user").addEventListener("change", function () {
  currentUser = this.value;
});

// Funktion zum Erstellen einer Session für User 1
// Funktion zum Erstellen einer Session für User 1
async function createSession() {
  const response = await fetch("/create-session", { method: "POST" });
  const data = await response.json();
  sessionId = data.sessionId;
  currentUser = data.user; // Setzt automatisch currentUser auf "user1"
  // alert(`Session ID for User 2: ${sessionId}`);
  
  // Versteckt den "Create Session"-Button und zeigt das "Join Session"-Formular an
  document.getElementById("create-session-btn").classList.add("hidden");
  document.getElementById("session-id-display").classList.remove("hidden");
  document.getElementById("show-session-id").textContent = "Session ID: " + sessionId;
  document.getElementById("join-session-container").classList.remove("hidden");
  
  startSwiping();
}

// Funktion zum Beitreten einer Session für User 2
async function joinSession() {
  const sessionInput = document.getElementById("session-id").value;
  if (!sessionInput) {
    alert("Please enter a valid Session ID.");
    return;
  }

  sessionId = sessionInput;
  const response = await fetch("/join-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  
  const data = await response.json();
  if (data.error) {
    alert(data.error);
  } else {
    currentUser = data.user; // Setzt automatisch currentUser auf "user2"
    startSwiping();
  }
}


// Funktion zum Starten des Swipe-Prozesses
function startSwiping() {
  document.getElementById("session-container").classList.add("hidden");
  document.getElementById("category-container").classList.remove("hidden");
  loadCategory();
}

// Funktion zum Laden einer Kategorie basierend auf der Session-ID
async function loadCategory() {
  try {
    const response = await fetch(`/category/${sessionId}/${currentCategoryIndex}`);
    const data = await response.json();

    if (data.end) {
      // Markiere den Nutzer als "fertig", wenn es keine weiteren Kategorien gibt
      markAsFinished();
    } else {
      // Zeige die aktuelle Kategorie an
      document.getElementById("category").textContent = data.name;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Kategorie:", error);
  }
}

// Funktion zum Speichern der Swipes
async function swipe(choice) {
  const response = await fetch(`/category/${sessionId}/${currentCategoryIndex}`);
  const data = await response.json();

  if (data.end) {
    markAsFinished();
  } else {
    // Speichern des Swipes
    await fetch("/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, user: currentUser, categoryId: data.id, choice }),
    });

    currentCategoryIndex++;  // Weiter zum nächsten Index
    loadCategory();  // Lade die nächste Kategorie
  }
}

// Funktion zum Setzen des Fertig-Status
async function markAsFinished() {
  await fetch("/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, user: currentUser }),
  });
  
  checkIfBothFinished();  // Überprüfen, ob beide Nutzer fertig sind
}

// Funktion zur Überprüfung, ob beide fertig sind
// Funktion zur Überprüfung, ob beide fertig sind
async function checkIfBothFinished() {
  const response = await fetch(`/check-finished/${sessionId}`);
  const data = await response.json();

  if (data.bothFinished) {
    showMutualSwipes(); // Ruft die Anzeige der gemeinsamen Swipes auf
  } else {
    // Wiederholt die Prüfung alle 2 Sekunden, falls noch nicht beide fertig sind
    setTimeout(checkIfBothFinished, 2000);
  }
}

// Funktion zum Anzeigen der gemeinsamen Swipes
async function showMutualSwipes() {
  const response = await fetch(`/mutual-swipes/${sessionId}`);
  const mutualCategories = await response.json();

  const mutualList = document.getElementById("mutual-list");
  mutualList.innerHTML = ""; // Leere die Liste vor dem Hinzufügen neuer Einträge
  mutualCategories.forEach(category => {
    const listItem = document.createElement("li");
    listItem.textContent = category.name;
    mutualList.appendChild(listItem);
  });

  // Zeige den Ergebnis-Container an und verstecke den Swipe-Container
  document.getElementById("category-container").classList.add("hidden");
  document.getElementById("result-container").classList.remove("hidden");
}


// Funktion zum Zurücksetzen der App
function restart() {
  location.reload();  // Die Seite neu laden
}
