import DBRepo from "./db.repo.js";
import OtpModel, { type IOtp } from "../DB/Models/otp.model.js";

class OtpRepo extends DBRepo<IOtp> {
  constructor() {
    super(OtpModel);
  }
}

export default new OtpRepo();
