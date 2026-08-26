// ============================================================
// SHOO GAZZZ
// MAIN APPLICATION CONTROLLER
// ============================================================

import {
  characters,
  questionCategories,
  getCategoryValues,
  getCharacterById,
  getCharacterByName,
  getCharacterAvatarUrl,
} from "./characters.js";

import {
  initializeAnonymousAuth,
  getPlayerId,
  createGame,
  findGameByCode,
  joinGame,
  listenToGame,
  deleteGame,
} from "./firebase.js";

// ============================================================
// APPLICATION STATE
// ============================================================

const state = {
  playerName: "",
  opponentName: "",

  gameCode: "",
  gameId: "",

  isHost: false,
  isMyTurn: true,

  characters: [...characters],

  eliminatedCharacters: new Set(),

  selectedCategory: null,

  selectedCharacter: null,

  opponentCharacterId: null,

  gameStarted: false,
};

// ============================================================
// FIREBASE CONNECTION STATE
// ============================================================

let unsubscribeGame = null;

let authReadyPromise = null;

// ============================================================
// DOM ELEMENTS
// ============================================================

const elements = {
  nameScreen: document.getElementById("name-screen"),
  modeScreen: document.getElementById("mode-screen"),
  joinScreen: document.getElementById("join-screen"),
  waitingScreen: document.getElementById("waiting-screen"),
  gameScreen: document.getElementById("game-screen"),
  resultScreen: document.getElementById("result-screen"),

  nameForm: document.getElementById("name-form"),
  playerName: document.getElementById("player-name"),

  welcomeName: document.getElementById("welcome-name"),

  createGameButton: document.getElementById("create-game-button"),

  showJoinButton: document.getElementById("show-join-button"),

  changeNameButton: document.getElementById("change-name-button"),

  backToModeButton: document.getElementById("back-to-mode-button"),

  joinForm: document.getElementById("join-form"),

  joinCode: document.getElementById("join-code"),

  joinError: document.getElementById("join-error"),

  gameCode: document.getElementById("game-code"),

  copyCodeButton: document.getElementById("copy-code-button"),

  cancelGameButton: document.getElementById("cancel-game-button"),

  localPlayerName: document.getElementById("local-player-name"),

  opponentPlayerName: document.getElementById("opponent-player-name"),

  localPlayerTurn: document.getElementById("local-player-turn"),

  opponentPlayerTurn: document.getElementById("opponent-player-turn"),

  characterBoard: document.getElementById("character-board"),

  remainingCount: document.getElementById("remaining-count"),

  questionButtons: document.getElementById("question-buttons"),

  answerPanel: document.getElementById("answer-panel"),

  answerQuestion: document.getElementById("answer-question"),

  answerOptions: document.getElementById("answer-options"),

  closeAnswerButton: document.getElementById("close-answer-button"),

  passTurnButton: document.getElementById("pass-turn-button"),

  makeGuessButton: document.getElementById("make-guess-button"),

  guessModal: document.getElementById("guess-modal"),

  closeGuessModal: document.getElementById("close-guess-modal"),

  guessOptions: document.getElementById("guess-options"),

  resultSymbol: document.getElementById("result-symbol"),

  resultEyebrow: document.getElementById("result-eyebrow"),

  resultTitle: document.getElementById("result-title"),

  resultMessage: document.getElementById("result-message"),

  resultCharacter: document.getElementById("result-character"),

  playAgainButton: document.getElementById("play-again-button"),

  returnHomeButton: document.getElementById("return-home-button"),

  toast: document.getElementById("toast"),

  toastMessage: document.getElementById("toast-message"),
};

// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeApplication();
});

function initializeApplication() {
  attachEventListeners();

  renderCharacterBoard();

  updateRemainingCount();

  restorePlayerName();

  ensureAuthenticated().catch((error) => {
    console.error("Could not authenticate with Firebase:", error);

    showToast("Could not connect to the game server.");
  });
}

// ============================================================
// AUTHENTICATION READY
// ============================================================

/**
 * Guarantees a Firebase player ID exists before any
 * create/join/listen call is made.
 *
 * Auth normally resolves almost instantly, but a player
 * could click CREATE GAME before it does. Every entry
 * point into Firebase awaits this first.
 */
