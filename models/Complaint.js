
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    studentId: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Infrastructure",
        "Academics",
        "Hostel",
        "Canteen",
        "Transport",
        "Harassment",
        "Other"
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending"
    },
    resolutionNote: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
