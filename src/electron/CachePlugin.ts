/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require("fs");

import { CACHE_LOCATION, CACHE_DIR } from "./Constants";

const beforeCacheAccess = async (cacheContext) => {
  return new Promise<void>(async (resolve, reject) => {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
      fs.writeFile(
        CACHE_LOCATION,
        cacheContext.tokenCache.serialize(),
        (err) => {
          if (err) {
            reject();
          }
        }
      );
    }
    if (fs.existsSync(CACHE_LOCATION)) {
      fs.readFile(CACHE_LOCATION, "utf-8", (err, data) => {
        if (err) {
          reject();
        } else {
          console.info("Cache Context :", cacheContext);
          console.info("Cache data :", data);
          cacheContext.tokenCache.deserialize(data);
          resolve();
        }
      });
    } else {
      fs.writeFile(
        CACHE_LOCATION,
        cacheContext.tokenCache.serialize(),
        (err) => {
          if (err) {
            reject();
          }
        }
      );
    }
  });
};

const afterCacheAccess = async (cacheContext) => {
  if (cacheContext.cacheHasChanged) {
    console.info("After cache access :", cacheContext);
    await fs.writeFile(
      CACHE_LOCATION,
      cacheContext.tokenCache.serialize(),
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
};

export const cachePlugin = {
  beforeCacheAccess,
  afterCacheAccess,
};