function ensureAuthenticated() {
  if (getPlayerId()) {
    return Promise.resolve(getPlayerId());
  }

  if (!authReadyPromise) {
    authReadyPromise = initializeAnonymousAuth().then((user) => user.uid);
  }

  return authReadyPromise;
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function attachEventListeners() {
  // ------------------------------------------
  // NAME
  // ------------------------------------------

  elements.nameForm?.addEventListener("submit", handleNameSubmit);

  // ------------------------------------------
  // GAME MODE
  // ------------------------------------------

  elements.createGameButton?.addEventListener("click", handleCreateGame);

  elements.showJoinButton?.addEventListener("click", showJoinScreen);

  elements.changeNameButton?.addEventListener("click", showNameScreen);

  // ------------------------------------------
  // JOIN
  // ------------------------------------------

  elements.backToModeButton?.addEventListener("click", showModeScreen);

  elements.joinForm?.addEventListener("submit", handleJoinGame);

  // ------------------------------------------
  // WAITING ROOM
  // ------------------------------------------

  elements.copyCodeButton?.addEventListener("click", copyGameCode);

  elements.cancelGameButton?.addEventListener("click", handleCancelGame);

  // ------------------------------------------
  // QUESTIONS
  // ------------------------------------------

  elements.questionButtons?.addEventListener("click", handleQuestionClick);

  elements.closeAnswerButton?.addEventListener("click", closeAnswerPanel);

  // ------------------------------------------
  // GAME ACTIONS
  // ------------------------------------------

  elements.passTurnButton?.addEventListener("click", handlePassTurn);

  elements.makeGuessButton?.addEventListener("click", openGuessModal);

  // ------------------------------------------
  // GUESS MODAL
  // ------------------------------------------

  elements.closeGuessModal?.addEventListener("click", closeGuessModal);

  elements.guessModal?.addEventListener("click", (event) => {
    if (event.target === elements.guessModal) {
      closeGuessModal();
    }
  });

  // ------------------------------------------
  // RESULT
  // ------------------------------------------

  elements.playAgainButton?.addEventListener("click", resetLocalGame);

  elements.returnHomeButton?.addEventListener("click", returnHome);
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(screen) {
  const screens = [
    elements.nameScreen,
    elements.modeScreen,
    elements.joinScreen,
    elements.waitingScreen,
    elements.gameScreen,
    elements.resultScreen,
  ];

  screens.forEach((currentScreen) => {
    if (!currentScreen) {
      return;
    }

    const isActive = currentScreen === screen;

    currentScreen.hidden = !isActive;

    currentScreen.classList.toggle("active-screen", isActive);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function showNameScreen() {
  showScreen(elements.nameScreen);
}

function showModeScreen() {
  updateWelcomeName();

  showScreen(elements.modeScreen);
}

function showJoinScreen() {
  elements.joinError.hidden = true;

  elements.joinCode.value = "";

  showScreen(elements.joinScreen);

  setTimeout(() => {
    elements.joinCode.focus();
  }, 150);
}

function showWaitingScreen() {
  showScreen(elements.waitingScreen);
}

function showGameScreen() {
  state.gameStarted = true;

  updatePlayerDisplay();

  renderCharacterBoard();

  updateRemainingCount();

  showScreen(elements.gameScreen);
}

function showResultScreen() {
  showScreen(elements.resultScreen);
}

// ============================================================
// PLAYER NAME
// ============================================================

function handleNameSubmit(event) {
  event.preventDefault();

  const name = elements.playerName.value.trim();

  if (!name) {
    showToast("Please enter your name.");
    return;
  }

  if (name.length < 2) {
    showToast("Your name must contain at least 2 characters.");
    return;
  }

  state.playerName = name;

  localStorage.setItem("shoogazzz_player_name", name);

  updateWelcomeName();

  showModeScreen();
}

function restorePlayerName() {
  const savedName = localStorage.getItem("shoogazzz_player_name");

  if (!savedName) {
    return;
  }

  state.playerName = savedName;

  elements.playerName.value = savedName;

  updateWelcomeName();
}

function updateWelcomeName() {
  if (!elements.welcomeName) {
    return;
  }

  if (!state.playerName) {
    elements.welcomeName.textContent = "HELLO";
    return;
  }

  elements.welcomeName.textContent = `HELLO, ${state.playerName.toUpperCase()}`;
}

// ============================================================
// CREATE GAME
// ============================================================

async function handleCreateGame() {
  if (!state.playerName) {
    showNameScreen();
    return;
  }

  state.isHost = true;

  state.gameCode = generateGameCode();

  const newGameId = generateGameId();

  state.opponentName = "";

  elements.gameCode.textContent = state.gameCode;

  showWaitingScreen();

  try {
    await ensureAuthenticated();

    await createGame({
      gameId: newGameId,

      gameCode: state.gameCode,

      playerName: state.playerName,
    });

    // The host's real document ID. This is the ID the
    // host must listen on, since it is what the guest's
    // findGameByCode() lookup will resolve to as well.
    state.gameId = newGameId;

    showToast("Game created. Share the code with your friend.");

    subscribeToGame(state.gameId);
  } catch (error) {
    console.error("Could not create game:", error);

    showToast("Could not create the game. Try again.");

    handleCancelGame();
  }
}

// ============================================================
// JOIN GAME
// ============================================================

async function handleJoinGame(event) {
  event.preventDefault();

  const code = elements.joinCode.value.trim().toUpperCase();

  if (!code) {
    showJoinError("Enter the game code.");

    return;
  }

  if (code.length !== 6) {
    showJoinError("The game code must contain 6 characters.");

    return;
  }

  elements.joinError.hidden = true;

  showToast("Looking for game...");

  try {
    await ensureAuthenticated();

    // Step 1: resolve the code into the host's real
    // document ID. The code and the document ID are
    // unrelated strings, so this lookup is required;
    // guessing `game_${code}` targets a document that
    // does not exist.
    const foundGame = await findGameByCode(code);

    // Step 2: join using that real ID, and capture the
    // ID again from the response so state.gameId is
    // never out of sync with the document we just wrote to.
    const joinedGame = await joinGame({
      gameId: foundGame.gameId,

      playerName: state.playerName,
    });

    state.isHost = false;

    state.gameCode = code;

    state.gameId = joinedGame.gameId || foundGame.gameId;

    const hostEntry = Object.values(joinedGame.players || {}).find(
      (player) => player.role === "host",
    );

    state.opponentName = hostEntry ? hostEntry.name : "Opponent";

    subscribeToGame(state.gameId);

    showToast("Game found. Joining...");

    showGameScreen();
  } catch (error) {
    console.error("Could not join game:", error);

    showJoinError(error.message || "Could not join that game.");
  }
}

function showJoinError(message) {
  elements.joinError.textContent = message;

  elements.joinError.hidden = false;
}

// ============================================================
// GAME CODE
// ============================================================

function generateGameCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);

    code += characters[randomIndex];
  }

  return code;
}

function generateGameId() {
  return (
    "game_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8)
  );
}

// ============================================================
// LIVE GAME SUBSCRIPTION
// ============================================================

/**
 * Starts listening to the game document on Firestore.
 *
 * This is what was missing before: neither the host nor
 * the guest ever called listenToGame(), so no update from
 * Firestore, correct ID or not, could reach the UI. The
 * waiting screen had nothing watching for a change.
 */
function subscribeToGame(gameId) {
  stopListeningToGame();

  unsubscribeGame = listenToGame(gameId, handleGameUpdate);
}

function stopListeningToGame() {
  if (unsubscribeGame) {
    unsubscribeGame();

    unsubscribeGame = null;
  }
}

function handleGameUpdate(gameData) {
  if (!gameData) {
    showToast("The game no longer exists.");

    stopListeningToGame();

    return;
  }

  const players = gameData.players || {};

  const playerId = getPlayerId();

  const opponentEntry = Object.values(players).find(
    (player) => player.id !== playerId,
  );

  if (opponentEntry) {
    state.opponentName = opponentEntry.name;
  }

  const opponentHasJoined =
    gameData.status === "starting" || gameData.status === "playing";

  if (state.isHost && !state.gameStarted && opponentHasJoined) {
    showToast(`${state.opponentName} joined the game.`);

    showGameScreen();
  }

  updatePlayerDisplay();
}

// ============================================================
// COPY GAME CODE
// ============================================================

async function copyGameCode() {
  if (!state.gameCode) {
    return;
  }

  try {
    await navigator.clipboard.writeText(state.gameCode);

    showToast("Game code copied.");
  } catch (error) {
    showToast(`Your game code is ${state.gameCode}`);
  }
}

// ============================================================
// CANCEL GAME
// ============================================================

function handleCancelGame() {
  const cancelledGameId = state.gameId;

  const wasHost = state.isHost;

  stopListeningToGame();

  state.gameCode = "";
  state.gameId = "";

  state.isHost = false;

  showModeScreen();

  if (wasHost && cancelledGameId) {
    deleteGame(cancelledGameId).catch((error) => {
      console.error("Could not delete cancelled game:", error);
    });
  }
}

// ============================================================
// CHARACTER BOARD
// ============================================================

function renderCharacterBoard() {
  if (!elements.characterBoard) {
    return;
  }

  elements.characterBoard.innerHTML = "";

  state.characters.forEach((character) => {
    const card = createCharacterCard(character);

    elements.characterBoard.appendChild(card);
  });
}

function createCharacterCard(character) {
  const card = document.createElement("button");

  card.type = "button";

  card.className = "character-card";

  card.dataset.characterId = character.id;

  if (state.eliminatedCharacters.has(character.id)) {
    card.classList.add("eliminated");
  }

  const image = document.createElement("img");

  image.className = "character-portrait";

  image.src = getCharacterAvatarUrl(character);

  image.alt = `${character.name} portrait`;

  image.loading = "lazy";

  const name = document.createElement("span");

  name.className = "character-name";

  name.textContent = character.name;

  card.appendChild(image);

  card.appendChild(name);

  card.addEventListener("click", () => handleCharacterClick(character.id));

  return card;
}

// ============================================================
// CHARACTER CLICK
// ============================================================

function handleCharacterClick(characterId) {
  if (state.eliminatedCharacters.has(characterId)) {
    return;
  }

  if (!state.isMyTurn) {
    showToast("Wait for your turn.");

    return;
  }

  eliminateCharacter(characterId);
}

// ============================================================
// ELIMINATE CHARACTER
// ============================================================

function eliminateCharacter(characterId) {
  const character = getCharacterById(characterId);

  if (!character) {
    return;
  }

  state.eliminatedCharacters.add(characterId);

  renderCharacterBoard();

  updateRemainingCount();

  showToast(`${character.name} eliminated.`);
}

// ============================================================
// RESTORE CHARACTER
// ============================================================

function restoreCharacter(characterId) {
  state.eliminatedCharacters.delete(characterId);

  renderCharacterBoard();

  updateRemainingCount();
}

// ============================================================
// REMAINING COUNT
// ============================================================

function updateRemainingCount() {
  if (!elements.remainingCount) {
    return;
  }

  const remaining = state.characters.length - state.eliminatedCharacters.size;

  elements.remainingCount.textContent = `${remaining} REMAINING`;
}

// ============================================================
// QUESTIONS
// ============================================================

function handleQuestionClick(event) {
  const button = event.target.closest(".question-button");

  if (!button) {
    return;
  }

  if (!state.isMyTurn) {
    showToast("It is not your turn.");

    return;
  }

  const category = button.dataset.category;

  if (!category) {
    return;
  }

  openAnswerPanel(category);
}

// ============================================================
// OPEN ANSWER PANEL
// ============================================================

function openAnswerPanel(category) {
  const config = questionCategories[category];

  if (!config) {
    return;
  }

  state.selectedCategory = category;

  elements.answerQuestion.textContent = config.label;

  elements.answerOptions.innerHTML = "";

  const values = getCategoryValues(category);

  values.forEach((value) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "answer-option";

    button.textContent = value;

    button.addEventListener("click", () =>
      handleAnswerSelection(category, value),
    );

    elements.answerOptions.appendChild(button);
  });

  elements.answerPanel.hidden = false;

  document.querySelectorAll(".question-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.category === category);
  });
}

