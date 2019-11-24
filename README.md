---
Title: Micro-manager: Schema driven microservice client
Author: Taylor Thompson
Keywords: js, microservices
---

## Usage
```js
const {Manager} = require('micro-manager')
const axiosAdapter = require('micro-manager/adapters/axios')
const template = require('lodash/template')

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
Micro-manager also aims to be HTTP client agnostic, allowing you to choose how you make requests. The following clients are supported out of the box and are accessed by importing through `micro-manager/clients/<clientName>`: [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch), [axios](https://github.com/axios/axios),[superagent](https://github.com/visionmedia/superagent)
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

### Adapters

### TODO

[ ] Support API versioning in schemas
[ ] Build adaptors for HTTP clients
