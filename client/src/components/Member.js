import React from "react";
import { Card, CardContent, Typography, styled } from "@mui/material";

const StyledCard = styled(Card)(() => ({
  position: "relative",
  margin: "10px",
  width: "200px",
  height: "250px",
  textAlign: "center",
  flex: "0 0 auto",
  backgroundColor: "rgba(0,0,0,0.2)",
  color: "white",
  transition: "transform 0.2s",
  "&:active": {
    transform: "scale(0.95)",
  },
}));

const StyledImg = styled("img")({
  width: "100%",
  height: "auto",
  borderRadius: "50%",
});

const OnlineIndicator = styled("div")({
  position: "absolute",
  top: "10px",
  right: "10px",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: "green",
});

function Member({ userId, username, photoUrl, onClick }) {
  return (
    <StyledCard onClick={onClick}>
      {<OnlineIndicator />}
      <CardContent>
        <StyledImg src={photoUrl} alt={username} />
        <Typography style={{ fontSize: "17px" }} component="div">
          {username}
        </Typography>
        <Typography color="text.secondary">{userId}</Typography>
      </CardContent>
    </StyledCard>
  );
}

export default Member;
