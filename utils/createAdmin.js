import readline from "readline";
import User from "../models/user.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const askQuestion = (rl, question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });

const askPassword = (rl, question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });

const createAdmin = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n=== Admin User Creation ===\n");
    await connectDB();

    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      const overwrite = await askQuestion(
        rl,
        "An admin already exists. Create another? (yes/no): "
      );
      if (!["yes", "y"].includes(overwrite.toLowerCase())) {
        rl.close();
        process.exit(0);
      }
    }

    const adminName = await askQuestion(rl, "Admin Name: ");
    const adminEmail = (await askQuestion(rl, "Admin Email: ")).toLowerCase();
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(adminEmail)) {
      console.log("Invalid email format!");
      rl.close();
      process.exit(1);
    }

    const adminPassword = await askPassword(
      rl,
      "Admin Password (min 6 characters): "
    );
    if (!adminPassword || adminPassword.length < 6) {
      console.log("Password must be at least 6 characters!");
      rl.close();
      process.exit(1);
    }
    const confirmPassword = await askPassword(rl, "Confirm Password: ");
    if (adminPassword !== confirmPassword) {
      console.log("Passwords do not match!");
      rl.close();
      process.exit(1);
    }

    rl.close();

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      existingUser.name = adminName;
      existingUser.role = "admin";
      existingUser.isActive = true;
      existingUser.password = adminPassword;
      await existingUser.save();
      console.log("\nExisting user promoted to admin.");
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isActive: true,
      });
      console.log("\nAdmin user created successfully.");
    }

    console.log("Setup complete!\n");
    process.exit(0);
  } catch (error) {
    rl.close();
    console.error("\nError creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

export default createAdmin;
