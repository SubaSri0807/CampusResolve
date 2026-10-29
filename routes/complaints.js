
const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");

const router = express.Router();

// Submit a new complaint
router.post("/", async (req, res) => {
  try {
    const {
      studentName,
      studentId,
      department,
      category,
      title,
      description,
      priority
    } = req.body;

    const complaint = await Complaint.create({
      studentName,
      studentId,
      department,
      category,
      title,
      description,
      priority
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not submit complaint",
      error: error.message
    });
  }
});

/* Public dashboard summary */
router.get("/public/summary", async (req, res) => {
  try {
    const [total, pending, resolved] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Pending" }),
      Complaint.countDocuments({ status: "Resolved" })
    ]);

    res.json({ total, pending, resolved });
  } catch (error) {
    res.status(500).json({
      message: "Could not load complaint summary",
      error: error.message
    });
  }
});

/* Public recent complaints */
router.get("/public/recent", async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("_id title category status createdAt");

    res.json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Could not load recent complaints",
      error: error.message
    });
  }
});

/* Track a complaint by ID (public endpoint) */
router.get("/:id/track", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid complaint ID"
      });
    }

    const complaint = await Complaint.findById(req.params.id)
      .select("_id title category status resolutionNote createdAt updatedAt");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({
      message: "Could not track complaint",
      error: error.message
    });
  }
});

// Get all complaints
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({
      createdAt: -1
    });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Could not load complaints",
      error: error.message
    });
  }
});

// Get one complaint by ID
router.get("/:id", async (req, res) => {
    
/* Student: Track a complaint by ID */
router.get("/:id/track", async (req, res) => {
  try {
    const complaintId = req.params.id;

    if (!mongoose.isValidObjectId(complaintId)) {
      return res.status(400).json({
        message: "Invalid complaint ID. Please check the ID and try again."
      });
    }

    const complaint = await Complaint.findById(complaintId).select(
      "_id title category status resolutionNote createdAt updatedAt"
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found. Please check your complaint ID."
      });
    }

    res.status(200).json({
      complaintId: complaint._id,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      resolutionNote: complaint.resolutionNote,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
    });
  } catch (error) {
    console.error("Complaint tracking error:", error);

    res.status(500).json({
      message: "Could not track the complaint. Please try again later."
    });
  }
});

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid complaint ID"
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({
      message: "Could not retrieve complaint",
      error: error.message
    });
  }
});

// Admin: Update complaint status and resolution notes
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid complaint ID"
      });
    }

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
      "Rejected"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        allowedStatuses
      });
    }

    const update = { status };

    if (resolutionNote !== undefined) {
      if (typeof resolutionNote !== "string") {
        return res.status(400).json({
          message: "Resolution note must be text"
        });
      }

      update.resolutionNote = resolutionNote.trim();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.status(200).json({
      message: "Complaint updated successfully",
      complaint
    });
  } catch (error) {
    res.status(400).json({
      message: "Could not update complaint",
      error: error.message
    });
  }
});

// Export router
module.exports = router;
