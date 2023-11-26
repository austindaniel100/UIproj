import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, TextareaAutosize } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import BotFunctions from "./botReplyHandler";
import ChatComponent from "./ChatComponent";
import PdfViewerComponent from "./PdfComponent";
import SettingsPopup from './SettingsPopup'; // Adjust the path as per your file structure
import SideNavBar from './SideNavBar';


import * as d3 from "d3";
const inputStyle = {
  width: '100%',
  padding: '10px 15px',
  marginBottom: '10px',
  border: '1px solid #555',
  borderRadius: '4px',
  backgroundColor: "#222",
  color: '#ccc',
};
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
  color: "#ccc", // Include the hash symbol before the color code
  border: "none",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "500",
  letterSpacing: "0.5px",
  zIndex: 1000,
  transition: "all 0.2s",
  boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
  margin: "8px 0",
  "&:focus": {
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)",
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

function MiniView({ messages, setCurrentMessage, increment, current, setInc, setTokenCount, input, currentMessage, pdfs }) {
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

  useEffect(() => {
    
  }, []);
  

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
      .attr("stroke", (d) => (d.data.id === current?.id ? "#ccc" : "none"))
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
    BotFunctions.getContextTokens(currentMessage, messages, pdfs).then((tokens) => {
      setTokenCount(tokens + Math.ceil(input.length / 4));
    });
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

    handleFocusClick();


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



const toggleButtonTextStyle = {
  margin: 0,
  paddingLeft: '5px',
  paddingRight: '5px',
};


const parametersColumnStyle = {
  flex: 1,
  marginRight: '5px', // Add some spacing between the columns
};

const dataStringsColumnStyle = {
  flex: 1,
  marginLeft: '5px', // Add some spacing between the columns
};



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
const rightColumnContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
};


const buttonsContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between', // Evenly spaces buttons
  marginTop: '20px',
};




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



