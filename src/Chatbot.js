import React, { useState, useRef, useEffect } from 'react';
import { Button, List, ListItem, TextareaAutosize } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { TreeView, TreeItem } from '@mui/lab';
import * as d3 from 'd3';

const components = {
  code({node, inline, className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter style={solarizedlight} language={match[1]} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }
};
const MiniView = ({ messages, setScrollToMessage }) => {
    const [expandedNodes, setExpandedNodes] = useState([]);

    const renderTreeItems = (node, index) => {
      if (!node || node.sender === 'root') return null;

      const nodeId = String(index);
      if (!expandedNodes.includes(nodeId)) {
        setExpandedNodes((prevNodes) => [...prevNodes, nodeId]);
      }

      return (
        <TreeItem 
          nodeId={nodeId} 
          label={
            <div 
              style={{
                background: node.sender === 'user' ? '#e6f7ff' : '#f6f6f6',
                border: '1px solid #ccc',
                borderRadius: '10px',
                marginBottom: '5px',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                padding: '5px 10px',
                cursor: 'pointer',  // Make it look clickable
                display: 'inline-block',  // Required to prevent full width styling
              }}
              onClick={() => setScrollToMessage(nodeId)}
            >
              {`${node.sender}: ${node.message.substring(0, 10)}...`}
            </div>
          }
        >
          {node.children && node.children.map((child, childIndex) => renderTreeItems(child, `${index}-${childIndex}`))}
        </TreeItem>
      );
    };

    return (
        <TreeView
          expanded={expandedNodes}
          onNodeToggle={(event, nodeIds) => setExpandedNodes(nodeIds)}
        >
          {messages.children && messages.children.map((message, index) => renderTreeItems(message, index))}
        </TreeView>
    );
};


  

const MessageNode = (message = '', sender = 'root', row = 0, col = 0) => {
    return { 
        message: message, 
        sender: sender, 
        row: row,
        col: col,
        children: [] 
    };
};


const Chatbot = () => {
    const textareaRef = useRef(null);


    const [currentMessage, setCurrentMessage] = useState(null);

  const [input, setInput] = useState('');
  
  
  // Inside your Chatbot component:
  const [messages, setMessages] = useState({ sender: 'root', message: '', children: [] });

  
  const [translateY, setTranslateY] = useState(0);
  
  const messagesRef = useRef(null);
  const messageRefs = useRef([]);

  
let currentRow = 0;
let currentCol = 0;
let maxColInLastRow = 0;
const processedNodes = [];

const isColumnOccupied = (col) => {
    return processedNodes.some(node => node.col === col);
};
const findNextMessageToRight = (currentMessage) => {
    let nextMessage = null;
    processedNodes.forEach(node => {
        if (node.row === currentMessage.row && node.col > currentMessage.col) {
            if (!nextMessage || node.col < nextMessage.col) {
                nextMessage = node;
            }
        }
    });
    return nextMessage;
};

const findNextMessageToLeft = (currentMessage) => {
    let nextMessage = null;
    processedNodes.forEach(node => {
        if (node.row === currentMessage.row && node.col < currentMessage.col) {
            if (!nextMessage || node.col > nextMessage.col) {
                nextMessage = node;
            }
        }
    });
    return nextMessage;
};

const findNextMessageAbove = (currentMessage) => {
    let nextMessage = null;
    processedNodes.forEach(node => {
        if (node.col === currentMessage.col && node.row < currentMessage.row) {
            if (!nextMessage || node.row > nextMessage.row) {
                nextMessage = node;
            }
        }
    });
    return nextMessage;
};

const findNextMessageBelow = (currentMessage) => {
    let nextMessage = null;
    processedNodes.forEach(node => {
        if (node.col === currentMessage.col && node.row > currentMessage.row) {
            if (!nextMessage || node.row < nextMessage.row) {
                nextMessage = node;
            }
        }
    });
    return nextMessage;
};



useEffect(() => {
    const handleArrowKeys = (event) => {
        if (!currentMessage) return;

        let nextMessage;
        if (event.key === 'ArrowRight') {
            nextMessage = findNextMessageToRight(currentMessage);
        } else if (event.key === 'ArrowLeft') {
            nextMessage = findNextMessageToLeft(currentMessage);
        } else if (event.key === 'ArrowUp') {
            nextMessage = findNextMessageAbove(currentMessage);
        } else if (event.key === 'ArrowDown') {
            nextMessage = findNextMessageBelow(currentMessage);
        }

        if (nextMessage) {
            setCurrentMessage(nextMessage);
        }
    };

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
}, [currentMessage]);


const assignRowAndCol = (node, isChild = false) => {
    if (!node) return;
    // if (node.sender == 'root') return;

    node.row = currentRow;
    node.col = currentCol;

    if (node.children && node.children.length) {
        node.children.forEach((child, index) => {
            if (index === 0) {
                // First child: Directly below the parent
                currentRow = node.row + 1;
                currentCol = node.col;
                
                // Check if column is occupied
                while (isColumnOccupied(currentCol)) {
                    currentCol++;
                }
            } else {
                // Subsequent children: To the right of the parent
                currentRow = node.row;
                currentCol = node.col + index;

                // Push nodes to the right to make space
                processedNodes.forEach(existingNode => {
                    if (existingNode.row === node.row && existingNode.col >= currentCol) {
                        existingNode.col++;
                    }
                });

                // Check if column is occupied
                while (isColumnOccupied(currentCol)) {
                    currentCol++;
                }
            }
            assignRowAndCol(child, true);
        });
    } else {
        if (!isChild) {
            currentRow++;
            currentCol = 0;
            if (currentRow > 0) {
                currentCol = maxColInLastRow + 1;
            }
        }
    }
    maxColInLastRow = Math.max(maxColInLastRow, currentCol);
    processedNodes.push(node);
};

assignRowAndCol(messages);
processedNodes.forEach(node => {
    node.row--;
});

  

  
  
  
  
  
  



  const countTotalMessages = (node) => {
    if (!node) return 0;
    let count = (node.sender === 'root') ? 0 : 1;  // Count the node itself, unless it's the root
    if (node.children) {
        node.children.forEach(child => {
            count += countTotalMessages(child);
        });
    }
    return count;
};

const traverseAndCalculateTotalHeight = (node, path = '') => {
    if (!node) return 0;
    
    let height = 0;

    // Calculate height for this node if it's not the root
    if (node.sender !== 'root') {
        const depth = path.split('-').length - 1; // Convert path to depth for indexing messageRefs
        if (messageRefs.current[depth]) {
            height += messageRefs.current[depth].offsetHeight + 0.5;
        }
    }

    if (node.children) {
        node.children.forEach((child, index) => {
            height += traverseAndCalculateTotalHeight(child, path ? `${path}-${index}` : String(index));
        });
    }

    return height;
};





const sendMessage = () => {
    const userMessage = MessageNode(input, 'user');
    const botReply = MessageNode('Response from chatbot', 'bot');
    
    // If there's a current message, add the new user message as its child.
    if (currentMessage) {
        if (!currentMessage.children) {
            currentMessage.children = [];
        }
        currentMessage.children.push(userMessage);
        userMessage.children = [botReply];
    } else {
        // If no current message, add directly to the root's children.
        setMessages(prevMessages => ({
            ...prevMessages,
            children: [...prevMessages.children, userMessage]
        }));
        userMessage.children = [botReply];
    }

    // Set the user's message as the current message
    setCurrentMessage(botReply);

    setInput('');
};



  

const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow newline when Shift + Enter is pressed
      } else if (input.trim() !== '') {
        event.preventDefault();
        sendMessage(); // Call the updated sendMessage function
      }
    }
};


  const BUFFER = 1040;  // 2 pixels buffer

  const setScrollToMessage = (nodeId) => {
    let cumulativeHeight = 0;
    let foundMessage = null;

    const traverseAndCalculateHeight = (node, path = '') => {
        if (!node || foundMessage) return;
    
        if (path === nodeId) {
            foundMessage = node;
        }
    
        if (node.sender !== 'root') {
            const depth = path.split('-').length - 1; // Convert path to depth for indexing messageRefs
            if (messageRefs.current[depth]) {
                cumulativeHeight += messageRefs.current[depth].offsetHeight + 0.5;
            }
        }
    
        if (node.children) {
            node.children.forEach((child, index) => {
                traverseAndCalculateHeight(child, path ? `${path}-${index}` : String(index));
            });
        }
    };

    traverseAndCalculateHeight(messages);

    if (foundMessage && foundMessage !== currentMessage) {
        setCurrentMessage(foundMessage);
    }

    const newY = -cumulativeHeight + BUFFER;
    // setTranslateY(newY);
};





