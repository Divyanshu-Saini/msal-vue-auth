/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Add here the endpoints for MS Graph API services you would like to use.
export const GRAPH_CONFIG = {
  GRAPH_ME_ENDPT: "https://graph.microsoft.com/v1.0/me",
  GRAPH_MAIL_ENDPT: "https://graph.microsoft.com/v1.0/me/messages",
};

export const IPC_MESSAGES = {
  SEND_NOTIFICATION: "SEND_NOTIFICATION",
  REFRESH_TRAY_NOTIFICATION: "REFRESH_TRAY_NOTIFICATION",
  DISPLAY_APP_MENU: "DISPLAY_APP_MENU",
  SHOW_WELCOME_MESSAGE: "SHOW_WELCOME_MESSAGE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  GET_ACCESS_TOKEN: "GET_ACCESS_TOKEN",
  GET_PROFILE: "GET_PROFILE",
  SET_PROFILE: "SET_PROFILE",
  GET_MAIL: "GET_MAIL",
  SET_MAIL: "SET_MAIL",
};

export const CACHE_LOCATION = "./data/cache.json";
export const CACHE_DIR = "./data";
