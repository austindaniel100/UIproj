import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { Button, TextareaAutosize } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import BotFunctions from "./botReplyHandler";
import ChatComponent from "./ChatComponent";
import PdfViewerComponent from "./PdfComponent";
import SettingsPopup from './SettingsPopup'; // Adjust the path as per your file structure


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

const customScrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#2C2F33',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#484848',
    borderRadius: '10px',
    border: '2px solid #2C2F33',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: '#606060',
  },
};

// Apply these styles to the scrollable elements like the prompt list and text area


const buttonStyles = {
  background: "#29274C", // Very dark purple, almost black
  color: "#ccc", // Light grey text color
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
  display: "inline-block", // Changed to flex
  justifyContent: "center", // Center content horizontally
  alignItems: "center", // Center content vertically
  margin: "10px",
  textTransform: 'none',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  boxSizing: 'border-box',
  // Optional: uniform width for all buttons
  width: '100px', // Adjust as needed
};





const popupStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  color: "#ccc",
  textAlign: 'left',
  transform: 'translate(-50%, -50%)',
  backgroundColor: "#23282d", // Slightly darker background
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle drop shadow
  borderRadius: "4px", // Optional, but might look good with the shadow
  padding: '20px',
  borderRadius: '8px',
  zIndex: 1000,
  // ... other styles ...
};

const popupContentStyle = {
  maxHeight: '400px',
  overflowY: 'auto',
  // ... other styles ...
};

const closeButtonStyle = {
  ... buttonStyles,
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

    if (!messages || !Array.isArray(messages.children)) {
      console.error('Invalid messages structure:', messages);
      return; // Early return to prevent further execution
    }
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
    // console.log(current);

    g.selectAll(".label")
      .data(nodes)
      .join("text")
      .attr("class", "label")
      .text(d => typeof d.data.message === 'string' ? d.data.message.substring(0, 10) + "..." : "...")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 5)
      .attr("fill", "#d1d1d1") // Set text color to a softer light gray
      .attr("text-anchor", "middle") // Center the text horizontally
      .attr("dominant-baseline", "central"); // Center the text vertically

    // ... after drawing nodes and text ...

g.selectAll(".click-capture")
.data(nodes)
.join("rect")
.attr("class", "click-capture")
.attr("width", 100) // Same width as your nodes
.attr("height", 50) // Same height as your nodes
.attr("x", (d) => d.x - 50) // Same x position as your nodes
.attr("y", (d) => d.y - 20) // Same y position as your nodes
.style("fill-opacity", 0) // Make them invisible
.on("click", (event, node) => {
  if (event.ctrlKey) {
    // Ctrl-click functionality
    node.data.inContext = !node.data.inContext;
    g.selectAll(".node")
      .filter(d => d.data.id === node.data.id) // Filter to get the corresponding node
      .attr("filter", node.data.inContext ? "url(#glow)" : "none"); // Update the glow 
    setInc();

    // Update the appearance or state as needed
  } else {
    // Normal click functionality
    const originalNode = findNodeById(messages, node.data.id);
    if (originalNode) {
      setCurrentMessage(originalNode);
    }
  }
});


    

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


  return (
    <div
      ref={ref}
      tabIndex={0}
      style={{ outline: "none", width: "100%", height: "100%" }}
    >
      <Button
        variant="contained"
        color="primary"
        onClick={handleFocusClick}
        style={buttonStyles}
        sx={{
          ...buttonStyles,
          '&&:hover': {
            backgroundColor: '#FFFFFF', // Adjust the color as needed
          },
        }}
      >
        Focus
      </Button>
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
            <feFlood floodColor="green" result="greenColor" />
            <feComposite in="greenColor" in2="blurred" operator="in" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        <g ref={gRef}></g>
      </svg>
    </div>
  );
}