const printMessagesTree = (node, depth = 0) => {
    if (!node) return;

    // Get the first word from the message (or the entire message if it's a single word)
    const firstWord = node.message.split(' ')[0];

    console.log(' '.repeat(depth * 4) + (node.sender !== 'root' ? `${node.sender}: ${firstWord}` : 'root'));

    if (node.children) {
        node.children.forEach(child => printMessagesTree(child, depth + 1));
    }
};



const branchMessage = () => {
    const userMessage = MessageNode(input, 'user');
    
    // If there's a current message, add the new user message as its child.
    if (currentMessage) {
        if (!currentMessage.children) {
            currentMessage.children = [];
        }
        currentMessage.children.push(userMessage);
    } else {
        // If no current message, add directly to the root's children.
        setMessages(prevMessages => ({
            ...prevMessages,
            children: [...prevMessages.children, userMessage]
        }));
    }

    // Set the user's message as the current message
    setCurrentMessage(userMessage);

    setInput('');
};



const userMessageStyle = {
    maxWidth: '80%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#e6f7ff',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    textAlign: 'left'  // Ensure text alignment to the left
};

const botMessageStyle = {
    ...userMessageStyle,
    backgroundColor: '#f6f6f6',
    textAlign: 'left'
};


let maxCol = 0;

const determineMaxColumns = (node) => {
    if (!node) return;

    if (node.col > maxCol) {
        maxCol = node.col;
    }

    if (node.children) {
        node.children.forEach(child => determineMaxColumns(child));
    }
};

