import Zernio from "@zernio/node";
const zernio = new Zernio({ apiKey: "sk_test_123" });
console.log(Object.keys(zernio.profiles));
