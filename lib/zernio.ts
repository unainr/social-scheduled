import Zernio from "@zernio/node";

export const zernio = new Zernio({ apiKey: process.env.ZERNIO_API_KEY! }); // uses ZERNIO_API_KEY env var
