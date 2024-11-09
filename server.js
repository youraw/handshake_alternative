const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

// Kategorien definieren
const categories = [
  { id: 1, name: "Movies" },
  { id: 2, name: "Music" },
  { id: 3, name: "Sports" },
  { id: 4, name: "Travel" },
  { id: 5, name: "Food" },
];

// Speicher für Sessions
const sessions = {};

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Zufällige 5-stellige Session-ID generieren
function generateSessionId() {
  let sessionId;
  do {
    sessionId = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (sessions[sessionId]); // Generiert solange, bis eine eindeutige ID gefunden wird
  return sessionId;
}

// Route für Session-Erstellung
app.post("/create-session", (req, res) => {
  const sessionId = generateSessionId();
  sessions[sessionId] = { user1: [], user2: [], user1Finished: false, user2Finished: false };
  console.log(`Session created with ID: ${sessionId} for User1`);
  res.json({ sessionId, user: "user1" });
});

// Route für Session-Beitritt
app.post("/join-session", (req, res) => {
  const { sessionId } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  
  if (session.user2.length > 0) {
    return res.status(400).json({ error: "User2 has already joined this session" });
  }

  console.log(`User2 joined session with ID: ${sessionId}`);
  res.json({ sessionId, user: "user2" });
});

// Route zum Speichern der Swipes
app.post("/swipe", (req, res) => {
  const { sessionId, user, categoryId, choice } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const category = categories.find(c => c.id === parseInt(categoryId));
  if (!category) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  if (user === "user1") {
    session.user1.push({ id: categoryId, choice });
    console.log(`User1 swiped on category ${categoryId} with choice ${choice}`);
  } else if (user === "user2") {
    session.user2.push({ id: categoryId, choice });
    console.log(`User2 swiped on category ${categoryId} with choice ${choice}`);
  }
  res.sendStatus(200);
});

// Route für Kategorien-Anzeige
app.get("/category/:sessionId/:index", (req, res) => {
  const { sessionId, index } = req.params;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const categoryIndex = parseInt(index, 10);
  if (categoryIndex < categories.length) {
    res.json(categories[categoryIndex]);
  } else {
    res.json({ end: true });
  }
});

// Status-Route: Setzt den Status auf "fertig" für einen Nutzer
app.post("/finish", (req, res) => {
  const { sessionId, user } = req.body;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (user === "user1") {
    session.user1Finished = true;
    console.log(`User1 finished swiping in session ${sessionId}`);
  } else if (user === "user2") {
    session.user2Finished = true;
    console.log(`User2 finished swiping in session ${sessionId}`);
  }
  res.sendStatus(200);
});

// Prüft, ob beide Nutzer fertig sind
app.get("/check-finished/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  console.log(`User1 Finished: ${session.user1Finished}, User2 Finished: ${session.user2Finished}`);
  
  const bothFinished = session.user1Finished && session.user2Finished;
  res.json({ bothFinished });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Route, um gegenseitige (mutual) Swipes zu erhalten
app.get("/mutual-swipes/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Suche nach Kategorien, bei denen beide User "yes" gewählt haben
  const mutualSwipes = categories.filter(category => {
    const user1Choice = session.user1.find(item => item.id === category.id)?.choice;
    const user2Choice = session.user2.find(item => item.id === category.id)?.choice;
    return user1Choice === 'yes' && user2Choice === 'yes';
  });

  res.json(mutualSwipes);
});
