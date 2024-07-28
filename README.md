# RateGuardJS

RateGuardJS is a simple and efficient JavaScript library for implementing time-based rate limiting for REST APIs. It helps to control the number of requests made to a specific URL within a defined time window, ensuring that your API usage remains within safe limits.

## Features

- Time-based rate limiting for REST APIs.
- Supports localStorage for persistent request tracking across sessions.
- Simple and intuitive API.

## Installation

You can install RateGuardJS via npm:

```bash
npm install rateguardjs
```

## Usage
Here's an example of how to use RateGuardJS in your project:

```javascript
import RateGuardJS from 'rateguardjs';

const rateGuard = new RateGuardJS(5, 1, 0.5); // Allow 5 requests per 1 minute window with a delay of 30 seconds if the limit is exceeded

async function requestHandler(url, params) {
    const response = await fetch(url, params);
    return response.json();
}

// Usage example
(async () => {
    const url = 'http://example.com/api';
    const params = { method: 'GET' };
    try {
        const data = await rateGuard.sendRequest(url, params, requestHandler);
        console.log(data);
    } catch (error) {
        console.error('Request failed:', error);
    }
})();
```

## Project Structure
```css
src/
├── RateGuard.js
├── RateGuard.test.js
└── index.js
```

* `RateGuard.js`: The main library file containing the RateGuardJS class.
* `RateGuard.test.js`: Unit tests for the RateGuardJS class.
* `index.js`: Entry point for the library.

## API


### Constructor
```javascript
new RateGuardJS(totalAllowedRequests, totalRequestsWindowMins, timeoutMinutes)
```

* totalAllowedRequests: The maximum number of requests allowed within the time window.
* totalRequestsWindowMins: The time window duration in minutes.
* timeoutMinutes: The delay duration in minutes if the request limit is exceeded.

### sendRequest(url, params, requestHandler)
* url: The URL to which the request is made.
* params: The parameters for the request.
* requestHandler: The function to handle the request. It should return a promise.

## Unit Tests
Jest is included in the package.json. To run the unit tests, simply use:

```bash
npm test
```

### Example Test
Here's an example test for the sendRequest function:

```javascript
const RateGuardJS = require("./RateGuard");

describe('RateGuardJS', () => {
    test('should allow requests within the limit', async () => {
        const rateGuard = new RateGuardJS(2, 1, 0.5);
        const requestHandler = jest.fn(() => Promise.resolve('success'));

        const response1 = await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        const response2 = await rateGuard.sendRequest('http://example.com', {}, requestHandler);

        expect(response1).toBe('success');
        expect(response2).toBe('success');
        expect(requestHandler).toHaveBeenCalledTimes(2);
    });

    test('should delay requests when the limit is exceeded', async () => {
        const rateGuard = new RateGuardJS(2, 1, 0.001);
        const requestHandler = jest.fn(() => Promise.resolve('success'));

        // Send first two requests
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);

        // Send third request, which should trigger the delay
        const responsePromise = rateGuard.sendRequest('http://example.com', {}, requestHandler);

        // Wait for the delay to pass
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 0.001));

        const response = await responsePromise;
        expect(response).toBe('success');
        expect(requestHandler).toHaveBeenCalledTimes(3);
    });

    test('should reset the counter after the window time has passed', async () => {
        const rateGuard = new RateGuardJS(2, 0.1, 0.001);
        const requestHandler = jest.fn(() => Promise.resolve('success'));

        // Send first two requests within the window
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);

        // Wait for the window to pass
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 0.1));

        // The third request should be allowed since the window has reset
        const response = await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        expect(response).toBe('success');
        expect(requestHandler).toHaveBeenCalledTimes(3);
    });
});
```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or new features to add.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.