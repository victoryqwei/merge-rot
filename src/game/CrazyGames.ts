import { toast } from "../components/Toast";
import { SESSION_TOKEN_KEY } from "../constants/SessionConstants";
import { SuikaGame } from "./SuikaGame";
// import { Accounts } from "../services/AuthService";
import { ReactInterface } from "../utils/Navigation";

interface CrazyUser {
  username: string;
  profilePictureUrl: string;
}

export default class CrazyGames {
  static initialized = false;

  static async init(): Promise<void> {
    if (!SuikaGame.isCrazyGames) return;

    try {
      await (window as any).CrazyGames.SDK.init();

      // add user change event listener
      (window as any).CrazyGames.SDK.user.addAuthListener((user: CrazyUser) => {
        console.info("CrazyGames user changed", user);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        window.location.reload();
      });
      CrazyGames.initialized = true;
    } catch (e) {
      console.error("CrazyGames SDK failed to initialize", e);
    }
  }

  static loadingStart() {
    if (!CrazyGames.initialized) return;

    (window as any).CrazyGames.SDK.game.loadingStart();
  }

  static loadingStop() {
    if (!CrazyGames.initialized) return;

    (window as any).CrazyGames.SDK.game.loadingStop();
  }

  static resume() {
    if (!CrazyGames.initialized) return;

    (window as any).CrazyGames.SDK.game.gameplayStart();
  }

  static pause() {
    if (!CrazyGames.initialized) return;

    (window as any).CrazyGames.SDK.game.gameplayStop();
  }

  static async getUser(): Promise<CrazyUser | null> {
    return await (window as any).CrazyGames.SDK.user.getUser();
  }

  static async getToken(): Promise<string | null> {
    const token = await (window as any).CrazyGames.SDK.user.getUserToken();
    const auth = { type: "crazygames", token };
    sessionStorage.setItem("oauth", JSON.stringify(auth));
    return token;
  }

  /**
   * By calling this method, the log in or register popup will be displayed on CrazyGames. The user can log in their existing account, or create a new account. The method returns the user object.
   */
  static async showAuthPrompt(): Promise<void> {
    try {
      await (window as any).CrazyGames.SDK.user.showAuthPrompt();
      await CrazyGames.linkAccount();
    } catch (e) {
      console.error("Error during auth prompt", e);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  static async linkAccount(): Promise<void> {
    if (!CrazyGames.initialized || (window as any).CrazyGames.SDK.code === "sdkDisabled") {
      console.info("CrazyGames SDK not initialized");
      return Promise.resolve();
    }

    const loggedIn = localStorage.getItem(SESSION_TOKEN_KEY) != null;

    const crazyuser = await CrazyGames.getUser();
    const token = await CrazyGames.getToken();
    if (!crazyuser || !token) {
      console.info("CrazyGames user not found, playing as a guest.");
      return Promise.resolve();
    }

    if (loggedIn) {
      try {
        // const res = await ClientAxios.userRequest("/accounts/crazygames", { token });
        // console.info("Linked CrazyGames account", res);
      } catch (e) {
        console.error("Failed to link CrazyGames account", e);
        localStorage.removeItem(SESSION_TOKEN_KEY);
        window.location.reload();
        return Promise.reject();
      }
    } else {
      console.info("CrazyGames user found, but not logged in.");

      try {
        // const res = await ClientAxios.publicRequest("/accounts/crazygames/no_game_account", { token });
        // // automatically sign in with the new account
        // if (res.session) {
        //   localStorage.setItem(SESSION_TOKEN_KEY, res.session);
        //   console.info("Logged in with CrazyGames account");
        // }
      } catch (e) {
        console.warn("No game account found for CrazyGames user", e, "Automatically creating a new account.");

        try {
          // const data = await Accounts.signUp({
          //   username: crazyuser.username,
          //   type: "crazygames",
          //   token,
          // });
          // sessionStorage.removeItem("oauth");
          // localStorage.setItem(SESSION_TOKEN_KEY, data.session);
        } catch (e) {
          console.error("Failed to create a new account", e);
          toast({
            description: `Failed to create a new account: ${e}`,
            status: "error",
          });
          ReactInterface.navigate("/signup/finish");
          return Promise.resolve();
        }
      }
    }

    return Promise.resolve();
  }

  static getInviteLink(code: string | null): string {
    if (!CrazyGames.initialized || !code) return "";

    const link = (window as any).CrazyGames.SDK.game.inviteLink({ join: code });
    return link;
  }
}

if (import.meta.env.DEV) (globalThis as any).cg = CrazyGames;
