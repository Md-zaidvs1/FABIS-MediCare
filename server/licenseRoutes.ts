import { Router } from "express";

export const licenseRouter = Router();

// In-memory state for doctor access and maintenance mode
let serverDoctorAccess: "Active" | "Locked" = "Active";
let serverMaintenanceMode = false;

licenseRouter.get("/status", (req, res) => {
  const isLockedForDoctor = serverMaintenanceMode || serverDoctorAccess === "Locked";

  res.json({
    serverTime: new Date().toISOString(),
    serverTimestamp: Date.now(),
    doctorAccess: serverDoctorAccess,
    maintenanceMode: serverMaintenanceMode,
    isLocked: isLockedForDoctor,
    accessStatus: isLockedForDoctor ? "Locked" : "Active",
  });
});

licenseRouter.post("/doctor-access", (req, res) => {
  const { doctorAccess } = req.body || {};
  if (doctorAccess === "Active" || doctorAccess === "Locked") {
    serverDoctorAccess = doctorAccess;
  }
  const isLockedForDoctor = serverMaintenanceMode || serverDoctorAccess === "Locked";

  res.json({
    success: true,
    doctorAccess: serverDoctorAccess,
    maintenanceMode: serverMaintenanceMode,
    isLocked: isLockedForDoctor,
    serverTime: new Date().toISOString(),
  });
});

licenseRouter.post("/maintenance-mode", (req, res) => {
  const { maintenanceMode } = req.body || {};
  if (typeof maintenanceMode === "boolean") {
    serverMaintenanceMode = maintenanceMode;
  }
  const isLockedForDoctor = serverMaintenanceMode || serverDoctorAccess === "Locked";

  res.json({
    success: true,
    doctorAccess: serverDoctorAccess,
    maintenanceMode: serverMaintenanceMode,
    isLocked: isLockedForDoctor,
    serverTime: new Date().toISOString(),
  });
});

// Backward compatibility alias
licenseRouter.post("/admin-override", (req, res) => {
  const { unlock } = req.body || {};
  if (typeof unlock === "boolean") {
    serverDoctorAccess = unlock ? "Active" : "Locked";
  }
  const isLockedForDoctor = serverMaintenanceMode || serverDoctorAccess === "Locked";

  res.json({
    success: true,
    doctorAccess: serverDoctorAccess,
    maintenanceMode: serverMaintenanceMode,
    isLocked: isLockedForDoctor,
    serverTime: new Date().toISOString(),
  });
});
