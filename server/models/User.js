import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return !this.googleId;
      },
      minlength: 6,
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer", "admin"],
      default: "jobseeker"
    },
    profileImage: {
      url: String,
      publicId: String
    },
    resume: {
      url: String,
      publicId: String
    },
    phone: String,
    whatsapp: String,
    skills: [String],
    preferredCity: String,
    preferredLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined
      },
      coordinates: {
        type: [Number],
        default: undefined
      }
    },
    experienceLevel: {
      type: String,
      enum: ["", "Fresher", "0-1 years", "1-3 years", "3-5 years", "5+ years"],
      default: ""
    },
    companyName: String,
    isBlocked: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isVerifiedEmployer: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.password || !this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
