import { Config as VerdaccioConfig } from "@verdaccio/types"
import chalk from "chalk"
import { get } from "lodash"

import { pluginName } from "../../constants"
import { logger } from "../../logger"

//
// Types
//

export interface PluginConfig {
  org: string
  "client-id": string
  "client-secret": string
  "enterprise-origin"?: string
  filter?: string[]
}

export type PluginConfigKey = keyof PluginConfig

export interface Config extends VerdaccioConfig, PluginConfig {
  middlewares: { [pluginName]: PluginConfig }
  auth: { [pluginName]: PluginConfig }
}

//
// Access
//

export function getConfig(config: Config, key: PluginConfigKey): string {
  const value =
    null ||
    get(config, `middlewares[${pluginName}][${key}]`) ||
    get(config, `auth[${pluginName}][${key}]`)

  return process.env[value] || value
}

export function getConfigArray(config: Config, key: PluginConfigKey): string[] {
  const value =  null || get(config, `auth[${pluginName}][${key}]`);
  return process.env[value] || value;
}

/**
 * user_agent: e.g. "verdaccio/5.0.4" --> 5
 */
export function getMajorVersion(config: VerdaccioConfig) {
  return +config.user_agent.replace(/^verdaccio\/(\d+).\d+.\d+$/, "$1")
}

//
// Validation
//

function ensurePropExists(config: Config, key: PluginConfigKey) {
  const value = getConfig(config, key)

  if (!value) {
    logger.error(
      chalk.red(
        `[${pluginName}] ERR: Missing configuration "auth.${pluginName}.${key}"`,
      ),
    )
    throw new Error("Please check your verdaccio config.")
  }
}

function ensureNodeIsNotEmpty(config: Config, node: keyof Config) {
  const path = `[${node}][${pluginName}]`
  const obj = get(config, path, {})

  if (!Object.keys(obj).length) {
    throw new Error(`"${node}.${pluginName}" must be enabled`)
  }
}

export function validateConfig(config: Config) {
  const majorVersion = getMajorVersion(config)

  if (majorVersion < 5) {
    throw new Error("This plugin requires verdaccio 5 or above")
  }

  ensureNodeIsNotEmpty(config, "auth")
  ensureNodeIsNotEmpty(config, "middlewares")

  ensurePropExists(config, "org")
  ensurePropExists(config, "client-id")
  ensurePropExists(config, "client-secret")
}
