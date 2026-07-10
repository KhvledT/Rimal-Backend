import type { UpdateContactInfoDto } from "./contactInfo.dto.js";
import contactInfoRepo from "../../Repo/contactInfo.repo.js";
import { NotFound } from "../../Common/Exeptions/domain.error.js";

class ContactInfoService {
  private _contactInfoRepo = contactInfoRepo;

  async getContactInfo() {
    const info = await this._contactInfoRepo.getSingleton();
    if (!info) {
      throw new NotFound("Contact info has not been initialized yet");
    }
    return info;
  }

  async updateContactInfo(data: UpdateContactInfoDto) {
    return await this._contactInfoRepo.upsertSingleton(data);
  }
}

export default new ContactInfoService();
