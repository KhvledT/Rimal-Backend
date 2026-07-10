import CorporateProfileModel, { type ICorporateProfile } from "../DB/Models/corporateProfile.model.js";
import DBRepo from "./db.repo.js";

class CorporateProfileRepo extends DBRepo<ICorporateProfile> {
  constructor() {
    super(CorporateProfileModel);
  }

  async getSingleton(): Promise<any | null> {
    return await this.model.findOne().lean();
  }

  async upsertSingleton(data: ICorporateProfile) {
    return await this.model.findOneAndUpdate(
      {},
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

export default new CorporateProfileRepo();