const PromptPopup = React.forwardRef(({ onClose, onSend, onSendWithContext, prompts = [], setPrompts, savePromptsToServer, dataStrings, setDataStrings, initialDataStrings = []}, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [promptName, setPromptName] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  const [parameters, setParameters] = useState({});
  const [parsedParameters, setParsedParameters] = useState([]);

  const [searchInput, setSearchInput] = useState("");

  const [hoverIndex, setHoverIndex] = useState(null); // State to track hovered item

  const [sortByRecency, setSortByRecency] = useState(false); // false for alphabetical, true for recency

  const [promptToDelete, setPromptToDelete] = useState(null);
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

const updateDataString = (name, value) => {
  setDataStrings(prevStrings => prevStrings.map(ds => ds.name === name ? { ...ds, content: value } : ds));
};

const convertArrayToDict = (dataArray) => {
  const dict = {};
  dataArray.forEach(item => {
    if(item.name) {
      dict[item.name] = item.content;
    }
  });
  return dict;
};

const initialDict = convertArrayToDict(initialDataStrings);
  const [dataStringDict, setDataStringDict] = useState(initialDict);

  const updateDataStringDict = (input) => {
    const regex = /\[([^\]]+)\]/g;
    let match;

    const newDataStringDict = { ...dataStringDict };

    while ((match = regex.exec(input)) !== null) {
      if (!newDataStringDict.hasOwnProperty(match[1])) {
        newDataStringDict[match[1]] = ""; // Add new empty string entry if not exist
      }
    }

    setDataStringDict(newDataStringDict);
  };

  // Call this function when inputValue changes
  useEffect(() => {
    updateDataStringDict(inputValue);
  }, [inputValue]);

const confirmDelete = (confirm) => {
  if (confirm) {
    // Code to delete the prompt
    setPrompts(prompts.filter(p => p.name !== promptToDelete.name));
  }
  setShowDeleteConfirmation(false);
};


const handleDeletePrompt = (prompt) => {
  setPromptToDelete(prompt);
  setShowDeleteConfirmation(true);
  savePromptsToServer();
};

const handleMessageSend = () => {
  let finalMessage = inputValue;

  // Replace parameter placeholders
  Object.keys(parameters).forEach(param => {
    const regex = new RegExp(`{${param}}`, 'g');
    finalMessage = finalMessage.replace(regex, parameters[param]);
  });

  // Replace data string placeholders
  finalMessage = finalMessage.replace(/\[(\w+)\]/g, (match, dataStringName) => {
    const dataString = dataStrings.find(d => d.name === dataStringName);
    return dataString ? dataString.content : match; // Replace with content or leave placeholder
  });

  onSend(finalMessage); // Send the final message
};



  const handleMessageSendContext = () => {
    let finalMessage = inputValue;
  
    // Replace each placeholder with its corresponding parameter value
    Object.keys(parameters).forEach(param => {
      const regex = new RegExp(`{${param}}`, 'g');
      finalMessage = finalMessage.replace(regex, parameters[param]);
    });
  
    // Now send this finalMessage
    onSendWithContext(finalMessage);
  };
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
  
    // Clear parameters if no placeholders are present in the input
    if (!/{\w+}/.test(event.target.value)) {
      setParameters({});
    }
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

  useEffect(() => {
    // Function to convert array to dictionary
    const convertArrayToDict = (dataArray) => {
      const dict = {};
      dataArray.forEach(item => {
        if (item.name) {
          dict[item.name] = item.content;
        }
      });
      return dict;
    };
  
    // Update the dictionary whenever the dataStrings array changes
    const newDict = convertArrayToDict(dataStrings);
    setDataStringDict(newDict);
  
  }, [dataStrings]); // Dependency array includes dataStrings to trigger effect when it changes
  
  

  const saveNewPrompt = () => {
    const newPrompt = { name: promptName, content: inputValue, parameters };
    setPrompts(prevPrompts => [...prevPrompts, newPrompt]);
    savePromptsToServer();
    // Removed resetForm call to maintain the current state of the form
  };

  const handleOverwriteConfirmation = (overwrite) => {
    if (overwrite) {
      const updatedPrompts = prompts.map(p => 
        p.name === overwritePromptName ? { ...p, content: inputValue, parameters } : p
      );
      setPrompts(updatedPrompts);
      savePromptsToServer();
    }
    setShowConfirmOverwrite(false);
    // resetForm();
  };

  const parseDataStringReferences = (input) => {
    const regex = /\[([^\]]+)\]/g;
    const dataStringRefs = new Set();
    let match;
  
    while ((match = regex.exec(input)) !== null) {
      if (dataStringDict[match[1]]) {
        dataStringRefs.add(match[1]);
      }
    }
    console.log("datastringdict: ", dataStringDict);
  
    console.log("Parsed References: ", Array.from(dataStringRefs)); // Debugging log
    return Array.from(dataStringRefs);
  };
  
  // Remember to check this every time inputValue changes.
  
  
  // Inside PromptPopup component
  // const [inputValue, setInputValue] = useState(""); // Assuming this is the state for your input
  const dataStringRefs = useMemo(() => parseDataStringReferences(inputValue), [inputValue, dataStringDict]);

  const handleDataStringChange = (dataStringName, value) => {
    setDataStringDict(prevDict => ({ ...prevDict, [dataStringName]: value }));
  };
  
  const renderDataStringInputs = () => {
    const regex = /\[([^\]]+)\]/g;
    let match;
    const dataStringInputs = [];
    while ((match = regex.exec(inputValue)) !== null) {
      if (dataStrings.some(d => d.name === match[1])) {
        const dataStringName = match[1]; // Store the matched name
  
        dataStringInputs.push(
          <div key={dataStringName} onClick={() => dataStringName && openPopup(dataStringName)}>
            <label>{dataStringName}: </label>
            <input
              type="text"
              value={dataStringDict[dataStringName] || ''}
              onChange={(e) => handleDataStringChange(match[1], e.target.value)}
              style={textareaStyles}
              readOnly
            />
          </div>
        );
      }
  
    }
  
    return dataStringInputs;
  };

  const DataStringPopup = ({ isOpen, onClose, onSave, initialValue }) => {
    const [inputValue, setInputValue] = useState(initialValue);
  
    useEffect(() => {
      setInputValue(initialValue); // Update input value when initialValue changes
    }, [initialValue]);
  
    const handleSave = () => {
      onSave(inputValue);
      onClose();
    };
  
    if (!isOpen) return null;
  
    return (
      <div style={{...popupStyle, display: 'flex', justifyContent: 'center'}} onClick={onClose}>
        <div style={{...popupContentStyle, width: '600px', maxWidth: '90%', height: '1200px', display: 'flex', justifyContent: 'flex-start', flexDirection: 'column',flexWrap: 'wrap', wordBreak: 'break-word'}} onClick={e => e.stopPropagation()}>
          <div style={{...titleStyle, marginBottom: '20px'}}>Edit Data String</div>
          <div className='dark-scrollbar'>
          <style>{scrollbarStyles}</style>
          
          <TextareaAutosize
            minRows={13}
            maxRows={13}
            value={inputValue}
            className='dark-scrollbar'
            onChange={(e) => setInputValue(e.target.value)}
            style={{...textareaStyles, width: '85%', height: '75%'}}
          />
          </div>
          
          <div style={{display: 'flex', justifyContent: 'center', marginTop: '10px'}}>
            <button onClick={handleSave} style={buttonStyles}>Save</button>
            <button onClick={onClose} style={buttonStyles}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false);
const [currentDataString, setCurrentDataString] = useState('');

const openPopup = (dataStringName) => {
  setCurrentDataString(dataStringName);
  setIsPopupOpen(true);
};
  
  




  
  // const resetForm = () => {
  //   setPromptName("");
  //   setInputValue("");
  //   setParameters({});
  //   setOverwritePromptName("");
  // };

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

  
// Modify listItemStyle to serve as a container style
const listItemContainerStyle = (index) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: hoverIndex === index ? "#484848" : "#333",
  padding: '10px 15px',
  cursor: 'pointer',
  borderBottom: "1px solid #555",
  });
  
  // Inline style for delete button, visibility controlled by hover
  const deleteButtonStyle = (index) => ({
  display: hoverIndex === index ? 'block' : 'none',
  cursor: 'pointer',
  color: '#ccc',
  marginLeft: '10px',
  });
  const labelStyle = {
    fontWeight: 'bold',
    marginBottom: '5px',
  };

  const handleSaveDataString = (updatedValue) => {
    const updatedDataStrings = dataStrings.map(ds => {
      if (ds.name === currentDataString) {
        return { ...ds, content: updatedValue };
      }
      return ds;
    });
  
    setDataStrings(updatedDataStrings);
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
  const params = prompt.parameters ? Object.keys(prompt.parameters) : [];
  const paramsString = params.length > 0 ? `(${params.join(', ')})` : '';
  const displayName = `${prompt.name}${paramsString}`;

  return (
    <div 
      key={index}
      style={listItemContainerStyle(index)}
      onMouseEnter={() => setHoverIndex(index)}
      onMouseLeave={() => setHoverIndex(null)}
      onClick={() => handlePromptClick(prompt)}
    >
      <div>
        {displayName}
      </div>
      <div
        style={deleteButtonStyle(index)}
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering prompt click
          handleDeletePrompt(prompt);
        }}
        title="Delete this prompt"
      >
        X
      </div>
    </div>
  );
})}


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
        <div style={rightColumnContainerStyle}>
      <div style={parametersColumnStyle}>
        <div style={labelStyle}>Parameters</div>
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
      </div>
      <div style={dataStringsColumnStyle}>
    <div style={labelStyle}>Data Strings</div>
    {renderDataStringInputs()}
  </div>
  </div>
            <div style={buttonsContainerStyle}>
              <Button onClick={handleSavePromptWithParameters} style={buttonStyles}>
                Save Prompt
              </Button>
              <Button onClick={handleMessageSend} style={buttonStyles}>
                Send
              </Button>
              <Button onClick={handleMessageSendContext} style={buttonStyles}>
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
      {showDeleteConfirmation && (
  <div style={confirmDeleteStyle}>
    <p>Are you sure you want to delete {promptToDelete.name} prompt?</p>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Button onClick={() => confirmDelete(true)} autoFocus style={buttonStyles}>
        Yes
      </Button>
      <Button onClick={() => confirmDelete(false)} style={buttonStyles}>
        No
      </Button>
    </div>
  </div>
)}
<DataStringPopup
  isOpen={isPopupOpen}
  onClose={() => setIsPopupOpen(false)}
  onSave={(value) => updateDataString(currentDataString, value)}
  initialValue={dataStrings.find(ds => ds.name === currentDataString)?.content || ''}
