import ContactModel, { type IContact } from "../DB/Models/contact.model.js";
import DBRepo from "./db.repo.js";

class ContactRepo extends DBRepo<IContact> {
  constructor() {
    super(ContactModel);
  }
}

export default new ContactRepo();
