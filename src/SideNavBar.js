
import React, { useState } from 'react';
import './SideNavBar.css'; // Assuming you have a separate CSS file for styles

const SideNavBar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleSendClick = () => {
        // onSendClick(chatInput);
        setChatInput(''); // Optionally clear the input after sending
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

            {/* Custom Instruction Section */}
            <div className="nav-item">
                <label className="nav-label">Custom Instruction</label>
                <input className="nav-input" type="text" placeholder="Enter custom instruction" />
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
                <textarea className="nav-textarea" placeholder="Enter chat context" readOnly>hi</textarea>
                {/* Implement the percentage bar as needed */}
            </div>

            

            {/* Menu Buttons Section */}
            <div className="nav-item">
                <button style={buttonStyles} className="nav-button">Prompt Menu</button>
                <button style={buttonStyles} className="nav-button">Data Menu</button>
            </div>

            {/* Context Section */}
            <div className="nav-item">
                <label className="nav-label">Context</label>
                <ul className="nav-list">
                    {/* Dynamically add context items here */}
                </ul>
            </div>
        </div>
    );
};

export default SideNavBar;