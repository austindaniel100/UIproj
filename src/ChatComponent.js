import React, { useEffect, useRef } from 'react';
import MessageComponent from './MessageComponent';




const generateConversationLists = (currentMessage, messagesTree) => {
    let conversationList = [];
    let otherMessagesList = [];
    const visitedMessages = new Set();
  
    // Helper function to check if a node is an ancestor of the current message

  
    // Trace back through the current message's ancestors
    let ancestorMessage = currentMessage;
    while (ancestorMessage) {
      if (ancestorMessage.inContext || ancestorMessage.id === currentMessage.id) {
        conversationList.unshift(ancestorMessage);
      }
      ancestorMessage = ancestorMessage.parent;
    }
  
    // Helper function to traverse the entire tree
    const traverseTree = (node) => {
      if (!node || visitedMessages.has(node)) return;
      visitedMessages.add(node);
  
      // Check if the node is not an ancestor of the current message and inContext is true
      if (node.inContext) {
        otherMessagesList.push(node);
      }
  
      // Traverse children
      if (node.children) {
        node.children.forEach(child => traverseTree(child));
      }
    };
  
    // Traverse the entire tree to find other in-context messages
    traverseTree(messagesTree);
    otherMessagesList = otherMessagesList.filter(msg => !conversationList.includes(msg));

    // console.log("************************************************************************************************");
    // console.log("conversationList: ", conversationList);
    // console.log("otherMessagesList: ", otherMessagesList);
  
    return { conversationList, otherMessagesList };
  };

const MessageNode = (
    parent,
    func,
    message = "",
    sender = "root",
    row = 0,
    col = 0,
    context = false
  ) => {
    if (func) {
      func();
    }
    return {
      id: `${Date.now()}-${Math.random()}`,
      message: message,
      sender: sender,
      row: row,
      col: col,
      children: [],
      parent: parent,
      inContext: context,
    };
  };

// Example default messages
const defaultMessages = [
  MessageNode(null, null, "Hello! I'm a bot.", "bot"),
  MessageNode(null, null, "Hi there! I'm a user.", "user")
];

const ChatComponent = ({ currentMessage, increment }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessage]);

  let messagesRoot = currentMessage;
  while (messagesRoot && messagesRoot.parent) {
    messagesRoot = messagesRoot.parent;
  }

  // Use generateConversationLists to get the conversation and other messages
  const { conversationList, otherMessagesList } = generateConversationLists(currentMessage, messagesRoot);

  const isConversationListArray = Array.isArray(conversationList);
  const isOtherMessagesListArray = Array.isArray(otherMessagesList) && otherMessagesList.length > 0;

  const titleStyle = {
    textAlign: 'left', // Align the title text to the left
    margin: 0,
    paddingLeft: '10px' // Adjust this padding to match the padding of the message bubbles
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%'}}>
      {isOtherMessagesListArray && (
        <div className="other-messages-column" style={{ flexShrink: 0, width: '300px' }}>
          <h2 style={{ textAlign: 'left', margin: 10 }}>In-Context</h2>
          {otherMessagesList.map((messageNode) => (
            <MessageComponent
              key={messageNode.id}
              messageNode={messageNode}
              isCurrentMessage={false}
            />
          ))}
        </div>
      )}
      <div className="conversation-list-column" style={{ flexGrow: 1, padding: '0 10px' }}>
        <h2 style={titleStyle}>Conversation</h2>
        <div style={{ width: '100%' }}>
          {isConversationListArray && conversationList.map((messageNode) => (
            <div style={{ width: '100%' }}>
              <MessageComponent
                key={messageNode.id}
                messageNode={messageNode}
                isCurrentMessage={currentMessage && messageNode.id === currentMessage.id}
              />
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};


export default ChatComponent;