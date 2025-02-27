import React, { useEffect, useState, useRef, useCallback } from "react"; 
import { useChatState } from "../../context/chatProvider";
import { Box, Button, Stack, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { AddIcon } from "@chakra-ui/icons";
import ChatLoading from "../ChatLoading";
import { io } from "socket.io-client";
import { getSender } from "../../config/chatLogic";
import GroupChatModal from "./GroupChatModal";

const ENDPOINT = "http://localhost:5000"; 

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { selectedChat, setSelectedChat, user, chats, setChats } = useChatState();
  const toast = useToast();
  const socketRef = useRef(null);

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get("/api/chat", config);
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

    socketRef.current = io(ENDPOINT);
    socketRef.current.on("message received", () => fetchChats());

    return () => socketRef.current?.disconnect();
  }, [fetchChats, fetchAgain]);

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
