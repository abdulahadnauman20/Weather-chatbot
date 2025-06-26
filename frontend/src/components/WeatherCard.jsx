import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import './WeatherCard.css';

const WeatherCard = ({ text, sender }) => {
  // Detect if this is a multi-day forecast (from free API, up to 5-6 days)
  const isForecast = text.toLowerCase().includes('forecast');
  const lines = text.split('\n').filter(line => line.trim() !== '');

  // Try to parse forecast lines: expect format like '1. Mon: ☀️ Clear...'
  const forecastDays = isForecast
    ? lines.slice(1).map(line => {
        const match = line.match(/^(\d+)\.\s*([^:]+):\s*([\u2600-\u26FF\u2700-\u27BF\uFE0F]*)\s*(.*)/);
        if (match) {
          return {
            day: match[2],
            icon: match[3],
            desc: match[4],
            raw: line
          };
        }
        return { raw: line };
      })
    : [];

  return (
    <Card className={`weather-card ${sender}`}>
      <CardContent>
        {isForecast && forecastDays.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              {lines[0]}
            </Typography>
            <Box className="forecast-list">
              {forecastDays.map((day, idx) => (
                <Box key={idx} className="forecast-day">
                  {day.icon && <span className="forecast-icon">{day.icon}</span>}
                  <span className="forecast-date">{day.day}</span>
                  <span className="forecast-desc">{day.desc}</span>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Typography variant="body1">{text}</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherCard;