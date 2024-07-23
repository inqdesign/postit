import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      rootElement
    );
  } catch (error) {
    console.error('Error rendering the app:', error);
    rootElement.innerHTML = '<div style="color: red;">An error occurred while loading the application. Please check the console for more information.</div>';
  }
} else {
  console.error('Root element not found');
}
