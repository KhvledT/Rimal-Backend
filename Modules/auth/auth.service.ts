import userRepo from "../../Repo/user.repo.js";
import {
  BadRequest,
  NotFound,
  Unauthorized,
  Conflict,
} from "../../Common/Exeptions/domain.error.js";
import { compareOperation } from "../../Common/security/hash.js";
import tokenService from "../../Common/security/token.js";
import type { LoginDto, SignupDto } from "./auth.dto.js";

class AuthService {
  private _userRepo = userRepo;

  async login(body: LoginDto) {
    const { username, password } = body;

    // Find user by userName or email
    const user = await this._userRepo.findOne({
      filter: {
        $or: [{ userName: username }, { email: username }],
      },
    });

    if (!user) {
      throw new Unauthorized("Invalid username or password");
    }

    // Compare password
    const isMatch = await compareOperation({
      plainValue: password,
      hashedValue: user.password,
    });

    if (!isMatch) {
      throw new Unauthorized("Invalid username or password");
    }

    // Generate tokens
    const { access_Token, refresh_Token } =
      tokenService.generateAccessAndRefreshToken(user);

    return {
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      accessToken: access_Token,
      refreshToken: refresh_Token,
    };
  }

  async signup(body: SignupDto) {
    const { username, email, password, role } = body;

    // Check if user already exists
    const existingUser = await this._userRepo.findOne({
      filter: { email },
    });

    if (existingUser) {
      throw new Conflict("User already exists with this email");
    }

    const newUser = await this._userRepo.create({
      userName: username,
      email,
      password,
      role: role ?? 0, // default to RoleEnum.User if not specified
    });

    return {
      id: newUser._id,
      userName: newUser.userName,
      email: newUser.email,
      role: newUser.role,
    };
  }
}

export default new AuthService();
