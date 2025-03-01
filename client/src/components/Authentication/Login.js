import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom"; 
import axios from "axios";
//const REACT_APP_API_URL="http://localhost:5000"
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pshow, setPShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const history = useHistory(); 

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      history.push("/chats");
    }
  }, [history]);

  const handlePShow = () => setPShow(!pshow);

  const handleLogIn = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({
        title: "Please Fill All The Details!",
        status: "warning",
        duration: 5000,
        position: "bottom",
        isClosable: true,
      });
      setLoading(false);
      return;
    }
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/login`,
        { email, password },
        config
      );
      console.log("Backend URL:", process.env.REACT_APP_API_URL);
      const data = response.data;

      console.log("Login Response:", data); // Debug API Response

      toast({
        title: "Logged In Successfully!",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);

      // 🚀 Redirect Fix: Use window.location.href if history.push fails
      history.push("/chats");
      console.log("Redirecting to /chats...");
      setTimeout(() => {
        window.location.href = "/chats"; // Forceful redirect as a backup
      }, 1000);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: error.response?.data?.message || "Login failed",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  return (
    <VStack>
      <FormControl id="email" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>

      <FormControl id="password" isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup>
          <Input
            type={pshow ? "text" : "password"}
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <div className="icons" onClick={handlePShow}>
              {pshow ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
            </div>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button
        colorScheme="twitter"
        width="100%"
        style={{ marginTop: 15 }}
        onClick={handleLogIn}
        isLoading={loading}
      >
        Log In
      </Button>

      <Button
        colorScheme="teal"
        width="100%"
        variant="solid"
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
      >
        Get Guest Credentials
      </Button>
    </VStack>
  );
};

export default Login;
