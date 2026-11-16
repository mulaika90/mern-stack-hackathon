import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import userModel from "./src/models/users.model.js";

const envPath = fileURLToPath(new URL("./.env", import.meta.url));

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set. Add it to the backend .env file.");
  }

  await connectDB();
  await ensureAdminAccount();
  await ensureDoctorAccount();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

async function ensureAdminAccount() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME } = process.env;
  if (!ADMIN_EMAIL && !ADMIN_PASSWORD && !ADMIN_USERNAME) return;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_USERNAME) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME together to configure the clinic administrator.");
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existingAdmin = await userModel.findOne({ email });
  if (existingAdmin) {
    if (!["admin", "patient", "user"].includes(existingAdmin.role)) {
      throw new Error("ADMIN_EMAIL belongs to a staff account with another role. Choose a different administrator email.");
    }
    const username = ADMIN_USERNAME.trim();
    const passwordMatches = await bcrypt.compare(ADMIN_PASSWORD, existingAdmin.password);
    if (existingAdmin.role !== "admin" || existingAdmin.username !== username || !passwordMatches) {
      const usernameInUse = await userModel.findOne({
        username,
        _id: { $ne: existingAdmin._id }
      }).select("_id");
      if (usernameInUse) {
        throw new Error("ADMIN_USERNAME is already in use. Choose a different administrator username.");
      }
      existingAdmin.role = "admin";
      existingAdmin.username = username;
      existingAdmin.password = passwordMatches
        ? existingAdmin.password
        : await bcrypt.hash(ADMIN_PASSWORD, 10);
      await existingAdmin.save();
      console.log("Clinic administrator account credentials were synchronized.");
    }
    return;
  }

  await userModel.create({
    username: ADMIN_USERNAME.trim(),
    email,
    password: await bcrypt.hash(ADMIN_PASSWORD, 10),
    role: "admin"
  });
  console.log("Clinic administrator account is ready.");
}

async function ensureDoctorAccount() {
  const { DOCTOR_EMAIL, DOCTOR_EXPERIENCE, DOCTOR_PASSWORD, DOCTOR_SPECIALIZATION, DOCTOR_USERNAME } = process.env;
  const configuredValues = [DOCTOR_EMAIL, DOCTOR_PASSWORD, DOCTOR_USERNAME];
  if (configuredValues.every((value) => !value)) return;
  if (configuredValues.some((value) => !value)) {
    throw new Error("Set DOCTOR_EMAIL, DOCTOR_PASSWORD, and DOCTOR_USERNAME together to configure the clinic doctor.");
  }
  if (DOCTOR_PASSWORD.length < 8) {
    throw new Error("DOCTOR_PASSWORD must be at least 8 characters.");
  }

  const experience = DOCTOR_EXPERIENCE ? Number(DOCTOR_EXPERIENCE) : 0;
  if (!Number.isInteger(experience) || experience < 0 || experience > 70) {
    throw new Error("DOCTOR_EXPERIENCE must be a whole number between 0 and 70.");
  }

  const email = DOCTOR_EMAIL.trim().toLowerCase();
  const username = DOCTOR_USERNAME.trim();
  const specialization = DOCTOR_SPECIALIZATION?.trim() || "General practice";
  const existingDoctor = await userModel.findOne({ email });
  if (existingDoctor) {
    if (!["doctor", "patient", "user"].includes(existingDoctor.role)) {
      throw new Error("DOCTOR_EMAIL belongs to a staff account with another role. Choose a different doctor email.");
    }
    const passwordMatches = await bcrypt.compare(DOCTOR_PASSWORD, existingDoctor.password);
    if (
      existingDoctor.role !== "doctor"
      || existingDoctor.username !== username
      || existingDoctor.specialization !== specialization
      || existingDoctor.experience !== experience
      || !passwordMatches
    ) {
      const usernameInUse = await userModel.findOne({
        username,
        _id: { $ne: existingDoctor._id }
      }).select("_id");
      if (usernameInUse) {
        throw new Error("DOCTOR_USERNAME is already in use. Choose a different doctor username.");
      }
      existingDoctor.role = "doctor";
      existingDoctor.username = username;
      existingDoctor.password = passwordMatches
        ? existingDoctor.password
        : await bcrypt.hash(DOCTOR_PASSWORD, 10);
      existingDoctor.specialization = specialization;
      existingDoctor.experience = experience;
      await existingDoctor.save();
      console.log("Clinic doctor account credentials were synchronized.");
    }
    return;
  }

  await userModel.create({
    username,
    email,
    password: await bcrypt.hash(DOCTOR_PASSWORD, 10),
    role: "doctor",
    specialization,
    experience
  });
  console.log("Clinic doctor account is ready.");
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exitCode = 1;
});