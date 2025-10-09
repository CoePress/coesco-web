import { Router } from "express";

import { externalInvitationController } from "@/controllers";

const router = Router();

// Stats and active invitations
router.get("/invitations/stats", externalInvitationController.getInvitationStats);
router.get("/invitations/active", externalInvitationController.getActiveInvitations);

// Validation and tracking
router.get("/invitations/validate/:token", externalInvitationController.validateInvitation);
router.post("/invitations/track/:token", externalInvitationController.trackUsage);

// CRUD operations
router.post("/invitations", externalInvitationController.createInvitation);
router.get("/invitations", externalInvitationController.getInvitations);
router.get("/invitations/:id", externalInvitationController.getInvitation);
router.post("/invitations/:id/revoke", externalInvitationController.revokeInvitation);

export default router;
