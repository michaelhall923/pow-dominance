import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
    const coins = await prisma.coin.findMany({
        where: {
            proofType: "PoW"
        }
    });

    let fsymsQueryStringLength = coins.map((coin) => { return coin.symbol }).join(',').length;
    let coinsChunks = splitToChunks(coins, Math.ceil(fsymsQueryStringLength / 1000));

    let fsymsQueryStrings = [];
    
    coinsChunks.forEach((chunk) => {
        fsymsQueryStrings.push(chunk.map((coin) => { return coin.symbol }).join(','));
    })

    let cryptoCompareResponseChunks = [];

    for(var i = 0; i < fsymsQueryStrings.length; i++) {
        let cryptoCompareResponse = await (await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsymsQueryStrings[i]}&tsyms=USD&api_key=${process.env.CRYPTO_COMPARE_API_KEY}`)).json();
        cryptoCompareResponseChunks.push(cryptoCompareResponse);
    }

    // cryptoCompareResponseChunks.forEach(async (chunk) => {
    //     Object.keys(chunk.RAW).forEach(async (symbol) => {
    //         let marketCap = chunk.RAW[symbol].USD.MKTCAP;
    //         marketCap = marketCap ? parseFloat(marketCap) : 0;
    //         await prisma.coin.update({
    //             where: {
    //               symbol: symbol,
    //             },
    //             data: {
    //                 marketCap: marketCap
    //             },
    //         });
    //     });
    // });

    let updates = [];

    for(var i = 0; i < cryptoCompareResponseChunks.length; i++) {
        let chunk = cryptoCompareResponseChunks[i];
        let symbols = Object.keys(chunk.RAW);
        for(var j = 0; j < symbols.length; j++) {
            let symbol = symbols[j];
            let marketCap = chunk.RAW[symbol].USD.MKTCAP;
            marketCap = marketCap ? parseFloat(marketCap) : 0;
            prisma.coin.update({
                where: {
                  symbol: symbol,
                },
                data: {
                    marketCap: marketCap
                },
            });
            if (marketCap) updates.push({
                symbol: symbol,
                marketCap: marketCap
            })
        }
    }

    res.status(200).json({ updates: updates })
}

function splitToChunks(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}