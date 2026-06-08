import Zernio from '@zernio/node';
async function test() {
  const zernio = new Zernio({ apiKey: 'sk_test_123' });
  const res = await zernio.profiles.listProfiles();
  console.log(res);
}
test();
