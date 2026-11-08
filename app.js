/* Bank DApp: ethers v6 + MetaMask (EIP-1193/EIP-6963). */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const config = window.BANK_CONFIG;
  const abi = [
    'function deposit() payable',
    'function withdraw(uint256 amount)',
    'function checkBlance() view returns (uint256 balance)',
    'event Deposit(address indexed owner, uint256 amount)',
    'event Withdraw(address indexed owner, uint256 amount)'
  ];
  let wallet, provider, account = '', bank, epoch = 0, busy = false;
  let discoveredMetaMask;
  window.addEventListener('eip6963:announceProvider', (event) => {
    if (event.detail?.info?.rdns === 'io.metamask') discoveredMetaMask = event.detail.provider;
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  function status(message, kind = 'info') {
    $('status').textContent = message;
    $('status').dataset.kind = kind;
  }
  function controls() {
    for (const id of ['deposit', 'withdraw', 'refresh']) $(id).disabled = busy || !bank;
    for (const id of ['connect', 'loadContract', 'contractAddress', 'switchNetwork']) $(id).disabled = busy;
  }
  function errorText(error) {
    const code = error?.code ?? error?.info?.error?.code;
    if (code === 4001 || code === 'ACTION_REJECTED') return 'คุณยกเลิกคำขอใน MetaMask ยังไม่ได้ส่งธุรกรรมใหม่';
    if (code === -32002) return 'มีคำขอรออยู่ กรุณาเปิด MetaMask แล้วตอบคำขอเดิม';
    if (code === 'INSUFFICIENT_FUNDS') return 'ETH ในกระเป๋าไม่พอสำหรับจำนวนเงินและค่า Gas';
    if (code === 'TIMEOUT') return 'ยังยืนยันธุรกรรมไม่ได้ในเวลาที่กำหนด กรุณาตรวจลิงก์ Etherscan ก่อนส่งซ้ำ';
    return error?.reason || error?.shortMessage || error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }
  async function run(task) {
    if (busy) return;
    busy = true; controls();
    try { await task(); } catch (error) { status(errorText(error), 'error'); }
    finally { busy = false; controls(); }
  }
  function invalidate(message) {
    epoch++;
    bank = undefined; provider = undefined; account = '';
    $('bankBalance').textContent = '—'; $('walletBalance').textContent = '— ETH';
    $('account').textContent = 'กรุณาเชื่อมต่อใหม่';
    $('walletState').textContent = message;
    $('connect').textContent = 'เชื่อมต่อ MetaMask';
    $('contractState').textContent = 'กรุณาเชื่อมต่อเพื่อยืนยันบัญชีและเครือข่ายใหม่';
    status(message, 'info'); controls();
  }
  function getWallet() {
    const candidates = window.ethereum?.providers || [window.ethereum];
    const found = discoveredMetaMask || candidates.find((item) => item?.isMetaMask);
    if (!found) throw new Error('ไม่พบ MetaMask กรุณาเปิดเว็บใน Chrome ที่ติดตั้ง MetaMask หรือเบราว์เซอร์ภายในแอป MetaMask');
    if (wallet !== found) {
      wallet = found;
      wallet.on?.('accountsChanged', () => invalidate('บัญชีเปลี่ยนแล้ว กรุณากดเชื่อมต่อใหม่'));
      wallet.on?.('chainChanged', () => invalidate('เครือข่ายเปลี่ยนแล้ว กรุณากดเชื่อมต่อใหม่'));
      wallet.on?.('disconnect', () => invalidate('กระเป๋าตัดการเชื่อมต่อ กรุณากดเชื่อมต่อใหม่'));
    }
    return wallet;
  }
  async function assertContext(version, expectedAccount = account) {
    const chain = await wallet.request({ method: 'eth_chainId' });
    const accounts = await wallet.request({ method: 'eth_accounts' });
    if (version !== epoch || chain.toLowerCase() !== config.chainId || accounts[0]?.toLowerCase() !== expectedAccount.toLowerCase()) {
      throw new Error('บัญชีหรือเครือข่ายเปลี่ยน กรุณาเชื่อมต่อใหม่ก่อนทำรายการ');
    }
  }
  async function refresh() {
    const currentBank = bank, currentProvider = provider, currentAccount = account, version = epoch;
    if (!currentBank) throw new Error('กรุณาเชื่อม MetaMask และสัญญาก่อน');
    await assertContext(version, currentAccount);
    const [balance, walletAmount] = await Promise.all([
      currentBank.checkBlance(), currentProvider.getBalance(currentAccount)
    ]);
    await assertContext(version, currentAccount);
    $('bankBalance').textContent = ethers.formatEther(balance);
    $('walletBalance').textContent = `${ethers.formatEther(walletAmount)} ETH`;
    return balance;
  }
  async function loadContract() {
    bank = undefined; controls(); $('bankBalance').textContent = '—';
    $('contractLink').hidden = true;
    if (!provider || !account) throw new Error('กรุณาเชื่อมต่อ MetaMask ก่อนเชื่อมสัญญา');
    const address = $('contractAddress').value.trim(), version = epoch;
    if (!ethers.isAddress(address) || address === ethers.ZeroAddress) throw new Error('Contract Address ไม่ถูกต้อง กรุณาคัดลอกจาก Remix');
    await assertContext(version);
    if (await provider.getCode(address) === '0x') throw new Error('ไม่พบสัญญาที่ Address นี้บน Sepolia ตรวจเครือข่ายและ Address อีกครั้ง');
    const signer = await provider.getSigner(account);
    const candidate = new ethers.Contract(address, abi, signer);
    try { await candidate.checkBlance(); }
    catch { throw new Error('สัญญานี้ไม่ตอบฟังก์ชัน checkBlance() ตามโจทย์ ตรวจ Address และโค้ดที่ Deploy'); }
    await assertContext(version);
    bank = candidate;
    $('contractAddress').value = ethers.getAddress(address);
    $('contractLink').href = `${config.explorerUrl}/address/${address}#code`;
    $('contractLink').hidden = false;
    $('contractState').textContent = 'เชื่อมสัญญาแล้ว • Sepolia • checkBlance() พร้อมใช้งาน';
    await refresh();
    status('เชื่อมต่อสำเร็จ พร้อมฝาก ถอน และตรวจสอบยอดเงิน');
  }
  async function connect() {
    if (!window.ethers) throw new Error('โหลด ethers.js ไม่สำเร็จ ตรวจไฟล์ vendor/ethers.umd.min.js');
    const injected = getWallet();
    const accounts = await injected.request({ method: 'eth_requestAccounts' });
    const chain = await injected.request({ method: 'eth_chainId' });
    if (chain.toLowerCase() !== config.chainId) {
      invalidate('เครือข่ายไม่ตรง กรุณาเปลี่ยนเป็น Sepolia');
      $('switchNetwork').hidden = false;
      throw new Error('กรุณากด “เปลี่ยนเป็น Sepolia” แล้วเชื่อมต่อใหม่');
    }
    if (!accounts.length) throw new Error('ไม่มีบัญชีที่อนุญาตให้เชื่อมต่อ');
    epoch++; bank = undefined;
    account = ethers.getAddress(accounts[0]);
    provider = new ethers.BrowserProvider(injected, undefined, { cacheTimeout: -1 });
    $('switchNetwork').hidden = true;
    $('walletState').textContent = 'เชื่อมต่อแล้ว • Sepolia';
    $('account').textContent = account;
    $('connect').textContent = 'เชื่อมต่อแล้ว · อัปเดตการเชื่อมต่อ';
    if ($('contractAddress').value.trim()) await loadContract();
    else status('เชื่อม MetaMask แล้ว กรุณาใส่ Contract Address จาก Remix และกดเชื่อมสัญญา');
  }
  function amountFrom(inputId) {
    const text = $(inputId).value.trim();
    if (!/^(?:\d+)(?:\.\d{1,18})?$/.test(text)) throw new Error('ระบุจำนวน ETH เป็นตัวเลขบวก ทศนิยมไม่เกิน 18 ตำแหน่ง ไม่ใช้เครื่องหมายคอมมา');
    const amount = ethers.parseEther(text);
    if (amount <= 0n) throw new Error('จำนวนเงินต้องมากกว่า 0 ETH');
    return amount;
  }
  function historyItem(tx, kind, amount, owner) {
    $('emptyHistory').hidden = true;
    const row = document.createElement('li'), link = document.createElement('a'), detail = document.createElement('span');
    link.href = `${config.explorerUrl}/tx/${tx.hash}`; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = `${kind} ${ethers.formatEther(amount)} ETH ↗`;
    link.title = tx.hash;
    detail.textContent = 'รอยืนยันบนเครือข่าย';
    row.title = `บัญชี ${owner} · สัญญา ${tx.to}`;
    row.append(link, detail); $('transactions').prepend(row);
    return { detail, link };
  }
  async function transact(kind) {
    if (!bank) throw new Error('กรุณาเชื่อมต่อสัญญาก่อน');
    const version = epoch, currentAccount = account, currentBank = bank;
    const inputId = kind === 'Deposit' ? 'depositAmount' : 'withdrawAmount';
    const amount = amountFrom(inputId);
    await assertContext(version, currentAccount);
    if (kind === 'Withdraw' && amount > await currentBank.checkBlance()) throw new Error('ยอดเงินฝากไม่พอสำหรับการถอน');
    await assertContext(version, currentAccount);
    status(`กรุณายืนยัน ${kind} ${ethers.formatEther(amount)} ETH ใน MetaMask`, 'busy');
    const tx = kind === 'Deposit' ? await currentBank.deposit({ value: amount }) : await currentBank.withdraw(amount);
    const item = historyItem(tx, kind, amount, currentAccount);
    status('ส่งธุรกรรมแล้ว กำลังรอยืนยันบน Sepolia ดูความคืบหน้าได้จากลิงก์ด้านล่าง', 'busy');
    try {
      let receipt;
      try { receipt = await tx.wait(1, 120000); }
      catch (error) {
        if (error.code === 'TRANSACTION_REPLACED' && !error.cancelled && error.reason === 'repriced' && error.receipt?.status === 1) {
          receipt = error.receipt;
          item.link.href = `${config.explorerUrl}/tx/${receipt.hash}`;
          item.link.title = receipt.hash;
        } else throw error;
      }
      if (!receipt || receipt.status !== 1) throw new Error('ธุรกรรมไม่สำเร็จ ตรวจรายละเอียดบน Etherscan');
      item.detail.textContent = `สำเร็จ · Block ${receipt.blockNumber}`;
      $(inputId).value = '';
      if (version === epoch) {
        try { await refresh(); status(`${kind} สำเร็จและอัปเดตยอดแล้ว`); }
        catch { status(`${kind} สำเร็จ แต่ยังอัปเดตยอดไม่ได้ กรุณากด Check Balance อีกครั้ง`); }
      } else status(`${kind} ของบัญชีเดิมสำเร็จแล้ว กรุณาเชื่อมต่อบัญชีปัจจุบันใหม่`);
    } catch (error) {
      item.detail.textContent = error.code === 'TIMEOUT' ? 'ยังรอยืนยัน · ตรวจ Etherscan ก่อนส่งซ้ำ' : error.code === 'TRANSACTION_REPLACED' ? 'ถูกแทนที่หรือยกเลิก · ตรวจ Etherscan' : 'ไม่สำเร็จ / ตรวจ Etherscan';
      if (error.replacement?.hash) item.link.href = `${config.explorerUrl}/tx/${error.replacement.hash}`;
      throw error;
    }
  }
  $('studentName').textContent = config.studentName;
  $('studentId').textContent = config.studentId;
  $('contractAddress').value = config.contractAddress;
  $('connect').addEventListener('click', () => run(connect));
  $('contractForm').addEventListener('submit', (event) => { event.preventDefault(); run(loadContract); });
  $('contractAddress').addEventListener('input', () => {
    bank = undefined; $('bankBalance').textContent = '—'; $('contractLink').hidden = true;
    $('contractState').textContent = 'Address เปลี่ยนแล้ว กรุณากดเชื่อมสัญญา'; controls();
  });
  $('refresh').addEventListener('click', () => run(async () => { await refresh(); status('อัปเดตยอดจากบล็อกเชนแล้ว'); }));
  $('depositForm').addEventListener('submit', (event) => { event.preventDefault(); run(() => transact('Deposit')); });
  $('withdrawForm').addEventListener('submit', (event) => { event.preventDefault(); run(() => transact('Withdraw')); });
  $('switchNetwork').addEventListener('click', () => run(async () => {
    await getWallet().request({ method: 'wallet_switchEthereumChain', params: [{ chainId: config.chainId }] });
    status('เปลี่ยนเครือข่ายแล้ว กรุณากดเชื่อมต่อ MetaMask อีกครั้ง');
  }));
  controls();
})();
