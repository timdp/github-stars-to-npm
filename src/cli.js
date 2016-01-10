#!/usr/bin/env node

'use strict'

import Promise from 'bluebird'
import npm from './lib/npm'
import github from './lib/github'

const STAR_INTERVAL = 100

const reRepo = /^[a-z\+]+:\/\/github\.com\/(.*?)(?:\.git)?$/

const parseRepositoryUrl = url => {
  const match = reRepo.exec(url)
  return match ? match[1] : null
}

;(async () => {
  console.info('Loading starred repositories ...')
  const starred = await github.getStarred()
  console.info('Starred repositories: %d', starred.length)
  for (const repoName of starred) {
    console.info('Loading %s package.json ...', repoName)
    let pkg = null
    try {
      pkg = await github.getFileContents(repoName, 'master', 'package.json')
    } catch (err) {
      console.warn('%s: Error loading package.json: %s', repoName, err)
      continue
    }
    if (!pkg.name) {
      console.warn('%s: No name in package.json', repoName)
      continue
    }
    if (pkg.private) {
      console.warn('%s (%s): Package is private', pkg.name, repoName)
      continue
    }
    console.info('%s (%s): Finding in registry ...', pkg.name, repoName)
    let regData = null
    try {
      regData = await npm.get(pkg.name)
    } catch (err) {
      console.warn('%s (%s): Error loading from registry: %s', pkg.name,
        repoName, err)
      continue
    }
    if (!regData.repository ||
        (regData.repository.type && regData.repository.type !== 'git') ||
        parseRepositoryUrl(regData.repository.url) !== repoName) {
      console.warn('%s (%s): Unexpected repository: %j', pkg.name, repoName,
        regData.repository)
      continue
    }
    console.info('%s (%s): Starring package ...', pkg.name, repoName)
    try {
      await npm.star(pkg.name)
    } catch (err) {
      console.warn('%s (%s): Error starring: %s', pkg.name, repoName, err)
    }
    await Promise.delay(STAR_INTERVAL)
  }
})()
