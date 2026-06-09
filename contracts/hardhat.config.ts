import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const MANTLESCAN_API_KEY = process.env.MANTLESCAN_API_KEY || "abc";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: { chainId: 31337 },
    mantleSepolia: {
      url: process.env.MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz",
      chainId: 5003,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    mantle: {
      url: process.env.MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz",
      chainId: 5000,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      mantleSepolia: MANTLESCAN_API_KEY,
      mantle: MANTLESCAN_API_KEY,
    },
    customChains: [
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache",
  },
};

export default config;
