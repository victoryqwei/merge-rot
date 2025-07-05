import React from "react";
import { Center, VStack, Text, Button, HStack, Box } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { BiTrophy } from "react-icons/bi";

interface LeaderboardOverlayProps {
  setShowLeaderboard: (showLeaderboard: boolean) => void;
}

// Placeholder leaderboard data
const placeholderScores = [
  { rank: 1, name: "ChampionPlayer", score: 15420 },
  { rank: 2, name: "MergeKing", score: 12890 },
  { rank: 3, name: "PuzzleMaster", score: 11750 },
  { rank: 4, name: "RotExpert", score: 10320 },
  { rank: 5, name: "ComboQueen", score: 9840 },
  { rank: 6, name: "GameWizard", score: 8960 },
  { rank: 7, name: "SkillPlayer", score: 8210 },
  { rank: 8, name: "ProGamer", score: 7650 },
  { rank: 9, name: "TopScorer", score: 7120 },
  { rank: 10, name: "ElitePlayer", score: 6890 },
];

const LeaderboardOverlay: React.FC<LeaderboardOverlayProps> = observer(({ setShowLeaderboard }) => {
  const closeLeaderboard = () => {
    setShowLeaderboard(false);
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "yellow.400"; // Gold
      case 2:
        return "gray.300"; // Silver
      case 3:
        return "orange.400"; // Bronze
      default:
        return "white";
    }
  };

  return (
    <Center position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.800" zIndex={10}>
      <VStack>
        <VStack spacing={6} p={8} borderRadius="xl" maxW="400px" w="100%" maxH="80vh" overflowY="auto">
          <HStack spacing={2}>
            <BiTrophy size={32} color="gold" />
            <Text fontSize="3xl" fontWeight="bold" color="white" textAlign="center">
              Leaderboard
            </Text>
          </HStack>

          <VStack spacing={3} w="100%">
            {placeholderScores.map((entry) => (
              <Box
                key={entry.rank}
                w="100%"
                bg={entry.rank <= 3 ? "whiteAlpha.200" : "whiteAlpha.100"}
                borderRadius="lg"
                p={3}
                border={entry.rank <= 3 ? "2px solid" : "1px solid"}
                borderColor={entry.rank <= 3 ? getRankColor(entry.rank) : "whiteAlpha.300"}>
                <HStack justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Text fontSize="lg" fontWeight="bold" color={getRankColor(entry.rank)} minW="30px">
                      #{entry.rank}
                    </Text>
                    <Text fontSize="md" color="white" fontWeight={entry.rank <= 3 ? "bold" : "normal"} isTruncated maxW="200px">
                      {entry.name}
                    </Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color={getRankColor(entry.rank)}>
                    {entry.score.toLocaleString()}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </VStack>
        <Button
          colorScheme="gray"
          size="lg"
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.3s"
          onClick={closeLeaderboard}
          variant="outline"
          borderColor="white"
          color="white">
          Back
        </Button>
      </VStack>
    </Center>
  );
});

export default LeaderboardOverlay;
