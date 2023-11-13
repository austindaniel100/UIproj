
const YOUR_GENERATED_SECRET = process.env.REACT_APP_YOUR_GENERATED_SECRET;
const useApi = false;

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
  



const getBotReply = async (input, currentMessage, messagesTree) => {

    const conversationHistory = getConversationHistory(currentMessage, messagesTree);
    const fullPrompt = "#Conversation: " + conversationHistory + "\n#user: " + input + "\nbot: ";
    console.log("\n\nFULL")
    console.log(fullPrompt);

    try {
        if (!useApi) {
            throw new Error("API usage is turned off");
        }
        
        const resp = await fetch('https://api.promptperfect.jina.ai/RlYg9Ir63bt7Sr1w1b34', {
            headers: {
                'x-api-key': `token ${YOUR_GENERATED_SECRET}`,
                'content-type': 'application/json'
            }, 
            body: JSON.stringify({"parameters": {"prompt": fullPrompt}}),
            method: 'POST'
        });

        if (!resp.ok) {
            throw new Error('Http error: ' + resp.status);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

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

                    if (data) {
                        // For now, just append the data. Adjust this if needed.
                        fullResponse += data;
                    }
                });
            }
        }

        return fullResponse; // This will return the full concatenated response from the stream.
    } catch (error) {
        console.error("failed to fetch bot reply: ", error);
        return "API call failed or is not turned on.  Default bot response.\n\nExtra lines to make the message more normal\n\n\n# header to show markdown\n\n## header2 to show more\n\n### codeblock: \n```python\n\nimport stuff\n\ndef code():\n\treturn 1";
    }
};


export default getBotReply;
