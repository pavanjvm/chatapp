import React, { useEffect, useState, useRef, useCallback } from "react"; 
import { useChatState } from "../../context/chatProvider";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "../ChatLoading";
import { getSender } from "../../config/chatLogic";
import GroupChatModal from "./GroupChatModal";

// Replace Socket.io endpoint with AWS WebSocket endpoint
const ENDPOINT = "wss://jzppq8whrk.execute-api.us-east-1.amazonaws.com/dev";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = useChatState();
  const toast = useToast();
  const webSocketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  // We're removing this unused variable:
  // const [socketConnected, setSocketConnected] = useState(false);
  
  // Only creating a local function for socket connection state
  // since we're not using the state anywhere else
  const setSocketConnected = (status) => {
    // This is just a local function now, not using state
    console.log(`Socket connection status: ${status}`);
  };

  // Function to send messages through WebSocket
  const sendWebSocketMessage = useCallback((message) => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected in MyChats, message not sent:", message);
      // We'll need to call connectWebSocket through the dependency array
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    console.log("Received WebSocket message in MyChats:", data);
    
    switch (data.action) {
      case "messageReceived":
        // Refresh chats list to show latest message
        fetchChats();
        break;
      
      default:
        console.log("Unhandled WebSocket message type in MyChats:", data.action);
    }
  }, []);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      webSocketRef.current = new WebSocket(ENDPOINT);

      webSocketRef.current.onopen = () => {
        console.log("WebSocket Connected in MyChats");
        setSocketConnected(true);
        reconnectAttempts.current = 0;
        
        // Send setup message with user info after connection
        if (user) {
          sendWebSocketMessage({
            action: "setup",
            userData: user
          });
        }
      };

      webSocketRef.current.onclose = () => {
        console.log("WebSocket Disconnected in MyChats");
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
            position: "bottom-left",
          });
        }
      };

      webSocketRef.current.onerror = (error) => {
        console.error("WebSocket Error in MyChats:", error);
      };

      webSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
    } catch (error) {
      console.error("WebSocket initialization error in MyChats:", error);
    }
  }, [user, toast, sendWebSocketMessage, handleWebSocketMessage]);

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`https://lockin.sbs/api/chat`, config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to Load Chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  }, [user?.token, setChats, toast]);

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
  }, [fetchChats, fetchAgain]);

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
    };
  }, [connectWebSocket]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="black"
      color="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.600"
    >
      {/* HEADER */}
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "24px", md: "28px" }}
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
        fontWeight="bold"
        borderBottom="1px solid gray"
      >
        My Chats
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "14px", md: "16px" }}
            bg="white"
            color="black"
            rightIcon={<AddIcon />}
            _hover={{ bg: "gray.300" }}
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      {/* CHAT LIST */}
      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="gray.900"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
        border="1px solid gray"
      >
        {chats ? (
          <Stack overflowY="scroll">
            {chats.map((chat) => {
              const sender = loggedUser && chat.users ? getSender(loggedUser, chat.users) : "Unknown";

              return (
                <Box
                  key={chat?._id}
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={selectedChat === chat ? "gray.600" : "gray.800"}
                  color="white"
                  px={4}
                  py={3}
                  borderRadius="lg"
                  transition="all 0.3s"
                  _hover={{
                    bg: "gray.700",
                    transform: "scale(1.02)",
                  }}
                >
                  <Text fontWeight="bold">{sender}</Text>
                  {chat.latestMessage && (
                    <Text fontSize="xs" opacity="0.8">
                      <b>{chat.latestMessage?.sender?.name || "Unknown"}:</b>{" "}
                      {chat.latestMessage?.content?.length > 50
                        ? chat.latestMessage.content.substring(0, 51) + "..."
                        : chat.latestMessage?.content || ""}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>
    </Box>
  );
};

export default MyChats;