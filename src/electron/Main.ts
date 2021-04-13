/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
  app,
  BrowserWindow,
  protocol,
  ipcMain,
  Menu,
  nativeImage,
  // screen,
  Tray,
} from "electron";
// import * as notifier from "node-notifier";

// import { WebSocketSubject, webSocket } from "rxjs/webSocket";
// import { Subject } from "rxjs";
// (global as any).WebSocket = require("ws");

import AuthProvider from "./AuthProvider";
import * as path from "path";
import { FetchManager } from "./FetchManager";

import { GRAPH_CONFIG, IPC_MESSAGES } from "./Constants";

import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

export default class Main {
  static application: Electron.App;
  static mainWindow: Electron.BrowserWindow;
  static authProvider: AuthProvider;
  static networkModule: FetchManager;
  static args = process.argv.slice(1);
  static serve = Main.args.some((val) => val === "--serve");
  static tray: Tray;
  static menu: any;

  // static snsWebSocketSubject: WebSocketSubject<any> = webSocket(
  //   "wss://xosd3kqk36.execute-api.us-east-1.amazonaws.com/Prod"
  // );
  // static personalizeSubject = new Subject<any>();
  // static notificationubject = new Subject<any>();

  static image = nativeImage.createFromPath(
    path.join(__dirname, "../logo.png")
  );
  static isWindows = process.platform === "win32";
  static contextMenuList = [
    {
      label: "Talk to TCPL-Bot",
      click() {
        Main.mainWindow.show();
      },
    },
    {
      label: "Exit Client",
      click() {
        Main.application.quit();
      },
    },
  ];
  static menuListLogin = [
    {
      label: "Developer Tools",
      role: "toggleDevTools",
    },
    {
      label: "Sign Out",
      click() {
        Main.logout();
      },
    },
  ];
  static menuListLogOut = [
    {
      label: "Developer Tools",
      role: "toggleDevTools",
    },
    {
      label: "Sign In",
      click() {
        Main.login();
      },
    },
  ];
  static main(): void {
    console.info("--------", process.platform);
    Main.application = app;
    Main.menu = new Menu();
    Main.application.on("window-all-closed", Main.onWindowAllClosed);
    Main.application.on("ready", Main.onReady);
    Main.application.on("activate", Main.onActivate);
  }

