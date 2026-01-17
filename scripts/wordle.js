window.onload = function () {
    const board = document.getElementById('board');
    const guessButton = document.getElementById('guessButton');
    const guessInput = document.getElementById('guessInput');
    const newGameButton = document.getElementById('newGameButton');
    const messageContainer = document.getElementById('message-container');
    const statsContainer = document.getElementById('stats-container');

    // Stats elements
    const gamesPlayedEl = document.getElementById('gamesPlayed');
    const winPercentageEl = document.getElementById('winPercentage');
    const currentStreakEl = document.getElementById('currentStreak');

    const words = [
        "media", "table", "chair", "piano", "mouse",
        "house", "plant", "brain", "cloud", "beach",
        "fruit", "bread", "music", "phone", "water",
        "light", "sound", "paper", "watch", "smile"
    ];

    let word = '';
    let tries = 0;
    let gameOver = false;

    // Statistics
    let stats = {
        gamesPlayed: 0,
        wins: 0,
        currentStreak: 0
    };

    function initGame() {
        // Reset state
        tries = 0;
        gameOver = false;
        word = words[Math.floor(Math.random() * words.length)].toUpperCase();
        console.log("Target word:", word); // For debugging/cheating ;)

        // Reset UI
        board.innerHTML = '';
        guessInput.value = '';
        guessInput.disabled = false;
        guessButton.disabled = false;
        messageContainer.textContent = '';
        newGameButton.classList.add('hidden');
        statsContainer.classList.add('hidden');

        // Create board
        for (let i = 0; i < 6; i++) {
            let row = document.createElement('div');
            row.classList.add('row');
            board.append(row);

            for (let j = 0; j < 5; j++) {
                let cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-column', j);
                row.append(cell);
            }
        }
    }

    function showMessage(msg, duration = 3000) {
        messageContainer.textContent = msg;
        if (duration > 0) {
            setTimeout(() => {
                if (messageContainer.textContent === msg) {
                    messageContainer.textContent = '';
                }
            }, duration);
        }
    }

    function updateStats(won) {
        stats.gamesPlayed++;
        if (won) {
            stats.wins++;
            stats.currentStreak++;
        } else {
            stats.currentStreak = 0;
        }

        gamesPlayedEl.textContent = stats.gamesPlayed;
        winPercentageEl.textContent = Math.round((stats.wins / stats.gamesPlayed) * 100);
        currentStreakEl.textContent = stats.currentStreak;

        statsContainer.classList.remove('hidden');
    }

    function handleGuess() {
        if (gameOver) return;

        let guess = guessInput.value.toUpperCase();

        // Validation
        if (guess.length !== 5) {
            showMessage("Word must be 5 letters long!");
            return;
        }

        // Check guess
        const rowCells = [];
        for (let i = 0; i < 5; i++) {
            rowCells.push(document.querySelector(`[data-row="${tries}"][data-column="${i}"]`));
        }

        // First pass: Mark correct letters (Green) and count frequencies
        let targetFreq = {};
        for (let char of word) {
            targetFreq[char] = (targetFreq[char] || 0) + 1;
        }

        let guessStatus = new Array(5).fill('red'); // Default to red

        // Check Greens
        for (let i = 0; i < 5; i++) {
            let letter = guess[i];
            rowCells[i].textContent = letter;
            rowCells[i].classList.add('filled');

            if (letter === word[i]) {
                guessStatus[i] = 'green';
                targetFreq[letter]--;
            }
        }

        // Check Yellows
        for (let i = 0; i < 5; i++) {
            let letter = guess[i];
            if (guessStatus[i] !== 'green') { // If not already marked green
                if (targetFreq[letter] > 0) {
                    guessStatus[i] = 'yellow';
                    targetFreq[letter]--;
                }
            }
        }

        // Apply classes with animation delay
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                rowCells[i].classList.add(guessStatus[i]);
            }, i * 100); // Staggered animation
        }

        // Game Over Logic
        if (guess === word) {
            setTimeout(() => {
                showMessage("You won! 🎉", 0);
                gameOver = true;
                guessInput.disabled = true;
                guessButton.disabled = true;
                newGameButton.classList.remove('hidden');
                updateStats(true);
            }, 500);
            return;
        }

        if (tries === 5) {
            setTimeout(() => {
                showMessage(`You lost! The word was: ${word}`, 0);
                gameOver = true;
                guessInput.disabled = true;
                guessButton.disabled = true;
                newGameButton.classList.remove('hidden');
                updateStats(false);
            }, 500);
            return;
        }

        tries++;
        guessInput.value = '';
        guessInput.focus();
    }

    // Event Listeners
    guessButton.addEventListener('click', handleGuess);

    guessInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });

    newGameButton.addEventListener('click', initGame);

    // Start first game
    initGame();
}