// ============================================================
// ANSWER SELECTION
// ============================================================

function handleAnswerSelection(category, value) {
  /*
   * For now this is the local UI logic.
   *
   * Later Firebase will send the question
   * to the opponent and receive YES / NO.
   */

  showToast(`${questionCategories[category].label}: ${value}`);

  closeAnswerPanel();

  /*
   * Temporary development behavior:
   *
   * We do NOT automatically eliminate
   * characters based on the answer.
   *
   * The real game should wait for the
   * opponent's YES / NO response.
   */
}

// ============================================================
// CLOSE ANSWER PANEL
// ============================================================

function closeAnswerPanel() {
  elements.answerPanel.hidden = true;

  state.selectedCategory = null;

  document.querySelectorAll(".question-button").forEach((button) => {
    button.classList.remove("selected");
  });
}

// ============================================================
// PASS TURN
// ============================================================

function handlePassTurn() {
  if (!state.isMyTurn) {
    showToast("It is already your opponent's turn.");

    return;
  }

  state.isMyTurn = false;

  updatePlayerDisplay();

  closeAnswerPanel();

  showToast("Turn passed.");

  /*
   * FIREBASE WILL LATER UPDATE:
   *
   * currentTurn: opponentPlayerId
   */
}

// ============================================================
// PLAYER STATUS
// ============================================================

