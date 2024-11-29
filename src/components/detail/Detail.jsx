// Detail.jsx
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";
import { useEffect, useState } from "react";
import upload from "../../lib/upload";

const Detail = () => {
  const {
    chatId,
    user,
    isGroupChat,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
    resetChat,
  } = useChatStore();

  const { currentUser, changeCurrentUser } = useUserStore();
  const [groupMembers, setGroupMembers] = useState([]);

  // State variables to control visibility of options
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showPrivacyHelp, setShowPrivacyHelp] = useState(false);
  const [showSharedPhotos, setShowSharedPhotos] = useState(false);
  const [showSharedFiles, setShowSharedFiles] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [newAbout, setNewAbout] = useState(currentUser?.about || "");
  const [newAvatar, setNewAvatar] = useState(null);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (isGroupChat && chatId) {
        const groupDocRef = doc(db, "groups", chatId);
        const groupDocSnap = await getDoc(groupDocRef);

        if (groupDocSnap.exists()) {
          const group = groupDocSnap.data();
          const members = group.members;

          const memberPromises = members.map(async (memberId) => {
            const userDocRef = doc(db, "users", memberId);
            const userDocSnap = await getDoc(userDocRef);
            return userDocSnap.data();
          });

          const membersData = await Promise.all(memberPromises);
          setGroupMembers(membersData);
        }
      }
    };

    fetchGroupMembers();
  }, [chatId, isGroupChat]);

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      if (isReceiverBlocked) {
        await updateDoc(userDocRef, {
          blocked: arrayRemove(user.id),
        });
      } else {
        await updateDoc(userDocRef, {
          blocked: arrayUnion(user.id),
        });
      }

      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      resetChat();
    } catch (err) {
      console.log(err);
    }
  };

  // Toggle function for options
  const toggleOption = (option) => {
    switch (option) {
      case "chatSettings":
        setShowChatSettings(!showChatSettings);
        break;
      case "privacyHelp":
        setShowPrivacyHelp(!showPrivacyHelp);
        break;
      case "sharedPhotos":
        setShowSharedPhotos(!showSharedPhotos);
        break;
      case "sharedFiles":
        setShowSharedFiles(!showSharedFiles);
        break;
      default:
        break;
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setNewAvatar(e.target.files[0]);
    }
  };

  const handleAboutChange = (e) => {
    setNewAbout(e.target.value);
  };

  const handleSaveAbout = async () => {
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        about: newAbout,
      });
      changeCurrentUser({ ...currentUser, about: newAbout });
      setEditingAbout(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSaveAvatar = async () => {
    try {
      if (newAvatar) {
        const avatarUrl = await upload(newAvatar);
        await updateDoc(doc(db, "users", currentUser.id), {
          avatar: avatarUrl,
        });
        changeCurrentUser({ ...currentUser, avatar: avatarUrl });
        setNewAvatar(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="detail">
      {isGroupChat ? (
        <div className="group">
          <h2>Group Chat</h2>
          <p>
            {groupMembers.length} member{groupMembers.length > 1 ? "s" : ""}
          </p>
          <div className="members">
            {groupMembers.map((member) => (
              <div className="member" key={member.id}>
                <img src={member.avatar || "./avatar.png"} alt="" />
                <span>{member.username}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <h2>{user?.username}</h2>
          <p>
            {isCurrentUserBlocked
              ? "You are blocked"
              : isReceiverBlocked
              ? "You have blocked this user"
              : "Online"}
          </p>
        </div>
      )}
      <div className="info">
        <div className="option" onClick={() => toggleOption("chatSettings")}>
          <div className="title">
            <span>Settings</span>
            <img src={showChatSettings ? "./arrowDown.png" : "./arrowUp.png"} alt="" />
          </div>
          {showChatSettings && (
            <div className="content">
              {/* Profile option */}
              <div className="profile-option" onClick={() => setShowProfile(true)}>
                <span>Profile</span>
                <img src="./arrowRight.png" alt="" />
              </div>
            </div>
          )}
        </div>
        <div className="option" onClick={() => toggleOption("privacyHelp")}>
          <div className="title">
            <span>Privacy & help</span>
            <img src={showPrivacyHelp ? "./arrowDown.png" : "./arrowUp.png"} alt="" />
          </div>
          {showPrivacyHelp && (
            <div className="content">
              {/* Add your privacy and help content here */}
              <p>Privacy and help content goes here</p>
            </div>
          )}
        </div>
        <div className="option" onClick={() => toggleOption("sharedPhotos")}>
          <div className="title">
            <span>Shared photos</span>
            <img src={showSharedPhotos ? "./arrowDown.png" : "./arrowUp.png"} alt="" />
          </div>
          {showSharedPhotos && (
            <div className="content">
              {/* Add your shared photos content here */}
              <p>Shared photos content goes here</p>
            </div>
          )}
        </div>
        <div className="option" onClick={() => toggleOption("sharedFiles")}>
          <div className="title">
            <span>Shared Files</span>
            <img src={showSharedFiles ? "./arrowDown.png" : "./arrowUp.png"} alt="" />
          </div>
          {showSharedFiles && (
            <div className="content">
              {/* Add your shared files content here */}
              <p>Shared files content goes here</p>
            </div>
          )}
        </div>

        {/* Profile window */}
      {showProfile && (
        <div className="profile-window">
          <div className="profile-header">
            <button onClick={() => setShowProfile(false)}>Back</button>
            <h2>Profile</h2>
          </div>
          <div className="profile-content">
            <div className="avatar-section">
              <img src={currentUser?.avatar || "./avatar.png"} alt="Avatar" />
              <input type="file" onChange={handleAvatarChange} />
              <button onClick={handleSaveAvatar}>Save Avatar</button>
            </div>
            <div className="about-section">
              <h3>About</h3>
              {editingAbout ? (
                <>
                  <input type="text" value={newAbout} onChange={handleAboutChange} />
                  <button onClick={handleSaveAbout}>Save</button>
                </>
              ) : (
                <>
                  <p>{currentUser?.about || "No about information"}</p>
                  <button onClick={() => setEditingAbout(true)}>Edit</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
        {!isGroupChat && (
          <button onClick={handleBlock}>
            {isCurrentUserBlocked
              ? "You are Blocked!"
              : isReceiverBlocked
              ? "Unblock User"
              : "Block User"}
          </button>
        )}
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;