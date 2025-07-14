# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Techu is a real-time multiplayer card game played on a 5x5 grid. Two players compete for territorial control using a deck of cards (2-A, with Ace being highest). The game uses Firebase Realtime Database for multiplayer synchronization.

## File Structure and Architecture

### Project Files
```
techusite/
├── index.html          # Main HTML page and UI structure
├── styles.css          # All styling and visual design
├── game.js             # Core game logic (TechuGame class)
├── config.js           # Firebase configuration
└── CLAUDE.md           # This documentation file
```

### Core Components

#### `index.html` (UI Structure)
- **Game Board**: 5x5 CSS Grid layout for the playing field
- **Player Interface**: Hand display, game controls, status indicators
- **Room Management**: Create/join room interface
- **Responsive Layout**: Adapts to different screen sizes
- **Event Bindings**: Click handlers for all interactive elements

#### `styles.css` (Visual Design)
- **CSS Grid**: Board layout with proper cell sizing
- **Player Themes**: Blue/red color schemes for Player 1/2
- **Interactive States**: Hover effects, selection highlighting
- **Card Styling**: Visual representation of playing cards
- **Responsive Design**: Mobile-friendly layouts and sizing

#### `game.js` (Game Logic)
- **Single Class Architecture**: All logic in `TechuGame` class
- **State Management**: Complete game state tracking
- **Move Validation**: Connection rules, card placement logic
- **Firebase Integration**: Real-time multiplayer synchronization
- **UI Updates**: Dynamic DOM manipulation for game state

#### `config.js` (Firebase Configuration)
- **Database Credentials**: Firebase project configuration
- **Environment Setup**: Different configs for dev/production
- **Security Settings**: Database access rules and permissions

### Game State Structure
```javascript
rooms/[roomCode]/
  ├── players/
  │   ├── player1: {id, hand[], deck[], territory}
  │   └── player2: {id, hand[], deck[], territory}
  ├── board: 5x5 array of {rank, value, player, reinforcements[]}
  ├── currentPlayer: 1|2
  ├── phase: 'waiting'|'setup'|'initial_placement'|'playing'
  └── winner: null|1|2
```

## Complete Game Rules

### Overview
Techu is a territorial control card game where two players compete to claim territory on a 5x5 grid using playing cards (2-A, with Ace being highest value).

### Game Setup
- **Board**: 5x5 grid with designated home rows
  - Player 1 (Blue): Bottom row (row 4) is home territory
  - Player 2 (Red): Top row (row 0) is home territory
- **Deck**: Standard deck with duplicated ranks (2-A, each rank appears multiple times)
- **Starting Hand**: 3 cards per player
- **Turn Order**: Player 1 starts first

### Core Mechanics

#### Card Placement Rules
1. **Valid Targets**: Cards can be played on:
   - Empty cells
   - Cells containing opponent's cards with lower value
   - Your own cards for reinforcement

2. **Connection Requirement**: 
   - All played cards must maintain a connection path back to your home row
   - Connection can be through adjacent cells (horizontally/vertically, not diagonally)
   - You cannot place cards that would be completely isolated

3. **Card Values**:
   - Number cards: Face value (2=2, 3=3, etc.)
   - Jack: 11, Queen: 12, King: 13, Ace: 14

#### Turn Structure
1. **Draw Phase**: Draw cards to maintain 3-card hand (if deck not empty)
2. **Action Phase**: Play one card from hand to valid board position
3. **End Turn**: Turn passes to opponent

#### Reinforcement System
- Players can stack multiple cards on the same cell they control
- Reinforced cells are harder to capture (opponent needs higher total value)
- Reinforcements provide strategic defensive positions

#### Capture Mechanics
- To capture an opponent's cell, play a card with higher value
- Captured cards are removed from the board (not returned to deck)
- Reinforced cells require total value comparison

### Victory Conditions
**Primary Win Condition**: When both players exhaust their decks:
- Count total cells controlled by each player
- Player controlling more cells wins
- Ties are possible (rare)

