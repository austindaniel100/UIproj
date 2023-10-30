const YOUR_GENERATED_SECRET = process.env.REACT_APP_YOUR_GENERATED_SECRET;

const getConversationHistory = (currentMessage, messagesTree) => {
    let conversation = "";

    // If there's a current message, trace back through its ancestors.
    while (currentMessage) {
        console.log("AHDSFAHDFHASDHADHDHASHDASHD current: " + currentMessage.message);
        // console.log("sdafklhdsaklfhsdklfhslkdfh parent: " + currentMessage.parent.message);
        conversation = currentMessage.sender + ": " +  currentMessage.message + "\n" + conversation;
        currentMessage = currentMessage.parent;
    }

    // Add the root message if it exists.
    if (messagesTree.message) {
        conversation = messagesTree.message + "\n" + conversation;
    }

    return conversation.trim();
};


const getBotReply = async (input, currentMessage, messagesTree) => {

    const conversationHistory = getConversationHistory(currentMessage, messagesTree);
    const fullPrompt = "#Conversation: " + conversationHistory + "\n#user: " + input + "\nbot: ";
    console.log("\n\nFULL")
    console.log(fullPrompt);

    try {
        const resp = await fetch('https://api.promptperfect.jina.ai/RlYg9Ir63bt7Sr1w1b34', {
            headers: {
                'x-api-key': `token ${YOUR_GENERATED_SECRET + "1"}`,
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
        return "API call failed or is not turned on.  Default bot response.\n\nExtra lines to make the message more normal\n\n\n# header to show markdown\n\n## header2 to show more\n\n### codeblock: \n```import stuff\n\ndef code():\n\treturn 1";
    }
};


export default getBotReply;
