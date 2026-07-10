import DBRepo from "./db.repo.js";
import SessionModel, { type ISession } from "../DB/Models/session.model.js";

class SessionRepo extends DBRepo<ISession> {
  constructor() {
    super(SessionModel);
  }
}

export default new SessionRepo();