function updatePlayerDisplay() {
  if (elements.localPlayerName) {
    elements.localPlayerName.textContent = state.playerName || "You";
  }

  if (elements.opponentPlayerName) {
    elements.opponentPlayerName.textContent = state.opponentName || "Waiting";
  }

  const myTurn = state.isMyTurn;

  if (elements.localPlayerTurn) {
    elements.localPlayerTurn.textContent = myTurn ? "YOUR TURN" : "WAITING";
  }

  if (elements.opponentPlayerTurn) {
    elements.opponentPlayerTurn.textContent = myTurn ? "WAITING" : "THEIR TURN";
  }

  const localStatus = document.getElementById("local-player-status");

  const opponentStatus = document.getElementById("opponent-player-status");

  localStatus?.classList.toggle("active-player", myTurn);

  opponentStatus?.classList.toggle("active-player", !myTurn);
}

// ============================================================
// GUESS MODAL
// ============================================================

function openGuessModal() {
  if (!state.isMyTurn) {
    showToast("Wait for your turn.");

    return;
  }

  renderGuessOptions();

  elements.guessModal.hidden = false;
}

function closeGuessModal() {
  elements.guessModal.hidden = true;
}

// ============================================================
// GUESS OPTIONS
// ============================================================

function renderGuessOptions() {
  elements.guessOptions.innerHTML = "";

  state.characters.forEach((character) => {
    if (state.eliminatedCharacters.has(character.id)) {
      return;
    }

    const button = document.createElement("button");

    button.type = "button";

    button.className = "guess-option";

    const thumb = document.createElement("img");

    thumb.className = "guess-option-portrait";

    thumb.src = getCharacterAvatarUrl(character);

    thumb.alt = "";

    thumb.loading = "lazy";

    const label = document.createElement("span");

    label.textContent = character.name;

    button.appendChild(thumb);

    button.appendChild(label);

    button.addEventListener("click", () => handleGuess(character.id));

    elements.guessOptions.appendChild(button);
  });
}

