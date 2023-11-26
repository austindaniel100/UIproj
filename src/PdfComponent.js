import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Modal from 'react-modal';
import BotFunctions from "./botReplyHandler";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
Modal.setAppElement('#root');

const PdfViewerComponent = forwardRef(({ pdfs, setPdfs, setTokenCount, input, currentMessage, messages }, ref) => {
    const [openPopupIndex, setOpenPopupIndex] = useState(-1);
    const [hoveredPage, setHoveredPage] = useState({ pdfIndex: null, pageNumber: null });
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [dragAction, setDragAction] = useState(null); // New state to track the initial drag action ('select' or 'deselect')

    const [largeViewSize, setLargeViewSize] = useState({ width: 0, height: 0 });


    const [isDarkMode, setIsDarkMode] = useState(true); // New state for dark mode

    // ... existing useEffects and functions

    // Function to toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };


    useEffect(() => {
        const calculateSize = () => {
          const width = window.innerWidth; // or a specific container's width
          const aspectRatio = 16 / 9; // Example: 16:9 aspect ratio
          const height = width / aspectRatio;
      
          setLargeViewSize({ width, height });
        };
      
        // Calculate size initially and on resize
        window.addEventListener('resize', calculateSize);
        calculateSize();
      
        // Clean up
        return () => {
          window.removeEventListener('resize', calculateSize);
        };
      }, []);
      



    // Function to handle mouse hover on a page
    const handlePageHover = (pdfIndex, pageNumber) => {
        setHoveredPage({ pdfIndex, pageNumber });
    };

    const onFileChange = (event) => {
        Array.from(event.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPdfs(prevPdfs => [...prevPdfs, { file: e.target.result, numPages: null, selectedPages: new Set(), fileName: file.name }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const onDocumentLoadSuccess = (pdfIndex, { numPages }) => {
        setPdfs(prevPdfs => prevPdfs.map((pdf, index) => index === pdfIndex ? { ...pdf, numPages } : pdf));
    };

    const togglePageSelection = (pdfIndex, pageNumber, event) => {
        const isCtrlPressed = event && event.ctrlKey; // Check if event exists and Ctrl key is pressed

        setPdfs(prevPdfs => prevPdfs.map((pdf, index) => {
            if (index === pdfIndex) {
                const newSelection = new Set(pdf.selectedPages);
                if (!isCtrlPressed) {
                    console.log("HUH2?");
                    newSelection.add(pageNumber);
                } else {
                    console.log("HUH?");
                    newSelection.delete(pageNumber);
                }
                return { ...pdf, selectedPages: newSelection };
            }
            return pdf;
        }));
        BotFunctions.getContextTokens(currentMessage, messages, pdfs).then((tokens) => {
            setTokenCount(tokens + Math.ceil(input.length / 4));
          });
    };

    // Handle mouse down event
    const handleMouseDown = () => {
        setIsMouseDown(true);
    };

    // Handle mouse up event
    const handleMouseUp = () => {
        setIsMouseDown(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        function closeOnEscapeKey(e) {
            if ((e.charCode || e.keyCode) === 27) {
                setOpenPopupIndex(-1);
            }
        }
        document.body.addEventListener('keydown', closeOnEscapeKey);
        return () => document.body.removeEventListener('keydown', closeOnEscapeKey);
    }, []);

    const triggerFileInputClick = () => {
        document.getElementById("hiddenFileInput").click();
    };

    const openPdfViewer = (documentName) => {
        const pdfIndex = pdfs.findIndex(pdf => pdf.fileName === documentName);
        if (pdfIndex !== -1) {
            setOpenPopupIndex(pdfIndex);
        }
    };
    

    // Expose openPdfViewer to parent components
    useImperativeHandle(ref, () => ({
        openPdfViewer
    }));
    const fileInputStyle = {
        display: 'none', // Hide the actual file input
    };
    const componentContainerStyle = {
        padding: "10px",
        color: "#ccc",
        borderRadius: "4px", // Rounded corners
    };

    const customButtonStyle = {
        background: "#29274C",
        color: "#ccc",
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
        justifyContent: "center",
        alignItems: "center",
        margin: "10px",
        width: '100px',
    };

    const pdfThumbnailStyle = {
        backgroundColor: "#262626",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)",
        borderRadius: "5px",
        width: '100px',
        height: '100px',
        display: 'inline-block',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        margin: '5px',
        cursor: 'pointer',
        userSelect: 'none',
        color: "#ccc",
    };

    const fileNameStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        color: "#ccc",
        wordWrap: 'break-word',
    };

    const pageNumberLabelStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: "#ccc",
        zIndex: 2,
    };

    const modalStyle = {
        content: {
            top: '10%',
            left: '10%',
            right: '10%',
            bottom: '10%',
            backgroundColor: "#1e1e1e",
            color: "#ccc",
            borderRadius: "4px",
            overflow: 'auto',
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
            zIndex: 10,
        },
    };

    const documentStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center the pages vertically
        justifyContent: 'flex-start', // Align content to the top
    };
    
    // Update the Page component style to remove extra space
    const pageStyle = {
        marginBottom: '0', // Remove any default margin
        padding: '0', // Remove any default padding
    };

    const largeViewContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '500px',
        height: `${largeViewSize.height / 2}px`,
        overflow: 'hidden',
        background: 'transparent'
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

    
    // Style for dark mode toggle button
    const darkModeStyles = {
        backgroundColor: isDarkMode ? '#2D2D2D' : '#FFF', // Dark grey background for dark mode
        color: isDarkMode ? '#CCC' : '#000', // Light grey text for dark mode
    };

    const pdfContainerStyle = {
        filter: isDarkMode ? 'invert(0.8)' : 'none',
        backgroundColor: isDarkMode ? '#2D2D2D' : '#FFF', // Change background color
    };

    const calculateOverlayHeight = (pdf) => {
        const totalPages = pdf.numPages || 0;
        const selectedPages = pdf.selectedPages.size;
        const percentage = totalPages > 0 ? (selectedPages / totalPages) * 100 : 0;
        return `${percentage}%`;
    };
    




    return (
    <div>
        <style>{scrollbarStyles}</style>
    <input
                id="hiddenFileInput"
                type="file"
                onChange={onFileChange}
                multiple
                style={fileInputStyle}
                accept="application/pdf"
            />
            <div style={customButtonStyle} onClick={triggerFileInputClick}>
                Choose Files
            </div>
        <div style={componentContainerStyle}>
            
            <div>
            {pdfs.map((pdf, index) => (
                    <div key={index} onClick={() => setOpenPopupIndex(index)} style={{...pdfThumbnailStyle, position: 'relative'}}>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0, // Ensure alignment starts from the left
                            width: '100%',
                            height: calculateOverlayHeight(pdf), // Apply the green overlay
                            backgroundColor: 'rgba(0, 128, 0, 0.5)', // Green color with some transparency
                            zIndex: 0
                        }}></div>
                        <div style={fileNameStyle}>
                            {pdf.fileName}
                        </div>
                    </div>
                ))}
            </div>
            {pdfs.map((pdf, index) => (
                <Modal
                    key={index}
                    isOpen={openPopupIndex === index}
                    onRequestClose={() => setOpenPopupIndex(-1)}
                    contentLabel={pdf.fileName}
                    style={modalStyle}
                >
                    <button onClick={() => setOpenPopupIndex(-1)} style={customButtonStyle}>Close</button>
                    <button style={{...customButtonStyle, ...darkModeStyles}} onClick={toggleDarkMode}>
                {isDarkMode ? 'Dark PDFs' : 'Light PDFs'}
            </button>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '30%' }}>
        <Document file={pdf.file} onLoadSuccess={(event) => onDocumentLoadSuccess(index, event)}>
            {Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(pageNumber => (
                <div 
                    key={pageNumber}
                    style={{ ...pdfThumbnailStyle, ...pdfContainerStyle }} // Apply dark mode style here
                    onMouseDown={(e) => {
                        togglePageSelection(index, pageNumber, e);
                        setIsMouseDown(true);
                    }}
                    onMouseEnter={(e) => {
                        if (isMouseDown) togglePageSelection(index, pageNumber, e);
                        handlePageHover(index, pageNumber);
                    }}
                    onMouseUp={() => setIsMouseDown(false)}
                >
                    {pdf.selectedPages.has(pageNumber) && (
                        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0, 128, 0, 0.5)', zIndex: 1 }}></div>
                    )}
                    <div style={pageNumberLabelStyle}>
                        Page<br />{pageNumber}
                    </div>
                    <Page pageNumber={pageNumber} width={100} height={100} />
                </div>
            ))}
        </Document>
    </div>
                        <div >
                        {
                            hoveredPage.pdfIndex === index && (
                                <Document style={documentStyle} file={pdfs[hoveredPage.pdfIndex].file} onLoadSuccess={(event) => onDocumentLoadSuccess(index, event)}>
                                    <div className="dark-scrollbar" style={{...largeViewContainerStyle, ...pdfContainerStyle}}> {/* Apply the filter style here */}
                                        <Page 
                                            pageNumber={hoveredPage.pageNumber}
                                            style={pageStyle}
                                            width={500}
                                            renderTextLayer={false}
                                        />
                                    </div>
                                </Document>
                            )
                        }

                        </div>
                    </div>
                </Modal>
            ))}
        </div>
        </div>
    );
});

export default PdfViewerComponent;
