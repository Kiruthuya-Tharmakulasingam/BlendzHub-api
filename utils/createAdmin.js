import readline from "readline";
import User from "../models/user.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Helper function to prompt for user input
const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Helper function to prompt for password (hidden input)
const askPassword = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
    // Note: In a real scenario, you might want to hide password input
    // For simplicity, we'll just use regular input here
  });
};

// Script to create initial admin user
const createAdmin = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n=== Admin User Creation ===\n");

    await connectDB();

    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin", isApproved: true });

    if (adminExists) {
      console.log("\n  An admin user already exists!");
      const overwrite = await askQuestion(
        rl,
        "Do you want to create another admin? (yes/no): "
      );

      if (
        overwrite.toLowerCase() !== "yes" &&
        overwrite.toLowerCase() !== "y"
      ) {
        console.log("Operation cancelled.");
        rl.close();
        process.exit(0);
      }
    }

    // Prompt for admin details
    console.log("\nPlease provide admin details:\n");

    const adminName = await askQuestion(rl, "Admin Name: ");
    if (!adminName) {
      console.log("Name is required!");
      rl.close();
      process.exit(1);
    }

    const adminEmail = await askQuestion(rl, "Admin Email: ");
    if (!adminEmail) {
      console.log("Email is required!");
      rl.close();
      process.exit(1);
    }

    // Validate email format
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

    const adminRole =
      (await askQuestion(rl, "Admin Role (owner/admin) [default: admin]: ")) ||
      "admin";

    if (!["owner", "admin"].includes(adminRole.toLowerCase())) {
      console.log("Role must be 'owner' or 'admin'!");
      rl.close();
      process.exit(1);
    }

    rl.close();

    // Check if user with this email exists
    const existingUser = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingUser) {
      // Update existing user to admin
      existingUser.name = adminName;
      existingUser.role = adminRole.toLowerCase();
      existingUser.isApproved = true;
      existingUser.approvedBy = existingUser._id; // Self-approved
      existingUser.approvedAt = new Date();
      existingUser.password = adminPassword; // Password will be hashed by pre-save hook
      await existingUser.save();
      console.log("\n Existing user updated to admin!");
      console.log(`   Name: ${adminName}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Role: ${adminRole.toLowerCase()}`);
    } else {
      // Create new admin user
      const admin = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: adminRole.toLowerCase(),
        isApproved: true,
        approvedBy: null, // First admin is self-approved
        approvedAt: new Date(),
      });

      console.log("\n Admin user created successfully!");
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: Approved`);
    }

    console.log("\n Setup complete!\n");
    process.exit(0);
  } catch (error) {
    rl.close();
    console.error("\n Error creating admin:", error.message);
    process.exit(1);
  }
};

// Run if called directly
createAdmin();

export default createAdmin;
