const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let gameCode = '';
let player1Socket = null;
let player2Socket = null;
let player1Name = '';
let player2Name = '';
let currentPlayer = 1;
let scores = [0, 0]; // Player 1 score, Player 2 score
let board = Array(9).fill(null); // Initialize game board

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('startGame', (playerName) => {
        if (!player1Socket) {
            player1Socket = socket;
            player1Name = playerName;
            gameCode = generateGameCode(); // Generate game code
            player1Socket.emit('gameCode', gameCode); // Send game code to Player 1
            console.log(`${playerName} started the game with code ${gameCode}.`);
        } else {
            socket.emit('message', 'Game already started by another player.');
            console.log('Game already started by another player.');
        }
    });

    socket.on('joinGame', (code) => {
        if (code === gameCode && !player2Socket && player1Socket !== socket) {
            player2Socket = socket;
            player2Name = 'Player 2'; // Set a default name or handle name input for Player 2
            player1Socket.emit('playerConnected', 1); // Player 1 is connected
            player2Socket.emit('playerConnected', 2); // Player 2 is connected
            startGame(); // Start the game
        } else {
            socket.emit('message', 'Invalid game code or game already started.');
            console.log('Invalid game code or game already started.');
        }
    });

    socket.on('playerMove', (cellIndex) => {
        if ((socket === player1Socket && currentPlayer === 1) || (socket === player2Socket && currentPlayer === 2)) {
            if (board[cellIndex] === null) {
                board[cellIndex] = currentPlayer === 1 ? 'X' : 'O';
                checkGameStatus();
            } else {
                console.log('Invalid move.');
            }
        }
    });

    socket.on('restartGame', () => {
        resetGame();
        io.emit('gameRestarted', { board, scores });
    });

    socket.on('disconnect', () => {
        if (socket === player1Socket) {
            console.log(`${player1Name} disconnected.`);
            player1Socket = null;
            resetGame();
        } else if (socket === player2Socket) {
            console.log(`${player2Name} disconnected.`);
            player2Socket = null;
            resetGame();
        }
    });

    function generateGameCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }

    function startGame() {
        currentPlayer = Math.random() < 0.5 ? 1 : 2; // Randomly determine starting player
        io.emit('gameState', { board, currentPlayer, scores });
        console.log('Game started.');
    }

    function checkGameStatus() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                const winner = board[a] === 'X' ? 1 : 2;
                scores[winner - 1]++;
                io.emit('gameState', { board, currentPlayer, scores });
                io.emit('message', `Player ${winner} wins!`);
                resetGame();
                return;
            }
        }

        if (!board.includes(null)) {
            io.emit('gameState', { board, currentPlayer, scores });
            io.emit('message', 'It\'s a tie!');
            resetGame();
            return;
        }

        currentPlayer = currentPlayer === 1 ? 2 : 1;
        io.emit('gameState', { board, currentPlayer, scores });
    }

    function resetGame() {
        board = Array(9).fill(null);
        currentPlayer = Math.random() < 0.5 ? 1 : 2;
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
