import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
    const coinResponse = await (await fetch(`https://min-api.cryptocompare.com/data/all/coinlist?api_key=${process.env.CRYPTO_COMPARE_API_KEY}`)).json();
    let outputData = {};

    if (coinResponse.Response == "Success") {
        outputData.coins = Object.keys(coinResponse.Data).map((key) => {
            let datum = coinResponse.Data[key];
            let coin = {};
            coin.id = datum.Id;
            coin.name = datum.Name;
            coin.symbol = datum.Symbol;
            coin.coinName = datum.CoinName;
            coin.fullName = datum.FullName;
            coin.proofType = datum.ProofType;
            coin.isTrading = datum.IsTrading;
            coin.marketCap = 0;
            return coin;
        });
        await prisma.coin.createMany({
            data: outputData.coins,
            skipDuplicates: true,
        });
        outputData.coins.forEach(async (coin) => {
            await prisma.coin.update({
                where: {
                  id: coin.id,
                },
                data: coin,
            });
        });
    }

    res.status(200).json({ coins: Object.keys(outputData.coins) })
}