const gameState = {
    currentBox: 0,
    currentRow: 1,
    lastGuess: "",
    gameOver: false,
    correctGuess: "",
}; // Stores the current state of the game

const ROW_LENGTH = 5;
const wordURL = "https://words.dev-apis.com/word-of-the-day?random=1";
const validityURL = "https://words.dev-apis.com/validate-word";
const box = document.querySelectorAll(".box"); // All letter boxes

// Fetch the word of the day, or use a default if the API fails
async function getTodaysWord() {
    try {
        const promise = await fetch(wordURL);
        const promisedResponse = await promise.json();
        gameState.correctGuess = "PENIS" //promisedResponse.word.toUpperCase();
    } catch (error) {
        gameState.correctGuess = "MOUNT";
        console.warn("Could not fetch word of the day, using default:", gameState.correctGuess);
    }
}

// Check if a word is valid using the API, or allow any word if the API fails
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

// Add a letter to the current box if within the current row
function addLetter(event) {
    const start = (gameState.currentRow - 1) * ROW_LENGTH;
    const end = start + ROW_LENGTH;

    if (gameState.currentBox >= start && gameState.currentBox < end) {
        box[gameState.currentBox].innerText = event.key.toUpperCase();
        gameState.currentBox++;
    }
}

function checkGuess(lG, cG, rowNum){
    
    //split words into two arrays, and create a map of letter occurences of the correctGuess
    const guess = lG.split('')
    const ans = cG.split('')
    const map = mapMaker(ans) 

    //color all correct, in-place letters as green, and decrements an occurence of that letter from the created map
    for(let i = 0; i < ans.length; i++){
        if(guess[i] === ans[i]){
            colorBox(i, rowNum, "green")
            map[guess[i]]--
        }
    }
    
    //color all existing, non in-place letters as yellow, if there are occurences left in the map for it to check, and then decerements an occurence of that letter
    for(let i = 0; i < ans.length; i++){
        if(guess[i] === ans[i]) continue;

        if(ans.includes(guess[i]) && map[guess[i]] > 0){
            colorBox(i, rowNum, "yellow")
            map[guess[i]]--
        }
        else //if not in place and doesnt exist, color as grey
            colorBox(i, rowNum, "grey")
    }       
    
    if (lG === cG) endGame(true) // If the guess is exactly correct, end the game with a win
}

// Color a specific box in a row
function colorBox(boxToColor, rowNum, color) {
    const start = (rowNum - 1) * ROW_LENGTH;
    box[start + boxToColor].style.backgroundColor = color;
}

// Show win/lose message and end the game
function endGame(win) {
    if (win === true)
        alert(`You win! The word was ${gameState.correctGuess}`);
    else
        alert(`You lost! The word was ${gameState.correctGuess}`);

    gameState.gameOver = true;
}

// Remove the last letter from the current row
function deleteLetter() {
    const start = (gameState.currentRow - 1) * ROW_LENGTH;

    if (gameState.currentRow >= 1 && gameState.currentRow <= 6) {
        if (gameState.currentBox > start) {
            gameState.currentBox--;
            box[gameState.currentBox].innerText = "";
        }
    }
}

async function submitWord(){
    const start = (gameState.currentRow - 1) * ROW_LENGTH // Calculate the starting index for the current row
    const end = start + ROW_LENGTH // Calculate the ending index for the current row

    // Only allow word submission if the row is full of letters and within the allowed number of rows
    if(gameState.currentRow <= 6 && gameState.currentBox === end){
        gameState.lastGuess = "" // Reset lastGuess to be empty

        // Build the guess string from the current row's boxes
        for(let i = start; i < end; i++) {
            gameState.lastGuess += box[i].innerText
        }

        const isValid = await validateWord(gameState.lastGuess) 
        
        if(isValid === true){ // If the word is valid
            console.log("Word Submitted!")
            console.log(gameState.lastGuess)
            // Check the guess and color the boxes
            checkGuess(gameState.lastGuess, gameState.correctGuess, gameState.currentRow) 
            // Move to the next row for the next guess
            gameState.currentRow++ 
        }
        else{ // If not a valid word, flash the row red and do not advance
            flashRowRed(gameState.currentRow)
            return
        }
    }

    // If all boxes are filled and the game isn't over, end the game with a loss
    if(gameState.currentBox === 30 && !gameState.gameOver)
        endGame(false)
}

//creates a map (object) of the number of occurences of letters in the correct Word, and stores them with keys and value
function mapMaker(array){
    const hashMap = {}

    for(let i = 0; i < array.length; i++){
        if(hashMap[array[i]]){
            hashMap[array[i]]++
        }
        else
            hashMap[array[i]] = 1
    }
    
    return hashMap
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

//Initialize the game and set up key listeners
async function init() {
    await getTodaysWord();
    console.log("Today's word is: " + gameState.correctGuess);

    document.addEventListener("keydown", function (event) {
        if (!gameState.gameOver) {
            if (event.key === "Enter")
                submitWord();
            else if (event.key === "Backspace")
                deleteLetter();
            else if (isLetter(event.key))
                addLetter(event);
            else
                event.preventDefault();
        }
    });
}

init();