// pages/forbidden.tsx
import React from "react";
import { useRouter } from "next/router";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import BlockIcon from "@mui/icons-material/Block";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { keyframes } from "@mui/system";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ForbiddenPage: React.FC = () => {
  const router = useRouter();
  const errorMessage =
    typeof router.query.message === "string"
      ? router.query.message
      : "Sorry, you don't have permission to access this page.";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.body",
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          width: "100%",
          p: 4,
          borderRadius: "lg",
          bgcolor: "background.surface",
          boxShadow: "md",
          textAlign: "center",
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        <BlockIcon sx={{ fontSize: 96, color: "danger.400", mb: 2 }} />
        <Typography
          level="h1"
          component="h1"
          fontSize="xl"
          mb={1}
          color="danger"
        >
          Access Denied
        </Typography>
        <Typography level="body-lg" mb={3}>
          {errorMessage}
        </Typography>
        <Button
          variant="soft"
          size="lg"
          color="primary"
          endDecorator={<ArrowForwardIcon />}
          onClick={() => router.push("/configuration/warehouse")}
        >
          Go to Warehouse Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default ForbiddenPage;
