const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const OPENWEATHER_API_KEY = 'fe0786c857bf16f33939d959825b060f';

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Weather icon mapping
const weatherIcons = {
  'Clear': '☀️',
  'Clouds': '☁️',
  'Rain': '🌧️',
  'Thunderstorm': '⛈️',
  'Drizzle': '🌦️',
  'Snow': '❄️',
  'Mist': '🌫️',
  'Fog': '🌁'
};

// Helper functions
function getWeatherIcon(condition) {
  return weatherIcons[condition] || '🌫️';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Weather API functions
async function getCurrentWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    const weather = response.data.weather[0];
    const main = response.data.main;
    const wind = response.data.wind;
    
    return {
      fulfillmentText: `Current weather in ${city}:\n` +
                      `${getWeatherIcon(weather.main)} ${weather.description}\n` +
                      `🌡️ Temperature: ${Math.round(main.temp)}°C\n` +
                      `🔺 High: ${Math.round(main.temp_max)}°C | ` +
                      `🔻 Low: ${Math.round(main.temp_min)}°C\n` +
                      `💧 Humidity: ${main.humidity}%\n` +
                      `🌬️ Wind: ${wind.speed} m/s`,
      weatherData: {
        city,
        current: {
          temp: Math.round(main.temp),
          condition: weather.main,
          description: weather.description,
          icon: getWeatherIcon(weather.main)
        }
      }
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { fulfillmentText: `Sorry, I couldn't find weather data for ${city}. Please check the city name and try again.` };
    }
    throw error;
  }
}

async function get8DayForecast(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    
    // Group forecasts by day
    const dailyForecasts = {};
    response.data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date,
          temp: [],
          temp_max: [],
          temp_min: [],
          conditions: new Set(),
          descriptions: new Set()
        };
      }
      
      dailyForecasts[dateKey].temp.push(item.main.temp);
      dailyForecasts[dateKey].temp_max.push(item.main.temp_max);
      dailyForecasts[dateKey].temp_min.push(item.main.temp_min);
      dailyForecasts[dateKey].conditions.add(item.weather[0].main);
      dailyForecasts[dateKey].descriptions.add(item.weather[0].description);
    });
    
    // Process the next 8 days
    const forecastDays = Object.values(dailyForecasts)
      .sort((a, b) => a.date - b.date)
      .slice(0, 8);
    
    let forecastText = `8-day forecast for ${city}:\n`;
    forecastDays.forEach((day, index) => {
      const avgTemp = Math.round(day.temp.reduce((a, b) => a + b, 0) / day.temp.length);
      const maxTemp = Math.round(Math.max(...day.temp_max));
      const minTemp = Math.round(Math.min(...day.temp_min));
      const primaryCondition = [...day.conditions][0];
      
      forecastText += `${index + 1}. ${formatDate(day.date)}: ` +
                     `${getWeatherIcon(primaryCondition)} ${[...day.descriptions][0]}\n` +
                     `   🌡️ ${avgTemp}°C (High: ${maxTemp}°C, Low: ${minTemp}°C)\n\n`;
    });
    
    return { fulfillmentText: forecastText };
  } catch (error) {
    if (error.response?.status === 404) {
      return { fulfillmentText: `Sorry, I couldn't find forecast data for ${city}. Please check the city name and try again.` };
    }
    throw error;
  }
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { queryResult } = req.body;
    
    if (!queryResult) {
      return res.status(400).json({ fulfillmentText: 'Invalid request: Missing queryResult' });
    }

    const intent = queryResult.intent?.displayName;
    const city = queryResult.parameters?.['geo-city'];
    const date = queryResult.parameters?.date;

    if (!city) {
      return res.status(400).json({ fulfillmentText: 'Please provide a city name.' });
    }

    let response;
    
    if (intent === 'CurrentWeatherIntent') {
      response = await getCurrentWeather(city);
    } else if (intent === '8DayForecastIntent') {
      response = await get8DayForecast(city);
    } else {
      response = { fulfillmentText: `I'm not sure how to handle that request. Please ask about current weather or forecasts.` };
    }

    res.json(response);

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ 
      fulfillmentText: 'Sorry, there was an error processing your request. Please try again later.' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Backend for Chatbot