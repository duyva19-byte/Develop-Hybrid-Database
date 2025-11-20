// hybrid.js
// Script nhỏ dùng Node: ghi dữ liệu vào MySQL + lên Blockchain (contract deploy bằng Remix)

// 1. Import thư viện
const mysql = require('mysql2/promise');
const Web3  = require('web3');

// 2. Cấu hình MySQL (sửa cho đúng với máy bạn)
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASS = 'pass123'; 
const DB_NAME = 'energy_trading';

// 3. Cấu hình Blockchain (sửa 3 cái: RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, ABI)
//Cái này ko xài chung dc nhé
const RPC_URL = 'https://sepolia.infura.io/v3/bd6e1309e4104bd585f8a8b0d65e684a';      // ví dụ: 'https://sepolia.infura.io/v3/xxxxx'
const PRIVATE_KEY = '0x14925c71dc8cbf17ecace298f93f628cb6a0e1ce2fe379a5d7b0334d3d84a604';             // ví 
const CONTRACT_ADDRESS = '0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B';  // contract address từ Remix

// 👉 ABI: vào Remix, bấm Compilation details -> copy ABI, dán vào mảng dưới
const abi = [
    {
      "inputs":[
        {"internalType":"uint256","name":"_tradeId","type":"uint256"},
        {"internalType":"address","name":"_seller","type":"address"},
        {"internalType":"address","name":"_buyer","type":"address"},
        {"internalType":"uint256","name":"_energyAmountKwh","type":"uint256"},
        {"internalType":"uint256","name":"_pricePerKwh","type":"uint256"}
      ],
      "name":"recordTrade",
      "outputs":[],
      "stateMutability":"nonpayable",
      "type":"function"
    },
    {
      "anonymous":false,
      "inputs":[
        {"indexed":true,"internalType":"uint256","name":"tradeId","type":"uint256"},
        {"indexed":true,"internalType":"address","name":"seller","type":"address"},
        {"indexed":true,"internalType":"address","name":"buyer","type":"address"},
        {"indexed":false,"internalType":"uint256","name":"energyAmountKwh","type":"uint256"},
        {"indexed":false,"internalType":"uint256","name":"pricePerKwh","type":"uint256"}
      ],
      "name":"TradeCreated",
      "type":"event"
    }
  ];
  

// 4. Kết nối MySQL
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// 5. Kết nối Web3 + contract
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

// 6. Một số hàm helper cho MySQL

async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function insertTrade(data) {
  const sql = `
    INSERT INTO trades
    (seller_id, buyer_id, energy_amount_kwh, price_per_kwh, status)
    VALUES (?, ?, ?, ?, 'PENDING')
  `;
  const params = [
    data.seller_id,
    data.buyer_id,
    data.energy_amount_kwh,
    data.price_per_kwh
  ];
  const [result] = await pool.query(sql, params);
  return result.insertId;
}

async function updateTradeTxHash(tradeId, txHash, status = 'ONCHAIN') {
  const sql = 'UPDATE trades SET tx_hash = ?, status = ? WHERE id = ?';
  await pool.query(sql, [txHash, status, tradeId]);
}

// Hàm load lại trade để xem kết quả
async function getTradeById(id) {
  const [rows] = await pool.query('SELECT * FROM trades WHERE id = ?', [id]);
  return rows[0];
}

// 7. Hàm ghi trade lên blockchain
async function recordTradeOnChain({ id, sellerEth, buyerEth, energyKwh, pricePerKwh }) {
  // Đổi đơn vị nếu muốn (ở đây demo dùng wei cho cả energy và price cho đơn giản)
  const energy = web3.utils.toWei(energyKwh.toString(), 'ether');
  const price  = web3.utils.toWei(pricePerKwh.toString(), 'ether');

  const tx = contract.methods.recordTrade(
    id,
    sellerEth,
    buyerEth,
    energy,
    price
  );

  const txData = {
    from: account.address,
    to: CONTRACT_ADDRESS,
    data: tx.encodeABI(),
    gas: 200000,  
    maxFeePerGas: web3.utils.toWei('3', 'gwei'),
    maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'),
  };

  console.log('⏳ Gửi transaction lên blockchain...');
  const receipt = await web3.eth.sendTransaction(txData);
  console.log('✅ Tx mined, hash =', receipt.transactionHash);

  return receipt.transactionHash;
}

// 8. Hàm chính: HYBRID
//    1) Ghi vào MySQL (PENDING)
//    2) Ghi lên blockchain
//    3) Cập nhật tx_hash trong MySQL (ONCHAIN)

async function createHybridTrade({ sellerId, buyerId, energyKwh, pricePerKwh }) {
  console.log('=== Bắt đầu HYBRID TRADE ===');

  // 1. Ghi MySQL
  const tradeId = await insertTrade({
    seller_id: sellerId,
    buyer_id: buyerId,
    energy_amount_kwh: energyKwh,
    price_per_kwh: pricePerKwh
  });
  console.log('✅ Insert trade vào MySQL, id =', tradeId);

  // Lấy địa chỉ ví từ bảng users
  const seller = await getUserById(sellerId);
  const buyer  = await getUserById(buyerId);

  if (!seller || !buyer) {
    throw new Error('Không tìm thấy seller/buyer trong bảng users');
  }

  console.log('Seller ETH:', seller.eth_address);
  console.log('Buyer  ETH:', buyer.eth_address);

  // 2. Ghi lên blockchain
  const txHash = await recordTradeOnChain({
    id: tradeId,
    sellerEth: seller.eth_address,
    buyerEth: buyer.eth_address,
    energyKwh: energyKwh,
    pricePerKwh: pricePerKwh
  });

  // 3. Cập nhật lại MySQL
  await updateTradeTxHash(tradeId, txHash, 'ONCHAIN');
  const finalTrade = await getTradeById(tradeId);

  console.log('=== HYBRID TRADE HOÀN TẤT ===');
  console.log(finalTrade);
}

// 9. Chạy thử script
//   Trước khi chạy, đảm bảo:
//   - Bảng users có ít nhất 2 user với id = 1 và 2, có eth_address hợp lệ
//   - ABI, CONTRACT_ADDRESS, RPC_URL, PRIVATE_KEY đã sửa đúng

async function main() {
  try {
    await createHybridTrade({
      sellerId: 1,
      buyerId: 2,
      energyKwh: 5,   // 5 kWh
      pricePerKwh: 2  // 2 (đơn vị tùy bạn)
    });
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
