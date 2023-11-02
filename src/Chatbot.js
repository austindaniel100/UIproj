import React, { useState, useRef, useEffect } from "react";
import { Button, List, ListItem, TextareaAutosize } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { TreeView, TreeItem } from "@mui/lab";
import getBotReply from "./botReplyHandler";

import * as d3 from "d3";

const components = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter
        style={solarizedlight}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

const svgStyles = {
  width: "100%",
  height: "90%",
  backgroundColor: "#23282d", // Slightly darker background
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle drop shadow
  borderRadius: "4px", // Optional, but might look good with the shadow
  border: "none", // Remove the border since we're using shadows
  overflow: "hidden", // To ensure shadows and rounded corners look right
};

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
};

const botMessageStyle = {
  ...userMessageStyle,
  backgroundColor: "#262626", // A tad darker grey for distinction
  boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)", // Slightly stronger shadow
};

const textareaStyles = {
  flex: 1,
  padding: "8px 16px",
  resize: "none",
  outline: "none",
  backgroundColor: "#222",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "500",
  letterSpacing: "0.5px",
  zIndex: 1000,
  transition: "all 0.2s",
  boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
  margin: "8px 0", // Add some vertical spacing
  "&:focus": {
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)",
  },
  "::placeholder": {
    color: "#666",
  },
};

const buttonStyles = {
  background: "#8A2BE2", // Purple shade
  color: "white",
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "all 0.2s",
  boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
  fontSize: "16px",
  fontWeight: "500",
  letterSpacing: "0.5px",
  textDecoration: "none",
  display: "inline-block",
  margin: "10px",
};

/**
 * Creates a new message node object with provided properties.
 *
 * @param {Object} parent - Parent node of the current message node.
 * @param {Function} func - Function to execute before creating the message node.
 * @param {string} message - The message content. Default is an empty string.
 * @param {string} sender - The sender of the message. Default is "root".
 * @param {number} row - The row index. Default is 0.
 * @param {number} col - The column index. Default is 0.
 * @param {boolean} context - Indicates if the node is in context. Default is false.
 *
 * @returns {Object} A new message node with unique ID, message content, sender, position (row, col), children, parent, and context status.
 */

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


/**
 * MiniView - A React component that visualizes a hierarchical tree of messages using D3.
 *
 * The component listens to various user interactions like key presses and mouse events 
 * to provide a focused view on the tree, zooming functionality, and navigation through 
 * the messages.
 *
 * Props:
 * - messages: The root node of the message hierarchy to visualize.
 * - setCurrentMessage: A callback function to set the currently focused message.
 * - increment: A number used to trigger the tree's focused view.
 * - current: The current message node being viewed.
 * - setInc: A function to update the increment value.
 * 
 * State:
 * - computedNodes: The list of computed message nodes after applying the D3 tree layout.
 * - svgDimensions: An object containing the dimensions of the SVG container.
 * 
 * The component also uses D3 for data visualization, and manages its own SVG 
 * rendering via React refs.
 */

