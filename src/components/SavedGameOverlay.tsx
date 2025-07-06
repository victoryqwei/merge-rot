import {
  Box,
  Button,
  Text,
  VStack,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import React from "react";
import { FaGamepad, FaTrash } from "react-icons/fa";

interface SavedGameOverlayProps {
  onRestore: () => void;
  onStartFresh: () => void;
}

const SavedGameOverlay: React.FC<SavedGameOverlayProps> = ({ onRestore, onStartFresh }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");

  return (
    <Modal isOpen={true} onClose={() => {}} closeOnOverlayClick={false} isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent bg={bgColor} color={textColor} mx={4} maxW="400px">
        <ModalHeader textAlign="center">
          <VStack spacing={2}>
            <Box fontSize="3xl">
              <FaGamepad />
            </Box>
            <Text fontSize="xl" fontWeight="bold">
              Saved Game Found!
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={4}>
            <Text textAlign="center" fontSize="md" color="gray.500">
              We found a saved game from your previous session. Would you like to continue where you left off?
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <VStack spacing={3} width="100%">
            <Button colorScheme="blue" size="lg" width="100%" onClick={onRestore} leftIcon={<FaGamepad />}>
              Continue Game
            </Button>

            <Button variant="outline" size="md" width="100%" onClick={onStartFresh} leftIcon={<FaTrash />} colorScheme="red">
              Start Fresh
            </Button>
          </VStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SavedGameOverlay;