// ============================================================
// HANDLE GUESS
// ============================================================

function handleGuess(characterId) {
  const character = getCharacterById(characterId);

  if (!character) {
    return;
  }

  closeGuessModal();

  /*
   * LOCAL DEVELOPMENT ONLY
   *
   * Firebase will eventually provide:
   *
   * state.opponentCharacterId
   *
   * from the opponent's selected character.
   */

  if (!state.opponentCharacterId) {
    showToast(`You guessed ${character.name}.`);

    showResult(true, character);

    return;
  }

  const correct = characterId === state.opponentCharacterId;

  showResult(correct, character);
}

// ============================================================
// RESULT
// ============================================================

function showResult(won, guessedCharacter) {
  elements.resultSymbol.textContent = won ? "✓" : "×";

  elements.resultEyebrow.textContent = won ? "GAME COMPLETE" : "WRONG GUESS";

  elements.resultTitle.textContent = won ? "YOU WIN" : "YOU LOSE";

  elements.resultMessage.textContent = won
    ? `You correctly guessed ${guessedCharacter.name}.`
    : `You guessed ${guessedCharacter.name}.`;

  elements.resultCharacter.innerHTML = "";

  const portrait = document.createElement("img");

  portrait.className = "result-character-portrait";

  portrait.src = getCharacterAvatarUrl(guessedCharacter);

  portrait.alt = `${guessedCharacter.name} portrait`;

  const nameLabel = document.createElement("span");

  nameLabel.className = "result-character-name";

  nameLabel.textContent = guessedCharacter.name;

  elements.resultCharacter.appendChild(portrait);

  elements.resultCharacter.appendChild(nameLabel);

  showResultScreen();
}

// ============================================================
// RESET GAME
// ============================================================

function resetLocalGame() {
  state.characters = [...characters];

  state.eliminatedCharacters = new Set();

  state.selectedCategory = null;

  state.selectedCharacter = null;

  state.opponentCharacterId = null;

  state.isMyTurn = true;

  state.gameStarted = false;

  renderCharacterBoard();

  updateRemainingCount();

  updatePlayerDisplay();

  showModeScreen();
}

// ============================================================
// RETURN HOME
// ============================================================

function returnHome() {
  stopListeningToGame();

  state.gameCode = "";
  state.gameId = "";

  state.opponentName = "";

  state.isHost = false;

  state.gameStarted = false;

  resetLocalGame();

  showNameScreen();
}

// ============================================================
// TOAST
// ============================================================

let toastTimeout = null;

function showToast(message) {
  if (!elements.toast) {
    return;
  }

  elements.toastMessage.textContent = message;

  elements.toast.hidden = false;

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2600);
}

// ============================================================
// DEVELOPMENT HELPERS
// ============================================================

window.Shoogazzz = {
  state,

  characters,

  showScreen,

  showNameScreen,

  showModeScreen,

  showJoinScreen,

  showWaitingScreen,

  showGameScreen,

  eliminateCharacter,

  restoreCharacter,

  openGuessModal,

  resetLocalGame,
};
