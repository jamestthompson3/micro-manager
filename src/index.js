const {
  InvalidUrlError,
  PathNotInSchemaError,
  MethodNotSupportedError,
  InvalidHTTPMethodError,
  ValidationError
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
    // console.log(reqObj);
    return reqObj;
  }
  validateWith(schema) {
    const self = this;
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
          if (!supportedMethods.includes(method))
            throw new MethodNotSupportedError(
              `${method} not supported in ${path}.\n supported methods are \n ${Object.values(
                supportedMethods
              )}`
            );
          return (params, body) => {
            const { paramsValidator, bodyValidator } = schema[path];
            if (params && paramsValidator) {
              const { valid, errors } = self.validator.validate(
                params,
                paramsValidator
              );
              if (!valid) throw new ValidationError(errors[0]);
            }
            if (body && bodyValidator) {
              const { valid, errors } = self.validator.validate(
                body,
                bodyValidator
              );
              if (!valid) throw new ValidationError(errors[0]);
            }

            // create promise via this.adapter
            // TODO better url building
            self.adapt({
              method,
              params,
              body,
              url: `${self.baseURL}${specifier}`
            });
          };
        });
    });
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