**Alternative Win Conditions**:
- Opponent cannot make any legal moves
- Opponent disconnects (though not implemented in current version)

### Strategy Notes
- **Territory Control**: Focus on claiming and holding central board positions
- **Connection Management**: Maintain paths to home row while expanding
- **Card Conservation**: Balance aggressive expansion with defensive reinforcement
- **Timing**: Save high-value cards for critical captures or defense

### Common Misconceptions
- **Suit Importance**: Card suits are not relevant to gameplay
- **Hand Management**: You cannot choose to not play a card (must play if possible)
- **Reinforcement Limits**: No limit to how many cards can be stacked on one cell

## Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime Text, etc.)
- Firebase account (free tier sufficient)

### Firebase Configuration

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Choose "Default Account for Firebase" for Google Analytics
4. Wait for project creation to complete

#### 2. Set Up Realtime Database
1. In Firebase Console, navigate to "Realtime Database"
2. Click "Create Database"
3. Choose your preferred location (closer to your users)
4. Start in **test mode** for development (rules allow read/write access)
5. Note the database URL (format: `https://PROJECT-ID-default-rtdb.REGION.firebasedatabase.app/`)

#### 3. Configure Web App
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" → Web (</>) icon
4. Register app with nickname (e.g., "Techu Game")
5. Copy the configuration object from the setup page
6. Replace placeholder values in `config.js` with your actual credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.region.firebasedatabase.app",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

#### 4. Database Security Rules (Development)
For development, use these permissive rules:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### 5. Database Security Rules (Production)
For production, implement proper security:
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "data.exists() || (!data.exists() && newData.child('players').numChildren() <= 2)"
      }
    }
  }
}
```

### Running the Game

#### Local Development
1. Open `index.html` directly in your web browser, OR
2. Use a local server for better development experience:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (if you have http-server installed)
   npx http-server
   ```
3. Navigate to `http://localhost:8000` if using a local server

#### Testing Multiplayer
1. **Single machine testing**:
   - Open the game in two different browser windows/tabs
   - Use one for Player 1, another for Player 2
   - Create room in first window, join with code in second

2. **Network testing**:
   - Host the game on your local network or deploy to a hosting service
   - Test with actual different devices/computers
   - Share the URL and room codes with test partners

3. **Debugging multiplayer**:
   - Open browser developer tools (F12)
   - Monitor the Console tab for errors
   - Use Network tab to check Firebase connections
   - Check Application → Storage to view local data

## Development Patterns and Examples

### Firebase Operations

#### Database Reference Pattern
```javascript
// Get reference to specific room
const roomRef = database.ref(`rooms/${roomCode}`);

// Update specific paths atomically
const updates = {};
updates[`currentPlayer`] = nextPlayer;
updates[`board/${row}/${col}`] = cardData;
roomRef.update(updates);
```

#### Real-time Listener Pattern
```javascript
// Listen for game state changes
database.ref(`rooms/${roomCode}`).on('value', (snapshot) => {
    if (snapshot.exists()) {
        this.gameState = snapshot.val();
        this.updateUI();
    }
});

// Don't forget to clean up listeners
database.ref(`rooms/${roomCode}`).off();
```

### Game Logic Patterns

#### Move Validation Template
```javascript
// Standard validation flow
isValidMove(row, col, cardValue) {
    // 1. Check basic constraints
    if (row < 0 || row >= 5 || col < 0 || col >= 5) return false;
    
    // 2. Check game state
    if (this.gameState.phase !== 'playing') return false;
    if (this.gameState.currentPlayer !== this.playerId) return false;
    
    // 3. Check cell-specific rules
    const cell = this.gameState.board[row][col];
    if (cell && cell.player === this.playerId) {
        // Reinforcement logic
        return true;
    }
    if (cell && cell.value >= cardValue) {
        // Can't capture stronger cards
        return false;
    }
    
    // 4. Check connection requirements
    return this.isConnectedToHome(row, col);
}
```

