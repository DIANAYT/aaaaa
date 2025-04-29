// app.js

// DOM Elements
const searchInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const geoButton = document.getElementById('geo-button');
const cSelect = document.getElementById('c-btn');
const fSelect = document.getElementById('f-btn');
const todayContainer = document.getElementById('today-info');
const forecastContainer = document.getElementById('forecast-cards');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

// API Key
const API_KEY = '6b236cf585b27ce3db00637532a341eb';

// default unit
let units = 'metric';
let city = 'seattle';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
});

searchButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        performSearch();
    }
});

geoButton.addEventListener('click', useGeolocation);

cSelect.addEventListener('click', () => {
    units = 'metric';
    cSelect.classList.add('active');
    fSelect.classList.remove('active');
    if (city === "Your Location") {
        useGeolocation()
    } else {
        if (searchInput.value.trim() !== '') {
            city = searchInput.value.trim();
        }
        performSearch(city);
    }
});

fSelect.addEventListener('click', () => {
    units = 'imperial';
    fSelect.classList.add('active');
    cSelect.classList.remove('active');
    if (city === "Your Location") {
        useGeolocation()
    } else {
        if (searchInput.value.trim() !== '') {
            city = searchInput.value.trim();
        }
        performSearch(city);
    }
});

// Initialize the application
function init() {
    //shows default weather data for seattle
    performSearch(city);
}

// Fetch data from the API
async function fetchData(url) {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch(url);
        
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(error.message);
        return null;
    } finally {
        showLoading(false);
    }
}

// fetch today's weather and 5 day forecast for city
async function fetchWeather(lat, lon, city) {

    const todayUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const todayData= await fetchData(todayUrl);
        
    // 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
    const forecastData = await fetchData(forecastUrl);

    // combine both jsons and extract relevant data
    if (todayData && forecastData) {
        const data = {todayData: todayData, cityName: city, forecastData: forecastData.list};
        return data;
    }
}

// display today's weather
function displayToday(today, cityName) {
    // Clear previous results
    todayContainer.innerHTML = '';
    
    // Check if data is empty
    if (!today || today.length === 0) {
        todayContainer.innerHTML = `
            <div class="card translucent-bg p-4" id="today">
                <p>No results found. Try a different city name.</p>
            </div>
        `;
        return;
    }
    
    todayContainer.innerHTML = `
        <div class="card-body text-center">
            <h2>${cityName}</h2>
            <h4>${new Date(today.dt * 1000).toLocaleDateString()}</h4>
            <img src="https://openweathermap.org/img/wn/${today.weather[0].icon}@2x.png" alt="${today.weather[0].description} icon">
            <h5>${today.weather[0].description}</h5>

            <div class="mt-5">
                <p>Temperature: ${Math.round(today.main.temp)}°${units === 'metric' ? 'C' : 'F'}</p>
                <p>Feels Like: ${Math.round(today.main.feels_like)}°${units === 'metric' ? 'C' : 'F'}</p>
                <p>Humidity: ${today.main.humidity}%</p>
                <p>Pressure: ${today.main.pressure} hPa</p>
                <p>Wind Speed: ${today.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}</p>
                <p>Visibility: ${(today.visibility / 1000).toFixed(1)} km</p>
                <p>Sunrise: ${new Date(today.sys.sunrise * 1000).toLocaleTimeString()}</p>
            </div>
        </div>
    `;
}

// display 5-day forecast
function displayForecast(forecastList) {
    // Clear previous results
    forecastContainer.innerHTML = '';

     // Check if data is empty
     if (!forecastList || forecastList.length === 0) {
        forecastContainer.innerHTML = `
            <div class="row" id="forecast-cards">
                <p>No results found. Try a different city name.</p>
            </div>
        `;
        return;
    }

    // pick every 8th item = next day
    for (let i = 0; i < forecastList.length; i += 8) {
        const day = forecastList[i];
        const date = new Date(day.dt * 1000).toLocaleDateString();

        const card = document.createElement('div');
        card.className = 'col-md-2 col-6 mb-4';

        card.innerHTML = `
            <div class="card translucent-bg p-3 text-center">
                <h6>${date}</h6>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description} icon">
                <p>${Math.round(day.main.temp)}°${units === 'metric' ? 'C' : 'F'}</p>
                <p>${day.weather[0].description}</p>
            </div>
        `;

        forecastContainer.appendChild(card);
    }
}

// fetch using geolocation
function useGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const weatherData = await fetchWeather(latitude, longitude, 'Your Location');
                    if (weatherData) {
                        city = 'Your Location';
                        displayToday(weatherData.todayData, weatherData.cityName);
                        displayForecast(weatherData.forecastData);
                    }
                } catch (error) {
                    console.error('Failed to fetch weather from geolocation:', error);
                    showError('Failed to fetch your location weather.');
                }
            },
            () => {
                showError('Unable to retrieve your location.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// searches for geolocation for a given city
function performSearch(city) {
    let searchTerm = city || searchInput.value.trim();
    if (searchTerm === '') return;

    if (searchTerm === "Your Location") {
        useGeolocation();
        return;
    }
    
    const searchUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchTerm)}&limit=1&appid=${API_KEY}`;
    fetchData(searchUrl)
    .then(data => {
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            city = data[0].name;
            return fetchWeather(lat, lon, city);
        }
    })
    .then(data => {
        if (data) {
            displayToday(data.todayData, data.cityName);
            displayForecast(data.forecastData);
        }
    });
}

// Show or hide loading indicator
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('d-none');
    } else {
        loadingIndicator.classList.add('d-none');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = `Error: ${message}`;
    errorMessage.classList.remove('d-none');
}

// Hide error message
function hideError() {
    errorMessage.classList.add('d-none');
}
