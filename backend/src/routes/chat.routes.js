import express from "express";
import mongoose from "mongoose"; // Missing import
import User from "../models/User.js";
import Chat from "../models/Chats.js";
import Appointments from "../models/Appointments.js";
import PatientProfile from "../models/PatientProfile.js";
import DoctorProfile from "../models/DoctorProfile.js";
import { authRequired } from "../middlewares/auth.js";
import { getIO } from "../socket.js";

const router = express.Router();

// Get all chats for a user
router.get("/my-chats", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    const query =
      userType === "doctor" ? { doctorId: userId } : { patientId: userId };

    const chats = await Chat.find(query)
      .populate("appointmentId", "date time status")
      .populate("doctorId", "name specialization")
      .populate("patientId", "name email")
      .sort({ lastUpdated: -1 })
      .select("appointmentId doctorId patientId lastUpdated messages");

    const formattedChats = chats.map((chat) => ({
      _id: chat._id,
      appointmentId: chat.appointmentId,
      doctor: chat.doctorId,
      patient: chat.patientId,
      lastMessage:
        chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null,
      lastUpdated: chat.lastUpdated,
      messageCount: chat.messages.length,
    }));

    res.json({
      success: true,
      data: formattedChats,
    });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get specific chat history with pagination
router.get("/appointment/:appointmentId", authRequired, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    let profileId = null;

    if (req.user.role === "doctor") {
      const doctor = await DoctorProfile.findOne({ user: userId });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found",
        });
      }

      profileId = doctor._id.toString();
    } else {
      const patient = await PatientProfile.findOne({ user: userId });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      profileId = patient._id.toString();
    }

    const chat = await Chat.findOne({
      appointmentId,
      $or: [{ doctorId: profileId }, { patientId: profileId }],
    })
      .populate("doctorId", "name email")
      .populate("patientId", "name email")
      .populate("appointmentId", "date time status");

    // No chat yet -> return empty conversation
    if (!chat) {
      return res.json({
        success: true,
        data: {
          chat: null,
          messages: [],
          totalMessages: 0,
          currentPage: 1,
          totalPages: 1,
          hasMore: false,
        },
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const totalMessages = chat.messages.length;

    const startIndex = Math.max(0, totalMessages - pageNum * limitNum);
    const endIndex = totalMessages - (pageNum - 1) * limitNum;

    const messages = chat.messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        chat: {
          _id: chat._id,
          appointmentId: chat.appointmentId,
          doctor: chat.doctorId,
          patient: chat.patientId,
          lastUpdated: chat.lastUpdated,
        },
        messages,
        totalMessages,
        currentPage: pageNum,
        totalPages: Math.ceil(totalMessages / limitNum),
        hasMore: startIndex > 0,
      },
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get chat history",
    });
  }
});

// Send a message (better naming than "update")
router.post("/send-message", authRequired, async (req, res) => {
  try {
    const { appointmentId, message } = req.body;
    const userId = req.user.id;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    let senderName = user.firstName + " " + user.lastName;
    if (!appointmentId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "appointmentId and message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID format",
      });
    }

    let chat = await Chat.findOne({ appointmentId });

    // Create chat automatically if it doesn't exist
    if (!chat) {
      const appointment = await Appointments.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      let profileId = null;

      if (req.user.role === "doctor") {
        const doctor = await DoctorProfile.findOne({ user: userId });

        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: "Doctor profile not found",
          });
        }

        profileId = doctor._id.toString();
      } else {
        const patient = await PatientProfile.findOne({ user: userId });

        if (!patient) {
          return res.status(404).json({
            success: false,
            message: "Patient profile not found",
          });
        }

        profileId = patient._id.toString();
      }

      if (
        appointment.doctorId.toString() !== profileId &&
        appointment.patientId.toString() !== profileId
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      chat = await Chat.create({
        appointmentId,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        messages: [],
        lastUpdated: new Date(),
      });
    }

    const newMessage = {
      senderId: userId,
      senderName,
      senderRole: req.user.role,
      message: message.trim(),
      timestamp: new Date(),
    };

    chat.messages.push(newMessage);

    chat.lastUpdated = new Date();

    await chat.save();

    const io = getIO();

    io.to(appointmentId).emit("newMessage", newMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

export default router;
