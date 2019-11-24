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
  constructor(baseURL, adaptor) {
    const urlTest = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;
    if (!urlTest.test(baseURL)) {
      throw new InvalidUrlError(`${baseURL} is not a valid url`);
    }
    this.baseURL = baseURL;
    this.adaptor = adaptor;
    this.validator = new Validator();
  }
  adapt(reqObj) {
    return this.adaptor && this.adaptor(reqObj);
  }
  validateWith(schema) {
    const self = this;
    return accessInterceptor(function(_, schemaPath) {
      if (!(schemaPath in schema))
        throw new PathNotInSchemaError(
          `${schemaPath} not in schema.\n valid schemaPaths are\n [${Object.keys(
            schema
          )}]`
        );
      return specifier =>
        accessInterceptor(function(_, method) {
          if (!HTTPMethods.has(method))
            throw new InvalidHTTPMethodError(
              `${method} is not a valid http method.`
            );
          const supportedMethods = schema[schemaPath].methods;
          if (!supportedMethods.includes(method))
            throw new MethodNotSupportedError(
              `${method} not supported in ${schemaPath}.\n supported methods are \n ${Object.values(
                supportedMethods
              )}`
            );
          return (params, body) => {
            const { paramsValidator, bodyValidator, path } = schema[schemaPath];
            if (Object.entries(params).length > 0 && paramsValidator) {
              const { valid, errors } = self.validator.validate(
                params,
                paramsValidator
              );
              if (!valid) throw new ValidationError(errors[0]);
            }
            if (Object.entries(body).length > 0 && bodyValidator) {
              const { valid, errors } = self.validator.validate(
                body,
                bodyValidator
              );
              if (!valid) throw new ValidationError(errors[0]);
            }
            const url = specifier
              ? compileURL(self.baseURL, specifier, path)
              : self.baseURL;
            self.adapt({
              method,
              params,
              body,
              url
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

function compileURL(base, fragmentArgs, fragment) {
  return `%{base}${fragment(fragmentArgs)}`;
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
 *            id: 'queryProducts',
 *            type: 'object',
 *            properties: {
 *              priceFrom: {type: "integer"},
 *              priceTo: {type: "integer"},
 *              desc: {type: "string"},
 *              name: {type: string}
 *            }
 *        }
 *    },
 *    product: {
 *        methods: ['get', 'patch'],
 *        bodyValidator: {
 *          id: 'updateProduct',
 *          type: 'object',
 *          properties: {
 *              description: {type: "string"},
 *              name: {type: "string"},
 *              price: {type: "string"}
 *          }
 *        },
 *        paramsValidator: {
 *          id: "queryProduct",
 *          type: 'object',
 *          properties: {
 *            id: {type: "string"}
 *          }
 *        }
 *    }
 * }
 */
