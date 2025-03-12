import { Err, Ok } from "~/utils/result";

export function generateSecret() {
  try {
    const secureRandomBytes = crypto.getRandomValues(new Uint8Array(32));
    const secret = Buffer.from(secureRandomBytes).toString("hex");

    return new Ok(secret);
  } catch (error) {
    console.error(error);

    return new Err(
      "Failed to generate a secure random secret. Please try again later."
    );
  }
}