function MiniView({ messages, setCurrentMessage, increment, current, setInc }) {
  const ref = useRef();
  const svgRef = useRef();
  const gRef = useRef();
  const [computedNodes, setComputedNodes] = useState([]);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const findNodeById = (root, id) => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  };
  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === "q") {
      handleFocusClick();
    }
  };
  const handleMouseDown = (event) => {
    // Check if the middle mouse button is clicked (button value 1 represents the middle button)
    if (event.button === 1) {
      handleFocusClick();
    }
  };

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", (event) => {
      const g = d3.select(gRef.current);
      g.attr("transform", event.transform);
    });

  useEffect(() => {
    if (svgRef.current) {
      setSvgDimensions({
        width: svgRef.current.clientWidth,
        height: svgRef.current.clientHeight,
      });
    }
    const width = ref.current.offsetWidth;
    const height = ref.current.offsetHeight;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const treeLayout = d3.tree().nodeSize([80, 150]); // Adjust the 50 as needed

    treeLayout.separation((a, b) => {
      return a.parent === b.parent ? 1.5 : 2; // Adjust the values as needed
    });

    const root = d3.hierarchy(messages);
    treeLayout(root);

    const nodes = root.descendants().slice(1);
    const links = root.links().filter((link) => link.source !== root);

    const xOffset = -200; // or whatever value you deem fit
    nodes.forEach((node) => {
      node.x += xOffset;
    });

    setComputedNodes(nodes);

    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        (d) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`
      );

    g.selectAll(".node")
      .data(nodes)
      .join("rect")
      .attr("class", "node")
      .attr("width", 100)
      .attr("height", 50)
      .attr("rx", 15)
      .attr("ry", 15)
      .attr("fill", (d) => (d.data.sender === "bot" ? "#2e2e2e" : "#1a3b5d"))
      .attr("stroke", (d) => (d.data.id === current?.id ? "white" : "none"))
      .attr("stroke-width", (d) => (d.data.id === current?.id ? "2" : "0"))
      .attr("x", (d) => d.x - 50)
      .attr("y", (d) => d.y - 20)
      .attr("filter", (d) => (d.data.inContext ? "url(#glow)" : "none")) // Apply the glow filter for nodes in context
      .on("click", (event, node) => {
        const originalNode = findNodeById(messages, node.data.id);
        if (originalNode) {
          setCurrentMessage(originalNode);
        }
      });
    console.log(current);

    g.selectAll(".label")
      .data(nodes)
      .join("text")
      .attr("class", "label")
      .text((d) => d.data.message.substring(0, 10) + "...")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 5)
      .attr("fill", "#d1d1d1") // Set text color to a softer light gray
      .attr("text-anchor", "middle") // Center the text horizontally
      .attr("dominant-baseline", "central"); // Center the text vertically

    svg.call(zoom);
    const handleResize = () => {
      if (svgRef.current) {
        setSvgDimensions({
          width: svgRef.current.clientWidth,
          height: svgRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Remember to remove the event listener when the component is unmounted
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [messages, svgRef.current, setCurrentMessage, increment, setInc]);
  
  /**
 * handleFocusClick:
 * Adjusts the SVG viewport to focus on `computedNodes`.
 * It calculates the bounding box around the nodes, then
 * zooms and translates the SVG to center those nodes.
 * 
 */
  const handleFocusClick = () => {
    const svg = d3.select(svgRef.current);

    const xMin = d3.min(computedNodes, (d) => d.x);
    const xMax = d3.max(computedNodes, (d) => d.x);
    const yMin = d3.min(computedNodes, (d) => d.y);
    const yMax = d3.max(computedNodes, (d) => d.y);

    // console.log('xMin:', xMin);
    // console.log('xMax:', xMax);
    // console.log('yMin:', yMin);
    // console.log('yMax:', yMax);

    const dx = xMax - xMin + 0.001;
    const dy = yMax - yMin + 0.001;

    // console.log('dx:', dx);
    // console.log('dy:', dy);

    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;

    // console.log('xCenter:', xCenter);
    // console.log('yCenter:', yCenter);

    const dxRatio = dx / (svgDimensions.width || 1);
    const dyRatio = dy / (svgDimensions.height || 1);
    const maxRatio = Math.max(dxRatio, dyRatio);
    const tentativeScale = 0.9 / maxRatio;
    const scale = Math.min(tentativeScale, 3);

    // console.log('dxRatio:', dxRatio);
    // console.log('dyRatio:', dyRatio);
    // console.log('maxRatio:', maxRatio);
    // console.log('tentativeScale:', tentativeScale);
    // console.log('scale:', scale);

    const translateX =
      (svgDimensions.width || svgRef.current.offsetWidth || 1) / 2 -
      scale * xCenter;
    const translateY =
      (svgDimensions.height || svgRef.current.offsetHeight || 1) / 2 -
      scale * yCenter;

    // console.log('translateX:', translateX);
    // console.log('translateY:', translateY);

    const translate = [translateX, translateY];

    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  useEffect(() => {
    let timer; // Declare timer outside of the if block

    if (increment < 3) {
      timer = setTimeout(() => {
        handleFocusClick();
      }, 2000); // 3s delay
    } else {
      handleFocusClick();
    }

    return () => {
      if (timer) {
        // Check if timer is set before clearing
        clearTimeout(timer);
      }
    }; // Clear the timeout if the component is unmounted before the timer fires
  }, [increment, computedNodes]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    // Clean up the listeners when the component is unmounted
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={0}
      style={{ outline: "none", width: "100%", height: "100%" }}
    >
      <button
        onClick={handleFocusClick}
        style={buttonStyles}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "#0056b3";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "#007BFF";
        }}
      >
        Focus
      </button>
      <svg ref={svgRef} style={svgStyles}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feMorphology
              operator="dilate"
              radius="2"
              in="SourceAlpha"
              result="thicken"
            />
            <feGaussianBlur in="thicken" stdDeviation="3" result="blurred" />
            <feFlood flood-color="green" result="greenColor" />
            <feComposite in="greenColor" in2="blurred" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        <g ref={gRef}></g>
      </svg>
    </div>
  );
}


/**
 * Chatbot Component
 * 
 * This component represents an interactive chatbot interface. 
 * It features a dynamic message layout based on a tree structure where
 * messages can have multiple child messages.
 * 
 * Features:
 * 1. Messages are stored in a tree structure.
 * 2. User can navigate the message tree using arrow keys.
 * 3. Messages are displayed in a unique grid layout with center-focused columns.
 * 
 * State:
 * - `messageCount`: Tracks the number of messages.
 * - `currentMessage`: Holds the currently selected or focused message.
 * - `input`: Tracks the current input value for the user message.
 * - `messages`: A tree structure to hold the conversation.
 * 
 * Methods:
 * - `setAllNodesContext`: Sets the context for all nodes in the tree.
 * - `setContextDefault`: Adjusts the context from the current node to the root.
 * - `isColumnOccupied`: Checks if a column in the grid is already occupied.
 * - `findNextMessageToRight`: Finds the next message to the right of the current.
 * - ... (and many more navigation methods)
 * - `assignRowAndCol`: Assigns a row and column to each message node based on the tree structure.
 * - `countTotalMessages`: Counts the total number of messages in the tree.
 * - `sendMessage`: Sends a new message and updates the tree structure.
 * - `renderGridMessages`: Renders the messages in a grid layout with the center column in focus.
 * 
 * Effects:
 * - An effect listens for arrow key presses to navigate the messages.
 * 
 * Note:
 * The message layout is designed to visually represent the hierarchical structure of the conversation.
 * The code makes heavy use of tree traversal algorithms to manage and display messages.
 */

const Chatbot = () => {
  const textareaRef = useRef(null);
  const [messageCount, setMessageCount] = useState(0);
  const incrementMessageCount = () => {
    setMessageCount((prevCount) => prevCount + 1);
  };

  const [currentMessage, setCurrentMessage] = useState(null);

  const [input, setInput] = useState("");

  // Inside your Chatbot component:
  const [messages, setMessages] = useState({
    sender: "root",
    message: "",
    children: [],
  });

  const messagesRef = useRef(null);
  const messageRefs = useRef([]);

  let currentRow = 0;
  let currentCol = 0;
  let maxColInLastRow = 0;
  const processedNodes = [];

  const setAllNodesContext = (node, value) => {
    node.inContext = value;
    node.children.forEach((child) => setAllNodesContext(child, value));
  };

  const setContextDefault = (root, current) => {
    // Set inContext to false for every node in the tree
    setAllNodesContext(root, false);

    // Set inContext to true from current node up to the root
    let tempNode = current;
    while (tempNode && tempNode.parent) {
      // Check for tempNode.parent ensures we stop before the root
      // console.log(tempNode);
      tempNode.inContext = true;
      tempNode = tempNode.parent;
      tempNode.inContext = true;
    }
  };

  const isColumnOccupied = (col) => {
    return processedNodes.some((node) => node.col === col);
  };
  const findNextMessageToRight = (currentMessage) => {
    let tempNode = currentMessage;
    let stepsUp = 0;
    // Traverse up
    while (tempNode.parent) {
      const siblings = tempNode.parent.children;
      const currentIndex = siblings.indexOf(tempNode);
      if (currentIndex < siblings.length - 1) {
        tempNode = siblings[currentIndex + 1];
        // Traverse down
        while (stepsUp > 0 && tempNode.children.length > 0) {
          tempNode = tempNode.children[tempNode.children.length - 1];
          stepsUp--;
        }
        return tempNode;
      }
      tempNode = tempNode.parent;
      stepsUp++;
    }
    return null;
  };

  const findNextMessageToLeft = (currentMessage) => {
    let tempNode = currentMessage;
    let stepsUp = 0;
    // Traverse up
    while (tempNode.parent) {
      const siblings = tempNode.parent.children;
      const currentIndex = siblings.indexOf(tempNode);
      if (currentIndex > 0) {
        tempNode = siblings[currentIndex - 1];
        // Traverse down
        while (stepsUp > 0 && tempNode.children.length > 0) {
          tempNode = tempNode.children[tempNode.children.length - 1];
          stepsUp--;
        }
        return tempNode;
      }
      tempNode = tempNode.parent;
      stepsUp++;
    }
    return null;
  };

  const findNextMessageAbove = (currentMessage) => {
    return currentMessage.parent || null;
  };

  const findNextMessageBelow = (currentMessage) => {
    return currentMessage.children && currentMessage.children.length > 0
      ? currentMessage.children[0]
      : null;
  };

  const findParent = (currentMessage) => {
    let tempNode = currentMessage;
    while (tempNode.parent) {
      const siblings = tempNode.parent.children;
      if (siblings.length > 1) {
        return tempNode.parent;
      }
      tempNode = tempNode.parent;
    }
    return null;
  };

  const findLeaf = (currentMessage) => {
    let tempNode = currentMessage;
    while (tempNode.children.length > 0) {
      tempNode = tempNode.children[0]; // Always take the first child
    }
    return tempNode;
  };

  useEffect(() => {
    const handleArrowKeys = (event) => {
      if (!currentMessage) return;

      let nextMessage;
      if (event.key === "ArrowRight") {
        nextMessage = findNextMessageToRight(currentMessage);
      } else if (event.key === "ArrowLeft") {
        nextMessage = findNextMessageToLeft(currentMessage);
      } else if (event.key === "ArrowUp" && event.ctrlKey) {
        nextMessage = findParent(currentMessage);
      } else if (event.key === "ArrowDown" && event.ctrlKey) {
        nextMessage = findLeaf(currentMessage);
      } else if (event.key === "ArrowUp") {
        nextMessage = findNextMessageAbove(currentMessage);
      } else if (event.key === "ArrowDown") {
        nextMessage = findNextMessageBelow(currentMessage);
      }

      if (nextMessage) {
        setCurrentMessage(nextMessage);
      }
    };

    window.addEventListener("keydown", handleArrowKeys);
    return () => window.removeEventListener("keydown", handleArrowKeys);
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
          processedNodes.forEach((existingNode) => {
            if (
              existingNode.row === node.row &&
              existingNode.col >= currentCol
            ) {
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
  processedNodes.forEach((node) => {
    node.row--;
  });

  const countTotalMessages = (node) => {
    if (!node) return 0;
    let count = node.sender === "root" ? 0 : 1; // Count the node itself, unless it's the root
    if (node.children) {
      node.children.forEach((child) => {
        count += countTotalMessages(child);
      });
    }
    return count;
  };

  const traverseAndCalculateTotalHeight = (node, path = "") => {
    if (!node) return 0;

    let height = 0;

    // Calculate height for this node if it's not the root
    if (node.sender !== "root") {
      const depth = path.split("-").length - 1; // Convert path to depth for indexing messageRefs
      if (messageRefs.current[depth]) {
        height += messageRefs.current[depth].offsetHeight + 0.5;
      }
    }

    if (node.children) {
      node.children.forEach((child, index) => {
        height += traverseAndCalculateTotalHeight(
          child,
          path ? `${path}-${index}` : String(index)
        );
      });
    }

    return height;
  };

  const sendMessage = async () => {
    const userMessage = MessageNode(
      currentMessage,
      incrementMessageCount,
      input,
      "user"
    );

    // If there's a current message, add the new user message as its child.
    if (currentMessage) {
      if (!currentMessage.children) {
        currentMessage.children = [];
      }
      currentMessage.children.push(userMessage);
    } else {
      // If no current message, add directly to the root's children.
      setMessages((prevMessages) => ({
        ...prevMessages,
        children: [...prevMessages.children, userMessage],
      }));
    }
    setCurrentMessage(userMessage);
    setInput("");

    const botResponse = await getBotReply(input, currentMessage, messages);

    console.log(botResponse);
    const botReply = MessageNode(
      userMessage,
      incrementMessageCount,
      botResponse,
      "bot"
    );
    userMessage.children = [botReply];

    // Set the user's message as the current message

    setCurrentMessage(botReply);

    setContextDefault(messages, botReply);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        // Allow newline when Shift + Enter is pressed
      } else if (input.trim() !== "") {
        event.preventDefault();
        sendMessage(); // Call the updated sendMessage function
      }
    }
  };

  // Style object for the button

  let maxCol = 0;

  const determineMaxColumns = (node) => {
    if (!node) return;

    if (node.col > maxCol) {
      maxCol = node.col;
    }

    if (node.children) {
      node.children.forEach((child) => determineMaxColumns(child));
    }
  };

  determineMaxColumns(messages);

  const messageContainerStyle = {
    flex: 1,
    // border: '1px solid #ccc',
    padding: "10px",
    position: "relative", // To allow absolute positioning for the pseudo-elements
  };

  const LINE_HEIGHT = 18.25; // 20 pixels for each line is an example, adjust as needed
  const LINE_HEIGHT_DOUBLE = 40;
  const ADDITION = 60;
  const AVERAGE_LINES_PER_MESSAGE = 3; // This is an example, adjust based on your data
  const DEFAULT_MESSAGE_HEIGHT =
    LINE_HEIGHT * AVERAGE_LINES_PER_MESSAGE + ADDITION;

  const renderGridMessages = () => {
    const grid = [];

    const populateGrid = (node) => {
      if (!node) return;

      if (!grid[node.row]) grid[node.row] = [];
      grid[node.row][node.col] = node;

      if (node.children) {
        node.children.forEach((child) => populateGrid(child));
      }
    };

    populateGrid(messages);

    let currentColIndex = currentMessage ? currentMessage.col : 0;

    // Determine the height of each cell in the center column
    const centerHeights = grid.map((row) => {
      const centerCell = row[currentColIndex];
      if (centerCell) {
        const message = centerCell.message;
        const doubleLineBreaks = (message.match(/\n\n/g) || []).length;
        const totalLines = message.split("\n").length + doubleLineBreaks;
        const singles = totalLines - doubleLineBreaks - doubleLineBreaks;

        return (
          singles * LINE_HEIGHT +
          doubleLineBreaks * LINE_HEIGHT_DOUBLE +
          ADDITION
        );
      } else {
        return DEFAULT_MESSAGE_HEIGHT;
      }
    });

    const leftColumnIndex = currentColIndex - 1;
    const rightColumnIndex = currentColIndex + 1;

    return (
      <div style={{ display: "flex", overflowX: "hidden" }}>
        {[leftColumnIndex, currentColIndex, rightColumnIndex].map(
          (colIndex) => (
            <div
              key={colIndex}
              style={{
                flex: colIndex === currentColIndex ? 1 : 0.3,
                opacity: colIndex === currentColIndex ? 1 : 0.3,
                transition: "opacity 0.3s",
                overflow: "hidden",
                maskImage:
                  colIndex !== currentColIndex
                    ? "linear-gradient(to right, transparent 5%, black 15%, black 85%, transparent 95%)"
                    : "none",
              }}
            >
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} style={{ ...messageContainerStyle }}>
                  {row[colIndex] ? (
                    <div
                      onClick={() => setCurrentMessage(row[colIndex])}
                      style={{
                        ...(row[colIndex].sender === "user"
                          ? userMessageStyle
                          : botMessageStyle),
                        border:
                          row[colIndex] === currentMessage
                            ? "3px solid black"
                            : "none",
                      }}
                    >
                      {/* Display message content for center column and "User" or "Bot" for left and right columns */}
                      {colIndex === currentColIndex ? (
                        <ReactMarkdown
                          components={components}
                          children={row[colIndex].message}
                        />
                      ) : (
                        <span>
                          {row[colIndex].sender.charAt(0).toUpperCase() +
                            row[colIndex].sender.slice(1)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: "100%" }}></div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
                .dark-scrollbar::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .dark-scrollbar::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 5px;
                }

                .dark-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                .dark-scrollbar::-webkit-scrollbar-track {
                    background: #333;
                    border-radius: 5px;
                }

                .dark-scrollbar {
                    scrollbar-color: #888 #333;
                    scrollbar-width: thin;
                }
            `}
      </style>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          backgroundColor: "#282c34",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100vw",
            height: "100vh",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "75vw",
              height: "85.5vh",
            }}
          >
            <div
              className="dark-scrollbar"
              style={{
                flex: 3,
                marginRight: "2%",
                paddingRight: "1%",
                overflowY: "auto",
                paddingBottom: "3%",
              }}
            >
              <div ref={messagesRef}>
                <List>{renderGridMessages()}</List>
              </div>

              <div
                style={{
                  position: "fixed",
                  bottom: "5%",
                  left: "10%",
                  width: "80vw",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <TextareaAutosize
                  ref={textareaRef}
                  onBlur={() => {
                    setTimeout(() => {
                      textareaRef.current.focus();
                    }, 0);
                  }}
                  minRows={1}
                  maxRows={10}
                  style={textareaStyles}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />

                <Button
                  variant="contained"
                  color="primary"
                  onClick={sendMessage}
                  style={buttonStyles}
                >
                  Send
                </Button>
              </div>
            </div>

            <div style={{ flex: 2 }}>
              <MiniView
                messages={messages}
                setCurrentMessage={setCurrentMessage}
                increment={messageCount}
                current={currentMessage}
                setInc={incrementMessageCount}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
