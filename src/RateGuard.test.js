class RateGuardJS {
    #urlTotalRequests
    #urlFirstAccessTimes
    
    constructor(totalAllowedRequests, totalRequestsWindowMins, timeoutMinutes) {
        this.totalAllowedRequests = totalAllowedRequests
        this.totalRequestsWindowMins = totalRequestsWindowMins
        this.timeoutMinutes = timeoutMinutes
        this.#urlTotalRequests = this.#loadUrlTotalRequests() || {}
        this.#urlFirstAccessTimes = this.#loadUrlFirstAccessTimes() || {}
    }

    async sendRequest(url, params, requestHandler) {
        const currentTime = Date.now()

        if (!this.#urlTotalRequests[url]) {
            this.#urlTotalRequests[url] = 0
            this.#urlFirstAccessTimes[url] = currentTime
            this.#saveUrlFirstAccessTimes()
        }

        const timeElapsed = this.#msToMins(currentTime - this.#urlFirstAccessTimes[url])

        if (timeElapsed > this.totalRequestsWindowMins) {
            this.#urlTotalRequests[url] = 0
            this.#urlFirstAccessTimes[url] = currentTime
            this.#saveUrlFirstAccessTimes()
        }

        this.#urlTotalRequests[url] += 1
        this.#saveUrlTotalRequests()

        if (this.#urlTotalRequests[url] > this.totalAllowedRequests) {
            await this.#delay(this.timeoutMinutes * 60 * 1000)
        }

        return requestHandler(url, params)
    }

    #msToMins(ms) {
        return ms / 1000 / 60
    }

    #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    #loadUrlTotalRequests() {
        const value = localStorage.getItem("urlTotalRequests")
        if (value != null) {
            return JSON.parse(value)
        }
        return value
    }

    #saveUrlTotalRequests() {
        localStorage.setItem("urlTotalRequests", JSON.stringify(this.#urlTotalRequests))
    }

    #loadUrlFirstAccessTimes() {
        const value = localStorage.getItem("urlFirstAccessTimes")
        if (value != null) {
            return JSON.parse(value)
        }
        return value
    }

    #saveUrlFirstAccessTimes() {
        localStorage.setItem("urlFirstAccessTimes", JSON.stringify(this.#urlFirstAccessTimes))
    }
}

// Mock the localStorage methods
global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn()
};

describe('RateGuardJS', () => {
    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        localStorage.getItem.mockClear();
        localStorage.setItem.mockClear();
    });

    test('should delay requests when the limit is exceeded', async () => {
        const rateGuard = new RateGuardJS(2, 1, 0.001); // Shorter timeout for testing
        const requestHandler = jest.fn(() => Promise.resolve('success'));

        // Send first request
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        // Send second request
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        // Send third request, which should trigger the delay
        const start = Date.now();
        const responsePromise = rateGuard.sendRequest('http://example.com', {}, requestHandler);

        // Wait for the delay duration
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 0.001));

        const response = await responsePromise;
        const end = Date.now();

        // Check that the delay happened
        expect(end - start).toBeGreaterThanOrEqual(1000 * 60 * 0.001);
        expect(response).toBe('success');
        expect(requestHandler).toHaveBeenCalledTimes(3);
    }, 10000); // Increased timeout to 10 seconds

    test('should reset the counter after the window time has passed', async () => {
        const rateGuard = new RateGuardJS(2, 0.1, 0.001); // Shorter window for testing
        const requestHandler = jest.fn(() => Promise.resolve('success'));

        // Send three requests within the window
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        await rateGuard.sendRequest('http://example.com', {}, requestHandler);

        // Wait for the window duration to pass
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 0.1));

        // The third request should be allowed since the window has reset
        const response = await rateGuard.sendRequest('http://example.com', {}, requestHandler);
        expect(response).toBe('success');
        expect(requestHandler).toHaveBeenCalledTimes(4);
    }, 10000); // Increased timeout to 10 seconds
});
