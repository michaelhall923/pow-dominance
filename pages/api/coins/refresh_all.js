import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
    var url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=5000&convert=USD";
    const response = await (await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: {
            'X-CMC_PRO_API_KEY': process.env.COIN_MARKET_CAP_API_KEY,
            'Accepts': 'application/json'
        },
    })).json();

    var coins = [];
    
    for (var i = 0; i < response.data.length; i++) {
        var coin = {};
        coin.id = response.data[i].id;
        coin.name = response.data[i].name;
        coin.symbol = response.data[i].symbol;
        coin.isPoW = response.data[i].tags.reduce((prev, current) => {
            return prev || (current == "pow");
        }, false);
        coin.price = response.data[i].quote.USD.price;
        coin.marketCap = response.data[i].quote.USD.market_cap;
        coins.push(coin);
    }
    
    await prisma.coin.createMany({
        data: coins,
        skipDuplicates: true,
    });

    res.status(200).json({ coins: coins })
}