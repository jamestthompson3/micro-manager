const {
  InvalidUrlError,
  PathNotInSchemaError,
  MethodNotSupportedError,
  InvalidHTTPMethodError
} = require("./errors");

const { HTTPMethods } = require("./constants");

const { Validator } = require("jsonschema");

export class Manager {
  constructor(baseURL) {
    const urlTest = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;
    if (!urlTest.test(baseURL)) {
      throw new InvalidUrlError(`${baseURL} is not a valid url`);
    }
    this.baseURL = baseURL;
    this.validator = new Validator();
  }
  adapter(adapterFunc) {
    this.transformer = adapterFunc;
  }
  adapt(reqObj) {
    console.log(reqObj);
    return reqObj;
  }
  validateWith(schema) {
    return accessInterceptor(function(_, path) {
      if (!(path in schema))
        throw new PathNotInSchemaError(
          `${path} not in schema.\n valid paths are\n [${Object.keys(schema)}]`
        );
      return specifier =>
        accessInterceptor(function(_, method) {
          if (!HTTPMethods.has(method))
            throw new InvalidHTTPMethodError(
              `${method} is not a valid http method.`
            );
          const supportedMethods = schema[path].methods;
          if (!(method in supportedMethods))
            throw new MethodNotSupportedError(
              `${method} not supported in ${path}.\n supported methods are \n ${Object.values(
                supportedMethods
              )}`
            );
          return (params, body) => {
            this.validateRequest(params, body, schema[path]);
            // create promise via this.adapter
            // TODO better url building
            this.adapt({
              method,
              params,
              body,
              url: `${this.baseURL}${specifier}`
            });
          };
        });
    });
  }
  validateRequest(params, body, validationSchema) {
    const { paramsValidator, bodyValidator } = validationSchema;
    if (params && paramsValidator) {
      this.validator.validate(params, paramsValidator);
    }
    if (body && bodyValidator) {
      this.validator.validate(body, bodyValidator);
    }
  }
}

function accessInterceptor(interceptor) {
  return new Proxy(
    {},
    {
      get(target, prop) {
        return interceptor(target, prop);
      }
    }
  );
}

/*
 * SCHEMAS
 *
 * const mySchema = {
 *    products: {
 *        methods: ['get', 'post'],
 *        bodyValidator: {
 *          id: 'createProduct',
 *          type: 'object',
 *          properties: {
 *              description: {type: "string"},
 *              name: {type: "string"},
 *              price: {type: "string"}
 *          },
 *          required: ["name", "description", "price"]
 *        },
 *        paramsValidator: {
 *            id: 'queryProduct',
 *            type: 'object',
 *            properties: {
 *              priceFrom: {type: "integer"},
 *              priceTo: {type: "integer"},
 *              desc: {type: "string"},
 *              name: {type: string}
 *            }
 *        }
 *    },
 * }
 */
