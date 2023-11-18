import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { copyToClipboard } from './utils';
import { Button, TextareaAutosize } from "@mui/material";

const CopyButton = ({ copyContent }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = () => {
    copyToClipboard(copyContent);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000); // Tooltip disappears after 2 seconds
  };
  const buttonStyle = {
    background: "#29274C", // Very dark purple, almost black
    color: "#ccc", // Light grey text color
    padding: "4px 4px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "0.5px",
    textDecoration: "none",
    display: "flex", // Changed to flex
    justifyContent: "center", // Center content horizontally
    alignItems: "center", // Center content vertically
    margin: "2px",
    textTransform: 'none',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    boxSizing: 'border-box',
    // Optional: uniform width for all buttons
  };
  

  return (
    <div style={{ position: 'relative' }}>
      <Button
        style={buttonStyle}
        onClick={handleCopy}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#29274C'; // Slightly lighter on hover
          e.currentTarget.style.color = '#fff'; // Text color changes to pure white on hover
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#29274C';
          e.currentTarget.style.color = '#bbb';
        }}
        onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#29274C'} // Darker when clicked
        onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#29274C'}
      >
        Copy
      </Button>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '50px',
          background: '#333',
          opacity: 0.6,
          color: 'aaa',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75em',
          whiteSpace: 'nowrap'
        }}>
          Copied!
        </div>
      )}
    </div>
  );
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
  const codeBlockHeaderStyle = {
    backgroundColor: '#333', // Dark grey header
    padding: '5px',
    position: 'relative', // Relative position for the copy button
    display: 'flex', // Use flexbox layout
    flexDirection: 'row', // Layout items in a row
    justifyContent: 'space-between', // Space between items
    alignItems: 'center', // Align items vertically in the center

  };

  const codeBlockStyle = {
    backgroundColor: '#333333', // Black background
    borderRadius: '4px',
    padding: 0
    // Add more styling as needed
  };


  
const customStyle = {
  ...darcula,
  'pre[class*="language-"]': {
    ...darcula['pre[class*="language-"]'],
    backgroundColor: 'black',
    padding: 5, // Adjust padding
  },
  'code[class*="language-"]': {
    ...darcula['code[class*="language-"]'],
    backgroundColor: 'black',
  },
};
  
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <div style={codeBlockStyle}>
          <div style={codeBlockHeaderStyle}>
            {/* Assuming the copy button should be in the header */}
            
            Language: {match[1]}
            <CopyButton copyContent={String(children).replace(/\n$/, "")} />
          </div>
          <SyntaxHighlighter
            style={customStyle}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
  
  // Styling for Markdown content
  const markdownStyle = {
    color: '#ddd', // Lighter text color for better readability
    lineHeight: '1.5', // Improve line spacing
    fontSize: 'calc(6px + 0.5vw)',
    width: '100%',
    wordWrap: 'break-word', // This allows long words to break and wrap onto the next line
  overflowWrap: 'break-word', // Use this for better handling in modern browsers
  wordBreak: 'break-all', // Add this line
    
    // Add more styling as required
  };

// Define styles for user and bot messages
const userMessageStyle = {
    maxWidth: "80%",
    padding: "8px 16px", // Consistent with other elements
    border: "none",
    borderRadius: "4px", // Consistent radius
    backgroundColor: "#15334f", // A bit darker variation of blue for depth
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    color: "#e0e0e0",
    textAlign: "left",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
    margin: "10px 0", // Add some margin for distinction
    wordWrap: 'break-word', // This allows long words to break and wrap onto the next line
  overflowWrap: 'break-word', // Use this for better handling in modern browsers
  boxSizing: 'border-box', // Include padding and borders in the width calculation
  };
  
  const botMessageStyle = {
    ...userMessageStyle,
    backgroundColor: "#262626", // A tad darker grey for distinction
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)", // Slightly stronger shadow
  };

  const MessageComponent = ({ messageNode, isCurrentMessage, currentBotMessageText, isCurrentBotMessage, wide}) => {

    const [message, setMessage] = useState(messageNode.message);
    console.log('Rendering MessageComponent:', messageNode);
    const sender = messageNode.sender;

    useEffect(() => {
      if (messageNode.sender === 'bot' && currentBotMessageText !== "" && isCurrentBotMessage) {
        console.log(isCurrentBotMessage, currentBotMessageText, messageNode.message, messageNode.id, messageNode.sender);
        console.log(messageNode.message);
        setMessage(currentBotMessageText);
      }
      
    }, [currentBotMessageText]);


    // useEffect(() => {
    //   console.log("messageNode: ", messageNode.message);
    // }, [messageNode]);

    

  // Determine the style based on the sender
  const messageStyle = sender === "user" ? userMessageStyle : botMessageStyle;

  const renderedMessage = typeof message === 'string' ? message : "";

  const currentMessageStyle = {
    ...messageStyle,
    border: isCurrentMessage ? "3px solid black" : "none",
    display: 'flex', // Use flexbox layout
    flexDirection: 'row', // Layout items in a row
    justifyContent: 'space-between', // Space between items
    alignItems: 'center', // Align items vertically in the center
    position: 'relative', // Keep this for positioning the copy button
    maxWidth: '90%', // Add a maximum width
    width: '100%',
  minwidth: '0', // Add a minimum width
  flexWrap: 'wrap',
  wordWrap: "break-word",
  minHeight: '50px',
  };

  return (
    <div style={currentMessageStyle}>
      <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
      <CopyButton copyContent={message} />
      </div>
      <div style={markdownStyle}>
      <ReactMarkdown components={components}>
        {renderedMessage}
      </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(MessageComponent);
