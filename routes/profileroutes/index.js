const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/profileController");
const ensureAuthenticated = require("../../middleware/ensureAuthenticated");

// ✅ Public Profile Routes (Anyone Can View)
router.get("/member/:id", profileController.viewMemberProfile);
router.get("/leader/:id", profileController.viewLeaderProfile);
router.get("/groupmember/:id", profileController.viewGroupMemberProfile);
router.get("/group/:id", profileController.viewGroupProfile);

// ✅ Private Profile Edit Routes (Only Authenticated Owners Can Edit)
router.get("/member/:id/edit", ensureAuthenticated, profileController.editMemberProfile);
router.post("/member/:id/update", ensureAuthenticated, profileController.updateMemberProfile);

router.get("/leader/:id/edit", ensureAuthenticated, profileController.editLeaderProfile);
router.post("/leader/:id/update", ensureAuthenticated, (req, res, next) => {
    console.log("✅ Route hit! Leader ID:", req.params.id);
    next();
}, profileController.updateLeaderProfile);


router.get("/groupmember/:id/edit", ensureAuthenticated, profileController.editGroupMemberProfile);
router.post("/groupmember/:id/update", ensureAuthenticated, profileController.updateGroupMemberProfile);

router.get("/group/:id/edit", ensureAuthenticated, profileController.editGroupProfile);
router.post("/group/:id/update", ensureAuthenticated, profileController.updateGroupProfile);


module.exports = router;
















