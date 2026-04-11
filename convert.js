import bs58 from "bs58";

const privateKey = "2FrLvkwucuJyHyVaHp8MUnHDACdwK1eJwzhvDyJiE2ER";

const decoded = bs58.decode(privateKey);

console.log(JSON.stringify(Array.from(decoded)));