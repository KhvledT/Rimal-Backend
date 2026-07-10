// This middleware is currently inactive as GraphQL has been excluded from the Rimal scope.
// It is preserved as a placeholder to prevent typescript compilation errors for unused code.
import type { RoleEnum } from "../enums/user.enums.js";

function authorizationGraphQl(userRole: RoleEnum, endPointRoles: RoleEnum[]) {
    // Placeholder
}

export default authorizationGraphQl;