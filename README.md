# The way i made the spacial chat works fine, but is kinda trash, so i'll probably just re-do that whole part of it, but the miniview, and backend all work great

# Chatbot UI
![Screenshot](screen.PNG)

## How to Run

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/austindaniel100/UIproj.git
    cd UIproj
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Start the Application:**
    ```bash
    npm start
    ```

The application will start running on `http://localhost:3000`, or another available port if `3000` is already in use.


## Interacting with the Bot

To interact with the bot and get responses:
- Ensure you have the API key set in the `.env` file.
- Set `useApi` to `true` in `botReplyHandler.js`.
- The context for messages is determined by traversing up the tree of messages.
- Messages that are part of the context are highlighted in green.

## Navigation Instructions

Navigate through the tree of messages using the arrow keys:

- **Up Arrow**: Move up the tree.
- **Down Arrow**: Move down the tree (prioritize leftmost branch).
- **Left Arrow**: Move to the direct left sibling.
- **Right Arrow**: Move to the direct right sibling.

For advanced navigation:

- **Ctrl + Up Arrow**: Navigate to the next parent with branching child.
- **Ctrl + Down Arrow**: Navigate down to a leaf.

### Mini-view Focus

To focus on the mini-view:
- Press `Ctrl + Q`.
- Middle-click.
- Click the "Focus" button.

### Branching

To branch the tree of messages, select a current message that isn't already a leaf and send a new message.


