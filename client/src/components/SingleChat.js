import React, { useEffect, useState, useCallback, useRef } from "react";
import { useChatState } from "../context/chatProvider";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/chatLogic";
import ProfileModals from "./miscellaneous/ProfileModals";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import axios from "axios";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

// Replace Socket.io endpoint with AWS WebSocket endpoint
const ENDPOINT = "wss://jzppq8whrk.execute-api.us-east-1.amazonaws.com/dev";

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    useChatState();
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const toast = useToast();

  // WebSocket reference
  const webSocketRef = useRef(null);
  const selectedChatCompare = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const typingTimeout = useRef(null);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAscpectRatio: "xMidYMid slice",
    },
  };

  // Function to send messages through WebSocket
  const sendWebSocketMessage = useCallback((message) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, message not sent:", message);
      // Attempt to reconnect if disconnected - we'll provide connectWebSocket via dependency array
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    console.log("Received WebSocket message:", data);
    
    switch (data.action) {
      case "connected":
        console.log("Setup confirmed by server");
        break;
        
      case "typing":
        if (data.room === selectedChat?._id) {
          setIsTyping(true);
        }
        break;
      
      case "stopTyping":
        if (data.room === selectedChat?._id) {
          setIsTyping(false);
        }
        break;
      
      case "messageReceived":
        const newMessageReceived = data.message;
        
        if (
          !selectedChatCompare.current ||
          selectedChatCompare.current._id !== newMessageReceived.chat._id
        ) {
          // If chat is not selected or doesn't match current chat
          if (!notification.includes(newMessageReceived)) {
            setNotification([newMessageReceived, ...notification]);
            setFetchAgain(!fetchAgain);
          }
        } else {
          // Add message to current chat
          setMessages((prevMessages) => [...prevMessages, newMessageReceived]);
        }
        break;
      
      default:
        console.log("Unhandled WebSocket message type:", data.action);
    }
  }, [selectedChat, notification, setNotification, fetchAgain, setFetchAgain]);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      webSocketRef.current = new WebSocket(ENDPOINT);

      webSocketRef.current.onopen = () => {
        console.log("WebSocket Connected");
        setSocketConnected(true);
        reconnectAttempts.current = 0;
        
        // Send setup message with user info after connection
        sendWebSocketMessage({
          action: "setup",
          userData: user
        });
      };

      webSocketRef.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setSocketConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connectWebSocket();
          }, timeout);
        } else {
          toast({
            title: "Connection Lost",
            description: "Failed to reconnect to chat server",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
      };

      webSocketRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      };

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
    } catch (error) {
      console.error("WebSocket initialization error:", error);
    }
  }, [user, toast, sendWebSocketMessage, handleWebSocketMessage]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      // Clean up WebSocket connection and reconnection attempts
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [connectWebSocket]);

  // Join chat room when selected chat changes
  useEffect(() => {
    if (selectedChat && socketConnected) {
      sendWebSocketMessage({
        action: "joinChat",
        room: selectedChat._id
      });
    }
  }, [selectedChat, socketConnected, sendWebSocketMessage]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      
      // Join chat room via WebSocket
      if (socketConnected) {
        sendWebSocketMessage({
          action: "joinChat",
          room: selectedChat._id
        });
      }
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to load messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  }, [selectedChat, user, toast, socketConnected, sendWebSocketMessage]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare.current = selectedChat;
  }, [fetchMessages, selectedChat]);

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      // Stop typing indicator
      sendWebSocketMessage({
        action: "stopTyping",
        room: selectedChat._id
      });
      
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/message`,
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        
        // Send new message via WebSocket
        sendWebSocketMessage({
          action: "newMessage",
          newMessage: {
            ...data,
            chat: selectedChat,
            sender: user
          }
        });
        
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: "Failed to send message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const typingHandler = useCallback((e) => {
    setNewMessage(e.target.value);
    if (!socketConnected || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      sendWebSocketMessage({
        action: "typing",
        room: selectedChat._id
      });
    }

    // Clear existing timeout
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    const timerLength = 3000;
    typingTimeout.current = setTimeout(() => {
      if (typing) {
        sendWebSocketMessage({
          action: "stopTyping",
          room: selectedChat._id
        });
        setTyping(false);
      }
    }, timerLength);
  }, [socketConnected, selectedChat, typing, sendWebSocketMessage]);

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModals user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#1E1E1E"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            <FormControl onKeyDown={sendMessage} mt={3} isRequired>
              {isTyping && (
                <div>
                  <Lottie
                    options={defaultOptions}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a Message..."
                onChange={typingHandler}
                value={newMessage}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3}>
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;