const PromptPopup = React.forwardRef(({ onClose, onSend, onSendWithContext, prompts = [], setPrompts }, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [promptName, setPromptName] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [parameters, setParameters] = useState({});
  const [parsedParameters, setParsedParameters] = useState([]);

  const [searchInput, setSearchInput] = useState("");

  const [hoverIndex, setHoverIndex] = useState(null); // State to track hovered item

  const [sortByRecency, setSortByRecency] = useState(false); // false for alphabetical, true for recency


const handleSearchChange = (event) => {
  const searchText = event.target.value.toLowerCase();
  setSearchInput(searchText);

  const filteredPrompts = prompts
    .filter(p => p.name.toLowerCase().includes(searchText) || p.content.toLowerCase().includes(searchText))
    .sort((a, b) => {
      // Prioritize matches by name over matches by content
      const nameMatchA = a.name.toLowerCase().includes(searchText);
      const nameMatchB = b.name.toLowerCase().includes(searchText);
      if (nameMatchA && !nameMatchB) return -1;
      if (!nameMatchA && nameMatchB) return 1;

      // If both are name matches or both are content matches, then sort alphabetically
      return a.name.localeCompare(b.name);
    });

  // Update the component's state to display these filtered prompts
  setDisplayedPrompts(filteredPrompts);
};

const [displayedPrompts, setDisplayedPrompts] = useState(prompts);

  const parseParameters = (input) => {
    const paramRegex = /{(\w+)}/g; // Regex to identify parameters
    let match;
    let newParameters = [];
    while ((match = paramRegex.exec(input)) !== null) {
      newParameters.push(match[1]);
    }
    setParsedParameters(newParameters);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    parseParameters(event.target.value); 
  };

  const handleNameChange = (event) => {
    setPromptName(event.target.value);
  };

  const handleParameterChange = (paramName, value) => {
    setParameters((prevParams) => ({
      ...prevParams,
      [paramName]: value,
    }));
  };

  const handlePromptClick = (prompt) => {
    setPromptName(prompt.name);
    setInputValue(prompt.content);
    setParameters(prompt.parameters || {});
    parseParameters(prompt.content); // Parse parameters when a prompt is selected
  };

  const handleSavePromptWithParameters = () => {
    const existingPrompt = prompts.find(p => p.name === promptName);
    if (existingPrompt) {
      setOverwritePromptName(promptName);
      setShowConfirmOverwrite(true);
      return;
    }
    saveNewPrompt();
  };

  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [overwritePromptName, setOverwritePromptName] = useState("");

  
  useEffect(() => {
    let sortedPrompts = prompts.filter(p => 
      p.name.toLowerCase().includes(searchInput) || 
      p.content.toLowerCase().includes(searchInput)
    );
  
    if (sortByRecency) {
      // Sort by recency - assuming prompts have a timestamp or similar property
      sortedPrompts.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      // Sort alphabetically
      sortedPrompts.sort((a, b) => a.name.localeCompare(b.name));
    }
  
    setDisplayedPrompts(sortedPrompts);
  }, [prompts, searchInput, sortByRecency]); // Depend on sortByRecency as well
  

  const saveNewPrompt = () => {
    const newPrompt = { name: promptName, content: inputValue, parameters };
    setPrompts(prevPrompts => [...prevPrompts, newPrompt]);
    // Removed resetForm call to maintain the current state of the form
  };

  const handleOverwriteConfirmation = (overwrite) => {
    if (overwrite) {
      const updatedPrompts = prompts.map(p => 
        p.name === overwritePromptName ? { ...p, content: inputValue, parameters } : p
      );
      setPrompts(updatedPrompts);
    }
    setShowConfirmOverwrite(false);
    // resetForm();
  };
  const resetForm = () => {
    setPromptName("");
    setInputValue("");
    setParameters({});
    setOverwritePromptName("");
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#2c3e50', // Dark color for title text
  };

  const subtitleStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '10px',
    marginBottom: '5px',
    color: '#34495e', // Slightly lighter color for subtitles
  };

  const toggleButtonStyle = {
    cursor: 'pointer',
    padding: '5px 10px',
    marginLeft: '10px',
    backgroundColor: sortByRecency ? '#333' : '#333', // Lighter grey when active
    color: '#ccc',
    border: 'none',
    borderRadius: '5px',
    outline: 'none',
    transition: 'background-color 0.3s',
  };
  
  const toggleButtonTextStyle = {
    margin: 0,
    paddingLeft: '5px',
    paddingRight: '5px',
  };
  
  


  const promptItemStyle = (prompt) => ({
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: selectedPrompt === prompt.name ? "#484848" : "#333",
    color: "#ccc",
    borderBottom: "1px solid #555",
    '&:hover': {
      backgroundColor: '#484848',
    }
  });

  const popupContainerStyle = {
    ...popupStyle,
    display: "flex",
    flexDirection: "row",
    width: '1000px', // Fixed width for the popup
    maxWidth: '100%', // Ensure it doesn't exceed the screen width
    // Other styling as needed
  };

  const promptListStyle = {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '400px',
    borderRight: '1px solid #555',
    padding: '10px',
    backgroundColor: '#2C2F33', // Dark background for contrast
    color: '#ecf0f1', // Light text for readability
  };

  const detailSectionStyle = {
    flex: 2,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#2C2F33', // Light background for the detail section
  };

  const rightColumnStyle = {
    backgroundColor: "#23282d", // Slightly darker background
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle drop shadow
  borderRadius: "4px", // Optional, but might look good with the shadow
  border: "none", // Remove the border since we're using shadows
    flex: 2,
    padding: '20px',
    backgroundColor: '#212121', // dark background for contrast
    display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start', // aligns children to the top of the container
  };
  
  const buttonsContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between', // Evenly spaces buttons
    marginTop: '20px',
  };

  

  const listItemStyle = (index) => ({
    backgroundColor: hoverIndex === index ? "#484848" : "#121212",
    color: '#ccc',
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  });