  private static onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) Main.createMainWindow();
  }
  
  private static async loadBaseUI(): Promise<void> {
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await Main.mainWindow.loadURL(
        process.env.WEBPACK_DEV_SERVER_URL as string
      );
      if (!process.env.IS_TEST) Main.mainWindow.webContents.openDevTools();
    } else {
      createProtocol("app");
      // Load the index.html when not in development
      Main.mainWindow.loadURL("app://./index.html");
    }
    // await Main.mainWindow.loadFile(path.join(__dirname, "../render-process/dist/index.html"));
  }

  private static onWindowAllClosed(): void {
    Main.application.quit();
  }

  private static onClose(): void {
    // Main.mainWindow = null;
    if (isDevelopment) {
      if (process.platform === "win32") {
        process.on("message", (data) => {
          if (data === "graceful-exit") {
            Main.application.quit();
          }
        });
      } else {
        process.on("SIGTERM", () => {
          Main.application.quit();
        });
      }
    }
  }

  private static onReady(): void {
    Main.loadDevTools();
    Main.createMainWindow();
    Main.createTray();
    Main.createMenue([]);
    Main.mainWindow.on("closed", Main.onClose);
    Main.authProvider = new AuthProvider();
    Main.networkModule = new FetchManager();
    Main.registerSubscriptions();

    Main.attemptSSOSilent();
  }

  private static async loadDevTools(): Promise<void> {
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        await installExtension(VUEJS_DEVTOOLS);
      } catch (e) {
        console.error("Vue Devtools failed to install:", e.toString());
      }
    }
  }

  // Creates main application window
  private static createMainWindow(): void {
    // const electronScreen = screen;
    // const size = electronScreen.getPrimaryDisplay().workAreaSize;
    this.mainWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: 470,
      height: 800,
      resizable: false,
      frame: true,
      webPreferences: {
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
        allowRunningInsecureContent: Main.serve ? true : false,
        contextIsolation: false, // false if you want to run 2e2 test with Spectron
        enableRemoteModule: true, // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
      },
    });
  }

  private static createTray(): void {
    Main.tray = new Tray(Main.image);
    Main.tray.setToolTip("TCPL DESKTOP CLIENT");
    Main.tray.on("click", () => {
      Main.mainWindow.isVisible()
        ? Main.mainWindow.hide()
        : Main.mainWindow.show();
    });
    const contextMenu = Menu.buildFromTemplate(Main.contextMenuList);
    Main.tray.setContextMenu(contextMenu);
  }

  private static createMenue(list: any): void {
    Main.menu = Menu.buildFromTemplate(list);
    Menu.setApplicationMenu(Main.menu);
  }

  private static displayMenu(event: any, args: any): void {
    console.info("Called");
    if (Main.isWindows && Main.mainWindow) {
      Main.menu.popup({
        window: Main.mainWindow,
        x: args.x,
        y: args.y,
      });
    }
  }

  private static refreshTray(event: any, args: any) {
    console.info("Refresh tary  :", event);
    console.info("Args ... :", args);
    Main.contextMenuList[0].label =
      args.notifications > 0
        ? `Talk to TCPL-Bot (${args.notifications})`
        : `Talk to TCPL-Bot`;
    const contextMenu = Menu.buildFromTemplate(Main.contextMenuList);
    Main.tray.setContextMenu(contextMenu);
  }

  // private static sendNotification(event: any, args: any) {
  //   console.info("Send Notification  :--", event);
  //   console.info("Args :--", args);
  //   Main.contextMenuList[0].label = `Talk to TCPL-Bot (${args.notifications})`;
  //   const contextMenu = Menu.buildFromTemplate(Main.contextMenuList);
  //   Main.tray.setContextMenu(contextMenu);
  //   notifier.notify(
  //     {
  //       appID: "Tata Consumer Product",
  //       title: args.msg.Sns.Subject,
  //       message: args.msg.Sns.Message,
  //       icon: path.join(__dirname, "../logo.png"),
  //       wait: true,
  //     },
  //     function(err, data) {
  //       console.log(err, data);
  //     }
  //   );
  // }

  private static publish(message: string, payload: any): void {
    Main.mainWindow.webContents.send(message, payload);
  }

  private static async attemptSSOSilent(): Promise<void> {
    const account = await Main.authProvider.loginSilent();
    console.log("SilentSSO :", account);
    if (account) {
      console.log("Successful silent account retrieval", account);
      await Main.loadBaseUI();
      await Main.createMenue(Main.menuListLogin);
      Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
    } else {
      Main.login();
    }
  }

  private static async login(): Promise<void> {
    const account = await Main.authProvider.login(Main.mainWindow);
    console.info("Login :", account);
    await Main.createMenue(Main.menuListLogin);
    await Main.loadBaseUI();
    Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
  }

  private static async getAccessToken() {
    const token = await Main.authProvider.getProfileToken(Main.mainWindow);
    const account = Main.authProvider.currentAccount;
    Main.mainWindow.webContents.send("token", { token, account });
  }

  private static async getProfile(): Promise<void> {
    const token = await Main.authProvider.getProfileToken(Main.mainWindow);
    const account = Main.authProvider.currentAccount;
    await Main.loadBaseUI();
    Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
    const graphResponse = await Main.networkModule.callEndpointWithToken(
      GRAPH_CONFIG.GRAPH_ME_ENDPT,
      token
    );
    Main.publish(IPC_MESSAGES.SET_PROFILE, graphResponse);
  }

  private static async getMail(): Promise<void> {
    const token = await Main.authProvider.getMailToken(Main.mainWindow);
    const account = Main.authProvider.currentAccount;
    await Main.loadBaseUI();
    Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
    const graphResponse = await Main.networkModule.callEndpointWithToken(
      GRAPH_CONFIG.GRAPH_MAIL_ENDPT,
      token
    );
    Main.publish(IPC_MESSAGES.SET_MAIL, graphResponse);
  }

  private static async logout(): Promise<void> {
    await Main.authProvider.logout();
    await Main.createMenue(Main.menuListLogOut);
    await Main.application.exit();
  }

  // Router that maps callbacks/actions to specific messages received from the Renderer
  private static registerSubscriptions(): void {
    ipcMain.on(IPC_MESSAGES.REFRESH_TRAY_NOTIFICATION, Main.refreshTray);
    // ipcMain.on(IPC_MESSAGES.SEND_NOTIFICATION, Main.sendNotification);
    ipcMain.on(IPC_MESSAGES.DISPLAY_APP_MENU, Main.displayMenu);
    ipcMain.on(IPC_MESSAGES.LOGIN, Main.login);
    ipcMain.on(IPC_MESSAGES.LOGOUT, Main.logout);
    ipcMain.on(IPC_MESSAGES.GET_ACCESS_TOKEN, Main.getAccessToken);
    ipcMain.on(IPC_MESSAGES.GET_PROFILE, Main.getProfile);
    ipcMain.on(IPC_MESSAGES.GET_MAIL, Main.getMail);
  }
}
