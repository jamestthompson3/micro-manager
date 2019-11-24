const { Manager } = require("./index");
const {
  InvalidUrlError,
  PathNotInSchemaError,
  MethodNotSupportedError
} = require("./errors");

const TEST_URL = "localhost:8080/api/products/v2";

const TEST_SCHEMA = {
  products: {
    methods: ["get", "post"],
    bodyValidator: {
      id: "createProduct",
      type: "object",
      properties: {
        description: { type: "string" },
        name: { type: "string" },
        price: { type: "string" }
      },
      required: ["name", "description", "price"]
    },
    paramsValidator: {
      id: "queryProduct",
      type: "object",
      properties: {
        priceFrom: { type: "integer" },
        priceTo: { type: "integer" },
        desc: { type: "string" },
        name: { type: "string" }
      }
    }
  }
};

describe("initializes new Manager class", () => {
  test("correctly initiates with baseURL", () => {
    const products = new Manager(TEST_URL);
    expect(products.baseURL).toBe(TEST_URL);
  });

  test("does not allow invalid urls", () => {
    expect(() => new Manager("myApiString")).toThrowError(InvalidUrlError);
    expect(() => new Manager("/api/v2/products")).toThrowError(InvalidUrlError);
  });

  test("correctly returns a validateWith method", () => {
    expect(() => new Manager(TEST_URL).validateWith).toBeDefined();
  });

  test("correctly returns a adapter method", () => {
    expect(() => new Manager(TEST_URL).adapter).toBeDefined();
  });
});

describe("Parses request schemas", () => {
  const setup = new Manager(TEST_URL).validateWith(TEST_SCHEMA);

  test("accepts schema in validateWith method", () => {
    expect(() => setup).not.toThrowError();
  });

  test("correctly returns methods based on schema keys", () => {
    expect(setup.products).toBeDefined();
    expect(() => setup.otherKey).toThrowError(PathNotInSchemaError);
  });

  test("correctly gives supported paths in error message", () => {
    expect(() => setup.otherKey).toThrowError("products");
  });

  test("correctly returns white-listed http methods", () => {
    expect(() => setup.products().get()).toBeDefined();
  });

  test("Throws error when trying to access non-supported http methods", () => {
    expect(() => setup.products().patch()).toThrow(MethodNotSupportedError);
  });

  test("Prints supported methods when trying to access non-supported http methods", () => {
    expect(() => setup.products().patch()).toThrow("get,post");
  });
});
