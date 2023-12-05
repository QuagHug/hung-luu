const fileSystem = require('fs');
const fileName = "input.json"

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

class FileManager {
    readJsonFileToObject(fileName) {
        try {
            const data = fileSystem.readFileSync(fileName, 'utf8')
            const jsonData = JSON.parse(data)
            return jsonData.offers
        } catch (error) {
            console.error('Error reading or parsing the file:', error)
            return null
        }
    }
    writeObjectToJsonFile(output) {
        try {
            const jsonString = JSON.stringify(output, null, 2);
            const fileName = 'output.json';
            fileSystem.writeFileSync(fileName, jsonString);
            console.log('Output has been written to output.json');
        } catch (error) {
            console.error('Error writing or parsing the file:', error)
        }
    }
}

class OfferManager {
    constructor(fileName, fileManager) {
        this.fileName = fileName
        this.fileManager = fileManager
        
    }
    filterOffers(checkinDate) { // O(n)
        this.checkinDate = new Date(checkinDate)
        this.validDate = new Date(checkinDate);
        this.validDate.setDate(this.validDate.getDate() + 5);

        const offers = this.fileManager.readJsonFileToObject(this.fileName)
        
        const filteredOffers = offers.filter(offer => {
            const offerDate = new Date(offer.valid_to)
            const isValidCategory = [1, 2, 4].includes(offer.category)
            const isValidDate = offerDate >= this.validDate
            return isValidCategory && isValidDate
        });
        if(filteredOffers.length == 0) return []

        filteredOffers.forEach(offer => {
            let closestMerchant = offer.merchants[0]
            offer.merchants.forEach(merchant => {
                if(merchant.distance < closestMerchant.distance) closestMerchant = merchant
            })
            offer.merchants = [closestMerchant]
        })

        let firstOfferIndex = -1
        let secondOfferIndex = -1
        
        filteredOffers.forEach((offer, index) => {
            if(firstOfferIndex == -1) {
                firstOfferIndex = index
                return
            }
            if(offer.merchants[0] < filteredOffers[firstOfferIndex].merchants[0]) firstOfferIndex = index
        })

        filteredOffers.forEach((offer, index) => {
            if(index == firstOfferIndex || offer.category == filteredOffers[firstOfferIndex].category) return
            if(secondOfferIndex == -1) {
                secondOfferIndex = index
                return
            }
            if(offer.merchants[0] < filteredOffers[secondOfferIndex].merchants[0]) secondOfferIndex = index
        })

        if(secondOfferIndex == -1) return [filteredOffers[firstOfferIndex]]
        return [filteredOffers[firstOfferIndex], filteredOffers[secondOfferIndex]]
    }
}

class UserInputManager {
    constructor(offerManager, fileManager) {
        this.offerManager = offerManager
        this.fileManager = fileManager
    }
    askForDate() {
        return new Promise((resolve) => {
          readline.question('Input a check-in date (YYYY-MM-DD): ', (input) => {
            resolve(input);
          });
        });
    }
    async handleUserInput() {
        let inputDate
        while(true) {
            inputDate = await this.askForDate()
            if(/^\d{4}-\d{2}-\d{2}$/.test(inputDate) && !isNaN(new Date(inputDate))) {
                readline.close()
                break
            }
            console.log("Invalid date")
        }
        const offers = this.offerManager.filterOffers(inputDate)
        const output = {offers: offers}
        this.fileManager.writeObjectToJsonFile(output)
    }
}

const fileManager = new FileManager()
const offerManager = new OfferManager(fileName, fileManager)
const userInputManager = new UserInputManager(offerManager, fileManager)

userInputManager.handleUserInput()