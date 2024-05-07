import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { assert } from "chai";
import { TokenProgram } from "../target/types/token_program";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { it } from "node:test";

// Create test keypairs
const admin = anchor.web3.Keypair.generate();
const payer = anchor.web3.Keypair.generate();
const user1 = anchor.web3.Keypair.generate();
const user2 = anchor.web3.Keypair.generate();
const vault = anchor.web3.Keypair.generate();
const mintAuthority = anchor.web3.Keypair.generate();

// Create constant amount fields
const MINT_AMOUNT = new BN(1000 * LAMPORTS_PER_SOL);
const BURN_AMOUNT = new BN(600 * LAMPORTS_PER_SOL);
const BURN_FROM_AMOUNT = new BN(200 * LAMPORTS_PER_SOL);
const TOKEN_AMOUNT = new BN(150);

// Constant seeds
const TEST_TOKEN = "Test";
const TEST_1_TOKEN = "Test-1";
const MINT = Buffer.from("mint");
const MAINTAINERS = Buffer.from("maintainers");
const CONFIG = Buffer.from("config");
const WHITELIST = Buffer.from("whitelist");
const TEST = Buffer.from(TEST_TOKEN);
const TEST_1 = Buffer.from(TEST_1_TOKEN);

describe("token_program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenProgram as Program<TokenProgram>;

  // Declare PDAs
  let pdaMaintainers,
    pdaConfig,
    pdaWhitelist,
    pdaEscrow,
    pdaVault,
    mintAccount = null;

  const confirmTransaction = async (tx) => {
    const latestBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: tx,
    });
  };

  const createToken = async (createTokenParams) => {
    // Test create_token instruction
    let createToken = await program.methods
      .create(createTokenParams)
      .accounts({
        maintainers: pdaMaintainers,
        config: pdaConfig,
        mintAccount,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        payer: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    await confirmTransaction(createToken);
  };

  const mint = async (tokenParams, user1ATA, signer) => {
    // Test mint_token instruction
    let mintToken = await program.methods
      .mintToken(tokenParams)
      .accounts({
        maintainers: pdaMaintainers,
        mintAccount,
        toAccount: user1ATA,
        authority: signer.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([signer])
      .rpc();

    await confirmTransaction(mintToken);
  };

  const burn = async (tokenParams, user1ATA) => {
    // Test burn_token instruction
    let burnToken = await program.methods
      .burnToken(tokenParams)
      .accounts({
        maintainers: pdaMaintainers,
        mintAccount,
        from: user1ATA,
        authority: user1.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    await confirmTransaction(burnToken);
  };

  const burnFrom = async (tokenParams, user1ATA, signer) => {
    // Burn from user1 account by admin
    let burnToken = await program.methods
      .burnTokenFrom(tokenParams)
      .accounts({
        maintainers: pdaMaintainers,
        mintAccount,
        from: user1ATA,
        tokenAccount: user1ATA,
        authority: signer.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    await confirmTransaction(burnToken);
  };

  it("Initialize test accounts", async () => {
    // Airdrop sol to the test users
    let adminSol = await provider.connection.requestAirdrop(
      admin.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(adminSol);

    let payerSol = await provider.connection.requestAirdrop(
      payer.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(payerSol);

    let user1Sol = await provider.connection.requestAirdrop(
      user1.publicKey,
      1000 * anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(user1Sol);

    let user2Sol = await provider.connection.requestAirdrop(
      user2.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(user2Sol);

    let mintAuthoritySol = await provider.connection.requestAirdrop(
      mintAuthority.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(mintAuthoritySol);

    let vaultSol = await provider.connection.requestAirdrop(
      vault.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await confirmTransaction(vaultSol);
  });

  it("Initialize global account", async () => {
    [pdaMaintainers] = anchor.web3.PublicKey.findProgramAddressSync(
      [MAINTAINERS],
      program.programId,
    );

    [pdaWhitelist] = anchor.web3.PublicKey.findProgramAddressSync(
      [WHITELIST],
      program.programId,
    );

    // Test initialize instruction
    let init = await program.methods
      .init([vault.publicKey])
      .accounts({
        maintainers: pdaMaintainers,
        whitelist: pdaWhitelist,
        authority: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    await confirmTransaction(init);

    let maintainers = await program.account.maintainers.fetch(pdaMaintainers);
    assert.equal(maintainers.admin.toString(), admin.publicKey.toString());
    assert.isTrue(
      JSON.stringify(maintainers.subAdmins).includes(
        JSON.stringify(admin.publicKey),
      ),
    );

    let whitelist = await program.account.whitelistedUser.fetch(pdaWhitelist);
    assert.isTrue(
      JSON.stringify(whitelist.users).includes(JSON.stringify(vault.publicKey)),
    );
  });

  it("Test Create Token", async () => {
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST],
      program.programId,
    );

    let createTokenParams = {
      name: TEST_TOKEN,
      symbol: "tes",
      uri: "https://arweave.net/dEGah51x5Dlvbfcl8UUGz52KovgWh6QmrYIW48hi244?ext=png",
      decimals: 9,
    };

    await createToken(createTokenParams);

    // Creating another token
    createTokenParams = {
      name: TEST_1_TOKEN,
      symbol: "tes-1",
      uri: "https://arweave.net/dEGah51x5Dlvbfcl8UUGz52KovgWh6QmrYIW48hi244?ext=png",
      decimals: 1,
    };

    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST_1],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST_1],
      program.programId,
    );

    await createToken(createTokenParams);
  });

  it("Test Mint Token", async () => {
    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST],
      program.programId,
    );

    let tokenParams = {
      name: TEST_TOKEN,
      amount: MINT_AMOUNT,
    };

    // Creating associated token for user1 for Test
    let user1ATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mintAccount,
      user1.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await mint(tokenParams, user1ATA.address, admin);

    // Check balance after mint
    let supply = await provider.connection.getTokenSupply(mintAccount);
    assert.equal(Number(supply.value.amount), Number(MINT_AMOUNT));

    let user1Account = await getAccount(
      provider.connection,
      user1ATA.address,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(Number(user1Account.amount), Number(MINT_AMOUNT));

    // Minting Token Test-1
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST_1],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST_1],
      program.programId,
    );

    tokenParams = {
      name: TEST_1_TOKEN,
      amount: MINT_AMOUNT,
    };

    // Creating associated token for user1 for Test-1
    user1ATA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mintAccount,
      user1.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await mint(tokenParams, user1ATA.address, admin);

    // Check balance after mint
    supply = await provider.connection.getTokenSupply(mintAccount);
    assert.equal(Number(supply.value.amount), Number(MINT_AMOUNT));

    user1Account = await getAccount(
      provider.connection,
      user1ATA.address,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(Number(user1Account.amount), Number(MINT_AMOUNT));

    let balance = await provider.connection.getBalance(user1.publicKey);
    // Here balance is divided by 10^6 to remove decimal values return by getBalance method
    assert.equal(balance, Number(MINT_AMOUNT));
  });

  it("Test Burn Token", async () => {
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST],
      program.programId,
    );

    let tokenParams = {
      name: TEST_TOKEN,
      toAccount: user1.publicKey,
      amount: BURN_AMOUNT,
    };

    // Creating associated token for user1 and Test
    let user1ATA = await getAssociatedTokenAddress(
      mintAccount,
      user1.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await burn(tokenParams, user1ATA);

    // Check balance after mint
    let user1Account = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(
      Number(user1Account.amount),
      Number(MINT_AMOUNT) - Number(BURN_AMOUNT),
    );
    let supply = await provider.connection.getTokenSupply(mintAccount);
    assert.equal(
      Number(supply.value.amount),
      Number(MINT_AMOUNT) - Number(BURN_AMOUNT),
    );

    // Burning Token Test-1
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST_1],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST_1],
      program.programId,
    );

    tokenParams = {
      name: TEST_1_TOKEN,
      toAccount: user1.publicKey,
      amount: BURN_AMOUNT,
    };

    // Creating associated token for user1 and Test-1
    user1ATA = await getAssociatedTokenAddress(
      mintAccount,
      user1.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    await burn(tokenParams, user1ATA);

    // Check balance after mint
    user1Account = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(
      Number(user1Account.amount),
      Number(MINT_AMOUNT) - Number(BURN_AMOUNT),
    );
    supply = await provider.connection.getTokenSupply(mintAccount);
    assert.equal(
      Number(supply.value.amount),
      Number(MINT_AMOUNT) - Number(BURN_AMOUNT),
    );
  });

  it("Test Burn Token From", async () => {
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST],
      program.programId,
    );

    // Creating associated token for user1 and Test
    let user1ATA = await getAssociatedTokenAddress(
      mintAccount,
      user1.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // Check balance before burn from
    let user1AccountBeforeBurn = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // Check supply before burn
    let supplyBeforeBurn =
      await provider.connection.getTokenSupply(mintAccount);

    let tokenParams = {
      name: TEST_TOKEN,
      toAccount: user1.publicKey,
      amount: BURN_FROM_AMOUNT,
    };

    await burnFrom(tokenParams, user1ATA, admin);

    // Check balance after burn from
    let user1AccountAfterBurn = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(
      Number(user1AccountAfterBurn.amount),
      Number(user1AccountBeforeBurn.amount) - Number(tokenParams.amount),
    );

    // Check supply after burn
    let supplyAfterBurn = await provider.connection.getTokenSupply(mintAccount);

    assert.equal(
      Number(supplyAfterBurn.value.amount),
      Number(supplyBeforeBurn.value.amount) - Number(tokenParams.amount),
    );

    // Burning Token Test-1
    [pdaConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [CONFIG, TEST_1],
      program.programId,
    );

    [mintAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [MINT, TEST_1],
      program.programId,
    );

    tokenParams = {
      name: TEST_1_TOKEN,
      toAccount: user1.publicKey,
      amount: BURN_FROM_AMOUNT,
    };

    // Creating associated token for user1 and Test-1
    user1ATA = await getAssociatedTokenAddress(
      mintAccount,
      user1.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // Check balance before burn from
    user1AccountBeforeBurn = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );

    // Check supply before burn
    supplyBeforeBurn = await provider.connection.getTokenSupply(mintAccount);

    await burnFrom(tokenParams, user1ATA, admin);

    // Check balance after burn from
    user1AccountAfterBurn = await getAccount(
      provider.connection,
      user1ATA,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    assert.equal(
      Number(user1AccountAfterBurn.amount),
      Number(user1AccountBeforeBurn.amount) - Number(tokenParams.amount),
    );

    // Check supply after burn
    supplyAfterBurn = await provider.connection.getTokenSupply(mintAccount);

    assert.equal(
      Number(supplyAfterBurn.value.amount),
      Number(supplyBeforeBurn.value.amount) - Number(tokenParams.amount),
    );
  });
});