const listContainerStyle = {
    overflowY: 'auto', // Make scrollable
    maxHeight: '400px', // Fixed height for scroll
    padding: '10px',
    backgroundColor: "#212121",
  color: '#ecf0f1', // Light text color for readability
    display: 'flex',
    flexDirection: 'column', // Ensure elements are stacked verticallyflexDirection: 'column',
    justifyContent: 'flex-start', // aligns children to the top of the container
    // other necessary styles
  };

  const scrollbarStyles = `
  .dark-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .dark-scrollbar::-webkit-scrollbar-thumb {
    background: #454545;
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
    scrollbar-color: #444 #333;
    scrollbar-width: thin;
  }
`;
const searchInputStyle = {
  padding: '10px 15px',
  width: 'calc(100%)', // Adjust width to account for padding and prevent overflow
  boxSizing: 'border-box', // Include padding and border in the element's width
  marginBottom: '0', // Remove any bottom margin
  border: 'none', // Remove borders
  borderBottom: '1px solid #555', // Add a bottom border to separate from the list
  backgroundColor: "#292b2b",
  color: '#ccc',
  fontSize: '16px',
  zIndex: 1000,
};



  return (
    <div ref={ref} style={popupContainerStyle}>
      <style>{scrollbarStyles}</style>
      <div style={rightColumnStyle} className="dark-scrollbar">
        <div style={titleStyle}>Prompts</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
  <input
    type="text"
    placeholder="Search..."
    style={searchInputStyle}
    onChange={handleSearchChange} 
  />
  <button
    style={toggleButtonStyle}
    onClick={() => setSortByRecency(!sortByRecency)}
  >
    <span style={toggleButtonTextStyle}>
      {sortByRecency ? 'Alphabetical' : 'Recency'}
    </span>
  </button>
</div>
        <style>{scrollbarStyles}</style> {/* Include this if not already present */}
        
        <div style={listContainerStyle} className="dark-scrollbar">
        

  {displayedPrompts.map((prompt, index) => {
  // Extract and format parameters
  const params = prompt.parameters ? Object.keys(prompt.parameters) : [];
  const paramsString = params.length > 0 ? `(${params.join(', ')})` : '';

  // Combine name and parameters for display
  const displayName = `${prompt.name}${paramsString}`;

  return (
        <div 
        key={index}
        style={listItemStyle(index)}
        onMouseEnter={() => setHoverIndex(index)}
        onMouseLeave={() => setHoverIndex(null)}
        onClick={() => handlePromptClick(prompt)}
      >
            {displayName}
        </div>);}
    )}
</div>

      </div>
      <div style={{ flex: 2, padding: '20px' }}>
        <div style={titleStyle}>Configuration</div>
        <div style={subtitleStyle}>Name</div>
        <input
          type="text"
          placeholder="Prompt Name"
          value={promptName}
          onChange={handleNameChange}
          style={{ ...textareaStyles, marginBottom: '10px' }}
        />
        <style>{scrollbarStyles}</style>
        <div style={subtitleStyle}>Prompt</div>
        <TextareaAutosize
          minRows={3}
          maxRows={5}
          placeholder="Prompt Content"
          className="dark-scrollbar"
          style={{... textareaStyles, width: '85%'}}
          value={inputValue}
          onChange={handleInputChange}
        />
        {parsedParameters.map((param, index) => (
          <div key={index}>
            <label>{param}: </label>
            <input
              type="text"
              value={parameters[param] || ""}
              onChange={(e) => handleParameterChange(param, e.target.value)}
              style={textareaStyles}
            />
          </div>
        ))}
        <div style={buttonsContainerStyle}>
    <Button onClick={handleSavePromptWithParameters} style={buttonStyles}>
      Save Prompt
    </Button>
    <Button onClick={() => onSend(inputValue)} style={buttonStyles}>
      Send
    </Button>
    <Button onClick={() => onSendWithContext(inputValue)} style={buttonStyles}>
      Send with Context
    </Button>
    <Button onClick={onClose} style={buttonStyles}>
      Close
    </Button>
  </div>
      </div>
      {showConfirmOverwrite && (
        <div style={confirmOverwriteStyle}>
          <p>Do you want to overwrite this prompt?</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={() => handleOverwriteConfirmation(true)} autoFocus style={buttonStyles}>
              Yes
            </Button>
            <Button onClick={() => handleOverwriteConfirmation(false)} style={buttonStyles}>
              No
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  
});

const confirmOverwriteStyle = {
  // Style for the confirm overwrite popup
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#212121",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  zIndex: 1000,
  // Add more styling as needed
};



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
 * - `sendMessageOnly`: Sends a new message and updates the tree structure without a bot response.
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

  const [prompts, setPrompts] = useState([]); // State to store user prompts

  // Load prompts from a file or initialize an empty array
  useEffect(() => {
    // Fetch prompts from a file or other source
    // setPrompts(fetchedPrompts);
  }, []);
  const [lockSettings, setLockSettings] = useState(false);

  const [settings, setSettings] = useState({
    'Use Api': false,
    'Update Context on Send': true,
    'Toggle Miniview': true,
    'Toggle PDF Viewer': true,
  });

  

  const updateSetting = (setting, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [setting]: value
    }));
  };

  const [pdfs, setPdfs] = useState([]);
  const [textareaHeight, setTextareaHeight] = useState(0);

  const readmeContent = `
  ## Chatbot UI Hotkeys and Commands

  ### Navigation Hotkeys
  - **Arrow Up**: Navigate to the parent message in the tree.
  - **Arrow Down**: Navigate to the first child message in the tree.
  - **Arrow Left**: Navigate to the left sibling message.
  - **Arrow Right**: Navigate to the right sibling message.
  - **Ctrl + Arrow Up**: Navigate to the next parent message with branching children.
  - **Ctrl + Arrow Down**: Navigate down to a leaf message (no children).
  
  ### Message Interaction
  - **Enter**: Send the message in the input field and receive a bot response.
  - **Shift + Enter**: Add a newline in the message input field (multi-line input).
  - **Ctrl + Enter**: Send a message without triggering a bot response.
  
  ### Command Functionality
  - **!help**: Displays the help popup with a list of commands.
  - **!settings**: Toggles the visibility of the settings popup.
  
  ### Additional Features
  - **MiniView Focus**: Click the "Focus" button to center and zoom the MiniView on the tree of messages.
  - **Predictive Commands**: As the user types, suggested commands appear based on input. Users can select a command with Tab, Alt + Enter, or mouse click.
  - **Settings Popup**: Access settings to toggle features like 'Use Api', 'Update Context on Send', 'Toggle MiniView', and 'Toggle PDF Viewer'.
  
  ### PDF Interaction
  - **Uploading PDFs**: Users can upload PDF documents to interact with the chatbot contextually.
  - **Viewing PDFs**: Uploaded PDFs can be viewed and selected for extracting text to influence chatbot responses.
  - **PDF Page Selection**: 
    - Click and drag to select multiple pages.
    - Ctrl + click and drag to select or deselect individual pages.
  
`;

