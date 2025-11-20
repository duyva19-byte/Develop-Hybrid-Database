const Web3 = require('web3');
const web3 = new Web3();

const PRIVATE_KEY = '0x14925c71dc8cbf17ecace298f93f628cb6a0e1ce2fe379a5d7b0334d3d84a604'; // dán key bạn đang dùng

try {
  const acc = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  console.log('OK, account address =', acc.address);
} catch (e) {
  console.error('Lỗi:', e.message);
}