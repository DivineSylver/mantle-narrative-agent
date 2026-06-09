import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const recorderEnv = process.env.RECORDER_ADDRESS;
  const resolverEnv = process.env.RESOLVER_ADDRESS;
  const recorder = recorderEnv && ethers.isAddress(recorderEnv) ? recorderEnv : deployer.address;
  const resolver = resolverEnv && ethers.isAddress(resolverEnv) ? resolverEnv : deployer.address;

  console.log(`Network    : ${network.name}`);
  console.log(`Deployer   : ${deployer.address}`);
  console.log(`Recorder   : ${recorder}`);
  console.log(`Resolver   : ${resolver}`);

  const Factory = await ethers.getContractFactory("PredictionStore");
  const contract = await Factory.deploy(recorder, resolver);
  const tx = contract.deploymentTransaction();
  console.log(`Deploy tx  : ${tx?.hash}`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Deployed   : ${address}`);

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address,
    deployer: deployer.address,
    recorder,
    resolver,
    txHash: tx?.hash,
    blockNumber: tx ? (await tx.wait())?.blockNumber : null,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${network.name}.json`), JSON.stringify(out, null, 2));
  console.log(`Wrote      : deployments/${network.name}.json`);

  // Mirror ABI into backend for the Python signer.
  const artifact = await import(
    path.join(__dirname, "..", "artifacts", "src", "PredictionStore.sol", "PredictionStore.json")
  );
  const abiOutPath = path.join(__dirname, "..", "..", "backend", "contracts", "PredictionStore.abi.json");
  fs.mkdirSync(path.dirname(abiOutPath), { recursive: true });
  fs.writeFileSync(abiOutPath, JSON.stringify((artifact as { abi: unknown }).abi, null, 2));
  console.log(`ABI mirror : ${abiOutPath}`);

  if (network.name === "mantleSepolia" || network.name === "mantle") {
    console.log("Waiting 30s before verify...");
    await new Promise((r) => setTimeout(r, 30_000));
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [recorder, resolver],
      });
      console.log("Verified on Mantlescan.");
    } catch (e) {
      console.warn("Verify failed (you can re-run `hardhat verify ...`):", e);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