const [showHelpPopup, setShowHelpPopup] = useState(false);
const helpPopupRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (helpPopupRef.current && !helpPopupRef.current.contains(event.target)) {
      setShowHelpPopup(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

const handleHelpCommand = () => {
  setShowHelpPopup(true);
};



const HelpPopup = React.forwardRef(({ onClose, content }, ref) => {
  return (
    <div ref={ref} style={popupStyle}>
      <ReactMarkdown>{content}</ReactMarkdown>
      <Button onClick={onClose} style={closeButtonStyle}>Close</Button>
    </div>
  );
});


// Define styles for popupStyle and closeButtonStyle

  

  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target) && !lockSettings && showSettings) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [lockSettings, showSettings]);

  const [showPromptPopup, setShowPromptPopup] = useState(false);
  const promptPopupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (promptPopupRef.current && !promptPopupRef.current.contains(event.target)) {
        setShowPromptPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePromptCommand = () => {
    setShowPromptPopup(true);
  };

  const sendPromptMessage = async (message) => {
    console.log(message);
    // Handle sending the message
    setShowPromptPopup(false);
    
    const userMessage = MessageNode(
      currentMessage,
      incrementMessageCount,
      message,
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

    const botResponse = await BotFunctions.callApi(message, settings['Use Api'], updateBotMessage)
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
    // console.log(pdfs);
    // console.log("**********************************************************");
    setSuggestions([]);
    // ... your implementation to send the message ...
  };

  const sendPromptMessageWithContext = async (message) => {
    // Handle sending the message with context
    console.log(message);
    console.log("SDHFDSHUFOIHSDJL:FHSDJKFGHSELIUEFGKJSHDFKJl");
    setShowPromptPopup(false);
    sendMessage(message);
    // ... your implementation to send the message with context ...
  };

  const handleSettingsCommand = () => {
    setShowSettings(!showSettings); // Toggle the visibility of the settings popup
  };
  

  const commandHandlers = {
    "!help": handleHelpCommand,
    "!settings": handleSettingsCommand,
    "!prompt": handlePromptCommand,
    // Add more mappings as needed
  };
  

  const chatCommands = [
    { command: "!help", description: "Show help information" },
    { command: "!settings", description: "Show settings"},
    { command: "!prompt", description: "open prompt popup"}
    // Add more commands as needed
  ];
  

  const [suggestions, setSuggestions] = useState([]);

  

  const toggleLockSettings = (value) => {
    setLockSettings(value);
  };


  const onFileChange = (event) => {
    const newPdfs = Array.from(event.target.files).map((file) => {
      const url = URL.createObjectURL(file); // Create a URL for the file
      return {
        file: url,
        name: file.name,
        numPages: null, // Will be set when the document is loaded
        selectedPages: new Set(), // No pages selected initially
      };
    });

    // Update the state with the new PDFs
    setPdfs((prevPdfs) => [...prevPdfs, ...newPdfs]);
  };
  const textareaRef = useRef(null);

const updateTextareaHeight = () => {
  if (textareaRef.current) {
    setTextareaHeight(textareaRef.current.scrollHeight);
  }
};



  




  const [messageCount, setMessageCount] = useState(0);
  const incrementMessageCount = () => {
    setMessageCount((prevCount) => prevCount + 1);
  };

  const [currentMessage, setCurrentMessage] = useState(null);

  useEffect(() => {
    // Focus the textarea whenever currentMessage changes
    textareaRef.current.focus();
  }, [currentMessage]); // Dependency array includes currentMessage

  const [input, setInput] = useState("");

  // Inside your Chatbot component:
  const [messages, setMessages] = useState({
    sender: "root",
    message: "",
    children: [],
  });

  const [currentBotMessageText, setCurrentBotMessageText] = useState(null);
  const [currentBotMessage, setCurrentBotMessage] = useState(null);

  const updateBotMessage = (newData) => {
    // console.log("DATA: ", newData)
    setCurrentBotMessageText(newData);
  };

  // useEffect(() => {
  //   // Function to handle new streamed data
  //   const handleStreamedData = (newData) => {
  //     currentBotMessage.message += newData;
  //   };

  //   // Start listening to the stream
  //   const stream = startYourStream(); // Replace with your actual stream initiation
  //   stream.on('data', handleStreamedData);

  //   // Handle stream closure
  //   stream.on('end', () => {
  //     console.log("Stream ended");
  //     // Perform any cleanup or final actions here
  //   });

  //   // Cleanup function
  //   return () => {
  //     stream.off('data', handleStreamedData);
  //     stream.off('end');
  //   };
  // }, []); // Empty dependency array to run only once on mount

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
    if (settings['Update Context on Send']) {
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

  const sendMessageOnly = async () => {
    if (input === "" || input.trim() === "") return;
    const userMessage = MessageNode(currentMessage, incrementMessageCount, input, "user");
    console.log("HISHDIFHDSIHF");
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

      setContextDefault(messages, userMessage);
      setSuggestions([]);

  }

  const sendMessage = async (message = "") => {
    console.log("message: ", message);
    
    if ((input === "" || input.trim() === "") && message === "") return;

    console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");

    
    const parts = input.split(' ');
    const command = parts[0];
    const rest = parts.slice(1).join(' ');
    const args = rest.split('|').map(arg => arg.trim());

    console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");

    if (commandHandlers[command]) {
      console.log("args: ", args);
      sendCommand(command, args);
      setInput(""); // Clear the input field
      
      return; // Return early
    }

    const p = message === "" ? input : message;

    const userMessage = MessageNode(
      currentMessage,
      incrementMessageCount,
      p,
      "user"
    );
    console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");

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

    const botReply = MessageNode(
      userMessage,
      incrementMessageCount,
      " ",
      "bot"
    );
    console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    userMessage.children = [botReply];

    setCurrentBotMessage(botReply);

    setCurrentMessage(botReply);
    setContextDefault(messages, botReply);

    const botResponse = await BotFunctions.getBotReply(input, currentMessage, messages, pdfs, settings['Use Api'], updateBotMessage);
    console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    
    console.log("______________________________________________")
    console.log(botResponse);
    setCurrentBotMessageText("");
    botReply.message = botResponse;


    
    

    


    

    // Set the user's message as the current message

    

    
    // console.log(pdfs);
    // console.log("**********************************************************");
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const inputText = e.target.value.trim();
  
    // Filter commands based on the entire input text
    const filteredCommands = chatCommands.filter(cmd => 
      cmd.command.includes(inputText)
    );
    if (inputText === "") {
      setSuggestions([]);
      return;
    }
  
    setSuggestions(filteredCommands);
  };
  

  const sendCommand = (command) => {
    const commandFunction = commandHandlers[command];
    if (commandFunction) {
      commandFunction();
    } else {
      console.log(`Unknown command: ${command}`);
      // Handle unknown commands, show error message, etc.
    }
    setInput("");
    setSuggestions([]);
  };
  
  

  const handleKeyDown = (event) => {
    if (event.key === "Tab" && suggestions.length > 0) {
      event.preventDefault(); // Prevent the default tab behavior
      setFocusedIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
    } else if (event.key === "Enter" && event.altKey && focusedIndex >= 0) {
      event.preventDefault();
      sendCommand(suggestions[focusedIndex].command); // Implement sendCommand
    }
    else if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();  // Prevent the default action (newline) for Enter key
      sendMessageOnly();
    } else if (event.key === "Enter" && event.shiftKey) {
      // Allow newline when Shift + Enter is pressed
    } else if (event.key === "Enter" && input.trim() !== "") {
      event.preventDefault();  // Prevent the default action (newline) for Enter key
      sendMessage();  // Call the updated sendMessage function
    } else if (event.key === "Tab") {
      event.preventDefault();  // Prevent the default action (tab) for Tab key
      
    }
  };
  
  const [focusedIndex, setFocusedIndex] = useState(-1); // -1 means no item is focused
  

  const PredictiveView = ({ suggestions }) => {
    
    const [hoverIndex, setHoverIndex] = useState(null); // Track which item is being hovered

    const predictiveViewStyle = {
      position: 'absolute',
      bottom: `${textareaHeight + 10}px`, // 10px is additional spacing; adjust as needed
      left: '0',
      width: '33%',
      backgroundColor: '#333', // Dark background
      color: '#fff', // Light text for contrast
      border: '1px solid #555', // Slight border for definition
      borderRadius: '4px', // Rounded corners
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)', // Subtle shadow for depth
      zIndex: 1000, // Ensure it's above other elements
      overflow: 'hidden', // In case of too many suggestions
      maxHeight: '200px', // Limit the height
    };
    
    const predictiveViewItemStyle = {
      userSelect: 'none',
      padding: '10px 15px',
      cursor: 'pointer',
      borderBottom: '1px solid #555', // Separator between items
      textAlign: 'left', // Align text to the left
      '&:hover': {
        backgroundColor: '#484848', // Slight change on hover for interactivity
      }
    };
  
    const predictiveViewItemHoverStyle = {
      ...predictiveViewItemStyle,
      backgroundColor: '#484848', // Slight change on hover for interactivity
    };
  
    const getPredictiveViewItemStyle = (index) => ({
      ...predictiveViewItemStyle,
      backgroundColor: index === focusedIndex ? '#484848' : 'transparent',
    });
  
    const handleClick = (command) => {
      sendCommand(command);
    };
  
    return (
      <div style={predictiveViewStyle}>
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            style={hoverIndex === index ? predictiveViewItemHoverStyle : getPredictiveViewItemStyle(index)}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => handleClick(suggestion.command)} // Handle click on suggestion
          >
            {suggestion.command} - {suggestion.description}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    updateTextareaHeight();
  }, [textareaHeight]); // Dependency array includes textareaHeight

  const isMiniViewActive = settings['Toggle Miniview'];