#### UI Update Pattern
```javascript
// Centralized UI updates
updateUI() {
    this.updateBoard();
    this.updateHand();
    this.updateGameStatus();
    this.updateControls();
}

// Individual component updates
updateBoard() {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.getElementById(`cell-${row}-${col}`);
            const cellData = this.gameState.board[row][col];
            
            // Update cell appearance based on data
            if (cellData) {
                cell.textContent = cellData.rank;
                cell.className = `cell player${cellData.player}`;
            } else {
                cell.textContent = '';
                cell.className = 'cell';
            }
        }
    }
}
```

### Adding New Features

#### 1. New Game Phase
```javascript
// Add to game state structure
phases: ['waiting', 'setup', 'initial_placement', 'playing', 'NEW_PHASE']

// Add phase-specific logic
if (this.gameState.phase === 'NEW_PHASE') {
    // Handle new phase behavior
    return this.handleNewPhase(action);
}

// Update UI for new phase
updateControls() {
    const controls = document.getElementById('game-controls');
    if (this.gameState.phase === 'NEW_PHASE') {
        controls.innerHTML = '<button onclick="game.newPhaseAction()">New Action</button>';
    }
}
```

#### 2. New Card Type or Ability
```javascript
// Extend card data structure
cardData = {
    rank: 'K',
    value: 13,
    player: 1,
    abilities: ['NEW_ABILITY'], // Add abilities array
    reinforcements: []
};

// Add ability handling in play logic
playCard(row, col, cardIndex) {
    const card = this.hand[cardIndex];
    
    // Handle special abilities
    if (card.abilities && card.abilities.includes('NEW_ABILITY')) {
        this.handleNewAbility(row, col, card);
    }
    
    // Continue with normal placement
    this.placeCard(row, col, card);
}
```

#### 3. New UI Component
```javascript
// Add to HTML structure
<div id="new-component" class="component">
    <!-- New component content -->
</div>

// Add update method
updateNewComponent() {
    const component = document.getElementById('new-component');
    const data = this.gameState.newData;
    
    component.innerHTML = this.renderNewComponent(data);
}

// Include in main UI update
updateUI() {
    this.updateBoard();
    this.updateHand();
    this.updateGameStatus();
    this.updateControls();
    this.updateNewComponent(); // Add here
}
```

### Error Handling Patterns

#### Firebase Error Handling
```javascript
// Handle database operations with error catching
async function updateGameState(updates) {
    try {
        await database.ref(`rooms/${roomCode}`).update(updates);
    } catch (error) {
        console.error('Failed to update game state:', error);
        this.showError('Connection error. Please try again.');
    }
}
```

#### Move Validation with User Feedback
```javascript
attemptMove(row, col) {
    if (!this.isValidMove(row, col)) {
        this.showError('Invalid move: card must connect to your territory');
        return false;
    }
    
    try {
        this.playCard(row, col, this.selectedCardIndex);
        return true;
    } catch (error) {
        this.showError('Failed to play card. Please try again.');
        return false;
    }
}
```

## Troubleshooting and Common Issues

### Firebase Connection Issues

#### Problem: "Firebase is not defined" Error
**Cause**: Firebase SDK not loaded properly
**Solutions**:
1. Check internet connection - Firebase CDN may be blocked
2. Verify Firebase script tags in `index.html` are correct
3. Make sure scripts load in correct order (firebase-app before firebase-database)
4. Try loading from different CDN or download locally

#### Problem: "Permission denied" Database Error
**Cause**: Firebase security rules are too restrictive
**Solutions**:
1. Check your database rules in Firebase Console
2. For development, use permissive rules:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. For production, implement proper user-based rules
4. Verify your Firebase project is active and not suspended

#### Problem: "Invalid API key" Error
**Cause**: Incorrect Firebase configuration
**Solutions**:
1. Double-check all values in `config.js` match Firebase Console
2. Regenerate API key if compromised
3. Ensure project ID is correct (case-sensitive)
4. Verify database URL includes correct region

