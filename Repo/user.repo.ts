import UserModel, { type IUser } from "../DB/Models/user.model.js";
import DBRepo from "./db.repo.js";

class UserRepo extends DBRepo<IUser> {
  constructor() {
    super(UserModel);
  }
}

export default new UserRepo();