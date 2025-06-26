import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Message from './Message';
import WeatherCard from './WeatherCard';
import './Chat.css';
import { TextField, IconButton, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your weather assistant. Ask me about current weather or forecasts.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    const city = extractCity(input);
    if (!city) {
      setMessages(prev => [...prev, { text: "Please specify a city name.", sender: 'bot' }]);
      return;
    }
    const isForecast = input.toLowerCase().includes('forecast');
    try {
      // Send to your Node.js backend (which connects to Dialogflow)
      const response = await axios.post('http://localhost:3000/webhook', {
        queryResult: {
          queryText: input,
          parameters: {
            'geo-city': city,
            'date': extractDate(input)
          },
          intent: {
            displayName: isForecast ? '8DayForecastIntent' : 'CurrentWeatherIntent'
          }
        }
      });

      // Add bot response
      const botMessage = { 
        text: response.data.fulfillmentText, 
        sender: 'bot',
        isWeather: response.data.fulfillmentText.includes('°C') || 
                  response.data.fulfillmentText.includes('forecast')
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the weather service.", 
        sender: 'bot' 
      }]);
    }
  };

  // Simple extraction helpers (Dialogflow normally handles this)
  const extractCity = (text) => {
    const cities = [
      'London', 'Paris', 'New York', 'Tokyo', 'Islamabad', 'Lahore', 'Karachi', 'Beijing', 'Delhi', 'Berlin', 'Sydney', 'Toronto', 'Moscow', 'Dubai', 'Rome', 'Madrid', 'Istanbul', 'Cairo', 'Bangkok', 'Singapore'
    ]; // Add more as needed
    return cities.find(city => text.toLowerCase().includes(city.toLowerCase())) || '';
  };

  const extractDate = (text) => {
    const dateKeywords = ['today', 'tomorrow', 'Monday', 'Tuesday', 'Wednesday', 
                         'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dateKeywords.find(keyword => text.includes(keyword)) || '';
  };

  return (
    <Box className="chat-outer-container">
      <Box className="chat-header">
        AI Weather Chatbot
      </Box>
      <Box className="chat-container">
        <Box className="messages-container">
          {messages.map((message, index) => (
            message.isWeather ? (
              <WeatherCard key={index} text={message.text} sender={message.sender} />
            ) : (
              <Message key={index} text={message.text} sender={message.sender} />
            )
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <Box className="input-container">
          <TextField
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about weather..."
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;