### Multiplayer Connection Issues

#### Problem: Players Can't Join Room
**Causes & Solutions**:
1. **Wrong room code**: Room codes are case-sensitive, verify exact match
2. **Room doesn't exist**: First player must create room before others can join
3. **Room full**: Only 2 players allowed per room
4. **Firebase connection**: Check both players have working internet
5. **Browser compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)

#### Problem: Game State Not Syncing
**Causes & Solutions**:
1. **Network issues**: Check internet connectivity
2. **Firebase quota exceeded**: Check Firebase usage in console
3. **Browser cache**: Clear browser cache and reload
4. **Multiple tabs**: Close other tabs with the same game
5. **Listener cleanup**: Refresh page to reset Firebase listeners

### Gameplay Issues

#### Problem: Cards Won't Play
**Common causes**:
1. **Not your turn**: Wait for opponent to finish their move
2. **Invalid connection**: Card must connect to your home row
3. **Wrong game phase**: Can only play cards during 'playing' phase
4. **No card selected**: Click a card in your hand first
5. **Invalid target**: Can't play on stronger opponent cards

#### Problem: UI Not Updating
**Debugging steps**:
1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Verify Firebase connection in Network tab
4. Clear browser cache and reload
5. Check if opponent is still connected

### Development Issues

#### Problem: Local Testing Difficulties
**Solutions**:
1. **Use local server**: `python -m http.server 8000` instead of file:// URLs
2. **Multiple browser windows**: Use different browsers or incognito mode
3. **Clear storage**: Browser → Application → Storage → Clear all
4. **Firebase emulator**: Use Firebase local emulator for offline testing

#### Problem: Code Changes Not Appearing
**Solutions**:
1. **Hard refresh**: Ctrl+F5 or Cmd+Shift+R
2. **Clear cache**: Browser settings → Clear browsing data
3. **Disable cache**: In DevTools → Network tab → Disable cache
4. **Check file save**: Verify your changes are actually saved

### Performance Issues

#### Problem: Slow Game Response
**Causes & Solutions**:
1. **Network latency**: Test with local/nearby users first
2. **Firebase quotas**: Check Firebase console for usage limits
3. **Browser performance**: Close other tabs, restart browser
4. **Device limitations**: Test on different devices
5. **Database optimization**: Minimize data being synced

#### Problem: High Firebase Usage
**Optimization strategies**:
1. **Reduce listener scope**: Only listen to specific paths you need
2. **Implement caching**: Store frequently accessed data locally
3. **Optimize updates**: Use atomic updates instead of multiple writes
4. **Remove unused listeners**: Clean up listeners when leaving rooms

### Mobile Issues

#### Problem: Touch Controls Not Working
**Solutions**:
1. Add touch event handlers alongside click events
2. Increase touch target sizes for small screens
3. Test on actual mobile devices, not just browser simulation
4. Consider adding touch feedback/vibration

### Browser Compatibility

#### Known Issues:
- **Internet Explorer**: Not supported (ES6+ features required)
- **Safari < 12**: May have Firebase compatibility issues
- **Firefox < 60**: Some CSS Grid features missing
- **Mobile browsers**: Touch events may need specific handling

#### Recommended Browsers:
- Chrome 70+
- Firefox 60+
- Safari 12+
- Edge 79+

## Deployment and Hosting

### Hosting Options

#### 1. Firebase Hosting (Recommended)
**Advantages**: Integrated with Firebase backend, free tier available, global CDN
**Steps**:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize in project directory: `firebase init hosting`
4. Select your Firebase project
5. Set public directory to current folder (`.`)
6. Configure as single-page app: No
7. Deploy: `firebase deploy --only hosting`

**Custom domain setup**:
1. In Firebase Console → Hosting → Add custom domain
2. Follow DNS configuration instructions
3. Firebase handles SSL certificates automatically

