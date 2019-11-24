const { Manager } = require("../src/index");
const {
  InvalidUrlError,
  PathNotInSchemaError,
  MethodNotSupportedError,
  ValidationError
} = require("../src/errors");

const template = require("lodash/template");

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
        price: { type: "integer" }
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
  },
  product: {
    methods: ["get", "patch"],
    path: template("/${ productId }"),
    bodyValidator: {
      id: "updateProduct",
      type: "object",
      properties: {
        description: { type: "string" },
        name: { type: "string" },
        price: { type: "string" }
      }
    },
    paramsValidator: {
      id: "queryProduct",
      type: "object",
      properties: {
        id: { type: "string" }
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
    expect(() => setup.products().post()).toBeDefined();
  });

  test("Throws error when trying to access non-supported http methods", () => {
    expect(() => setup.products().patch()).toThrow(MethodNotSupportedError);
  });

  test("Prints supported methods when trying to access non-supported http methods", () => {
    expect(() => setup.products().patch()).toThrow("get,post");
  });

  describe("Validates requests based on schema", () => {
    const setup = new Manager(TEST_URL).validateWith(TEST_SCHEMA);

    test("Successfully validates request that passes schema", () => {
      expect(() =>
        setup.products().post(
          {},
          {
            description: "a cool product",
            name: "the art of computer science",
            price: 20
          }
        )
      ).not.toThrow();
    });

    test("Catches invalid types in request", () => {
      expect(() =>
        setup.products().post(
          {},
          {
            description: 42,
            name: "the art of computer science",
            price: 20
          }
        )
      ).toThrow(ValidationError);
    });
  });
});

describe("Returns correct request object to adapter function", () => {
  test("returns body without params to adapter function", () => {
    const adapter = jest.fn();
    const setup = new Manager(TEST_URL, adapter).validateWith(TEST_SCHEMA);
    setup.products().post(
      {},
      {
        description: "a cool product",
        name: "the art of computer science",
        price: 20
      }
    );
    expect(adapter).toHaveBeenCalledWith({
      method: "post",
      params: {},
      body: {
        description: "a cool product",
        name: "the art of computer science",
        price: 20
      },
      url: "localhost:8080/api/products/v2"
    });
  });

  test("returns params without body to adapter function", () => {
    const adapter = jest.fn();
    const setup = new Manager(TEST_URL, adapter).validateWith(TEST_SCHEMA);
    setup.products().get(
      {
        priceFrom: 60,
        priceTo: 120
      },
      {}
    );
    setup.adapter = function(requestObject) {
      expect(requestObject).toBe({
        method: "get",
        params: {
          priceFrom: 60,
          priceTo: 120
        },
        body: {},
        url: "localhost:8080/api/vi/products/v2"
      });
    };
  });

  test("correctly compiles URL with passed arguments", () => {
    const adapter = jest.fn();
    const setup = new Manager(TEST_URL, adapter).validateWith(TEST_SCHEMA);
    setup.product({ productId: "abc123" }).get(
      {
        priceFrom: 60,
        priceTo: 120
      },
      {}
    );
    setup.adapter = function(requestObject) {
      expect(requestObject).toBe({
        method: "get",
        params: {
          priceFrom: 60,
          priceTo: 120
        },
        body: {},
        url: "localhost:8080/api/vi/products/v2/abc123"
      });
    };
  });
});
