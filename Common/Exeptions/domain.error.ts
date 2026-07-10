import CustomErorr from "./custom.error.js";

export class BadRequest extends CustomErorr {
  constructor(message: string = "Bad Request", cause?: unknown) {
    super(message, 400, cause);
  }
}

export class Unauthorized extends CustomErorr {
  constructor(message: string = "Unauthorized", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class NotFound extends CustomErorr {
  constructor(message: string = "Not Found", cause?: unknown) {
    super(message, 404, cause);
  }
}

export class Conflict extends CustomErorr {
  constructor(message: string = "Conflict", cause?: unknown) {
    super(message, 409, cause);
  }
}
