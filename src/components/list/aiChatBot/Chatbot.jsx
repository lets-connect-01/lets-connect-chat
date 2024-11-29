import React, { useState } from "react";
import "./chatbot.css"; // Create this CSS file for styling

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user's message to the chat
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response (you can replace this with actual API call)
    const aiResponse = await getAIResponse(input);
    setMessages((prev) => [...prev, aiResponse]);

    setInput(""); // Clear input field
  };

  const getAIResponse = async (userInput) => {
    // Simulate API call to AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ text: `AI: You said "${userInput}"`, sender: "ai" });
      }, 1000); // Simulated delay
    });
  };

  return (
    <div className="chatbot">
      <h2>Chatbot</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chatbot;