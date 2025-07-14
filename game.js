class TechuGame {
    constructor() {
        this.currentRoom = null;
        this.playerId = null;
        this.playerNumber = null;
        this.gameState = null;
        this.selectedCard = null;
        this.selectedCell = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Menu buttons
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinInput());
        document.getElementById('confirmJoinBtn').addEventListener('click', () => this.joinRoom());
        
        // Game controls
        document.getElementById('drawCardBtn').addEventListener('click', () => this.drawCard());
        document.getElementById('discardBtn').addEventListener('click', () => this.discardCard());
        document.getElementById('endTurnBtn').addEventListener('click', () => this.endTurn());
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    createRoom() {
        const roomCode = this.generateRoomCode();
        this.currentRoom = roomCode;
        this.playerId = 'player_' + Date.now();
        this.playerNumber = 1;

        const initialState = {
            players: {
                player1: {
                    id: this.playerId,
                    hand: [],
                    deck: this.createDeck(),
                    territory: 0
                }
            },
            board: this.createEmptyBoard(),
            currentPlayer: null,
            phase: 'waiting',
            winner: null
        };

        database.ref(`rooms/${roomCode}`).set(initialState).then(() => {
            this.joinGameRoom(roomCode);
        });
    }

    showJoinInput() {
        document.getElementById('roomInput').style.display = 'block';
    }

    joinRoom() {
        const roomCode = document.getElementById('roomCode').value.toUpperCase();
        if (!roomCode) return;

        database.ref(`rooms/${roomCode}`).once('value', (snapshot) => {
            const room = snapshot.val();
            if (room && !room.players.player2) {
                this.currentRoom = roomCode;
                this.playerId = 'player_' + Date.now();
                this.playerNumber = 2;

                database.ref(`rooms/${roomCode}/players/player2`).set({
                    id: this.playerId,
                    hand: [],
                    deck: this.createDeck(),
                    territory: 0
                }).then(() => {
                    database.ref(`rooms/${roomCode}/phase`).set('setup');
                    this.joinGameRoom(roomCode);
                });
            } else {
                alert('Room not found or already full');
            }
        });
    }

    joinGameRoom(roomCode) {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = `Room: ${roomCode}`;
        document.getElementById('playerName').textContent = `Player ${this.playerNumber}`;

        this.createBoard();
        this.listenToGameState();
    }

    createDeck() {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck = [];
        
        ranks.forEach(rank => {
            deck.push({ rank, value: this.getCardValue(rank) });
            deck.push({ rank, value: this.getCardValue(rank) });
        });
        
        return this.shuffleArray(deck);
    }

    getCardValue(rank) {
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
        return values[rank];
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createEmptyBoard() {
        const board = [];
        for (let i = 0; i < 5; i++) {
            board[i] = [];
            for (let j = 0; j < 5; j++) {
                board[i][j] = null;
            }
        }
        return board;
    }

    createBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (row === 4) {
                    cell.classList.add('home-row-player1');
                } else if (row === 0) {
                    cell.classList.add('home-row-player2');
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    listenToGameState() {
        database.ref(`rooms/${this.currentRoom}`).on('value', (snapshot) => {
            this.gameState = snapshot.val();
            if (this.gameState) {
                this.updateUI();
                
                if (this.gameState.phase === 'setup' && this.gameState.players.player1 && this.gameState.players.player2) {
                    this.setupGame();
                }
            }
        });
    }

    setupGame() {
        if (this.gameState.phase !== 'setup') return;
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        
        if (player.hand.length === 0) {
            // Draw initial 3 cards
            const hand = [];
            const deck = [...player.deck];
            
            for (let i = 0; i < 3; i++) {
                if (deck.length > 0) {
                    hand.push(deck.pop());
                }
            }
            
            database.ref(`rooms/${this.currentRoom}/players/${playerKey}`).update({
                hand: hand,
                deck: deck
            }).then(() => {
                if (this.playerNumber === 2) {
                    database.ref(`rooms/${this.currentRoom}/phase`).set('initial_placement');
                }
            });
        }
    }

    updateUI() {
        this.updateBoard();
        this.updateHand();
        this.updateGameStatus();
        this.updateControls();
    }

    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const boardCell = this.gameState.board[row][col];
            
            cell.innerHTML = '';
            cell.classList.remove('valid-move');
            
            if (boardCell) {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.classList.add(boardCell.player === 1 ? 'player1' : 'player2');
                cardDiv.textContent = boardCell.rank;
                
                if (boardCell.reinforcements && boardCell.reinforcements.length > 0) {
                    const reinforcementDiv = document.createElement('div');
                    reinforcementDiv.className = 'reinforcement';
                    reinforcementDiv.textContent = boardCell.reinforcements.length;
                    cardDiv.appendChild(reinforcementDiv);
                }
                
                cell.appendChild(cardDiv);
            }
        });
        
        if (this.selectedCard !== null && this.isMyTurn()) {
            this.highlightValidMoves();
        }
    }

    updateHand() {
        const handElement = document.getElementById('playerHand');
        handElement.innerHTML = '';
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        
        if (player && player.hand) {
            player.hand.forEach((card, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.classList.add('player' + this.playerNumber);
                cardDiv.textContent = card.rank;
                
                if (this.selectedCard === index) {
                    cardDiv.classList.add('selected');
                }
                
                cardDiv.addEventListener('click', () => this.selectCard(index));
                handElement.appendChild(cardDiv);
            });
        }
        
        // Update opponent hand count
        const opponentKey = this.playerNumber === 1 ? 'player2' : 'player1';
        const opponent = this.gameState.players[opponentKey];
        const opponentHandElement = document.getElementById('opponentHand');
        opponentHandElement.innerHTML = '';
        
        if (opponent && opponent.hand) {
            for (let i = 0; i < opponent.hand.length; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back';
                opponentHandElement.appendChild(cardBack);
            }
        }
    }

    updateGameStatus() {
        const statusElement = document.getElementById('gameStatus');
        const turnIndicator = document.getElementById('turnIndicator');
        
        if (this.gameState.winner) {
            statusElement.textContent = `Player ${this.gameState.winner} wins!`;
            statusElement.className = this.gameState.winner === this.playerNumber ? 'winner' : 'loser';
        } else if (this.gameState.phase === 'waiting') {
            statusElement.textContent = 'Waiting for player 2...';
        } else if (this.gameState.phase === 'initial_placement') {
            statusElement.textContent = 'Place your initial card';
        } else if (this.gameState.phase === 'playing') {
            const currentPlayer = this.gameState.currentPlayer;
            turnIndicator.textContent = currentPlayer === this.playerNumber ? 'Your turn' : "Opponent's turn";
        }
    }

    updateControls() {
        const drawBtn = document.getElementById('drawCardBtn');
        const discardBtn = document.getElementById('discardBtn');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        const isMyTurn = this.isMyTurn();
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        
        drawBtn.disabled = !isMyTurn || !player || player.hand.length >= 3 || this.gameState.phase !== 'playing';
        discardBtn.disabled = !isMyTurn || this.selectedCard === null || this.gameState.phase !== 'playing';
        endTurnBtn.disabled = !isMyTurn || this.gameState.phase !== 'playing';
    }

    selectCard(index) {
        if (!this.isMyTurn() && this.gameState.phase !== 'initial_placement') return;
        
        this.selectedCard = this.selectedCard === index ? null : index;
        this.updateUI();
    }

    highlightValidMoves() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            if (this.isValidMove(row, col)) {
                cell.classList.add('valid-move');
            }
        });
    }

    isValidMove(row, col) {
        if (this.selectedCard === null) return false;
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        const selectedCardData = player.hand[this.selectedCard];
        const targetCell = this.gameState.board[row][col];
        
        // Initial placement phase
        if (this.gameState.phase === 'initial_placement') {
            const homeRow = this.playerNumber === 1 ? 4 : 0;
            return row === homeRow && targetCell === null;
        }
        
        // Regular game phase
        if (this.gameState.phase === 'playing') {
            // Check if card can be played on this cell
            if (targetCell) {
                // Can reinforce own card or play on opponent's card if higher value
                if (targetCell.player === this.playerNumber) {
                    return true; // Can reinforce
                } else {
                    return selectedCardData.value > targetCell.value;
                }
            }
            
            // Empty cell - must be connected to home row
            return this.isConnectedToHomeRow(row, col);
        }
        
        return false;
    }

    isConnectedToHomeRow(row, col) {
        const homeRow = this.playerNumber === 1 ? 4 : 0;
        const visited = new Set();
        const queue = [[row, col]];
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            const key = `${r},${c}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (r === homeRow) return true;
            
            // Check adjacent cells
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                
                if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
                    const cell = this.gameState.board[nr][nc];
                    if (cell && cell.player === this.playerNumber) {
                        queue.push([nr, nc]);
                    }
                }
            }
        }
        
        return false;
    }

    handleCellClick(row, col) {
        if (!this.isValidMove(row, col)) return;
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        const selectedCardData = player.hand[this.selectedCard];
        const targetCell = this.gameState.board[row][col];
        
        if (this.gameState.phase === 'initial_placement') {
            this.placeInitialCard(row, col);
        } else if (this.gameState.phase === 'playing') {
            this.playCard(row, col);
        }
    }

    placeInitialCard(row, col) {
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        const card = player.hand[this.selectedCard];
        
        const newHand = [...player.hand];
        newHand.splice(this.selectedCard, 1);
        
        const updates = {};
        updates[`board/${row}/${col}`] = {
            rank: card.rank,
            value: card.value,
            player: this.playerNumber,
            reinforcements: []
        };
        updates[`players/${playerKey}/hand`] = newHand;
        
        database.ref(`rooms/${this.currentRoom}`).update(updates).then(() => {
            this.selectedCard = null;
            
            // Check if both players have placed initial cards
            database.ref(`rooms/${this.currentRoom}`).once('value', (snapshot) => {
                const state = snapshot.val();
                const homeRow1 = 4;
                const homeRow2 = 0;
                let player1Placed = false;
                let player2Placed = false;
                
                for (let col = 0; col < 5; col++) {
                    if (state.board[homeRow1][col] && state.board[homeRow1][col].player === 1) {
                        player1Placed = true;
                    }
                    if (state.board[homeRow2][col] && state.board[homeRow2][col].player === 2) {
                        player2Placed = true;
                    }
                }
                
                if (player1Placed && player2Placed) {
                    this.determineFirstPlayer();
                }
            });
        });
    }

    determineFirstPlayer() {
        database.ref(`rooms/${this.currentRoom}`).once('value', (snapshot) => {
            const state = snapshot.val();
            let player1Card = null;
            let player2Card = null;
            
            // Find initial cards
            for (let col = 0; col < 5; col++) {
                if (state.board[4][col] && state.board[4][col].player === 1) {
                    player1Card = state.board[4][col];
                }
                if (state.board[0][col] && state.board[0][col].player === 2) {
                    player2Card = state.board[0][col];
                }
            }
            
            let firstPlayer;
            if (player1Card.value < player2Card.value) {
                firstPlayer = 1;
            } else if (player2Card.value < player1Card.value) {
                firstPlayer = 2;
            } else {
                firstPlayer = Math.random() < 0.5 ? 1 : 2;
            }
            
            database.ref(`rooms/${this.currentRoom}`).update({
                currentPlayer: firstPlayer,
                phase: 'playing'
            });
        });
    }

    playCard(row, col) {
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        const card = player.hand[this.selectedCard];
        const targetCell = this.gameState.board[row][col];
        
        const newHand = [...player.hand];
        newHand.splice(this.selectedCard, 1);
        
        const updates = {};
        
        if (targetCell && targetCell.player === this.playerNumber) {
            // Reinforce own card
            const reinforcements = targetCell.reinforcements || [];
            reinforcements.push(card);
            updates[`board/${row}/${col}/reinforcements`] = reinforcements;
            updates[`board/${row}/${col}/value`] = Math.max(targetCell.value, card.value);
        } else {
            // Place new card or capture opponent's card
            updates[`board/${row}/${col}`] = {
                rank: card.rank,
                value: card.value,
                player: this.playerNumber,
                reinforcements: []
            };
        }
        
        updates[`players/${playerKey}/hand`] = newHand;
        
        database.ref(`rooms/${this.currentRoom}`).update(updates).then(() => {
            this.selectedCard = null;
            this.checkEndGame();
        });
    }

    drawCard() {
        if (!this.isMyTurn()) return;
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        
        if (player.hand.length >= 3 || player.deck.length === 0) return;
        
        const newDeck = [...player.deck];
        const newHand = [...player.hand];
        
        if (newDeck.length > 0) {
            const drawnCard = newDeck.pop();
            newHand.push(drawnCard);
            
            database.ref(`rooms/${this.currentRoom}/players/${playerKey}`).update({
                hand: newHand,
                deck: newDeck
            });
        }
    }

    discardCard() {
        if (!this.isMyTurn() || this.selectedCard === null) return;
        
        const playerKey = `player${this.playerNumber}`;
        const player = this.gameState.players[playerKey];
        
        const newHand = [...player.hand];
        newHand.splice(this.selectedCard, 1);
        
        database.ref(`rooms/${this.currentRoom}/players/${playerKey}/hand`).set(newHand).then(() => {
            this.selectedCard = null;
            this.updateUI();
        });
    }

    endTurn() {
        if (!this.isMyTurn()) return;
        
        const nextPlayer = this.playerNumber === 1 ? 2 : 1;
        database.ref(`rooms/${this.currentRoom}/currentPlayer`).set(nextPlayer);
    }

    isMyTurn() {
        return this.gameState && this.gameState.currentPlayer === this.playerNumber;
    }

    checkEndGame() {
        const player1 = this.gameState.players.player1;
        const player2 = this.gameState.players.player2;
        
        if (!player1 || !player2) return;
        
        const player1Done = player1.hand.length === 0 && player1.deck.length === 0;
        const player2Done = player2.hand.length === 0 && player2.deck.length === 0;
        
        if (player1Done && player2Done) {
            this.calculateWinner();
        }
    }

    calculateWinner() {
        let player1Territory = 0;
        let player2Territory = 0;
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = this.gameState.board[row][col];
                if (cell) {
                    if (cell.player === 1) player1Territory++;
                    else if (cell.player === 2) player2Territory++;
                }
            }
        }
        
        const winner = player1Territory > player2Territory ? 1 : 
                       player2Territory > player1Territory ? 2 : null;
        
        database.ref(`rooms/${this.currentRoom}`).update({
            winner: winner,
            player1Territory: player1Territory,
            player2Territory: player2Territory
        });
    }
}

// Initialize game when page loads
const game = new TechuGame();