import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Modal from 'react-modal';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
Modal.setAppElement('#root');

const PdfViewerComponent = ({ pdfs, setPdfs }) => {
    const [openPopupIndex, setOpenPopupIndex] = useState(-1);
    const [hoveredPage, setHoveredPage] = useState({ pdfIndex: null, pageNumber: null });
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [dragAction, setDragAction] = useState(null); // New state to track the initial drag action ('select' or 'deselect')


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

    const componentContainerStyle = {
        padding: "10px",
        color: "#ccc"
    };

    const fileInputStyle = {
        display: 'none', // Hide the actual file input
    };

    const customButtonStyle = {
        backgroundColor: "#343434", // Choose a color that fits your theme
        color: "#ccc",
        border: "1px solid #444444",
        borderRadius: "4px",
        padding: "10px 15px",
        cursor: "pointer",
        fontSize: "16px",
        display: "inline-block", // Change to inline-block
        // Optionally, you can add some margins for spacing
        margin: "10px"
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
        overflow: 'hidden', // Ensures the content doesn't spill out
        wordWrap: 'break-word',
        margin: '5px',
        cursor: 'pointer',
        userSelect: 'none',
        color: "#ccc",
    };

    const fileNameStyle = {
        position: 'absolute', // Position absolutely within the thumbnail
        top: '50%', // Center vertically
        left: '50%', // Center horizontally
        transform: 'translate(-50%, -50%)', // Adjust for the element's own size
        width: '90%', // Give some padding inside the thumbnail
        color: "#ccc",
        wordWrap: 'break-word', // Wrap long file names to the next line
    };

    const pageNumberLabelStyle = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2, // Ensure it's on top
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
            userSelect: 'none',
        },
    };



    // Style for the large view container with a fixed maximum height
// Updated style for the large view container
const largeViewContainerStyle = {
    display: 'flex',
    justifyContent: 'center', // Aligns content to the start of the flex container
    alignItems: 'flex-start', // Aligns items to the start of the container on the cross-axis
    maxHeight: '800px', // Set the maximum height as needed
    overflow: 'auto', // Allows scrolling if the content is taller than the max height
    background: 'transparent'
};




    return (
    <div>
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
                    <div key={index} onClick={() => setOpenPopupIndex(index)} style={pdfThumbnailStyle}>
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
                    <button onClick={() => setOpenPopupIndex(-1)} style={{ position: 'absolute', top: 0, left: 0, color: 'white', backgroundColor: '#8A2BE2', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>X</button>
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '50%' }}>
                            <Document file={pdf.file} onLoadSuccess={(event) => onDocumentLoadSuccess(index, event)}>
                                {Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(pageNumber => (
                                    <div 
                                    key={pageNumber} 
                                    onMouseDown={(e) => {
                                        console.log('Mouse Down Event:', e); // Debugging line
                                        togglePageSelection(index, pageNumber, e);
                                        setIsMouseDown(true);
                                    }}
                                    onMouseEnter={(e) => {
                                        console.log('Mouse Enter Event:', e); // Debugging line
                                        if (isMouseDown) togglePageSelection(index, pageNumber, e);
                                        handlePageHover(index, pageNumber);
                                    }}
                                    onMouseUp={() => setIsMouseDown(false)}
                                    style={pdfThumbnailStyle}
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
                        <div style={{ width: '50%' }}>
                            {hoveredPage.pdfIndex === index && (
                                <Document file={pdfs[hoveredPage.pdfIndex].file}>
                                    <div style={largeViewContainerStyle}>
                                        <Page
                                            pageNumber={hoveredPage.pageNumber}
                                            width={500}
                                        />
                                    </div>
                                </Document>
                            )}
                        </div>
                    </div>
                </Modal>
            ))}
        </div>
        </div>
    );
};

export default PdfViewerComponent;
