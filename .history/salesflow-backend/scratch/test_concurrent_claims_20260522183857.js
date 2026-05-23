/**
 * Test concurrent sale creation to verify claimNumber generation is thread-safe
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Sale = require("../src/models/sale.model");
const Claim = require("../src/models/claim.model");
const Client = require("../src/models/client.model");
const Employee = require("../src/models/employee.model");
const saleService = require("../src/services/sale.service");

async function testConcurrentCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get test data
    const client = await Client.findOne({ isActive: true }).lean();
    const employees = await Employee.find({ isActive: true }).limit(4).lean();

    if (!client) {
      console.log("❌ No active client found. Please seed the database first.");
      process.exit(1);
    }

    if (employees.length < 2) {
      console.log(
        "❌ Need at least 2 active employees. Please seed the database first.",
      );
      process.exit(1);
    }

    console.log(`📊 Testing concurrent sale creation...`);
    console.log(`   Client: ${client.name}`);
    console.log(`   Employees: ${employees.map((e) => e.name).join(", ")}\n`);

    // Create 5 sales concurrently
    const salePromises = [];
    for (let i = 1; i <= 5; i++) {
      const saleData = {
        clientId: client._id.toString(),
        projectName: `Test Project ${i}`,
        unitNumber: `UNIT-${i}`,
        contractDate: new Date(),
        invoiceAmount: 100000 + i * 10000,
        invoiceStatus: "pending",
        expectedCollectionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sellers: [
          {
            employeeId: employees[0]._id.toString(),
            percentage: 60,
          },
          {
            employeeId: employees[1]._id.toString(),
            percentage: 40,
          },
        ],
      };

      salePromises.push(
        saleService
          .createSale(saleData)
          .then((sale) => {
            console.log(
              `✅ Sale ${i}: Created ${sale.saleNumber}, Claim: ${sale._doc?.claimNumber || "generating..."}`,
            );
            return sale;
          })
          .catch((err) => {
            console.log(`❌ Sale ${i}: ${err.message}`);
            return null;
          }),
      );
    }

    // Wait for all to complete
    const results = await Promise.all(salePromises);
    const successful = results.filter((r) => r !== null);

    console.log(
      `\n📈 Results: ${successful.length}/5 sales created successfully`,
    );

    // Verify claimNumbers are unique
    const claims = await Claim.find().lean();
    const claimNumbers = claims.map((c) => c.claimNumber);
    const uniqueClaimNumbers = new Set(claimNumbers);

    console.log(`\n🔍 Verification:`);
    console.log(`   Total claims: ${claims.length}`);
    console.log(`   Unique claimNumbers: ${uniqueClaimNumbers.size}`);

    if (claimNumbers.length === uniqueClaimNumbers.size) {
      console.log(`   ✅ All claimNumbers are UNIQUE!\n`);
    } else {
      console.log(`   ❌ DUPLICATES FOUND!\n`);
      const dupes = claimNumbers.filter(
        (n, i) => claimNumbers.indexOf(n) !== i,
      );
      console.log(`   Duplicates: ${[...new Set(dupes)].join(", ")}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testConcurrentCreation();
