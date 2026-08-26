// ============================================================
// SHOO GAZZZ
// FIREBASE CONFIGURATION + MULTIPLAYER DATABASE
// ============================================================

// Firebase CDN imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIG
// ============================================================
//
// REPLACE THESE VALUES WITH YOUR FIREBASE WEB APP CONFIG.
//
// Firebase Console
// → Project Settings
// → General
// → Your apps
// → Web app
// → SDK setup and configuration
//
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAGELUMNKKKe8b2wYG_XYSweSMwnA4FN60",

  authDomain: "guess-the-person-91ed1.firebaseapp.com",

  projectId: "guess-the-person-91ed1",

  storageBucket: "guess-the-person-91ed1.firebasestorage.app",

  messagingSenderId: "898776254744",

  appId: "1:898776254744:web:6de0686393a3cb7e68b66d",
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);

// ============================================================
// FIREBASE SERVICES
// ============================================================

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

// ============================================================
// AUTHENTICATION
// ============================================================

let currentUser = null;

/**
 * Sign the current browser into Firebase anonymously.
 *
 * This gives every player a Firebase UID without
 * requiring a registration form.
 */
export async function initializeAnonymousAuth() {
  try {
    const result = await signInAnonymously(auth);

    currentUser = result.user;

    console.log("Firebase anonymous authentication successful.");

    console.log("Player UID:", currentUser.uid);

    return currentUser;
  } catch (error) {
    console.error("Firebase authentication failed:", error);

    throw error;
  }
}

// ============================================================
// AUTH STATE
// ============================================================

export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;

    callback(user);
  });
}

// ============================================================
// CURRENT USER
// ============================================================

export function getCurrentUser() {
  return currentUser;
}

export function getPlayerId() {
  return currentUser?.uid || null;
}

// ============================================================
// GAME REFERENCES
// ============================================================

function getGameReference(gameId) {
  return doc(db, "games", gameId);
}

// ============================================================
// CREATE GAME
// ============================================================

export async function createGame({ gameId, gameCode, playerName }) {
  const playerId = getPlayerId();

  if (!playerId) {
    throw new Error("Player is not authenticated.");
  }

  const gameRef = getGameReference(gameId);

  const gameData = {
    gameId,

    gameCode,

    status: "waiting",

    createdAt: serverTimestamp(),

    hostId: playerId,

    currentTurn: playerId,

    players: {
      [playerId]: {
        id: playerId,

        name: playerName,

        role: "host",

        connected: true,

        joinedAt: serverTimestamp(),
      },
    },
  };

  await setDoc(gameRef, gameData);

  console.log("Game created:", gameId, "with code:", gameCode);

  return gameData;
}

// ============================================================
// FIND GAME BY CODE
// ============================================================

export async function findGameByCode(gameCode) {
  try {
    const gamesRef = collection(db, "games");

    const q = query(gamesRef, where("gameCode", "==", gameCode));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first matching game
    const doc = querySnapshot.docs[0];

    return {
      gameId: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error("Error finding game by code:", error);

    throw error;
  }
}

// ============================================================
// GET GAME
// ============================================================

export async function getGame(gameId) {
  const gameRef = getGameReference(gameId);

  const snapshot = await getDoc(gameRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

// ============================================================
// JOIN GAME
// ============================================================

export async function joinGame({ gameCode, playerName }) {
  const playerId = getPlayerId();

  if (!playerId) {
    throw new Error("Player is not authenticated.");
  }

  // Find the game by code
  const gameData = await findGameByCode(gameCode);

  if (!gameData) {
    throw new Error("Game does not exist.");
  }

  const gameId = gameData.gameId;

  const gameRef = getGameReference(gameId);

  if (gameData.status !== "waiting") {
    throw new Error("This game has already started.");
  }

  const players = gameData.players || {};

  const playerIds = Object.keys(players);

  if (playerIds.length >= 2) {
    throw new Error("This game is already full.");
  }

  players[playerId] = {
    id: playerId,

    name: playerName,

    role: "guest",

    connected: true,

    joinedAt: serverTimestamp(),
  };

  await updateDoc(gameRef, {
    players,

    status: "starting",

    startedAt: serverTimestamp(),
  });

  console.log("Joined game:", gameId);

  return {
    gameId,

    ...gameData,

    players,

    status: "starting",
  };
}

// ============================================================
// LISTEN TO GAME
// ============================================================

export function listenToGame(gameId, callback) {
  const gameRef = getGameReference(gameId);

  return onSnapshot(
    gameRef,

    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);

        return;
      }

      callback(snapshot.data());
    },

    (error) => {
      console.error("Game listener error:", error);
    },
  );
}

