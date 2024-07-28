export default class RateGuardJS {
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

        if (this.#urlTotalRequests[url] >= this.totalAllowedRequests) {
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