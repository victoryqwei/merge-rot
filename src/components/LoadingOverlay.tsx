import { Box, Center, Progress, Text, VStack } from "@chakra-ui/react";
import React from "react";

interface LoadingOverlayProps {
  progress: number; // 0-100
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, isVisible }) => {
  if (!isVisible) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.9)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center">
      <Center>
        <VStack spacing={6} maxW="400px" w="90%" textAlign="center">
          <Text color="white" fontSize="3xl" fontWeight="bold">
            Loading Game Assets
          </Text>

          <Text color="white" fontSize="lg" opacity={0.8}>
            Loading images and sounds...
          </Text>

          <Box w="100%" bg="rgba(255, 255, 255, 0.2)" borderRadius="full" p={1}>
            <Progress value={progress} colorScheme="blue" borderRadius="full" size="lg" hasStripe isAnimated />
          </Box>

          <Text color="white" fontSize="md" fontWeight="medium">
            {Math.round(progress)}%
          </Text>
        </VStack>
      </Center>
    </Box>
  );
};

export default LoadingOverlay;
