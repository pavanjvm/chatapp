import { Avatar, Tooltip } from "@chakra-ui/react";

const ScrollableChat = ({ messages = [], user = {} }) => {
  return (
    <div 
      className="messages" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "10px",
        flex: 1,
        overflowY: "auto",
        padding: "10px"
      }}
    >
      {messages.map((msg) => {
        const isUserMessage = msg?.sender?._id === user?._id;

        return (
          <div
            key={msg?._id || Math.random()}
            style={{
              display: "flex",
              flexDirection: isUserMessage ? "row-reverse" : "row", // User messages on right, others on left
              alignItems: "center",
              justifyContent: isUserMessage ? "flex-end" : "flex-start", 
              marginBottom: "8px",
              gap: "8px",
            }}
          >
            {/* Avatar */}
            <Tooltip label={msg?.sender?.name} placement="top">
              <Avatar
                size="md"
                cursor="pointer"
                name={msg?.sender?.name}
                src={msg?.sender?.pic || ""}
              />
            </Tooltip>

            {/* Message Container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "60%",
                alignItems: isUserMessage ? "flex-end" : "flex-start",
              }}
            >
              {/* Sender's Name (only for others, NOT for the user) */}
              {!isUserMessage && (
                <span style={{ fontWeight: "bold", fontSize: "12px", color: "#ffffff" }}>
                  {msg?.sender?.name}
                </span>
              )}

              {/* Message Bubble */}
              <p
                style={{
                  background: isUserMessage ? "#38B2AC" : "#2D3748", // Teal for user, dark gray for others
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  maxWidth: "100%",
                  minWidth: "fit-content",
                  display: "inline-block",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  textAlign: "left",
                  fontSize: "14px",
                  marginTop: "3px",
                }}
              >
                {msg?.content || ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScrollableChat;