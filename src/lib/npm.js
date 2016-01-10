'use strict'

import Promise from 'bluebird'
import RegClient from 'npm-registry-client'
import path from 'path'

const auth = require(path.join(__dirname, '..', '..', 'auth', 'npm.json'))

const client = new RegClient()
Promise.promisifyAll(client)

const buildUri = pkg => `https://registry.npmjs.org/${pkg}`

export default {
  get: pkg => {
    const uri = buildUri(pkg)
    return client.getAsync(uri, {})
  },
  star: pkg => {
    const uri = buildUri(pkg)
    return client.starAsync(uri, {starred: true, auth})
  }
}
