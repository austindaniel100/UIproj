import { pdfjs } from 'react-pdf';

const YOUR_GENERATED_SECRET = process.env.REACT_APP_YOUR_GENERATED_SECRET;




const compilePdfContext = async (pdfs) => {
  let contextString = "";

  // Check if pdfs is defined and is an array
  if (!Array.isArray(pdfs)) {
    console.error("Invalid or undefined 'pdfs' array:", pdfs);
    return contextString;
  }

  for (const pdf of pdfs) {
    // Only process if there are selected pages
    if (pdf.selectedPages && pdf.selectedPages.size > 0) {
      const loadingTask = pdfjs.getDocument(pdf.file);
      try {
        const doc = await loadingTask.promise;
        for (const pageNumber of pdf.selectedPages) {
          const page = await doc.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          contextString += `Page ${pageNumber} of ${pdf.fileName}: ${pageText}\n\n`;
        }
      } catch (error) {
        console.error(`Error loading page content from PDF: ${pdf.fileName}`, error);
      } finally {
        loadingTask.destroy();
      }
    }
  }

  return contextString.trim();
};




const generateConversationLists = (currentMessage, messagesTree) => {
    let conversationList = [];
    let otherMessagesList = [];
    const visitedMessages = new Set();
  
    // Helper function to check if a node is an ancestor of the current message

  
    // Trace back through the current message's ancestors
    let ancestorMessage = currentMessage;
    while (ancestorMessage) {
      if (ancestorMessage.inContext || ancestorMessage.id === currentMessage.id) {
        conversationList.unshift(ancestorMessage);
      }
      ancestorMessage = ancestorMessage.parent;
    }
  
    // Helper function to traverse the entire tree
    const traverseTree = (node) => {
      if (!node || visitedMessages.has(node)) return;
      visitedMessages.add(node);
  
      // Check if the node is not an ancestor of the current message and inContext is true
      if (node.inContext) {
        otherMessagesList.push(node);
      }
  
      // Traverse children
      if (node.children) {
        node.children.forEach(child => traverseTree(child));
      }
    };
  
    // Traverse the entire tree to find other in-context messages
    traverseTree(messagesTree);
    otherMessagesList = otherMessagesList.filter(msg => !conversationList.includes(msg));

    // console.log("************************************************************************************************");
    // console.log("conversationList: ", conversationList);
    // console.log("otherMessagesList: ", otherMessagesList);
  
    return { conversationList, otherMessagesList };
  };
  
  const getConversationHistory = (currentMessage, messagesTree) => {
    const { conversationList, otherMessagesList } = generateConversationLists(currentMessage, messagesTree);
  
    const conversationString = listToString(conversationList);
    const otherMessagesString = listToString(otherMessagesList);
  
    return conversationString + "\n\notherMessages:\n" + otherMessagesString;
  };
  
  // Function to convert a list of messages to a string
  const listToString = (messageList) => {
    return messageList.map(message => `${message.sender}: ${message.message}`).join('\n').trim();
  };

  const callApiNoStream = async (fullPrompt, useApi) => {
    try {
      const resp = await fetch('https://api.promptperfect.jina.ai/tcok9OGA8BjFBzPp2KqR', {
        headers: {
          'x-api-key': `token ${YOUR_GENERATED_SECRET}`,
          'content-type': 'application/json'
        }, 
        body: JSON.stringify({"parameters": {"prompt":fullPrompt}}),
        method: 'POST'
      });

    if (!resp.ok) {
      throw new Error('Http error: ' + resp.status);
    }

    const data = await resp.json();
    console.log(data);
    return data;
  } catch (error) {
    console.log("failed to fetch bot reply: ", error);
    return "";
  }

  };
  


  const callApi = async (fullPrompt, useApi, updateBotMessage) => {
    console.log("\n\n\n\n\n\nCALLING API\n\n\n\n\n\n\n");
    console.log("fullPrompt: ", fullPrompt);
    try {
      console.log("OK DOING IT NOW");
        if (!useApi) {
            console.log("sadfhadsghd43");
            throw new Error("API usage is turned off");
        }
        console.log("sadfhadsghd432");
        
        const resp = await fetch('https://api.promptperfect.jina.ai/RlYg9Ir63bt7Sr1w1b34', {
          headers: {
            'x-api-key': `token ${YOUR_GENERATED_SECRET}`,
            'content-type': 'application/json'
          }, 
          body: JSON.stringify({"parameters": {"prompt":fullPrompt}}),
          method: 'POST'
        });

        console.log("1");

        if (!resp.ok) {
            throw new Error('Http error: ' + resp.status);
        }
        console.log("1");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        console.log("1");

        while (true) {
            const {done, value} = await reader.read();

            if (done) {
                break;
            }

            if (value) {
                const streamData = decoder.decode(value);
                const events = streamData.split('\n\n');

                events.forEach(event => {
                    const data = event.replace(/data: /g, '');
                    // console.log(data);

                    if (data) {
                        // For now, just append the data. Adjust this if needed.
                        fullResponse += data;
          
                        updateBotMessage(fullResponse);
                    }
                });
            }
        }
        console.log("1");
        console.log("fullResponse: ", fullResponse);

        return fullResponse; // This will return the full concatenated response from the stream.

    } catch (error) {
        console.error("failed to fetch bot reply: ", error);
        updateBotMessage("API call failed or is not turned on.  Default bot response. AHHH\n\nExtra lines to make the message more normal\n\n\n# header to show markdown\n\n## header2 to show more\n\n### codeblock: \n```python\n\nimport stuff\n\ndef code():\n\treturn 1");
        return "API call failed or is not turned on.  Default bot response. AHHH\n\nExtra lines to make the message more normal\n\n\n# header to show markdown\n\n## header2 to show more\n\n### codeblock: \n```python\n\nimport stuff\n\ndef code():\n\treturn 1";
    }
  };



const getBotReply = async (input, currentMessage, messagesTree, pdfs, useApi, updateBotMessage, useContext = true) => {
    console.log("INPUT: ", input);
    console.log("PDFS: ", pdfs);
    console.log("SDHFSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD");
    let fullPrompt = "";
    console.log(useContext);
    if (useContext) {
      const pdfsString = await compilePdfContext(pdfs);
      console.log(pdfsString);
      // const pdfsString = ""

      const conversationHistory = getConversationHistory(currentMessage, messagesTree);
      console.log(conversationHistory);
      if (pdfsString !== "") {
        console.log("HOW????");
        fullPrompt = fullPrompt +  "#PDFS: " + pdfsString
      }
      if (conversationHistory !== "") {
        console.log("HOW????!!");
        fullPrompt = fullPrompt +  "#Conversation History: " + conversationHistory
      }
      fullPrompt = fullPrompt + "\n#user: " + input + "\nbot: ";
      console.log("\n\nFULL")
      console.log(fullPrompt);
    }

    return callApi(fullPrompt, useApi, updateBotMessage);


    
};




export default {
  getBotReply,
  callApi,
  callApiNoStream
};
