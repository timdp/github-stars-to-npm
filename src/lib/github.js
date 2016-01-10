'use strict'

import Promise from 'bluebird'
import github from 'octonode'
import got from 'got'
import path from 'path'

const PER_PAGE = 100
const REQUEST_INTERVAL = 100

const auth = require(path.join(__dirname, '..', '..', 'auth', 'github.json'))

const client = github.client(auth)
const me = client.me()
Promise.promisifyAll(me)

const paginated = async (func, context) => {
  const call = async page => {
    const res = await func.call(context, {page, per_page: PER_PAGE})
    if (!res) {
      return []
    }
    if (res.length >= PER_PAGE) {
      await Promise.delay(REQUEST_INTERVAL)
      const next = await call(page + 1)
      res.push.apply(res, next)
    }
    return res
  }
  return call(1)
}

export default {
  getStarred: async () => {
    const repos = await paginated(me.starredAsync, me)
    return repos.map(({full_name}) => full_name)
  },
  getFileContents: async (repo, branch, path) => {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`
    const res = await got(url)
    if (res.statusCode !== 200) {
      throw new Error(`HTTP ${res.statusCode}`)
    }
    return JSON.parse(res.body)
  }
}
