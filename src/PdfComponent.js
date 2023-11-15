import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Modal from 'react-modal';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
Modal.setAppElement('#root');

const PdfViewerComponent = ({ pdfs, setPdfs }) => {
    const [openPopupIndex, setOpenPopupIndex] = useState(-1);
    const [hoveredPage, setHoveredPage] = useState({ pdfIndex: null, pageNumber: null });
    const [pageAspectRatio, setPageAspectRatio] = useState(null); // New state for storing the aspect ratio

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

    const togglePageSelection = (pdfIndex, pageNumber) => {
        setPdfs(prevPdfs => prevPdfs.map((pdf, index) => {
            if (index === pdfIndex) {
                const newSelection = new Set(pdf.selectedPages);
                if (newSelection.has(pageNumber)) {
                    newSelection.delete(pageNumber);
                } else {
                    newSelection.add(pageNumber);
                }
                return { ...pdf, selectedPages: newSelection };
            }
            return pdf;
        }));
    };

    useEffect(() => {
        function closeOnEscapeKey(e) {
            if ((e.charCode || e.keyCode) === 27) {
                setOpenPopupIndex(-1);
            }
        }
        document.body.addEventListener('keydown', closeOnEscapeKey);
        return () => document.body.removeEventListener('keydown', closeOnEscapeKey);
    }, []);

    const componentContainerStyle = {
        backgroundColor: "#23282d",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
        padding: "10px",
        color: "white",
    };

    const fileInputStyle = {
        backgroundColor: "#222",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "8px 16px",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
        marginBottom: "10px",
    };

    const pdfThumbnailStyle = {
        backgroundColor: "#262626",
        boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.3)",
        borderRadius: "5px",
        width: '150px',
        height: '150px',
        display: 'inline-block',
        textAlign: 'center',
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden', // Ensures the content doesn't spill out
        wordWrap: 'break-word',
        margin: '5px',
        cursor: 'pointer',
    };

    const fileNameStyle = {
        position: 'absolute', // Position absolutely within the thumbnail
        top: '50%', // Center vertically
        left: '50%', // Center horizontally
        transform: 'translate(-50%, -50%)', // Adjust for the element's own size
        width: '90%', // Give some padding inside the thumbnail
        color: 'white', // Text color
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
            color: "white",
            borderRadius: "4px",
            overflow: 'auto',
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
        },
    };

    const fileInputContainerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '20px', // Add space between the file input and the list of PDFs
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
        <div style={componentContainerStyle}>
            <div style={fileInputContainerStyle}>
                <input type="file" onChange={onFileChange} multiple style={fileInputStyle} />
            </div>
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
                                    <div key={pageNumber} onClick={() => togglePageSelection(index, pageNumber)} onMouseEnter={() => handlePageHover(index, pageNumber)} style={pdfThumbnailStyle}>
                                        {pdf.selectedPages.has(pageNumber) && (
                                            <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0, 128, 0, 0.5)', zIndex: 1 }}></div>
                                        )}
                                        <div style={pageNumberLabelStyle}>
                                            Page<br />{pageNumber}
                                        </div>
                                        <Page pageNumber={pageNumber} width={150} height={150} />
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
    );
};

export default PdfViewerComponent;
