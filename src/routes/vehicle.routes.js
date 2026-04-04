import {Router} from "express";
import {
	createVehicle,
	deleteVehicle,
	getAllUserVehicles, getQr,
	getVehicle,
	qrScanned,
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
	.patch(jwt_auth, upload_mul.fields([{name: "vehicleImages", maxCount: 10}]), updateVehicleImage);

vehicleRoutes.route("/delete/:vehicleId").delete(jwt_auth, deleteVehicle);
vehicleRoutes.route("/getQr/:vehicleId").get(jwt_auth, getQr);



vehicleRoutes.route("/qrScanned/:qrId").post(qrScanned);

export default vehicleRoutes;
