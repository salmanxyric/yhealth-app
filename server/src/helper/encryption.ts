import bcrypt from "bcryptjs";

// Helper to hash password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

// Helper to compare password
export async function comparePassword(
  candidatePassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch {
    return false;
  }
}
