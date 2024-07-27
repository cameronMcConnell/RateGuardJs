export default class RateGuardJS {
    #urlTotalRequests
    
    constructor(totalRequests, timeoutMinutes) {
        this.totalRequests = totalRequests
        this.timeoutMinutes = timeoutMinutes
        this.#urlTotalRequests = {}
    }

    async sendRequest(url, requestHandler) {
        if (!this.#urlTotalRequests[url]) {
            this.#urlTotalRequests[url] = 0
        }

        this.#urlTotalRequests[url] += 1

        if (this.#urlTotalRequests[url] >= this.totalRequests) {
            this.#urlTotalRequests[url] = 0
            await this.#delay(this.timeoutMinutes * 60 * 1000)
        }

        return requestHandler(url)
    }

    #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}