import React from 'react';

// Extend window interface to include our extension logo URI
declare global {
    interface Window {
        extensionLogoUri?: string;
    }
}

interface Config {
    openmetadataUrl: string;
}

interface ConnectionDotsProps {
    config: Config | null;
    onHomeClick?: () => void;
}

export const ConnectionDots: React.FC<ConnectionDotsProps> = ({ config, onHomeClick }) => {
    const handleDotsClick = () => {
        // Open GitHub repo in browser
        window.open('https://github.com/markusbegerow/local-llm-chat-vscode-openmetadata/tree/main', '_blank');
    };

    const handleLogoClick = () => {
        if (onHomeClick) {
            onHomeClick();
        }
    };

    if (!config) {
        return (
            <div className="connection-dots" onClick={handleDotsClick} title="Loading configuration... Click for setup help">
                <div className="connection-dot loading"></div>
                <div className="connection-dot loading"></div>
            </div>
        );
    }

    const isOpenMetadataConnected = !!config.openmetadataUrl;
    
    // Show logo when everything is working
    if (isOpenMetadataConnected) {
        const logoUri = window.extensionLogoUri || 'assets/robot_icon_32.png';
        return (
            <div className="extension-logo" onClick={handleLogoClick} title="OpenMetadata - Click to go home">
                <img src={logoUri} alt="OpenMetadata" />
            </div>
        );
    }
    
    // Show dots when there's a problem
    return (
        <div className="connection-dots" onClick={handleDotsClick}>
            <div 
                className={`connection-dot ${isOpenMetadataConnected ? 'connected' : 'disconnected'}`}
                title={`OpenMetadata: ${isOpenMetadataConnected ? 'Connected' : 'Not configured'} - Click for setup help`}
            ></div>
        </div>
    );
};