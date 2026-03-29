import mongoose, { Schema } from "mongoose";

const normalizePlateNumber = (value) => {
  if (typeof value !== "string") return value;

  return value.replace(/[\s-]/g, "").toUpperCase().trim();
};

const vehicleSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
      enum: ["CAR", "MOTORCYCLE", "TRUCK", "BUS", "OTHER"],
    },
    plateNumber: {
      type: String,
      required: true,
      trim: true,
      set: normalizePlateNumber,

      minlength: 4,
      maxlength: 16,
      match: [/^[A-Z0-9]+$/, "plateNumber must be alphanumeric"],
    },
    qrId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      uppercase: true,
      minlength: 8,
      maxlength: 8,
      match: [/^[A-Z0-9]{8}$/, "qrId must be exactly 8 characters"],
    },

    label: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    vehicleImage:[{
        type: String,
        required: true
    }]
  },
  {
    timestamps: true,

  }
);



export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
