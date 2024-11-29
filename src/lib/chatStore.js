import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null, // Current chat ID
  user: null, // User data for one-on-one chats
  isGroupChat: false, // Flag to indicate group chat
  isCurrentUserBlocked: false, // Flag for current user being blocked
  isReceiverBlocked: false, // Flag for receiver being blocked

  /**
   * Change the current chat
   * @param {string} chatId - The chat ID
   * @param {object|null} user - The user object for one-on-one chats
   * @param {boolean} isGroupChat - Whether it's a group chat
   */
  changeChat: (chatId, user = null, isGroupChat = false) => {
    const currentUser = useUserStore.getState().currentUser;

    if (isGroupChat) {
      // Group chat logic (no blocking checks required)
      return set({
        chatId,
        user: null, // No specific user for group chats
        isGroupChat: true,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }

    if (user && user.blocked) {
      // One-on-one chat blocking logic
      if (user.blocked.includes(currentUser.id)) {
        // Current user is blocked by the other user
        return set({
          chatId,
          user: null,
          isGroupChat: false,
          isCurrentUserBlocked: true,
          isReceiverBlocked: false,
        });
      } else if (currentUser.blocked.includes(user.id)) {
        // Current user has blocked the other user
        return set({
          chatId,
          user,
          isGroupChat: false,
          isCurrentUserBlocked: false,
          isReceiverBlocked: true,
        });
      }
    }

    // Default case: no blocking
    set({
      chatId,
      user,
      isGroupChat: false,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },

  /**
   * Toggle block status for the receiver
   */
  changeBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },

  /**
   * Reset the current chat state
   */
  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isGroupChat: false,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
