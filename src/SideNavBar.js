import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Make sure to install axios if not already done
import './SideNavBar.css';
import BotFunctions from './botReplyHandler';

const SideNavBar = ({ systemPrompt, setSystemPrompt, setShowPromptPopup, setShowDataPopup, useApi, loadContext, saveContext, currentMessage, messageTree, pdfs, tokenCount, tokenTotal }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [contextInput, setContextInput] = useState('');
    const [chatInput, setChatInput] = useState('Summarize the current context');

    const [contextualChatArea, setContextualChatArea] = useState('');

    const [contextList, setContextList] = useState([]);

    const [currentContext, setCurrentContext] = useState('');


    useEffect(() => {
        setSystemPrompt(systemPrompt);
    }, [systemPrompt, setSystemPrompt]);

    useEffect(() => {
        axios.get('http://localhost:3001/api/contexts')
            .then(response => setContextList(response.data))
            .catch(error => console.error('Error fetching contexts:', error));
    }, [saveContext]);

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleSendClick = async () => {
        try {
            const response = await BotFunctions.callApiContext(chatInput, currentMessage, messageTree, pdfs, useApi);
            console.log("API Response:", response.data);
            setContextualChatArea(response.data);
            // Handle the response here (e.g., display it in the UI)
        } catch (error) {
            console.error("Error calling API:", error);
            // Handle any errors here
        }
        
    };
    const handlePromptInputChange = (e) => {
        setSystemPrompt(e.target.value);
    };

    const handleSaveContext = async (newContextName) => {
        try {
            // Replace this with your actual save logic
            await saveContext(newContextName); 
    
            setContextList(prevList => {
                // Add new context name to the list if it's not already there
                if (!prevList.includes(newContextName)) {
                    return [...prevList, newContextName];
                }
                return prevList;
            });
        } catch (error) {
            console.error('Error saving context:', error);
            // Handle any errors in saving context here
        }
    };

    const getProgressBarColor = (percentage) => {
        if (percentage <= 50) return '#6BCB77'; // Green
        if (percentage <= 85) return '#F4D35E'; // Yellow
        return '#EF476F'; // Red
    };

    // Calculate token usage percentage
    const tokenPercentage = tokenCount / tokenTotal * 100;
    const progressBarColor = getProgressBarColor(tokenPercentage);

    const progressBarStyle = {
        height: '10px',
        width: `${Math.min(tokenPercentage, 100)}%`, // Ensure it doesn't exceed 100%
        backgroundColor: progressBarColor,
        borderRadius: '5px',
        transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out',
    };

    const progressBarContainerStyle = {
        backgroundColor: '#404040',
        borderRadius: '5px',
        padding: '2px',
        marginTop: '5px',
        marginBottom: '15px',
    };
    

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
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "10px",
        textTransform: 'none',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        boxSizing: 'border-box',
        width: '90%' // Adjust as needed
    };

    return (
        <div className={`side-nav ${isCollapsed ? 'collapsed' : ''}`}>

            <div className="toggle-btn" onClick={handleToggle}>
                <span className="toggle-icon">{isCollapsed ? '>' : '<'}</span>
            </div>
            <div className="token-usage-label">
                Current Context: {tokenCount} / {tokenTotal}
            </div>
            <div style={progressBarContainerStyle}>
                <div style={progressBarStyle}></div>
            </div>
            

            {/* Custom Instruction Section */}
            <div className="nav-item">
                <label className="nav-label">System Prompt</label>
                <input 
                    className="nav-input" 
                    type="text" 
                    placeholder="Enter system prompt" 
                    value={systemPrompt}
                    onChange={handlePromptInputChange}
                />
            </div>

            {/* Contextual Chat Section */}
            <div className="nav-item">
            <label className="nav-label">Contextual Chat</label>
            <input 
                    className="nav-input" 
                    type="text" 
                    placeholder="Enter chat prompt" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                />
                <button style={buttonStyles} className="nav-button" onClick={handleSendClick}>Send</button>
                <textarea className="nav-textarea custom-scrollbar"  placeholder="Enter chat context" readOnly value={contextualChatArea} onChange={(e) => setContextualChatArea(e.target.value)}></textarea>
                {/* Implement the percentage bar as needed */}
            </div>

            

            {/* Menu Buttons Section */}
            <div className="nav-item">
                <button style={buttonStyles} className="nav-button" onClick={() => setShowPromptPopup(true)}>Prompt Menu</button>
                <button style={buttonStyles} className="nav-button" onClick={() => setShowDataPopup(true)}>Data Menu</button>
            </div>

            {/* Context Section */}
            <div className="nav-item">
                <label className="nav-label">Context Name</label>
                <input 
                    className="nav-input" 
                    type="text" 
                    placeholder="Enter context name" 
                    value={contextInput}
                    onChange={(e) => setContextInput(e.target.value)}
                />
                <button style={buttonStyles} className="nav-button" onClick={() => handleSaveContext(contextInput)}>Save Context</button>
                <label className="nav-label">Select Context</label>
                <ul className="nav-list">
                    {contextList.map((contextName, index) => (
                        <li 
                            key={index} 
                            className={`nav-list-item ${contextName === currentContext ? 'current-context' : ''}`}
                            onClick={() => {
                                loadContext(contextName);
                                setCurrentContext(contextName);
                                setContextInput(contextName);
                            }}
                        >
                            {contextName}
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
};

export default SideNavBar;