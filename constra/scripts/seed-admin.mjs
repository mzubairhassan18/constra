// Generates a random admin password + bcrypt hash (prints to stdout only).
import { randomBytes } from "node:crypto";
import { hashSync } from "bcryptjs";

const password = randomBytes(9).toString("base64url");
const hash = hashSync(password, 10);
console.log(JSON.stringify({ password, hash }));
