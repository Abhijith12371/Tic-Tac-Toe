document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const startGameBtn = document.getElementById('start-game');
    const joinGameBtn = document.getElementById('join-game');
    const joinGameShowBtn = document.getElementById('join-game-show');
    const gameCodeInput = document.getElementById('game-code-input');
    const playerNameInput = document.getElementById('player-name');
    const playerChoiceSection = document.getElementById('player-choice');
    const gameSection = document.getElementById('game');
    const joinSection = document.getElementById('join-section');
    const message = document.getElementById('message');
    const player1Score = document.getElementById('player1-score');
    const player2Score = document.getElementById('player2-score');
    const restartBtn = document.getElementById('restart');
    const cells = document.querySelectorAll('.cell');

    let playerNumber = null;
    let currentPlayer = null;

    joinGameShowBtn.addEventListener('click', () => {
        playerChoiceSection.style.display = 'none';
        joinSection.style.display = 'block';
    });

    startGameBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName === '') {
            alert('Please enter your name to start the game.');
            return;
        }

        socket.emit('startGame', playerName);
    });

    joinGameBtn.addEventListener('click', () => {
        const code = gameCodeInput.value.trim();
        if (code === '') {
            alert('Please enter the game code to join.');
            return;
        }

        socket.emit('joinGame', code);
    });

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (playerNumber === currentPlayer && cell.textContent === '') {
                socket.emit('playerMove', parseInt(cell.dataset.cell));
            }
        });
    });

    restartBtn.addEventListener('click', () => {
        socket.emit('restartGame');
    });

    socket.on('gameCode', (code) => {
        message.textContent = `Share this code with your friend: ${code}`;
        joinSection.style.display = 'block';
        startGameBtn.disabled = true;
        joinGameShowBtn.disabled = true;
    });

    socket.on('playerConnected', (player) => {
        playerNumber = player;
        message.textContent = `Player ${player} connected.`;
        gameSection.style.display = 'block';
        playerChoiceSection.style.display = 'none';
        joinSection.style.display = 'none';
    });

    socket.on('gameState', (state) => {
        const { board, currentPlayer: cp, scores: [player1ScoreValue, player2ScoreValue] } = state;
        currentPlayer = cp;
        updateBoard(board);
        updateScores(player1ScoreValue, player2ScoreValue);
        currentPlayer === playerNumber ? enableCells() : disableCells();
    });

    socket.on('gameRestarted', (state) => {
        const { board, scores } = state;
        updateBoard(board);
        updateScores(scores[0], scores[1]);
        enableCells();
    });

    socket.on('message', (msg) => {
        message.textContent = msg;
    });

    function updateBoard(board) {
        cells.forEach((cell, index) => {
            cell.textContent = board[index];
        });
    }

    function updateScores(player1ScoreValue, player2ScoreValue) {
        player1Score.textContent = `Player 1: ${player1ScoreValue}`;
        player2Score.textContent = `Player 2: ${player2ScoreValue}`;
    }

    function enableCells() {
        cells.forEach(cell => {
            cell.style.pointerEvents = 'auto';
        });
    }

    function disableCells() {
        cells.forEach(cell => {
            cell.style.pointerEvents = 'none';
        });
    }
});
