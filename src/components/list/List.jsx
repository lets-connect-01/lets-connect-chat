import Chatlist from "./chatList/Chatlist";
import Groups from "./groups/Groups";
import Userinfo from "./userInfo/Userinfo";
import Chatbot from "./aiChatBot/Chatbot"; // Import the Chatbot component
import "./list.css";
import { useState } from "react";

const List = () => {
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <div className='list'>
      <Userinfo />
      <div className="tab-buttons">
        <button
          className={activeTab === "chats" ? "active" : ""}
          onClick={() => setActiveTab("chats")}
        >
          Chats
        </button>
        <button
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>
        <button
          className={activeTab === "chatbot" ? "active" : ""}
          onClick={() => setActiveTab("chatbot")}
        >
          Chatbot
        </button>
      </div>
      <div className="chats-container">
        {activeTab === "chats" && <Chatlist />}
        {activeTab === "groups" && <Groups />}
        {activeTab === "chatbot" && <Chatbot />} {/* Render Chatbot */}
      </div>
    </div>
  );
};

export default List;