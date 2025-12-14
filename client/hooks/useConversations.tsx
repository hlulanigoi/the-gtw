import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
  messages: Message[];
}

interface ConversationsContextType {
  conversations: Conversation[];
  addMessage: (conversationId: string, message: Message) => void;
  markAsRead: (conversationId: string) => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(
  undefined
);

const initialConversations: Conversation[] = [
  {
    id: "1",
    userName: "Sarah M",
    lastMessage: "Great! I'll have the package ready by 10am",
    lastMessageTime: new Date(Date.now() - 1800000),
    unread: true,
    messages: [
      {
        id: "m1",
        text: "Hi! I saw your parcel listing from Boksburg to Kempton Park",
        isMe: true,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: "m2",
        text: "Yes! Are you interested in transporting it?",
        isMe: false,
        timestamp: new Date(Date.now() - 3000000),
      },
      {
        id: "m3",
        text: "Yes, I'm traveling that route tomorrow morning",
        isMe: true,
        timestamp: new Date(Date.now() - 2400000),
      },
      {
        id: "m4",
        text: "Great! I'll have the package ready by 10am",
        isMe: false,
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  },
  {
    id: "2",
    userName: "Michael K",
    lastMessage: "Thanks for delivering the package safely!",
    lastMessageTime: new Date(Date.now() - 86400000),
    unread: false,
    messages: [
      {
        id: "m1",
        text: "Package delivered successfully",
        isMe: true,
        timestamp: new Date(Date.now() - 90000000),
      },
      {
        id: "m2",
        text: "Thanks for delivering the package safely!",
        isMe: false,
        timestamp: new Date(Date.now() - 86400000),
      },
    ],
  },
];

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  const addMessage = (conversationId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: message.text,
              lastMessageTime: message.timestamp,
            }
          : conv
      )
    );
  };

  const markAsRead = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unread: false } : conv
      )
    );
  };

  return (
    <ConversationsContext.Provider
      value={{ conversations, addMessage, markAsRead }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      "useConversations must be used within a ConversationsProvider"
    );
  }
  return context;
}
