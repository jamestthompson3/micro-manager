export class InvalidUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export class PathNotInSchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = "PathNotInSchemaError";
  }
}

export class MethodNotSupportedError extends Error {
  constructor(message) {
    super(message);
    this.name = "MethodNotSupportedError";
  }
}

export class InvalidHTTPMethodError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidHTTPMethodError";
  }
}
