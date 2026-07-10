import ContactInfoModel, { type IContactInfo } from "../DB/Models/contactInfo.model.js";
import DBRepo from "./db.repo.js";

class ContactInfoRepo extends DBRepo<IContactInfo> {
  constructor() {
    super(ContactInfoModel);
  }

  async getSingleton(): Promise<any | null> {
    return await this.model.findOne().lean();
  }

  async upsertSingleton(data: Partial<IContactInfo>) {
    return await this.model.findOneAndUpdate(
      {},
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

// Since IHTeamMember was typed in getSingleton, let's keep it generic or IContactInfo
export default new ContactInfoRepo();
