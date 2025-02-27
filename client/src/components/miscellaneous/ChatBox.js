import React from "react";
import { useChatState } from "../../context/chatProvider";
import { Box } from "@chakra-ui/react";
import SingleChat from "../SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = useChatState();

  return (
    <Box
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={4}
      bg="#121212" // Darker background
      w={{ base: "100%", md: "68%" }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor="gray.700"
      color="white"
      boxShadow="lg"
    >
      {/* Chatbox Header */}
      <Box
        w="100%"
        textAlign="center"
        fontSize="lg"
        fontWeight="bold"
        borderBottom="1px solid gray"
        pb={2}
      >
        {selectedChat ? "Chat Room" : "Select a Chat to Start"}
      </Box>

      {/* Single Chat Component */}
      <Box
        flex="1"
        w="100%"
        overflowY="auto"
        bg="#1E1E1E" // Grayish chat background
        borderRadius="lg"
        p={4}
        mt={2}
        border="1px solid gray"
        boxShadow="md"
      >
        <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      </Box>
    </Box>
  );
};

export default ChatBox;
