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
} from "./characters.js";

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

function handleCreateGame() {
  if (!state.playerName) {
    showNameScreen();
    return;
  }

  state.isHost = true;

  state.gameCode = generateGameCode();

  state.gameId = generateGameId();

  state.opponentName = "";

  elements.gameCode.textContent = state.gameCode;

  showWaitingScreen();

  showToast("Game created. Share the code with your friend.");

  /*
   * FIREBASE CONNECTION WILL BE ADDED HERE.
   *
   * Example future flow:
   *
   * await createFirebaseGame({
   *     gameId: state.gameId,
   *     gameCode: state.gameCode,
   *     playerName: state.playerName
   * });
   *
   * Then listen for the second player.
   */
}

// ============================================================
// JOIN GAME
// ============================================================

function handleJoinGame(event) {
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

  /*
   * FIREBASE CONNECTION WILL BE ADDED HERE.
   *
   * The application will later:
   *
   * 1. Search Firebase for the game.
   * 2. Check whether the game exists.
   * 3. Check whether a second player already joined.
   * 4. Add this player.
   * 5. Start the game for both players.
   */

  state.isHost = false;

  state.gameCode = code;

  state.gameId = `game_${code}`;

  state.opponentName = "Opponent";

  showToast("Game found. Joining...");

  setTimeout(() => {
    showGameScreen();
  }, 600);
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
  state.gameCode = "";
  state.gameId = "";

  state.isHost = false;

  showModeScreen();
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

  /*
   * IMAGE PLACEHOLDER
   *
   * Later we can replace this with:
   *
   * /assets/characters/idris.png
   *
   * or your actual artwork paths.
   */

  const image = document.createElement("div");

  image.className = "character-portrait";

  image.setAttribute("aria-label", `${character.name} portrait`);

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

    button.textContent = character.name;

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

  const characterName = document.createElement("div");

  characterName.textContent = guessedCharacter.name;

  characterName.style.display = "grid";

  characterName.style.placeItems = "center";

  characterName.style.height = "100%";

  characterName.style.color = "var(--cream)";

  characterName.style.fontWeight = "900";

  elements.resultCharacter.appendChild(characterName);

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
