import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { copyToClipboard } from './utils';

const CopyButton = ({ copyContent }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = () => {
    copyToClipboard(copyContent);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000); // Tooltip disappears after 2 seconds
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'transparent',
            border: '1px solid #555', // Softer border color
            borderRadius: '3px',
            padding: '3px 6px',
            cursor: 'pointer',
            color: '#bbb', // Softer white
            fontSize: '0.8em',
            transition: 'background-color 0.2s'
          }}
          
        onClick={handleCopy}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#333'}
        onMouseUp={(e) => e.currentTarget.style.backgroundColor = '#555'}
      >
        Copy
      </button>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '4px', // Adjust as needed
          right: '50px', // Adjust as needed
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
            <CopyButton copyContent={String(children).replace(/\n$/, "")} />
            Language: {match[1]}
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
    fontSize: '16px', // Adjust font size as needed
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
  };
  
  const botMessageStyle = {
    ...userMessageStyle,
    backgroundColor: "#262626", // A tad darker grey for distinction
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)", // Slightly stronger shadow
  };

  const MessageComponent = ({ messageNode, isCurrentMessage }) => {
    console.log('Rendering MessageComponent:', messageNode.id);
    const { message, sender } = messageNode;

    

  // Determine the style based on the sender
  const messageStyle = sender === "user" ? userMessageStyle : botMessageStyle;

  const currentMessageStyle = {
    ...messageStyle,
    border: isCurrentMessage ? "3px solid black" : "none",
    position: 'relative', // Added for positioning the copy button
  };

  return (
    <div style={currentMessageStyle}>
      <CopyButton copyContent={message} />
      <div style={markdownStyle}>
      <ReactMarkdown components={components}>
        {message}
      </ReactMarkdown>
      </div>
    </div>
  );
};

export default React.memo(MessageComponent);
