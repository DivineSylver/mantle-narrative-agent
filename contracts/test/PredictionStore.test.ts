import { expect } from "chai";
import { ethers } from "hardhat";
import { PredictionStore } from "../typechain-types";

describe("PredictionStore", () => {
  let contract: PredictionStore;
  let owner: any, recorder: any, resolver: any, stranger: any;

  beforeEach(async () => {
    [owner, recorder, resolver, stranger] = await ethers.getSigners();
    const F = await ethers.getContractFactory("PredictionStore");
    contract = (await F.deploy(recorder.address, resolver.address)) as unknown as PredictionStore;
    await contract.waitForDeployment();
  });

  it("records a prediction and emits an event", async () => {
    const tx = await contract
      .connect(recorder)
      .recordPrediction("mETH", 2, 8200, 7, "NR-184");
    await expect(tx).to.emit(contract, "PredictionRecorded").withArgs(1n, "mETH", 2, 8200);
    const p = await contract.getPrediction(1);
    expect(p.asset).to.equal("mETH");
    expect(p.direction).to.equal(2n);
    expect(p.confidenceBps).to.equal(8200);
    expect(p.horizonDays).to.equal(7);
    expect(p.status).to.equal(0n); // Open
  });

  it("rejects non-recorder", async () => {
    await expect(
      contract.connect(stranger).recordPrediction("mETH", 2, 8200, 7, "NR-1"),
    ).to.be.revertedWithCustomError(contract, "NotRecorder");
  });

  it("rejects invalid horizon", async () => {
    await expect(
      contract.connect(recorder).recordPrediction("mETH", 2, 8200, 14, "NR-1"),
    ).to.be.revertedWithCustomError(contract, "InvalidHorizon");
  });

  it("rejects confidence > 10000", async () => {
    await expect(
      contract.connect(recorder).recordPrediction("mETH", 2, 10_001, 7, "NR-1"),
    ).to.be.revertedWithCustomError(contract, "InvalidConfidence");
  });

  it("resolves a bullish prediction correctly", async () => {
    await contract.connect(recorder).recordPrediction("mETH", 2, 8200, 7, "NR-1");
    await contract.connect(resolver).resolvePrediction(1, 480); // +4.8%
    const p = await contract.getPrediction(1);
    expect(p.status).to.equal(1n); // Won
    expect(p.realizedBps).to.equal(480);
  });

  it("marks bearish-as-bullish as Lost", async () => {
    await contract.connect(recorder).recordPrediction("AGNI", 2, 6100, 7, "NR-2");
    await contract.connect(resolver).resolvePrediction(1, -710); // -7.1%
    const p = await contract.getPrediction(1);
    expect(p.status).to.equal(2n); // Lost
  });

  it("neutral within band is Won", async () => {
    await contract.connect(recorder).recordPrediction("USDC", 1, 5000, 7, "NR-3");
    await contract.connect(resolver).resolvePrediction(1, 75);
    const p = await contract.getPrediction(1);
    expect(p.status).to.equal(1n); // Won
  });

  it("disallows double-resolution", async () => {
    await contract.connect(recorder).recordPrediction("mETH", 2, 8200, 7, "NR-1");
    await contract.connect(resolver).resolvePrediction(1, 480);
    await expect(
      contract.connect(resolver).resolvePrediction(1, 200),
    ).to.be.revertedWithCustomError(contract, "AlreadyResolved");
  });

  it("paginates predictions", async () => {
    for (let i = 0; i < 5; i++) {
      await contract.connect(recorder).recordPrediction("mETH", 2, 8000, 7, `NR-${i}`);
    }
    const page = await contract.getPredictions(2, 3);
    expect(page).to.have.length(3);
    expect(page[0].id).to.equal(2n);
    expect(page[2].id).to.equal(4n);
  });

  it("owner can rotate recorder", async () => {
    await contract.connect(owner).setRecorder(stranger.address);
    await contract.connect(stranger).recordPrediction("MNT", 2, 7000, 7, "NR-7");
    expect(await contract.predictionCount()).to.equal(1n);
  });
});
