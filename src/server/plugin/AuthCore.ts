import { stringify } from "querystring"

import { logger } from "../../logger"
import { User, Verdaccio } from "../verdaccio"
import { Config, getConfig, getConfigArray } from "./Config"

export class AuthCore {
  private readonly requiredGroup = "github/" + getConfig(this.config, "org")
  private readonly filterList = getConfigArray(this.config, "filter");

  constructor(
    private readonly verdaccio: Verdaccio,
    private readonly config: Config,
  ) {}

  async createAuthenticatedUser(
    username: string,
    groups: string[],
  ): Promise<User> {
    // See https://verdaccio.org/docs/en/packages
    let filteredGroups = groups.filter(x => x.startsWith(this.requiredGroup));
    if(this.filterList)
      filteredGroups = filteredGroups.filter(x => this.filterList.includes(x));
    console.log(this.filterList, filteredGroups);
    const user: User = {
      name: username,
      groups: ["$all", "@all", "$authenticated", "@authenticated"],
      real_groups: [username, ...filteredGroups],
    }
    logger.log("Created authenticated user", user)
    return user
  }

  async createUiCallbackUrl(
    username: string,
    token: string,
    groups: string[],
  ): Promise<string> {
    const user = await this.createAuthenticatedUser(username, groups)

    const uiToken = await this.verdaccio.issueUiToken(user)
    const npmToken = await this.verdaccio.issueNpmToken(token, user)

    const query = { username, uiToken, npmToken }
    const url = "/?" + stringify(query)

    return url
  }

  authenticate(username: string, groups: string[]): boolean {
    console.log(username, groups.length, groups);

    // no groups - htpasswd user?
    if(groups.length <= 0)
      return false;
    
      /*
    if (!groups.includes(this.requiredGroup)) {
      logger.error(
        `Access denied: User "${username}" is not a member of  "${this.requiredGroup}"`,
      )
      return false
    }
    */

    return true
  }
}
