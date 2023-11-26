const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');




const app = express();

const cors = require('cors');
app.use(cors());
const port = 3001; // You can use any port that's available

app.use(bodyParser.json({ limit: '50mb' })); // Increase the limit to 50mb or as per your requirement

app.use(express.static(path.join(__dirname, 'build'))); // Serve your React App

const filePath = path.join(__dirname, 'prompts.json');

const dataFilePath = path.join(__dirname, 'data.json');

app.post('/api/saveData', (req, res) => {
    fs.writeFile(dataFilePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).send('Error writing to the file');
      }
      res.send('Data saved successfully');
    });
  });

  app.get('/api/loadData', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send('Error reading the file');
      }
      res.send(data);
    });
  });
  
  


// Endpoint to get prompts
app.get('/api/prompts', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading the file');
    }
    res.send(data);
  });
});

// Endpoint to save prompts
app.post('/api/prompts', (req, res) => {
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf8', (err) => {
    if (err) {
      return res.status(500).send('Error writing to the file');
    }
    res.send('Prompts saved successfully');
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


const messageFilePath = path.join(__dirname, 'messageContext.json');


app.post('/api/saveContext', (req, res) => {
    const { messageTree, pdfFileReferences, contextName } = req.body;
  
    console.log('Received PDF File References:', pdfFileReferences); // Debugging log
  
    const updatedPdfFileReferences = pdfFileReferences.map(fileRef => {
      return {
        ...fileRef,
        numPages: fileRef.numPages || null, // Fallback to null if numPages is not provided
        selectedPages: fileRef.selectedPages || null, // Fallback to null if selectedPages is not provided
        fileName: fileRef.fileName || null, // Fallback to null if fileName is not provided
        // ... other properties as needed
      };
    });
    console.log('Updated PDF File References:', updatedPdfFileReferences); // Debugging log
  
    const context = {
      messageTree,
      pdfFileReferences: updatedPdfFileReferences,
    };
  
    const contextFilePath = path.join(__dirname, `context_${contextName}.json`);
    fs.writeFile(contextFilePath, JSON.stringify(context, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).send('Error writing the chat context to the file');
      }
      res.send(`Chat context '${contextName}' saved successfully`);
    });
  });
  
  
  

  app.get('/api/loadContext/:contextName', (req, res) => {
    const { contextName } = req.params;
    const contextFilePath = path.join(__dirname, `context_${contextName}.json`);
  
    fs.readFile(contextFilePath, 'utf8', (err, data) => {
      if (err) {
        return res.status(404).send(`Chat context '${contextName}' not found`);
      }
      res.send(data);
    });
  });
  
  app.get('/api/contexts', (req, res) => {
    console.log('Received request to fetch context names'); // Log when a request is received

    const contextDirectory = path.join(__dirname);
    fs.readdir(contextDirectory, (err, files) => {
        if (err) {
            console.error('Error reading the directory:', err); // Log the error if directory reading fails
            return res.status(500).send('Error reading the directory');
        }
        
        console.log('Scanning for context files...'); // Log the process of scanning for context files
        const contextFiles = files
            .filter(file => file.startsWith('context_') && file.endsWith('.json'))
            .map(file => {
                console.log('Found context file:', file); // Log each found context file
                return file.replace('context_', '').replace('.json', '');
            });

        if (contextFiles.length === 0) {
            console.log('No context files found'); // Log if no context files are found
        } else {
            console.log('Context names retrieved:', contextFiles); // Log the list of context names
        }

        res.json(contextFiles);
    });
});



  app.post('/api/uploadPdf', bodyParser.json({ limit: '50mb' }), async (req, res) => {
    const { base64Pdf, fileName } = req.body;
  
    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
  
    // Convert Base64 to a Buffer
    const buffer = Buffer.from(base64Pdf, 'base64');
  
    // Save the buffer as a file
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        return res.status(500).send('Error saving PDF file');
      }
  
      // Construct a URL to access the file
      // Replace 'localhost:3001' with your actual host and port if different
      const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(fileName)}`;
      res.json({ fileUrl: fileUrl });
    });
  });
  

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

