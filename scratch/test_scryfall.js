const axios = require('axios');

async function testApi() {
    try {
        console.log('Testing Scryfall API...');
        const { data } = await axios.get('https://api.scryfall.com/cards/named', {
            params: { fuzzy: 'Black Lotus' }
        });
        console.log('Success! Card found:', data.name);
        console.log('Price:', data.prices.usd);
        process.exit(0);
    } catch (error) {
        console.error('API Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

testApi();
