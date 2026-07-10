import type { CreateContactDto } from "./contact.dto.js";
import contactRepo from "../../Repo/contact.repo.js";
import { NotFound } from "../../Common/Exeptions/domain.error.js";

class ContactService {
  private _contactRepo = contactRepo;

  async createContact(body: CreateContactDto) {
    return await this._contactRepo.create(body);
  }

  async listContacts(page: number = 1, limit: number = 20) {
    return await this._contactRepo.paginate({
      filter: {},
      page,
      limit,
    });
  }

  async deleteContact(id: string) {
    const contact = await this._contactRepo.findById({ id });
    if (!contact) {
      throw new NotFound("Contact message not found");
    }
    await this._contactRepo.deleteOne({ filter: { _id: id } });
    return contact;
  }
}

export default new ContactService();
