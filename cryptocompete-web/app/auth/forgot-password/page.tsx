import type { Metadata } from "next";
import ForgotPasswordPage from "./forgot-password-client";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Reset your CryptoCompete password. Enter your email to receive a password reset link.",
};

export default ForgotPasswordPage;