#### 2. Netlify
**Advantages**: Simple drag-and-drop deployment, free tier
**Steps**:
1. Go to [netlify.com](https://netlify.com)
2. Drag your project folder to Netlify dashboard
3. Site automatically deployed with generated URL
4. For custom domain: Site settings → Domain management

#### 3. GitHub Pages
**Advantages**: Free for public repos, automatic deployment
**Steps**:
1. Push code to GitHub repository
2. Repository Settings → Pages
3. Source: Deploy from branch (main)
4. Folder: / (root)
5. Save - site available at `username.github.io/repository-name`

#### 4. Vercel
**Advantages**: Excellent performance, automatic deployments
**Steps**:
1. Connect GitHub/GitLab repository to Vercel
2. Configure build settings (none needed for static site)
3. Deploy automatically on commits

### Production Configuration

#### Environment-Specific Config
Create separate config files for different environments:

**config.prod.js** (Production):
```javascript
const firebaseConfig = {
  // Production Firebase credentials
  apiKey: "prod-api-key",
  authDomain: "techu-prod.firebaseapp.com",
  databaseURL: "https://techu-prod-default-rtdb.firebaseio.com",
  projectId: "techu-prod"
  // ... other prod settings
};
```

**config.dev.js** (Development):
```javascript
const firebaseConfig = {
  // Development Firebase credentials
  apiKey: "dev-api-key",
  authDomain: "techu-dev.firebaseapp.com",
  databaseURL: "https://techu-dev-default-rtdb.firebaseio.com",
  projectId: "techu-dev"
  // ... other dev settings
};
```

#### Security Considerations

**Firebase Security Rules (Production)**:
```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "data.exists() || (!data.exists() && newData.child('players').numChildren() <= 2)",
        ".validate": "newData.hasChildren(['phase', 'currentPlayer'])",
        "players": {
          ".validate": "newData.numChildren() <= 2"
        },
        "board": {
          ".validate": "newData.isString() || newData.hasChildren()"
        }
      }
    }
  }
}
```

**Environment Variables** (if using build process):
```javascript
// Use environment variables for sensitive data
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ...
};
```

### Performance Optimization

#### 1. Minification
For production, consider minifying JavaScript and CSS:
```bash
# Using UglifyJS for JavaScript
npm install -g uglify-js
uglifyjs game.js -o game.min.js -c -m

# Using cssnano for CSS
npm install -g cssnano-cli
cssnano styles.css styles.min.css
```

#### 2. CDN and Caching
- Use Firebase Hosting's automatic CDN
- Set appropriate cache headers
- Consider loading Firebase SDK from CDN vs local copy

#### 3. Asset Optimization
- Compress any images used
- Remove unused CSS rules
- Minimize HTML whitespace

### Domain and SSL

#### Custom Domain Setup
1. **Purchase domain** from registrar (GoDaddy, Namecheap, etc.)
2. **Configure DNS** to point to hosting provider
3. **Enable SSL** (automatic with most modern hosts)
4. **Update Firebase configuration** if using custom domain

#### SSL/HTTPS Requirements
- Required for Firebase and most modern web APIs
- Automatically provided by recommended hosting services
- Test thoroughly after SSL setup

### Monitoring and Analytics

#### Firebase Usage Monitoring
- Monitor database reads/writes in Firebase Console
- Set up billing alerts to avoid unexpected charges
- Track active users and game sessions

#### Error Tracking
Consider adding error tracking service:
```javascript
// Example: Simple error logging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  // Send to error tracking service
});
```

### Backup and Data Management

#### Database Backup
- Firebase automatically backs up Realtime Database
- Consider exporting data periodically for additional safety
- Test restore procedures

#### Game State Cleanup
Implement automatic cleanup of old game rooms:
```javascript
// Remove rooms older than 24 hours
const cutoff = Date.now() - (24 * 60 * 60 * 1000);
database.ref('rooms').orderByChild('created').endAt(cutoff).remove();
```