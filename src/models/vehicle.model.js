import mongoose, { Schema } from "mongoose";

const normalizePlateNumber = (value) => {
  if (typeof value !== "string") return value;
  const raw = value.trim().toUpperCase();
  let normalized = raw.replace(/[^A-Z0-9]/g, "");

  if (normalized.startsWith("IND")) normalized = normalized.slice(3);

  const standardPlate = /^[A-Z]{2}\d{2}(?![IO])[A-Z]{1,2}\d{4}$/;
  const bhPlate = /^\d{2}BH\d{4}(?![IO])[A-Z]{2}$/;

  if (!standardPlate.test(normalized) && !bhPlate.test(normalized)) {
    throw new Error(
      "Invalid Indian plate format. Expected e.g. MH12AB1234, DL01C1234, or BH format 22BH1234AA."
    );
  }

  return normalized;
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

    description: {
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
