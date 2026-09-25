import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer.js";

function createToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function sendAuthResponse(res, user) {
  const token = createToken(user._id);
  const safeUser = user.toObject();
  delete safeUser.password;

  res.json({ token, user: safeUser });
}

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role = "jobseeker", adminSecret } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const allowedRoles = ["jobseeker", "employer", "admin"];

    if (!normalizedName || !normalizedEmail || typeof password !== "string") {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (normalizedName.length > 100 || password.length < 6) {
      return res.status(400).json({ message: "Name must be 100 characters or fewer and password must be at least 6 characters" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid account role" });
    }

    if (role === "admin" && (!process.env.ADMIN_REGISTER_SECRET || adminSecret !== process.env.ADMIN_REGISTER_SECRET)) {
      return res.status(403).json({ message: "Invalid admin secret" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const verificationToken = createRawToken();
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await sendVerificationEmail(user, verificationToken);
    res.status(201).json({
      message: "Account created. Check your email to verify your account.",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      requiresEmailVerification: true
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { credential, role = "jobseeker" } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google login is not configured on the server" });
    }

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const allowedRoles = ["jobseeker", "employer"];
    const selectedRole = allowedRoles.includes(role) ? role : "jobseeker";

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: "Google email is not verified" });
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }]
    });

    if (user?.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked" });
    }

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: normalizedEmail,
        googleId: payload.sub,
        authProvider: "google",
        isEmailVerified: true,
        role: selectedRole,
        profileImage: payload.picture ? { url: payload.picture } : undefined
      });
    } else {
      user.googleId = user.googleId || payload.sub;
      user.authProvider = user.authProvider || "google";
      user.isEmailVerified = true;
      if (!user.profileImage?.url && payload.picture) {
        user.profileImage = { url: payload.picture };
      }
      await user.save();
    }

    sendAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() }
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) return res.status(400).json({ message: "Verification link is invalid or expired" });

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationEmail(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");

    if (user && !user.isEmailVerified && user.authProvider === "local") {
      const token = createRawToken();
      user.emailVerificationToken = hashToken(token);
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user, token);
    }

    res.json({ message: "If that account needs verification, a new email has been sent" });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");

    if (user && user.authProvider === "local") {
      const token = createRawToken();
      user.resetPasswordToken = hashToken(token);
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendPasswordResetEmail(user, token);
    }

    res.json({ message: "If that email is registered, password reset instructions have been sent" });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const token = typeof req.body.token === "string" ? req.body.token : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() }
    }).select("+resetPasswordToken +resetPasswordExpires");
    if (!user) return res.status(400).json({ message: "Password reset link is invalid or expired" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}
