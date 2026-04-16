/** Domain error for registration flow (no DB import — safe for API error mapping / tests). */
export class RegistrationError extends Error {
  constructor(
    public readonly code: "VALIDATION" | "CONFLICT" | "INTERNAL",
    public readonly httpStatus: number,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "RegistrationError";
  }
}
