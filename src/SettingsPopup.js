import React from 'react';

const SettingsPopup = React.forwardRef(({ settings, updateSetting, toggleLockSettings, isLocked }, ref) => {

    const popupStyle = {
        // Common styles
        backgroundColor: '#23282d',
        color: '#ccc',
        padding: '20px',
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle drop shadow
        zIndex: 1000,
        // ...
        // Conditional styles
        ...(isLocked ? {
            position: 'static',
            marginLeft: '20px', // Adjust as needed for inline display
            // Other styles specific to inline display
        } : {
            // Styles for modal display
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            // Other styles specific to modal display
        })
        };
  return (
    <div ref={ref} style={popupStyle}>
      <h2 style={popupTitleStyle}>Settings</h2>
      <label style={checkboxLabelStyle}>
        <input
          type="checkbox"
          checked={isLocked}
          onChange={(e) => toggleLockSettings(e.target.checked)}
        />
        {' Lock Settings'}
      </label>
      <div style={checkboxContainerStyle}>
        {Object.keys(settings).map((setting) => (
          <label key={setting} style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={settings[setting]}
              onChange={(e) => updateSetting(setting, e.target.checked)}
            />
            {` ${setting}`}
          </label>
        ))}
      </div>
    </div>
  );
});


  

const popupTitleStyle = {
  textAlign: 'center',
  marginBottom: '15px',
};

const checkboxContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
};

const checkboxLabelStyle = {
  marginBottom: '10px',
  cursor: 'pointer',
};

export default SettingsPopup;
