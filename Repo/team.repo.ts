import TeamModel, { type ITeamMember } from "../DB/Models/team.model.js";
import DBRepo from "./db.repo.js";

class TeamRepo extends DBRepo<ITeamMember> {
  constructor() {
    super(TeamModel);
  }
}

export default new TeamRepo();