// ============================================================
// UPDATE GAME
// ============================================================

export async function updateGame(gameId, updates) {
  const gameRef = getGameReference(gameId);

  await updateDoc(gameRef, updates);
}

// ============================================================
// UPDATE PLAYER
// ============================================================

export async function updatePlayer(gameId, updates) {
  const playerId = getPlayerId();

  if (!playerId) {
    throw new Error("Player is not authenticated.");
  }

  const gameRef = getGameReference(gameId);

  const snapshot = await getDoc(gameRef);

  if (!snapshot.exists()) {
    throw new Error("Game does not exist.");
  }

  const game = snapshot.data();

  const players = game.players || {};

  if (!players[playerId]) {
    throw new Error("Player does not belong to this game.");
  }

  players[playerId] = {
    ...players[playerId],

    ...updates,
  };

  await updateDoc(gameRef, {
    players,
  });
}

// ============================================================
// START GAME
// ============================================================

export async function startGame(gameId, gameState) {
  const playerId = getPlayerId();

  if (!playerId) {
    throw new Error("Player is not authenticated.");
  }

  await updateGame(gameId, {
    status: "playing",

    gameState,

    startedAt: serverTimestamp(),
  });
}

// ============================================================
// UPDATE TURN
// ============================================================

export async function updateTurn(gameId, playerId) {
  await updateGame(gameId, {
    currentTurn: playerId,
  });
}

// ============================================================
// UPDATE GAME STATE
// ============================================================

export async function updateGameState(gameId, gameState) {
  await updateGame(gameId, {
    gameState,
  });
}

// ============================================================
// SEND QUESTION
// ============================================================

export async function sendQuestion({ gameId, category, value }) {
  const playerId = getPlayerId();

  await updateGame(gameId, {
    pendingQuestion: {
      from: playerId,

      category,

      value,

      createdAt: serverTimestamp(),
    },
  });
}

// ============================================================
// SEND ANSWER
// ============================================================

export async function sendAnswer({ gameId, answer }) {
  const playerId = getPlayerId();

  await updateGame(gameId, {
    pendingAnswer: {
      from: playerId,

      answer,

      createdAt: serverTimestamp(),
    },
  });
}

// ============================================================
// SEND GUESS
// ============================================================

export async function sendGuess({ gameId, characterId }) {
  const playerId = getPlayerId();

  await updateGame(gameId, {
    pendingGuess: {
      from: playerId,

      characterId,

      createdAt: serverTimestamp(),
    },
  });
}

// ============================================================
// CLEAR QUESTION
// ============================================================

export async function clearQuestion(gameId) {
  await updateGame(gameId, {
    pendingQuestion: null,
  });
}

// ============================================================
// CLEAR ANSWER
// ============================================================

export async function clearAnswer(gameId) {
  await updateGame(gameId, {
    pendingAnswer: null,
  });
}

// ============================================================
// CLEAR GUESS
// ============================================================

export async function clearGuess(gameId) {
  await updateGame(gameId, {
    pendingGuess: null,
  });
}

// ============================================================
// DELETE GAME
// ============================================================

export async function deleteGame(gameId) {
  const gameRef = getGameReference(gameId);

  await deleteDoc(gameRef);
}

// ============================================================
// DISCONNECT PLAYER
// ============================================================

export async function disconnectPlayer(gameId) {
  const playerId = getPlayerId();

  if (!playerId) {
    return;
  }

  try {
    await updatePlayer(gameId, {
      connected: false,
    });
  } catch (error) {
    console.error("Could not update player connection:", error);
  }
}

// ============================================================
// EXPORT FIREBASE APP
// ============================================================

export { firebaseApp };
