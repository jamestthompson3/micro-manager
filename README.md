---
Title: Micro-manager: Schema driven microservice client
Author: Taylor Thompson
Keywords: js, microservices
---

## Usage
```js
const {Manager} = require('micro-manager')
const template = require('lodash/template')

const axiosAdapter = require('./myAdapter')

const mySchema = {
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
}

const manager = new Manager("http://myservice.com/api/v2/products", axiosAdapter).validateWith(mySchema);
const request = manager.product({ productId: "abc123" }).get(
  {
    priceFrom: 60,
    priceTo: 120
  },
  {}
);

request
  .then(res => res.json())
  .then(console.log)
```
## Motivation

Interacting with many microservices can get messy. Services often have different implementations in regards to request body, query parameters, error responses, and URL naming.
The objective of micro-manager is to introduce a json schema driven workflow where schemas act as the single source of truth, validating requests and offering a unified way of accessing different microservices.
One of the goals of this project is to ensure that the API for consuming a service is always reflected by the schema. For example, if you add another path to service ( e.g `/books` ) it becomes available in the manager instance without any additional configuration.
Micro-manager also aims to be HTTP client agnostic, allowing you to choose how you make requests. Adapters for the following clients are found in the Adapters API section of this document: [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch), [axios](https://github.com/axios/axios),[superagent](https://github.com/visionmedia/superagent)
You can also build your own HTTP client adaptor using the [ adaptor API ]( #adaptors )


## Schema Example
```js
const productSchema = {
   products: {
       methods: ["get", "post"],
       bodyValidator: {
         id: "createProduct",
         type: "object",
         properties: {
             description: {type: "string"},
             name: {type: "string"},
             price: {type: "string"}
         },
         required: ["name", "description", "price"]
       },
       paramsValidator: {
           id: "queryProduct",
           type: "object",
           properties: {
             priceFrom: {type: "integer"},
             priceTo: {type: "integer"},
             desc: {type: "string"},
             name: {type: "string"}
           }
       }
   },
}
```

## Adapters API

Adapters are what allow you to take the validated request and use it with an HTTP client of your choosing. Micro-manager is client agnostic by design, giving you flexibility in how you implement your requests.

### Creating an adaptor

An adaptor is a function passed to the constructor of an instance of Manager. It receives one argument, the `requestObject`. This contains information about the request that has been validated by the json schema.

#### Request Object

The `requestObject` passed to your adaptor function looks like this:

| Property       | Type     | Desc                                                   |
| :------------- | :------- | :------------------------------------------------------|
| method         | String   | The HTTP method for the request                        |
| params         | Object   | The validated query params to be sent with the request |
| body           | Object   | The validated body to be sent with the request         |
| url            | String   | The URL of the request                                 |

An adaptor for the popular HTTP client, axios might look like this:

```js
import axios from 'axios'
import {stringify} from 'query-string'

function axiosAdapter({method, params, body, url }) { // destructure the requestObject
  const urlWithQueryParams = `${url}/?${stringify(query)}`
  return axios({method, url: urlWithQueryParams, data: body })
}
```

Once you've created the adaptor, it can be used in a `Manager` instance like so:

```js
const productApi = new Manager('https://my-product-api', axiosAdapter)
```

### TODO

[ ] Proper build for publishing
[ ] Support API versioning in schemas
[ ] Support for consistent response bodies
[ ] Data caching (server side)
[ ] Client side version?
