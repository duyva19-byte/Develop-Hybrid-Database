# Develop-Hybrid-Database
Develop P2P Energy Trading


Bắt Buộc phải có ví MetaMask, và gas kiếm ở đây: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
---------------------------------------------------
Khi Thực Hiện Hybrid Data - > xài Remix và EnergyTrading.sol
giải nén file rar ( chạy file giải nén bằng VS code, nhớ run script )
Khi mở file backend xong:
Step 1: npm init -y
npm install mysql2 web3

Step 2: 
const RPC_URL = { 
Vào: https://infura.io
Đăng ký miễn phí
Tạo project mới → chọn network (Sepolia hoặc mạng bạn deploy contract)
}
Copy RPC:
const PRIVATE_KEY = https://www.youtube.com/watch?v=NaaArC06Wug 

const CONTRACT_ADDRESS = CONTRACT_ADDRESS – lấy từ Remix sau khi deloy 
Vào Remix → tab “Deploy & Run Transactions”.
Chọn môi trường Injected Provider - MetaMask.
Sau khi deploy, ở phần “Deployed Contracts” sẽ thấy:
EnergyTrading at 0x1234abcd.....
Ấn vào icon copy bên cạnh địa chỉ đó (0x1234abcd....).

Step 3: runnode hybrid.js rồi check data + https://sepolia.etherscan.io/ 