determineMaxColumns(messages);

const messageContainerStyle = {
    flex: 1, 
    // border: '1px solid #ccc', 
    padding: '10px', 
    position: 'relative' // To allow absolute positioning for the pseudo-elements
};


const LINE_HEIGHT = 18.25; // 20 pixels for each line is an example, adjust as needed
const LINE_HEIGHT_DOUBLE = 40;
const ADDITION = 60;
const AVERAGE_LINES_PER_MESSAGE = 3; // This is an example, adjust based on your data
const DEFAULT_MESSAGE_HEIGHT = LINE_HEIGHT * AVERAGE_LINES_PER_MESSAGE + ADDITION;




const renderGridMessages = () => {
    const grid = [];

    const populateGrid = (node) => {
        if (!node) return;

        if (!grid[node.row]) grid[node.row] = [];
        grid[node.row][node.col] = node;

        if (node.children) {
            node.children.forEach(child => populateGrid(child));
        }
    };

    populateGrid(messages);

    let currentColIndex = currentMessage ? currentMessage.col : 0;

    // Determine the height of each cell in the center column
    const centerHeights = grid.map(row => {
        const centerCell = row[currentColIndex];
        if (centerCell) {
            const message = centerCell.message;
            const doubleLineBreaks = (message.match(/\n\n/g) || []).length;
            const totalLines = message.split('\n').length + doubleLineBreaks;
            const singles = totalLines - doubleLineBreaks - doubleLineBreaks
    
            return singles * LINE_HEIGHT + doubleLineBreaks * (LINE_HEIGHT_DOUBLE) + ADDITION; 
        } else {
            return DEFAULT_MESSAGE_HEIGHT;
        }
    });
    
    

    const leftColumnIndex = currentColIndex - 1;
    const rightColumnIndex = currentColIndex + 1;

    return (
        <div style={{ display: 'flex', overflowX: 'hidden' }}>
            {[leftColumnIndex, currentColIndex, rightColumnIndex].map(colIndex => (
                <div 
                    key={colIndex} 
                    style={{ 
                        flex: colIndex === currentColIndex ? 1 : 0.3, 
                        opacity: colIndex === currentColIndex ? 1 : 0.3,
                        transition: 'opacity 0.3s',
                        overflow: 'hidden',
                        maskImage: colIndex !== currentColIndex ? 'linear-gradient(to right, transparent 5%, black 15%, black 85%, transparent 95%)' : 'none'
                    }}
                >
                    {grid.map((row, rowIndex) => (
                        <div key={rowIndex} style={{ ...messageContainerStyle }}>

                            {row[colIndex] ? (
                                <div 
                                    onClick={() => setCurrentMessage(row[colIndex])}
                                    style={{
                                        ...row[colIndex].sender === 'user' ? userMessageStyle : botMessageStyle,
                                        border: row[colIndex] === currentMessage ? '3px solid black' : 'none'
                                    }}
                                >
                                    {/* Display message content for center column and "User" or "Bot" for left and right columns */}
                                    {colIndex === currentColIndex ? 
                                        <ReactMarkdown components={components} children={row[colIndex].message} /> :
                                        <span>{row[colIndex].sender.charAt(0).toUpperCase() + row[colIndex].sender.slice(1)}</span>
                                    }
                                </div>
                            ) : (
                                <div style={{ height: '100%' }}></div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};







  
  


  

return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh' }}>
        
        <div style={{ display: 'flex', flexDirection: 'row', width: '80vw', height: '90vh' }}>
            
            <div style={{ flex: 4, marginRight: '2%', borderRight: '1px solid #ccc', paddingRight: '1%', overflowY: 'auto', paddingBottom: '5%' }}>
                
                <div ref={messagesRef}>
                    <List>
                        {renderGridMessages()}
                    </List>
                </div>

                <div style={{ 
                    position: 'fixed', 
                    bottom: '5%', 
                    left: '10%', 
                    width: '80vw', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end' 
                }}>
                    <TextareaAutosize
                    ref={textareaRef}
                    onBlur={() => {
                        setTimeout(() => {
                            textareaRef.current.focus();
                        }, 0);
                    }}
                        minRows={1}
                        maxRows={10}
                        style={{
                            flex: 1, 
                            padding: '0.5rem', 
                            resize: 'none', 
                            outline: 'none', 
                            border: '1px solid #ccc', 
                            borderRadius: '5px',
                            zIndex: 1000 
                        }}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />

                    <Button variant="contained" color="primary" onClick={sendMessage} style={{ marginLeft: '1%' }}>Send</Button>
                </div>
            </div>
            
            <div style={{ flex: 1, padding: '1%', overflowY: 'auto' }}>
                <Button variant="outlined" onClick={() => printMessagesTree(messages)} style={{ width: '100%', marginBottom: '1%' }}>Print Tree</Button>
                <MiniView messages={messages} setScrollToMessage={setScrollToMessage} />
            </div>
            
        </div>
    </div>
);
};

export default Chatbot;