const isPdfViewerActive = settings['Toggle PDF Viewer'];

// Container style for MiniView and PDF Viewer
const miniViewPdfViewerContainerStyle = {
  flex: isMiniViewActive && isPdfViewerActive ? 2 : (isMiniViewActive || isPdfViewerActive ? 2 : 0),
  display: 'flex',
  flexDirection: 'column',
};


// Include the rest of your README content here


  
  

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
      {showPromptPopup && (
        <PromptPopup
          ref={promptPopupRef}
          prompts={prompts}
      setPrompts={setPrompts}
          onSend={sendPromptMessage}
          onSendWithContext={sendPromptMessageWithContext}
          onClose={() => setShowPromptPopup(false)}
        />
      )}
      {!lockSettings && showSettings && (
        <SettingsPopup
          ref={settingsRef}
          settings={settings}
          updateSetting={updateSetting}
          toggleLockSettings={toggleLockSettings}
          isLocked={lockSettings}
        />
      )}
      {showHelpPopup && (
      <HelpPopup
        ref={helpPopupRef}
        content={readmeContent}
        onClose={() => setShowHelpPopup(false)}
      />
    )}
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
                    flex: 2, // Adjust the flex value
                    
        marginRight: "2%",
                    margin: "0 10px", // Add some margin
                    overflowY: "auto",
                    paddingBottom: "3%",
                    
                  }}
                >
              <ChatComponent currentMessage={currentMessage} currentBotMessage={currentBotMessage} increment = {incrementMessageCount} currentBotText={currentBotMessageText} wide={settings['Toggle Miniview'] || settings['Toggle PDF Viewer']}/>

              
            </div>

            

            <div style={{... miniViewPdfViewerContainerStyle}} className="dark-scrollbar">
              <div style={{flex: 1, overflowY: 'auto' }}>
                {/* Pass the lifted state and handler as props to PdfViewerComponent */}
                {settings['Toggle PDF Viewer'] && (
                <div style={{...svgStyles, maxHeight: '21.375vh', overflowY: 'auto' }} className="dark-scrollbar">
                  <PdfViewerComponent pdfs={pdfs} setPdfs={setPdfs} onFileChange={onFileChange} />
                </div>
              )}
              </div>
              {settings['Toggle Miniview'] && (
              <div style={{ flex: 3}} className="dark-scrollbar">
                <MiniView
                  messages={messages}
                  setCurrentMessage={setCurrentMessage}
                  increment={messageCount}
                  current={currentMessage}
                  setInc={incrementMessageCount}
                />
              </div>
              )}
            </div>
              <div
                  style={{
                    position: "fixed",
                    bottom: "5%",
                    left: "10%",
                    width: "80vw",
                    display: "flex",
                    justifyContent: lockSettings ? 'space-between' : 'center',
                    alignItems: "flex-end",
                    flexDirection: 'row',
                  }}
                >
                  {suggestions.length > 0 && <PredictiveView suggestions={suggestions} />}
                  <TextareaAutosize
                    ref={textareaRef}
                    minRows={1}
                    maxRows={10}
                    style={{...textareaStyles, marginTop: suggestions.length > 0 ? '210px' : '10px'}}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onInput={updateTextareaHeight}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={sendMessage}
                    style={buttonStyles}
                  >
                    Send
                  </Button>
                  {lockSettings && showSettings && (
              <SettingsPopup
                ref={settingsRef}
                settings={settings}
                updateSetting={updateSetting}
                toggleLockSettings={toggleLockSettings}
                isLocked={lockSettings}
              />
            )}
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
