import React from 'react';
import { Box, Typography } from '@mui/material';

const Message = ({ text, sender }) => {
  return (
    <Box className={`message-bubble ${sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
      <Typography variant="body1">{text}</Typography>
    </Box>
  );
};

export default Message;