const gameState = {
    currentBox: 0,
    currentRow: 1,
    lastGuess: "",
    gameOver: false,
    correctGuess: "",
};

const ROW_LENGTH = 5;
const wordURL = "https://words.dev-apis.com/word-of-the-day?random=1";
const validityURL = "https://words.dev-apis.com/validate-word";
const box = document.querySelectorAll(".box");
const letters = document.querySelectorAll(".letter");
const enter = document.querySelector(".enter");
const del = document.querySelector(".backspace");

async function getTodaysWord() {
    try {
        const promise = await fetch(wordURL);
        const promisedResponse = await promise.json();
        gameState.correctGuess = promisedResponse.word.toUpperCase();
    } catch (error) {
        gameState.correctGuess = "MOUNT";
        console.warn("Could not fetch word of the day, using default:", gameState.correctGuess);
    }
}

async function validateWord(word) {
    try {
        const promise = await fetch(validityURL, {
            method: "POST",
            body: JSON.stringify({ "word": word })
        });
        const promisedResponse = await promise.json();
        return promisedResponse.validWord;
    } catch (error) {
        console.warn("Could not validate word, allowing any word by default.");
        return true;
    }
}

function addLetter(event) {
    const start = (gameState.currentRow - 1) * ROW_LENGTH;
    const end = start + ROW_LENGTH;

    if (gameState.currentBox >= start && gameState.currentBox < end) {
        box[gameState.currentBox].innerText = event.key.toUpperCase();
        gameState.currentBox++;
    }
}

function checkGuess(lG, cG, rowNum) {
    const guess = lG.split('');
    const ans = cG.split('');
    const map = mapMaker(ans);

    for (let i = 0; i < ans.length; i++) {
        if (guess[i] === ans[i]) {
            colorBox(i, rowNum, "green");
            for (let j = 0; j < letters.length; j++) {
                if (letters[j].innerText === guess[i]) {
                    letters[j].style.backgroundColor = "green";
                    letters[j].style.color = "white";
                }
            }
            map[guess[i]]--;
        }
    }

    for (let i = 0; i < ans.length; i++) {
        if (guess[i] === ans[i]) continue;

        if (ans.includes(guess[i]) && map[guess[i]] > 0) {
            colorBox(i, rowNum, "#9B870C");
            for (let j = 0; j < letters.length; j++) {
                if (letters[j].innerText === guess[i]) {
                    if (letters[j].style.backgroundColor !== "green") {
                        letters[j].style.backgroundColor = "#9B870C";
                        letters[j].style.color = "white";
                    }
                }
            }
            map[guess[i]]--;
        } else {
            colorBox(i, rowNum, "grey");
            for (let j = 0; j < letters.length; j++) {
                if (letters[j].innerText === guess[i]) {
                    if (
                        letters[j].style.backgroundColor !== "green" &&
                        letters[j].style.backgroundColor !== "#9B870C"
                    ) {
                        letters[j].style.backgroundColor = "#3b3b3b";
                        letters[j].style.color = "white";
                    }
                }
            }
        }
    }

    
    if (lG === cG) endGame(true);
}

function colorBox(boxToColor, rowNum, color) {
    const start = (rowNum - 1) * ROW_LENGTH;
    box[start + boxToColor].style.backgroundColor = color;
}

function endGame(win) {
    if (win === true)
        alert(`You win! The word was ${gameState.correctGuess}`);
    else
        alert(`You lost! The word was ${gameState.correctGuess}`);

    gameState.gameOver = true;
}

function deleteLetter() {
    const start = (gameState.currentRow - 1) * ROW_LENGTH;

    if (gameState.currentRow >= 1 && gameState.currentRow <= 6) {
        if (gameState.currentBox > start) {
            gameState.currentBox--;
            box[gameState.currentBox].innerText = "";
        }
    }
}

async function submitWord() {
    const start = (gameState.currentRow - 1) * ROW_LENGTH;
    const end = start + ROW_LENGTH;

    if (gameState.currentRow <= 6 && gameState.currentBox === end) {
        gameState.lastGuess = "";
        for (let i = start; i < end; i++) {
            gameState.lastGuess += box[i].innerText;
        }

        const isValid = await validateWord(gameState.lastGuess);

        if (isValid === true) {
            console.log("Word Submitted!");
            console.log(gameState.lastGuess);
            checkGuess(gameState.lastGuess, gameState.correctGuess, gameState.currentRow);
            for(let i = start; i < end; i++){
                box[i].style.color = "white";
            }
            gameState.currentRow++;
        } else {
            flashRowRed(gameState.currentRow);
            return;
        }
    }
    if (gameState.currentBox === 30 && !gameState.gameOver)
        endGame(false);
}

function mapMaker(array) {
    const hashMap = {};

    for (let i = 0; i < array.length; i++) {
        if (hashMap[array[i]]) {
            hashMap[array[i]]++;
        } else {
            hashMap[array[i]] = 1;
        }
    }

    return hashMap;
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

function flashRowRed(rowNum) {
    const start = (rowNum - 1) * ROW_LENGTH;
    const end = start + ROW_LENGTH;
    for (let i = start; i < end; i++) {
        box[i].style.transition = "none";
        box[i].style.backgroundColor = "red";
        void box[i].offsetWidth;
        box[i].style.transition = "background-color 0.5s";
    }
    setTimeout(() => {
        for (let i = start; i < end; i++) {
            box[i].style.backgroundColor = "";
        }
    }, 250);
}

async function init() {
    await getTodaysWord();
    console.log("Today's word is: " + gameState.correctGuess);

    document.addEventListener("keydown", function (event) {
        if (!gameState.gameOver) {
            if (event.key === "Enter") {
                submitWord();
            } else if (event.key === "Backspace") {
                deleteLetter();
            } else if (isLetter(event.key)) {
                addLetter(event);
            } else {
                event.preventDefault();
            }
        }
    });

    for (let i = 0; i < letters.length; i++) {
        letters[i].addEventListener("click", function (event) {
            if (!gameState.gameOver) {
                addLetter({ key: event.target.innerText });
            }
        });
    }

    enter.addEventListener("click", function () {
        if (!gameState.gameOver)
            submitWord();
    });

    del.addEventListener("click", function () {
        if (!gameState.gameOver)
            deleteLetter();
    });
}

init();
