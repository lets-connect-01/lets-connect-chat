// Groups.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useUserStore } from "../../../lib/userStore";
import { useChatStore } from "../../../lib/chatStore";
import "./groups.css";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.id !== currentUser.id);
      setAllUsers(usersData);
    };

    fetchUsers();
  }, [currentUser.id]);

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        if (res.data()) {
          const items = res.data().groups;
          const promises = Array.isArray(items)
  ? items.map(async (item) => {
      const groupDocRef = doc(db, "groups", item.groupId);
      const groupDocSnap = await getDoc(groupDocRef);
      const group = groupDocSnap.data();
      return { ...item, group };
    })
  : [];

          const groupData = await Promise.all(promises);
          setGroups(groupData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleCreateGroup = async () => {
    try {
      if (groupName.trim() === "" || selectedUsers.length === 0) {
        // Handle cases where group name is empty or no users are selected
        alert("Please enter a group name and select at least one user.");
        return;
      }

      const groupRef = collection(db, "groups");
      const newGroupRef = doc(groupRef);

      await setDoc(newGroupRef, {
        name: groupName,
        members: [currentUser.id, ...selectedUsers],
        messages: [],
        admin: currentUser.id,
        createdAt: serverTimestamp(),
      });

      const userChatsRef = collection(db, "userchats");
      [currentUser.id, ...selectedUsers].forEach(async (userId) => {
        const userChatsRef = doc(db, "userchats", userId);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          await updateDoc(userChatsRef, {
            groups: arrayUnion({
              groupId: newGroupRef.id,
              lastMessage: "",
              updatedAt: Date.now(),
            }),
          });
        } else {
          await setDoc(userChatsRef, {
            groups: arrayUnion({
              groupId: newGroupRef.id,
              lastMessage: "",
              updatedAt: Date.now(),
            }),
          });
        }
      });

      setGroupName("");
      setSelectedUsers([]);
      setAddMode(false);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSelect = async (group) => {
    const userChats = groups.map((item) => {
      const { groupId, lastMessage, updatedAt } = item;
      return { groupId, lastMessage, updatedAt };
    });

    const chatIndex = userChats.findIndex(
      (item) => item.groupId === group.groupId,
    );

    userChats[chatIndex].isSeen = true;
    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        groups: userChats,
      });

      changeChat(group.groupId, group.group, true);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="groups">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {addMode && (
        <div className="addGroup">
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <div className="userSelection">
            {allUsers.map((user) => (
              <label key={user.id}>
                <input
                  type="checkbox"
                  value={user.id}
                  onChange={(e) =>
                    setSelectedUsers((prev) =>
                      e.target.checked
                        ? [...prev, user.id]
                        : prev.filter((id) => id !== user.id),
                    )
                  }
                />
                {user.username}
              </label>
            ))}
          </div>
          <button onClick={handleCreateGroup}>Create Group</button>
        </div>
      )}
      {groups.map((group, index) => (
        <div
          className="group"
          key={index}
          onClick={() => handleSelect(group)}
          style={{
            backgroundColor: group?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <span>{group.group.name}</span>
          <span>{group.group.members.length} members</span>
        </div>
      ))}
    </div>
  );
};

export default Groups;