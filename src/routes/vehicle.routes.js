import {Router} from "express";
import {
	activateDeactivateVehicleQr,
	createVehicle,
	deleteVehicle,
	getAllUserVehicles, getQr,
	getVehicle, getVehicleByQrId,
	qrScanned, sendEmailToOwner,
	updateVehicleImage,
} from "../controllers/vehicle.controller.js";
import {jwt_auth} from "../middlewares/auth.middleware.js";
import {upload_mul} from "../middlewares/multer.middleware.js";

const vehicleRoutes = Router();



vehicleRoutes
	.route("/create")
	.post(jwt_auth, upload_mul.fields([{name: "vehicleImages", maxCount: 10}]), createVehicle);

vehicleRoutes.route("/get/:vehicleId").get(jwt_auth, getVehicle);

vehicleRoutes.route("/getAll").get(jwt_auth, getAllUserVehicles);

vehicleRoutes
	.route("/updateVehicleImage/:vehicleId")
	.post(jwt_auth, upload_mul.fields([{name: "vehicleImages", maxCount: 10}]), updateVehicleImage);

vehicleRoutes.route("/delete/:vehicleId").delete(jwt_auth, deleteVehicle);
vehicleRoutes.route("/getQr/:vehicleId").get(jwt_auth, getQr);



vehicleRoutes.route("/qrScanned/:qrId").post(  upload_mul.fields([{
	name: "captured",
	maxCount: 10
}]) ,  qrScanned);
vehicleRoutes.route("/getVehicleByQrId/:qrId").get(getVehicleByQrId);
vehicleRoutes.route("/activateQr/:vehicleId").patch(jwt_auth, activateDeactivateVehicleQr);
vehicleRoutes.route("/sendEmail").post(sendEmailToOwner)
export default vehicleRoutes;
