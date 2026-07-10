class CustomErorr extends Error {
  constructor(
    message: string,
    public StatusCode: number,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
  }
}

export default CustomErorr;