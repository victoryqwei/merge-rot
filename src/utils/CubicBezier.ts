import { SuikaGame } from "../game/SuikaGame";

export default class CubicBezier {
  static AD_COOLDOWN_MS = 3 * 60_000;

  constructor(readonly game: SuikaGame) {}

  playRewardedAd(): Promise<boolean> {
    if (!SuikaGame.isCrazyGames) {
      return this.playVideoAd(true, true);
    }

    return new Promise((resolve) => {
      const callbacks = {
        adFinished: () => {
          console.info("Finished rewarded ad");
          resolve(true);
        },
        adError: (error: any) => {
          console.info("Error rewarded ad", error);
          resolve(false);
        },
        adStarted: () => {
          console.info("Started rewarded ad");
        },
      };
      (window as any).CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
    });
  }

  private playCrazyGamesAd(resolve: (value: boolean) => void, fullscreen = false) {
    if (!fullscreen) return;

    const callbacks = {
      adFinished: () => {
        console.info("Finished midgame ad");
        this.game.soundManager.mute(false);

        resolve(true);
      },
      adError: (error: any) => {
        console.info("Error midgame ad", error);
        this.game.soundManager.mute(false);
        resolve(false);
      },
      adStarted: () => {
        console.info("Started midgame ad");
      },
    };
    (window as any).CrazyGames.SDK.ad.requestAd("midgame", callbacks);
  }

  static async showCrazyGamesBanner() {
    if (!SuikaGame.isCrazyGames) return;

    try {
      // await is not mandatory when requesting banners, but it will allow you to catch errors
      await (window as any).CrazyGames.SDK.banner.requestBanner({
        id: "banner-container",
        width: 320,
        height: 50,
      });
    } catch (e) {
      console.error("Banner request error", e);
    }
  }

  playAdinplayAd(resolve: (value: boolean) => void, fullscreen = false) {
    if (SuikaGame.isCrazyGames) {
      this.playCrazyGamesAd(resolve, true);
      return;
    }

    const prerollElement = document.getElementById("preroll");
    if (prerollElement) {
      prerollElement.style.left = "0px"; // Keep ad to the right side
    }

    console.info(`Playing video ad (fullscreen: ${fullscreen})`);

    const aiptag = (window as any).aiptag;

    if (typeof aiptag.adplayer == "undefined") {
      console.warn("Video ad could not be loaded");
      resolve(false);
      this.game.soundManager.mute(false);
      return;
    }

    if (aiptag.adplayer.aipConfig == null) {
      console.warn("Video ad could not be loaded");
      resolve(false);
      this.game.soundManager.mute(false);
      return;
    }

    aiptag.adplayer.aipConfig.AD_FULLSCREEN = fullscreen;

    aiptag.cmd.player.push(() => {
      aiptag.adplayer.startPreRoll();
    });

    // mute the game
    this.game.soundManager.mute(true);

    // Modify the Load callback to resolve the Promise
    aiptag.adplayer.aipConfig.AIP_COMPLETE = () => {
      (document.activeElement as HTMLElement).blur();
      this.game.soundManager.mute(false);
      resolve(true); // Resolve the Promise here
    };
  }

  async playVideoAd(fullscreen = false, force = false): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.shouldPlayVideoAd(fullscreen) && !force) {
        resolve(true);
        return;
      }

      localStorage.setItem("lastAd", Date.now().toString());
      // Handle null case for getElementById

      this.game.soundManager.mute(true);

      if (SuikaGame.isCrazyGames && fullscreen) {
        this.playCrazyGamesAd(resolve, fullscreen);
      } else {
        this.playAdinplayAd(resolve, fullscreen);
      }
    });
  }

  shouldPlayVideoAd(fullscreen: boolean): boolean {
    if (SuikaGame.isCrazyGames && fullscreen) return true;

    // check if the adslib is loaded correctly or blocked by adblockers etc.
    const aiptag = (window as any).aiptag;
    if (aiptag && aiptag.adplayer == null) {
      // ReactInterface.navigate("/infoscreen/Video ad failed to load. Please support Miniblox and disable adblock.");
      // return;

      // TODO: notify session server that the ad failed to load

      console.info("Skipping video ad because player could not be loaded (probably adblock)");
      return false;
    }

    // vulnerable to being set to a high value meaning the user will never get ads (probably would be easier to just install adblock though)
    const lastAd = localStorage.getItem("lastAd");
    console.info(lastAd);

    if (lastAd == null) {
      // if last ad not set, the player is new to the game or the local storage was cleared
      // allow the first few minutes of game play to be ad free
      localStorage.setItem("lastAd", (Date.now() - CubicBezier.AD_COOLDOWN_MS + 3 * 60_000).toString());
      console.info("Skipping video ad because last ad was not set");
      return false;
    } else {
      if (Date.now() - parseInt(lastAd) < CubicBezier.AD_COOLDOWN_MS) {
        console.info("Skipping video ad because last ad was played too recently");
        return false;
      }
    }

    return true;
  }
}
