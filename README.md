todo: chat commands, prompts, settings, toggles, save/load context, contextual sidebar, internet search
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

### TextAreaShortcuts

- **Enter**: To send a message and get a response.
- **Shift + Enter**: To add a newline in your message.
- **Ctrl + Enter**: To add a message to the tree without a bot response.


## PDF Interaction Features

The application now includes a sophisticated PDF interaction feature, enabling users to upload, view, and select specific pages from multiple PDF documents. This functionality is seamlessly integrated, enhancing the user interaction experience with the chatbot.

### Uploading and Viewing PDFs

1. **Upload PDFs:**
   - Users can upload one or more PDF documents by clicking the "Choose File" button.
   - Uploaded PDFs are displayed as thumbnails for easy access and identification.

2. **Viewing PDF Content:**
   - Double-click on any PDF thumbnail to open a modal with a detailed view of the document.
   - This detailed view allows users to browse through all the pages of the selected PDF.

### Selecting Pages for Context

- **Select Specific Pages:**
  - In the detailed view, users can click on individual pages or drag a selection to select.
    - **Ctrl + click** to deselect.
  - The selected pages are used to extract text, which becomes part of the chatbot’s context for dynamic conversations.
  - This feature enhances interaction, as the chatbot can reference content from the selected PDF pages for context-aware responses.

### Integration with Chatbot

- **Contextual Responses:**
  - Extracted text from selected PDF pages is utilized by the chatbot to provide more relevant and context-specific responses.
  - This integration leads to a more intuitive and enriched user experience, blending document content with intelligent chatbot interactions.

### Managing PDFs

- **Multi-PDF Support:**
  - The application supports uploading and managing multiple PDFs concurrently.
  - Each PDF is treated independently, allowing for individual page selection and document management.

- **Dynamic Interaction:**
  - Users can interact dynamically with the chatbot, leveraging the content of selected PDF pages.
  - This makes the chatbot an effective tool for handling specific inquiries or discussions based on the document content.

### Large View in PDF Interaction

- **Large View for PDFs:** Users can open a detailed Large View of any PDF page by double-clicking on its thumbnail.
- **Dynamic Sizing:** This view dynamically adjusts to the page's size, maintaining the correct aspect ratio and centering content horizontally.
- **Scrollable Interface:** Long pages are scrollable within the Large View, allowing complete page content access.
- **Enhanced Readability:** Offers a clearer and more detailed examination of PDF pages.
- **Easy Navigation:** Simplifies navigating through different pages within the Large View.


# PDF Page Selector
![PDF Page Selector Screenshot](screenpopup.PNG)
