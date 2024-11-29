import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const { currentUser } = useUserStore();
  const {
    chatId,
    user,
    isGroupChat,
    isCurrentUserBlocked,
    isReceiverBlocked,
  } = useChatStore();
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(
      doc(db, isGroupChat ? "groups" : "chats", chatId),
      (res) => {
        setChat({ id: res.id, ...res.data() });
      },
    );

    return () => {
      unSub();
    };
  }, [chatId, isGroupChat]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "" && !img.file) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      // Prepare message data without the createdAt field
      const messageData = {
        senderId: currentUser.id,
        senderName: currentUser.username,
        text,
        img: imgUrl || null, // Include image URL if exists
        createdAt: Timestamp.now(),
      };

      await updateDoc(doc(db, isGroupChat ? "groups" : "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      // Now, update the last message in userchats
      const userChatsRef = doc(db, "userchats", currentUser.id);
      const userChatsSnap = await getDoc(userChatsRef);
      const userChatsData = userChatsSnap.data();

      const chatIndex = userChatsData.chats?.findIndex((c) =>
        isGroupChat ? c.groupId === chatId : c.chatId === chatId,
      );

      if (chatIndex !== -1) {
        userChatsData.chats[chatIndex].lastMessage = text || imgUrl || "";
        userChatsData.chats[chatIndex].updatedAt = Date.now();

        await updateDoc(userChatsRef, {
          chats: userChatsData.chats,
        });
      }

      // If not a group chat, update the last message in receiver's userchats
      if (!isGroupChat) {
        const receiverChatsRef = doc(db, "userchats", user.id);
        const receiverChatsSnap = await getDoc(receiverChatsRef);
        const receiverChatsData = receiverChatsSnap.data();

        const receiverChatIndex = receiverChatsData.chats?.findIndex((c) =>
          isGroupChat ? c.groupId === chatId : c.chatId === chatId,
        );

        if (receiverChatIndex !== -1) {
          receiverChatsData.chats[receiverChatIndex].lastMessage =
            text || imgUrl || "";
          receiverChatsData.chats[receiverChatIndex].updatedAt = Date.now();

          await updateDoc(receiverChatsRef, {
            chats: receiverChatsData.chats,
          });
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });
      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          {isGroupChat ? (
            <>
              <img src="./group.png" alt="" />
              <div className="texts">
                <span>{chat?.name}</span>
                <p>{chat?.members?.length} members</p>
              </div>
            </>
          ) : (
            <>
              <img src={user?.avatar || "./avatar.png"} alt="" />
              <div className="texts">
                <span>{user?.username}</span>
                <p>
                  {isCurrentUserBlocked
                    ? "You are blocked"
                    : isReceiverBlocked
                    ? "You have blocked this user"
                    : "Online"}
                </p>
              </div>
            </>
          )}
        </div>

        {!isCurrentUserBlocked && !isGroupChat && (
          <div className="icons">
            <img src="./phone.png" alt="" />
            <img src="./video.png" alt="" />
            <img src="./info.png" alt="" />
          </div>
        )}
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={index}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              {isGroupChat && (
                <span className="senderName">{message.senderName}</span>
              )}
              {message.createdAt?.toDate && (
                <span>{format(message.createdAt.toDate())}</span>
              )}
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>

          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>

        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker open={open} onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={
            isCurrentUserBlocked || isReceiverBlocked || (text === "" && !img.file)
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
