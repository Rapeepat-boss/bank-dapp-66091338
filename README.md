# Bank DApp — 66091338

จัดทำโดย **ระพีภัธท ผาพันธุ์**

เว็บสำหรับงานระบบธนาคาร Smart Contract ใช้ Remix บนเว็บ, MetaMask, ethers.js และ Sepolia Etherscan เผยแพร่เป็นเว็บ static บน GitHub Pages ได้โดยไม่ต้อง build

## สัญญาที่ใช้

- เครือข่าย: Sepolia (Chain ID `11155111`)
- Contract Address: `0xD094a8680a0e1165c2C7ED874d530Ae94Ece8DEa`
- [ดูสัญญาบน Etherscan](https://sepolia.etherscan.io/address/0xD094a8680a0e1165c2C7ED874d530Ae94Ece8DEa)
- [ธุรกรรม Deploy](https://sepolia.etherscan.io/tx/0xbee5636bdc6d746ef9c30a7986ad415315e4466341d29ffd87c3155e5c676a50)
- โค้ด: [`Bank.sol`](./Bank.sol)

## ใช้งาน

1. เปิดเว็บใน Chrome ที่ติดตั้ง MetaMask แล้วเลือกเครือข่าย Sepolia
2. กด **เชื่อมต่อ MetaMask** และอนุญาตบัญชีที่ต้องการใช้ สัญญาจะเชื่อมอัตโนมัติจาก `config.js`
3. ฝาก: ใส่จำนวน เช่น `0.001` ETH แล้วกด **Deposit** ตรวจและยืนยันใน MetaMask
4. ถอน: ใส่จำนวนไม่เกินยอดเงินฝาก แล้วกด **Withdraw** และยืนยันใน MetaMask
5. กด **Check Balance** เพื่ออ่านยอดของบัญชีปัจจุบันจากสัญญา ไม่ต้องส่งธุรกรรมและไม่เสีย Gas
6. กดลิงก์รายการเพื่อดูสถานะและรายละเอียดบน Etherscan

เมื่อเปลี่ยนบัญชีหรือเครือข่าย เว็บจะปิดปุ่มฝาก–ถอนจนกดเชื่อมต่อใหม่ เพื่อไม่แสดงยอดของบัญชีเดิมเป็นยอดบัญชีใหม่ ประวัติบนหน้าเว็บเป็นรายการที่ส่งในรอบการเปิดหน้านั้น ดูประวัติบนบล็อกเชนได้ที่ Etherscan

ใช้ Sepolia ETH ทดสอบสำหรับงานนี้ การฝาก/ถอน/Deploy มีค่า Gas และต้องเหลือ ETH ในกระเป๋าสำหรับค่า Gas ด้วย ยอด ETH ใน MetaMask เป็นคนละยอดกับยอดฝากใน Bank

## ความตรงตามโจทย์

| ข้อกำหนด | การทำงาน |
|---|---|
| เชื่อม Smart Contract | `new ethers.Contract(address, abi, signer)` |
| เชื่อม MetaMask | `eth_requestAccounts`, `BrowserProvider` |
| Deposit | `deposit({ value: ethers.parseEther(amount) })` |
| Withdraw | `withdraw(ethers.parseEther(amount))` |
| CheckBalance | `checkBlance()` ตามชื่อจริงในภาพโจทย์ |
| รหัสนักศึกษา / ชื่อ–สกุล | แสดงส่วนบนของหน้าเว็บ อ่านจาก `config.js` |
| GitHub Pages | HTML/CSS/JS แบบ static ใช้ relative paths |
| Etherscan | ลิงก์สัญญาและธุรกรรมบน Sepolia |

`checkBlance` สะกดตามโจทย์ ห้ามเปลี่ยนเฉพาะชื่อใน ABI เป็น `checkBalance` เพราะ selector จะไม่ตรงกับสัญญา `withdraw` รับหน่วย wei ส่วนเว็บรับ ETH แล้วแปลงด้วย `parseEther` โดยไม่ใช้เลข floating point

## Deploy สัญญาใหม่ด้วย Remix (หากต้องการทำซ้ำ)

1. เปิด [Remix](https://remix.ethereum.org) และนำเข้า `Bank.sol`
2. ใน Solidity Compiler เลือก compiler ที่รองรับ `^0.8.0` แล้ว Compile สัญญา ตัวที่ Deploy สำหรับงานนี้ใช้ `0.8.34+commit.80d5c536`
3. เปิด Deploy & Run → Environment **Browser Extension** → **Sepolia Testnet - MetaMask** (Remix บางรุ่นใช้ชื่อ **Injected Provider - MetaMask**)
4. ตรวจว่าเป็น Sepolia และบัญชีถูกต้อง ค่า Value สำหรับ Deploy ต้องเป็น **0 wei** แล้วกด Deploy
5. ตรวจรายการใน MetaMask และยืนยัน รอให้สัญญาปรากฏใน Deployed Contracts
6. คัดลอก Contract Address ไปใส่ `contractAddress` ใน `config.js` ก่อนเผยแพร่เว็บ
7. Verify ผ่าน Contract Verification plugin โดยใช้ source, compiler, optimizer และ EVM version ตรงกับตอน Deploy ถ้าระบบร้องขอ Etherscan API key ให้กรอกใน Settings ของ plugin เท่านั้น ไม่ใส่ key ลงไฟล์เว็บ

สัญญานี้คงการทำงานตามภาพโจทย์ รวมถึง `transfer` และลำดับการปรับยอด ใช้สำหรับการเรียนบน testnet

## GitHub Pages

1. สร้าง public repository แล้วอัปโหลดไฟล์ทั้งหมดของโฟลเดอร์นี้ โดยให้ `index.html` อยู่ที่ root ของ repository
2. ตรวจว่า `ethers.umd.min.js` และ `ethers-LICENSE.md` ถูกอัปโหลดด้วย
3. Settings → Pages → Source: **Deploy from a branch** → Branch: **main** → Folder: **/(root)** → Save
4. รอ Actions/Pages deploy สำเร็จ เปิด URL จากหน้า Pages แล้วทดสอบเชื่อม MetaMask
5. ส่ง URL เว็บ GitHub Pages ใน dlearning ตามโจทย์ ไม่ใช่ URL หน้า repository หรือ Contract Address

## ไฟล์

- `index.html` — โครงหน้าเว็บ
- `styles.css` — รูปแบบและหน้าจอมือถือ
- `app.js` — เชื่อม wallet, เรียกสัญญา, ตรวจข้อมูล และติดตามธุรกรรม
- `config.js` — ข้อมูลนักศึกษา เครือข่าย และ Contract Address
- `ethers.umd.min.js` — ethers.js 6.16.0 พร้อมใบอนุญาต MIT
- `Bank.sol` — Smart Contract จากโจทย์
- `deployment.json` — ข้อมูลสัญญาที่ Deploy

## แหล่งอ้างอิง

- [Remix: Deploy & Run](https://remix-ide.readthedocs.io/en/latest/run.html)
- [Remix: Contract Verification](https://remix-ide.readthedocs.io/en/latest/contract_verification.html)
- [ethers v6: Getting Started](https://docs.ethers.org/v6/getting-started/)
- [Ethereum: Networks / Sepolia](https://ethereum.org/developers/docs/networks/)
- [GitHub Pages: Publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