/>
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

const confirmDeleteStyle = {
  ... confirmOverwriteStyle,
};


const DataPopup = React.forwardRef(({ onClose, onDataSave, dataStrings = [], setDataStrings, setSystemPrompt, systemPrompt = "" }, ref) => {
  const [inputValue, setInputValue] = useState("");
  const [dataName, setDataName] = useState("");
  const [selectedData, setSelectedData] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [displayedData, setDisplayedData] = useState(dataStrings);

  useEffect(() => {
    console.log('DataStrings:', dataStrings);
    // Filter data strings based on search input and update displayed data
    const filteredData = dataStrings.filter(data => 
      data.name.toLowerCase().includes(searchInput.toLowerCase())
    );
    setDisplayedData(filteredData);
  }, [searchInput, dataStrings]); 

  
  const handleDataStringChange = (index, key, value) => {
    setDataStrings((prevDataStrings) => {
      const newDataStrings = [...prevDataStrings];
      newDataStrings[index][key] = value;
      return newDataStrings;
    });
  };
  const handleSetSystemPrompt = () => {
    const data = { name: dataName, content: inputValue };
    setSystemPrompt("\n\n# SYSTEM PROMPT:\n\n" + data.content + ":\n\n");
  };
  

  const handleDataSave = () => {
    const newData = { name: dataName, content: inputValue };
    const existingDataIndex = dataStrings.findIndex(d => d.name === dataName);
  
    console.log('Before Save:', dataStrings); // Log the data before save/update operation
  
    if (existingDataIndex !== -1) {
      // Update existing data
      const updatedDataStrings = [...dataStrings];
      updatedDataStrings[existingDataIndex] = newData;
      setDataStrings(updatedDataStrings);
      console.log('Updated Data:', updatedDataStrings); // Log the data after update
    } else {
      // Add new data
      const newDataStrings = [...dataStrings, newData];
      setDataStrings(newDataStrings);
      console.log('Added New Data:', newDataStrings); // Log the data after new addition
    }
  
    onDataSave(newData); // Optional, can be used for additional side effects
  };
  

  const [hoverIndex, setHoverIndex] = useState(null); // State to track hovered item

  const handleDataSelect = (data) => {
    setDataName(data.name);
    setInputValue(data.content);
  };

  const handleDataDelete = (dataToDelete) => {
    setDataStrings(dataStrings.filter(d => d.name !== dataToDelete.name));
    // Additional actions if needed
  };

  


  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };



  const leftColumnStyle = {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '400px',
    borderRight: '1px solid #555',
    padding: '10px',
    backgroundColor: '#2C2F33', // Dark background for contrast
    color: '#ecf0f1', // Light text for readability
  };
  
  const listItemContainerStyle = (data, index) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: systemPrompt?.includes(data.content) ? "#4d4000" : (hoverIndex === index ? "#484848" : "#333"),

    padding: '10px 15px',
    color: 'ccc',
    cursor: 'pointer',
    borderBottom: "1px solid #555",
  });

  const goldButtonStyle = {
    ...buttonStyles,
    backgroundColor: "#4d4000", // Gold color for the button
    color: '#ccc', // Dark text for contrast 
    // Other styling as needed
  };

  const deleteButtonStyle = (index) => ({
    display: hoverIndex === index ? 'block' : 'none',
    cursor: 'pointer',
    color: '#ccc',
    marginLeft: '10px',
  });
  
  
  

  return (
    <div ref={ref} style={popupContainerStyle}>
      <div style={listContainerStyle} className="dark-scrollbar">
      <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={handleSearchChange}
          style={searchInputStyle}
        />
        {
  displayedData.map((data, index) => (
    <div 
      key={`${data.name}-${index}`} // Unique key for each item
      style={listItemContainerStyle(data, index)}
      onMouseEnter={() => setHoverIndex(index)}
      onMouseLeave={() => setHoverIndex(null)}
      onClick={() => handleDataSelect(data)}
    >
      <div>{data.name}</div>
      <div
        style={deleteButtonStyle(index)}
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering data select
          handleDataDelete(data);
        }}
        title="Delete this data"
      >
        X
      </div>
    </div>
  ))
}

      </div>
      
      
      <div style={{ ...detailSectionStyle, background: 'transparent' }}>
      <div style={subtitleStyle}>Name</div>
        <input
          type="text"
          placeholder="Data Name"
          value={dataName}
          onChange={(e) => setDataName(e.target.value)}
          style={{ ...textareaStyles, width: '30%', height: '100%'}}
        />
      <div style={subtitleStyle}>Data</div>
      <style>{scrollbarStyles}</style>
        <TextareaAutosize
        className="dark-scrollbar"
          minRows={3}
          maxRows={5}
          placeholder="Data Content"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{...textareaStyles, width: '85%', height: '100%'}}
        />
        <div style={{ display: 'flex', gap: '10px' }}> {/* Added for horizontal layout */}
        <Button onClick={handleDataSave} style={buttonStyles}>Save Data</Button>
        <Button onClick={handleSetSystemPrompt} style={goldButtonStyle}>Set System Prompt</Button>
      </div>

      </div>
    </div>
  );
});







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
  const [tokenCount, setTokenCount] = useState(0);
  const [tokenTotal, setTokenTotal] = useState(4096);

  

  const [dataStrings, setDataStrings] = useState([]); // Initialize with an empty array or fetched data

  const [systemPrompt, setSystemPrompt] = useState("");

  const saveData = async (data) => {
    try {
      const response = await fetch('http://localhost:3001/api/saveData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Error saving data');
      }
      const result = await response.text();
      console.log(result);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const loadData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/loadData');
      if (!response.ok) {
        throw new Error('Error loading data');
      }
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('Failed to load data:', error);
      return [];
    }
  };
  useEffect(() => {
    // This checks if dataStrings is not empty before saving
    if (dataStrings.length > 0) {
      const saveDataToServer = async () => {
        await saveData(dataStrings);
      };
      saveDataToServer();
    }
  }, [dataStrings]); // Dependency array - useEffect triggers when dataStrings changes
  
  

  useEffect(() => {
    const fetchDataStrings = async () => {
      const fetchedData = await loadData();
      setDataStrings(fetchedData);
      // Implement fetching logic here
      // const fetchedData = await yourFetchFunction();
      // setDataStrings(fetchedData);
    };
    fetchDataStrings();
  }, []);

  const handleDataSave = async (data) => {
    
    // Save data to server or local storage
    // Update the state to either add new data or update existing data
    setDataStrings(prevData => {
      const existingDataIndex = prevData.findIndex(d => d.name === data.name);
      if (existingDataIndex !== -1) {
        // Update existing data
        const updatedData = [...prevData];
        updatedData[existingDataIndex] = data;
        return updatedData;
      } else {
        // Add new data
        return [...prevData, data];
      }
    });
    
  };
  
  
  


  const [prompts, setPrompts] = useState([]); // State to store user prompts
  const [currentContextName, setCurrentContextName] = useState("");

  const pdfViewerRef = useRef();


  const savePromptsToServer = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompts),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Prompts saved successfully');
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  

  // Load prompts from a file or initialize an empty array
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/prompts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPrompts(data);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
  
    fetchPrompts();
  }, []);
  const [lockSettings, setLockSettings] = useState(false);

  const [settings, setSettings] = useState({
    'Use Api': false,
    'Update Context on Send': true,
    'Miniview': true,
    'PDF Viewer': true,
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
  - **Settings Popup**: Access settings to toggle features like 'Use Api', 'Update Context on Send', 'Miniview', and 'Toggle PDF Viewer'.
  
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

const [showDataPopup, setShowDataPopup] = useState(false);
const dataPopupRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (dataPopupRef.current && !dataPopupRef.current.contains(event.target)) {
      setShowDataPopup(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []); // Ensure the effect runs only once


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

    const botReply = MessageNode(
      userMessage,
      incrementMessageCount,
      " ",
      "bot"
    );
    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    userMessage.children = [botReply];

    setCurrentBotMessage(botReply);

    setCurrentMessage(botReply);
    setContextDefault(messages, botReply);
    setCurrentBotMessageText("");
      
    const botResponse = await BotFunctions.getBotReply(systemPrompt.content + input, currentMessage, messages, pdfs, settings['Use Api'], updateBotMessage);
    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    
    // console.log("______________________________________________")
    // console.log(botResponse);
    setCurrentBotMessageText("");
    botReply.message = botResponse;

    setSuggestions([]);

  };

  const sendPromptMessageWithContext = async (message) => {
    // Handle sending the message with context
    console.log(message);
    // console.log("SDHFDSHUFOIHSDJL:FHSDJKFGHSELIUEFGKJSHDFKJl");
    setShowPromptPopup(false);
    sendMessage(message);
    // ... your implementation to send the message with context ...
  };

  const handleSettingsCommand = () => {
    setShowSettings(!showSettings); // Toggle the visibility of the settings popup
  };

  const handleSoloCommand = () => {
    // Toggle the visibility of the other components
    setShowSettings(false);
    setShowPromptPopup(false);
    setShowHelpPopup(false);
    setSettings(prevSettings => ({
      ...prevSettings,
      'Miniview': false, // Replace 'newValue' with the desired value
      'PDF Viewer': false // Replace 'newValue' with the desired value
    }));
  };

  const handleToggleCommand = (input) => {
    console.log("Toggle: ", input);
    const settingsList = ['Lock Settings', 'Use Api', 'Miniview', 'PDF Viewer', 'Update Context on Send'];
    let matchedSetting = null;

    // First, try matching the input with the start of the first word of each setting
    settingsList.forEach(setting => {
      const firstWordRegex = new RegExp('^' + setting.split(' ')[0].toLowerCase(), 'i');
      if (firstWordRegex.test(input)) {
        if (!matchedSetting || setting.length < matchedSetting.length) {
          matchedSetting = setting;
        }
      }
    });
  
    // If no match found, try matching the input with the start of any word in each setting
    if (!matchedSetting) {
      settingsList.forEach(setting => {
        const anyWordRegex = new RegExp('\\b' + input.toLowerCase(), 'i');
        if (anyWordRegex.test(setting.toLowerCase())) {
          if (!matchedSetting || setting.length < matchedSetting.length) {
            matchedSetting = setting;
          }
        }
      });
    }
  
    if (matchedSetting) {
      if (matchedSetting === 'Lock Settings') {
        toggleLockSettings(!lockSettings);
        return 'Settings locked';
      }
      // Toggle the matched setting
      setSettings(prevSettings => ({
        ...prevSettings,
        [matchedSetting]: !prevSettings[matchedSetting]
      }));
      return `Toggled ${matchedSetting}`;
    } else {
      return 'No matching setting found';
    }
  };

  const uploadPdf = async (pdf) => {
    console.log("Uploading PDF", pdf)
  
    const response = await fetch('http://localhost:3001/api/uploadPdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64Pdf: pdf.file.split(',')[1], fileName: pdf.fileName }),
  });
  
    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }
  
    return await response.json(); // Expecting a response with file reference
  };
  

  const clearContext = async () => {
    // First, save the current context if it has a name
    if (currentContextName) {
      await saveChatContext(currentContextName);
    }
  
    // Reset the state variables to their default values
    setMessages({
      sender: "root",
      message: "",
      children: [],
    });
    setPdfs([]);
    setCurrentMessage(null);
    // Reset any other state variables here as needed
  
    // Optionally, reset the current context name if desired
    setCurrentContextName("");
  };

  
  const traverseMessages = (node) => {
    // Copy the node's data except the children
    const nodeCopy = { sender: node.sender, message: node.message, children: [] };
  
    // Recursively handle the children
    if (node.children && node.children.length > 0) {
      nodeCopy.children = node.children.map(child => traverseMessages(child));
    }
  
    return nodeCopy;
  };
  
  
  const saveChatContext = async (contextName) => {
    console.log("Saving context", contextName);
  
    // Function to recursively serialize the message nodes, including the inContext property
    const serializeMessageNodes = (node, parentId = null) => {
      const serializedNode = {
        id: node.id,
        message: node.message,
        sender: node.sender,
        row: node.row,
        col: node.col,
        inContext: node.inContext,
        parentId: parentId, // Save the parent's ID
        children: node.children.map(child => serializeMessageNodes(child, node.id))
      };
      return serializedNode;
    };
  
    // Serialize the message tree
    let serializedMessages = serializeMessageNodes(messages);

    try {
      // Map over the 'pdfs' and upload each PDF while preserving its properties
      const pdfFileReferences = await Promise.all(pdfs.map(async (pdf) => {
        // Upload the PDF and get the file URL
        const uploadedPdfReference = await uploadPdf(pdf);
  
        // Combine the uploaded PDF reference with the additional properties
        return {
          fileUrl: uploadedPdfReference.fileUrl, // This is the URL from the upload response
          fileName: pdf.fileName, // Preserving the original fileName
          numPages: pdf.numPages, // Preserving the number of pages
          selectedPages: Array.from(pdf.selectedPages) // Preserving the selected pages
        };
      }));
  
      const chatContext = {
        messageTree: serializedMessages,
        pdfFileReferences, // Array of file references with all necessary properties
        contextName,
      };
  
      // Sending the chat context to the server
      const response = await fetch('http://localhost:3001/api/saveContext', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatContext),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save chat context');
      }
  
      const responseData = await response.text();
      console.log('Chat context saved successfully', responseData);
    } catch (error) {
      console.error('Error saving chat context:', error);
    }
  };
  
  const loadChatContext = async (contextName) => {
    console.log("Loading context", contextName);
    try {
      const response = await fetch(`http://localhost:3001/api/loadContext/${contextName}`);
      if (!response.ok) {
        throw new Error(`Error loading chat context '${contextName}': ${response.statusText}`);
      }
  
      const chatContext = await response.json();
      const { messageTree, pdfFileReferences } = chatContext;
  
      const pdfs = await Promise.all(pdfFileReferences.map(async (fileRef) => {
        const response = await fetch(fileRef.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${fileRef.fileUrl}`);
        }
        const blob = await response.blob();
  
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ file: e.target.result, numPages: fileRef.numPages, selectedPages: new Set(fileRef.selectedPages || []), fileName: fileRef.fileName });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }));

      console.log("PDFS: ", pdfs);
  
      // Update state with PDF data
      setPdfs(pdfs);
    
      // Function to recursively rebuild the message nodes with correct references
      const rebuildMessageNodes = (node, allNodes, parent = null) => {
        const newNode = MessageNode(
          parent, // Set the parent
          null,
          node.message,
          node.sender,
          node.row,
          node.col,
          node.inContext
        );
        newNode.id = node.id; // Preserve the original ID
        newNode.children = (node.children || []).map(childId => rebuildMessageNodes(allNodes[childId], allNodes, newNode));
        return newNode;
      };
  
      // Rebuild the message tree
      let allNodes = {};
      const addAllNodes = (node) => {
        allNodes[node.id] = { ...node, children: node.children.map(child => child.id) };
        node.children.forEach(addAllNodes);
      };
      addAllNodes(messageTree);
  
      let rebuiltMessageTree = rebuildMessageNodes(allNodes[messageTree.id], allNodes);
  
      // Now rebuiltMessageTree is the root of your message tree
      setMessages(rebuiltMessageTree);
  
      // Find the last leaf node in the message tree
      let lastLeaf = rebuiltMessageTree;
      while (lastLeaf.children && lastLeaf.children.length > 0) {
        lastLeaf = lastLeaf.children[lastLeaf.children.length - 1];
      }
  
      // Update currentMessage and currentBotMessage
      setCurrentMessage(lastLeaf);
      // if (lastLeaf.sender === "bot") {
      //   setCurrentBotMessage(lastLeaf);
      // } else {
      //   setCurrentBotMessage(null);
      // }
  
      console.log(`Chat context '${contextName}' loaded successfully`);
    } catch (error) {
      console.error('Error loading chat context:', error);
    }
  };

  function getClosestPDFCommand(inputCommand, commandList) {
    console.log("inputCommand: ", inputCommand);
    let closestMatch = null;
    let closestMatchLengthDifference = Infinity;

    commandList.forEach(cmdObj => {
        const commandName = cmdObj.command;
        if (commandName.startsWith(inputCommand)) {
            const lengthDifference = commandName.length - inputCommand.length;
            if (lengthDifference < closestMatchLengthDifference) {
                closestMatch = cmdObj.command;
                closestMatchLengthDifference = lengthDifference;
            }
        }
    });

    return closestMatch;
}

function getClosestPDFFileName(inputName, pdfNames) {
  console.log("inputName: ", inputName);
  let closestMatch = null;
  let highestMatchScore = -1;

  pdfNames.forEach(pdfName => {
      let matchScore = 0;

      // Check if the first letter matches
      if (pdfName.toLowerCase().startsWith(inputName.toLowerCase()[0])) {
          matchScore += 10; // Higher score for first letter match

          // Check if the input is a substring of the pdf name
          if (pdfName.toLowerCase().includes(inputName.toLowerCase())) {
              matchScore += 5; // Add score for substring match
          }

          // Additional logic for multi-word inputs
          const inputWords = inputName.toLowerCase().split(/\s+/);
          if (inputWords.length > 1) {
              const pdfWords = pdfName.toLowerCase().split(/\s+/);
              for (let i = 1; i < inputWords.length; i++) {
                  if (pdfWords.length > i && pdfWords[i].startsWith(inputWords[i][0])) {
                      matchScore += 2; // Lower score for subsequent words' first letter match
                  }
              }
          }
      }

      if (matchScore > highestMatchScore) {
          highestMatchScore = matchScore;
          closestMatch = pdfName;
      }
  });

  return closestMatch;
}

function parsePageSelection(input) {
  // Check if the input is empty
  if (!input.trim()) {
      return new Set(); // Return an empty set if no input is provided
  }
  const pageSelectionRegex = /\d+(-\d+)?/g;
  const matches = input.match(pageSelectionRegex);
  const pages = new Set();

  if (matches) {
      matches.forEach(match => {
          if (match.includes('-')) {
              const range = match.split('-').map(Number);
              const start = range[0];
              const end = range[1];

              for (let i = start; i <= end; i++) {
                  pages.add(i);
              }
          } else {
              pages.add(Number(match));
          }
      });
  }

  return pages;
}

  const handlePdfCommand = async (input = "") => {
    if (input === '') {
      return;
    }

    const pdfCommands = [{command: 'view', description: 'view(name) the chosen pdf name'}, {command: 'select', description: 'select(pages) selects the number of pages'}, {command: 'deselect', description: 'deselect page numbers for a pdf'}, {command: 'clear', description: 'clear all pdfs'}, {command: 'remove', description: 'remove named pdf'}];
    // const pdfCommandsListString = "[" + pdfCommands.map(cmd => cmd.command).join(", ") + "]";
    // Extract the command from user input using regex
    const commandRegex = /(\b\w+\b)/;
    const commandMatch = commandRegex.exec(input);
    if (!commandMatch) {
        throw new Error('Unable to parse command');
    }

    const inputCommand = commandMatch[0];
    const closestCommand = getClosestPDFCommand(inputCommand, pdfCommands);
    if (!closestCommand) {
        throw new Error('No matching command found');
    }

    // Extract arguments after the command
    const args = input.slice(input.indexOf(inputCommand) + inputCommand.length).trim().split(/\s*\|\s*/);

    console.log(closestCommand, args);

    if (closestCommand === 'view') {
      const pdfNames = pdfs.map(pdf => pdf.fileName);
      console.log("VIEW PDF: ", args[0], pdfNames);
      if (args[0]) {
          const closestPdf = getClosestPDFFileName(args[0], pdfNames);
          if (!closestPdf) {
              throw new Error('No matching pdf found');
          }
          console.log("Viewing PDF: ", closestPdf);
          pdfViewerRef.current.openPdfViewer(closestPdf);

      } else {
          console.log("Viewing PDF: ", pdfs[0].fileName);
      }
  
  

      

    } else if (closestCommand === 'select') {
      //set all page number selections that the user asks for.  use another callapinostream prompt to get the page numbers from a semantic user query.
      console.log("Selecting PDF")
      const pdfNames = pdfs.map(pdf => pdf.fileName);
      console.log("Select PDF: ", args[0], pdfNames);
      if (args[0]) {
          const closestPdf = getClosestPDFFileName(args[0], pdfNames);
          if (!closestPdf) {
              throw new Error('No matching pdf found');
          }
          console.log("Selecting PDF: ", closestPdf);
          
          const pageSelectionString = input.split(' ').slice(2).join(' '); // Extract everything after the command and filename
          const selectedPages = parsePageSelection(pageSelectionString);
          setPdfs(prevPdfs => prevPdfs.map(pdf => {
            if (pdf.fileName === closestPdf) {
                return { ...pdf, selectedPages: selectedPages }; // Deselect all pages
            }
            return pdf;
        }));

      } else {
          console.log("Deselecting all PDFS: ");
          setPdfs(prevPdfs => prevPdfs.map(pdf => ({ ...pdf, selectedPages: new Set() }))); // Deselect all pages
          return;
      }

    } else if (closestCommand === 'deselect') {
      //set all page number selections to false within the pdfs state variable for the selected pdf.  If no pdf is selected(no args) then deselect all pdfs
      console.log("Deselecting PDF")
      const pdfNames = pdfs.map(pdf => pdf.fileName);
      console.log("Deselect PDF: ", args[0], pdfNames);
      if (args[0]) {
          const closestPdf = getClosestPDFFileName(args[0], pdfNames);
          if (!closestPdf) {
              throw new Error('No matching pdf found');
          }
          console.log("Deselecting PDF: ", closestPdf);
          setPdfs(prevPdfs => prevPdfs.map(pdf => {
            if (pdf.fileName === closestPdf) {
                return { ...pdf, selectedPages: new Set() }; // Deselect all pages
            }
            return pdf;
        }));

      } else {
          console.log("Deselecting all PDFS: ");
          setPdfs(prevPdfs => prevPdfs.map(pdf => ({ ...pdf, selectedPages: new Set() }))); // Deselect all pages
          return;
      }

    } else if (closestCommand === 'clear') {
      //clear all pdfs state variable
      console.log("Clearing PDFs")
      setPdfs([]);
    } else if (closestCommand === 'remove') {
      console.log("Removing PDF")
      const pdfNames = pdfs.map(pdf => pdf.fileName);
      console.log("Remove PDF: ", args[0], pdfNames);
      if (args[0]) {
          const closestPdf = getClosestPDFFileName(args[0], pdfNames);
          if (!closestPdf) {
              throw new Error('No matching pdf found');
          }
          console.log("Removing PDF: ", closestPdf);
          const newPdfs = pdfs.filter(pdf => pdf.fileName !== closestPdf);
          setPdfs(newPdfs);

      } else {
          console.log("not Removing PDF: ", pdfs[0].fileName);
          return;
      }
    } else {

    }

    // throw new Error('Unable to parse command');
  
  };
  
  const handleDataCommand = () => {
    setShowDataPopup(true); // Toggle the visibility of the data popup
  };
  

  const commandHandlers = {
    "!help": handleHelpCommand,
    "!settings": handleSettingsCommand,
    "!prompt": handlePromptCommand,
    "!solo": handleSoloCommand,
    "!toggle": handleToggleCommand,
    "!clear": clearContext,
    "!save": saveChatContext,
    "!load": loadChatContext,
    "!pdf": handlePdfCommand,
    "!data": handleDataCommand,
    // Add more mappings as needed
  };
  

  const chatCommands = [
    { command: "!help", description: "Show help information" },
    { command: "!settings", description: "Show settings"},
    { command: "!prompt", description: "open prompt popup"},
    { command: "!solo", description: "Toggles off other components" },
    { command: "!toggle", description: "Toggle a setting" },
    { command: "!clear", description: "Clear the current context"},
    { command: "!save", description: "Save the current context"},
    { command: "!load", description: "Load a saved context"},
    { command: "!pdf", description: "PDF commands"},
    { command: "!data", description: "string data storage"},
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
    console.log("Current Message:", currentMessage);
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

  useEffect(() => {
    BotFunctions.getContextTokens(currentMessage, messages, pdfs).then((tokens) => {
      setTokenCount(tokens + Math.ceil(input.length / 4));
    });
  }, [input, messages, pdfs, currentMessage, currentBotMessage, currentBotMessageText]);

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

  
  processedNodes.forEach((node) => {
    node.row--;
  }, [currentMessage]); 

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
    // console.log("HISHDIFHDSIHF");
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

  const parseCommand = async (input) => {
    const commandsListString = "[" + chatCommands.map(cmd => cmd.command).join(", ") + "]";

    const prompt = "# Mission\nYou are a command parser.  You have a list of executable commands: \n\n" + commandsListString + "\n\nYou will only respond with what you think the original command from the user was and nothing else.  Place this command in tripple $$$ for easy parsing.\n\n# Examples\n\nUser input: !prosmpt\n\n# Output\n\n$$$!prompt$$$\n\nUser input: !r un param1 | param 2\n\n# Output\n\n$$$!run param1 | param 2$$$\n\nUser input: " + input;
    const response = await BotFunctions.callApiNoStream(prompt, settings['Use Api']);

    // console.log(response);

    const commandRegex = /\${3}(!.+?)\${3}/;
    const match = commandRegex.exec(response.data);

    if (match && match[1]) {
      const fullCommand = match[1].trim();
      const parts = fullCommand.split(' ');
      const commandSent = parts[0];
      const rest = parts.slice(1).join(' ');
      const argss = rest.split('|').map(arg => arg.trim());
      // console.log(commandSent, argss);
      return { commandSent, argss };
    }

    throw new Error('Unable to parse command');
  }

  function getClosestCommand(inputCommand, commandList) {
    // console.log("inputCommand: ", inputCommand);
    const inputCmdWithoutExclamation = inputCommand.startsWith('!') ? inputCommand.slice(1) : inputCommand;
  let closestMatch = null;
  let closestMatchLengthDifference = Infinity;

  commandList.forEach(cmdObj => {
    const commandName = cmdObj.command.slice(1); // Remove the '!' from the command name
    if (commandName.startsWith(inputCmdWithoutExclamation)) {
      const lengthDifference = commandName.length - inputCmdWithoutExclamation.length;
      if (lengthDifference < closestMatchLengthDifference) {
        closestMatch = cmdObj.command;
        closestMatchLengthDifference = lengthDifference;
      }
    }
  });

  return closestMatch;
}
  

  const sendMessage = async (message = "") => {
    console.log("message: ", message);
    
    if ((input === "" || input.trim() === "") && message === "") return;

    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");

    
    const parts = input.split(' ');
    let command = parts[0];
    const closestCommand = getClosestCommand(command, chatCommands);
    if (closestCommand) {
      command = closestCommand;
    }
    

    const rest = parts.slice(1).join(' ');
    const args = rest.split('|').map(arg => arg.trim());

    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    if (input[0] === '!') {
      if (commandHandlers[command]) {
        console.log("command: ", command);
        console.log("args: ", args);
        sendCommand(command, args);
        setInput(""); // Clear the input field
        
        return; // Return early
      } else {
        console.log(`Unknown command: ${command}`);
        // Handle unknown commands, show error message, etc.
        if (settings['Use Api'])
        {
          try {
            const { commandSent, argss } = await parseCommand(input);
            console.log(commandSent, argss);
            sendCommand(commandSent, argss);
            setInput("");
          } catch (error) {
            console.error(error.message);
            // Handle error, such as showing a message to the user
          }
          return;
        }
        else {
          return;
        }
      }
    }
    

    const p = message === "" ? input : message;

    const userMessage = MessageNode(
      currentMessage,
      incrementMessageCount,
      p,
      "user"
    );
    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");

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
    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    userMessage.children = [botReply];

    setCurrentBotMessage(botReply);

    setCurrentMessage(botReply);
    setContextDefault(messages, botReply);
    setCurrentBotMessageText("");
    console.log(systemPrompt);
    const botResponse = await BotFunctions.getBotReply(systemPrompt.content + input, currentMessage, messages, pdfs, settings['Use Api'], updateBotMessage);
    // console.log("SDHFISHDFOIHDSKLFHDSLKHJGDKLSH:FSOIISEH:LDJS:FLKJDSKF:SJD:KLFJGD************");
    
    // console.log("______________________________________________")
    // console.log(botResponse);
    setCurrentBotMessageText("");
    botReply.message = botResponse;

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
  

  const sendCommand = (command, args = []) => {
    const commandFunction = commandHandlers[command];
    if (commandFunction) {
      commandFunction(... args);
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
      color: '#ccc', // Light text for contrast
      border: '1px solid #555', // Slight border for definition
      borderRadius: '4px', // Rounded corners
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)', // Subtle shadow for depth
      zIndex: 1000, // Ensure it's above other elements
      overflow: 'hidden', // In case of too many suggestions
      maxHeight: '200px', // Limit the height
      marginLeft: '75px'
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

  const isMiniViewActive = settings['Miniview'];
const isPdfViewerActive = settings['PDF Viewer'];

// Container style for MiniView and PDF Viewer
const miniViewPdfViewerContainerStyle = {
  flex: isMiniViewActive && isPdfViewerActive ? 2 : (isMiniViewActive || isPdfViewerActive ? 2 : 0),
  display: 'flex',
  flexDirection: 'column',
};

const triggerFileInputClick = () => {
  document.getElementById("hiddenFileInput").click();
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
          dataStrings={dataStrings}
          initialDataStrings={dataStrings}
          setDataStrings={setDataStrings}
          prompts={prompts}
      setPrompts={setPrompts}
      savePromptsToServer={savePromptsToServer}
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
    
    {showDataPopup && (
  <DataPopup
  ref={dataPopupRef}
    dataStrings={dataStrings}
    setSystemPrompt={setSystemPrompt}
    systemPrompt={systemPrompt}
    setDataStrings={setDataStrings}
    onDataSave={handleDataSave}
    onClose={() => setShowDataPopup(false)}
  />
)}
<SideNavBar 
className="dark-scrollbar"
tokenCount={tokenCount}
tokenTotal={tokenTotal}
systemPrompt={systemPrompt}
pdfs={pdfs}
currentMessage={currentMessage}
messageTree={messages}
setSystemPrompt={setSystemPrompt}
loadContext={loadChatContext}
saveContext={saveChatContext}
setShowPromptPopup={setShowPromptPopup}
setShowDataPopup={setShowDataPopup}
useApi={settings['Use Api']}
/>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          height: "100vh",
          backgroundColor: "#282c34",
          color: "#ccc",
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
              <ChatComponent currentMessage={currentMessage} currentBotMessage={currentBotMessage} increment = {incrementMessageCount} currentBotText={currentBotMessageText} wide={settings['Miniview'] || settings['PDF Viewer']}/>

              
            </div>

            

            <div style={{... miniViewPdfViewerContainerStyle}} className="dark-scrollbar">
              <div style={{flex: 1, overflowY: 'auto' }}>
                {/* Pass the lifted state and handler as props to PdfViewerComponent */}
                {settings['PDF Viewer'] && (
                <div style={{...svgStyles, maxHeight: '21.375vh', overflowY: 'auto' }} className="dark-scrollbar">
                    <PdfViewerComponent 
                    messages = {messages}
                    setTokenCount={setTokenCount}
                    input={input}
                    currentMessage={currentMessage}
                        pdfs={pdfs} 
                        setPdfs={setPdfs} 
                        onFileChange={onFileChange} 
                        ref = {pdfViewerRef}
                        triggerFileInputClicked={triggerFileInputClick} // Pass the function as a prop
                    />
                </div>
            )}
              </div>
              {settings['Miniview'] && (
              <div style={{ flex: 3}} className="dark-scrollbar">
                <MiniView
                  setTokenCount={setTokenCount}
                  pdfs={pdfs}
                  input={input}
                  currentMessage={currentMessage}
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
                  className='dark-scrollbar'
                    ref={textareaRef}
                    minRows={1}
                    maxRows={10}
                    style={{...textareaStyles, marginTop: suggestions.length > 0 ? '210px' : '10px', marginLeft: '75px'}}
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
